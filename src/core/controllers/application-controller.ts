import isNumber from 'is-number';
import { Context } from 'koa';
import { get } from 'lodash';

import { errors } from '../application-settings';
import ApplicationError from '../helpers/application-error';

import ContextRequestParser from './helpers/context-request-parser';
import ResponseDataFormatter from './helpers/response-data-formatter';

import BaseModel from '../models/base-model';
import { IDBResult } from '../types';
import { ICtxState, IPaginationLinks, IResponseJsonApi } from '../types/helpers';
import { IKeyValue } from '../types/model';
import PaginationHelper from './helpers/pagination-helper';

const { defaultLimit } = global.config;

export default class ApplicationController {
  public model: BaseModel;
  protected resource: string;
  protected contextRequestParser: ContextRequestParser;

  private responseDataFormatter: ResponseDataFormatter;
  private paginationHelper: PaginationHelper;
  private limit: number;

  constructor(resource: string, model: BaseModel, limit?: number) {
    this.resource = resource;
    this.model = model;
    this.limit = limit || defaultLimit;

    this.contextRequestParser = new ContextRequestParser(this.model.relationshipsHelper);
    this.responseDataFormatter = new ResponseDataFormatter(this.model.getSchema(), this.model.relationshipsHelper);
    this.paginationHelper = new PaginationHelper();
  }

  /**
   * Makes a request to GET a row
   *
   * @param {string} value
   * @param {string} field
   * @returns {Promise<IJsonApi>}
   */
  public async getRowByField(value: string, field?: string): Promise<IResponseJsonApi> {
    const dbResult = await this.model.getRowByField(value, field);
    this.checkDbResult(dbResult);

    if (!dbResult.data.length) {
      throw new ApplicationError(errors.RESOURCE_NOT_FOUND);
    }

    return (await this.responseDataFormatter.formatDataToResponse(
      dbResult.data,
      this.resource,
      null,
      true
    )) as IResponseJsonApi;
  }

  /**
   * Makes request to model and returns results from model after check DBResult
   *
   * @param {IKeyValue} requestParams
   * @param {string?} selectionFields
   * @param {ICtxState?} ctxState
   * @returns {Promise<IResponseJsonApi>}
   */
  public async getByParams(
    requestParams: IKeyValue,
    selectionFields?: string,
    ctxState?: ICtxState
  ): Promise<IResponseJsonApi> {
    const params = this.contextRequestParser.parseParams(requestParams);

    const dbResult = await this.model.getByParams(params, selectionFields, ctxState);
    this.checkDbResult(dbResult);

    return (await this.responseDataFormatter.formatDataToResponse(
      dbResult.data,
      this.resource,
      ctxState,
      true,
      true
    )) as IResponseJsonApi;
  }

  /**
   * Makes a request to get the number of all rows in the table
   *
   * @param {IKeyValue} requestParams
   * @returns {Promise<number>}
   */
  public async getCount(requestParams: IKeyValue): Promise<number> {
    const params = this.contextRequestParser.parseParams(requestParams);

    const dbResult = await this.model.getByParams(params, 'COUNT(*) as count');
    this.checkDbResult(dbResult);

    return get(dbResult, 'data[0].count', 0);
  }

  /**
   * Return pagination links
   *
   * @param {number} count
   * @param {ICtxState} ctxState
   * @returns {IPaginationLinks}
   */
  public getLinks(count: number, ctxState: ICtxState): IPaginationLinks {
    const { page, limit, query } = ctxState;
    return this.paginationHelper.getLinks(page, limit, count, query);
  }

  /**
   * Parse and validate id from ctx.params
   *
   * @param {Context} ctx
   * @param {Functions} next
   */
  public async parseId(ctx: Context, next: () => Promise<any>) {
    const { id } = ctx.params;
    if (!isNumber(id)) {
      throw new ApplicationError(errors.INVALID_ID);
    }

    ctx.state.id = id;

    await next();
  }

  /**
   * Parse request body from json:api specification to IKeyValue
   *
   * @param {Context} ctx
   * @param {Function} next
   */
  public async parseBody(ctx: Context, next: () => Promise<any>) {
    const resource = get(ctx.request.body, 'data.type');
    if (this.resource.toLowerCase() !== (resource && resource.toLowerCase())) {
      throw new ApplicationError(errors.UNKNOWN_RESOURCE_TYPE(resource));
    }

    ctx.state.body = { ...ctx.request.body };
    ctx.state.payload = { ...(await this.contextRequestParser.parseBody(ctx.state.body)) };

    await next();
  }

  /**
   * Check status, changeRows and affectedRowd of the DBResult
   *
   * @param {IDBResult} docuemnt
   * @param {boolean?} isCheckChangeRows
   * @param {boolean?} isCheckAffectedRows
   * @returns {boolean}
   */
  public checkDbResult(docuemnt: IDBResult, isCheckChangeRows?: boolean, isCheckAffectedRows?: boolean): boolean {
    if (!docuemnt.status) {
      throw new ApplicationError(errors.FAIL_REQUEST_TO_DATABASE);
    }

    if (isCheckChangeRows && !get(docuemnt, 'data.changedRows')) {
      throw new ApplicationError(errors.NO_CONTENT);
    }

    if (isCheckAffectedRows && !get(docuemnt, 'data.affectedRows')) {
      throw new ApplicationError(errors.RESOURCE_NOT_FOUND);
    }

    return true;
  }

  /**
   * Parse query from ctx.query
   *
   * @param {Context} ctx
   * @param {Functions} next
   */
  public async parseQuery(ctx: Context, next: () => Promise<any>) {
    const query = { ...ctx.query };

    const { 'page[number]': pageNumber, 'page[size]': pageSize, sort, include, fields, ...filter } = query;

    if (pageSize && !isNumber(pageSize)) {
      throw new ApplicationError(errors.INVALID_PAGE_SIZE);
    }

    if (pageNumber && !isNumber(pageNumber)) {
      throw new ApplicationError(errors.INVALID_PAGE_NUMBER);
    }

    ctx.state.limit = pageSize ? parseInt(pageSize, 10) : this.limit;
    ctx.state.page = pageNumber ? parseInt(pageNumber, 10) - 1 : 0;
    ctx.state.sort = sort;
    ctx.state.filter = filter;
    ctx.state.query = query;
    ctx.state.include = include ? include.split(',') : null;
    ctx.state.fields = fields ? fields.split(',') : null;

    await next();
  }

  /**
   * Send Response to Client
   *
   * @param {Context} ctx
   */
  public async sendResponse(ctx: Context) {
    const { body = 'OK', status = 200 } = ctx.state.response || {};

    ctx.status = status;
    ctx.body = body;
  }
}
