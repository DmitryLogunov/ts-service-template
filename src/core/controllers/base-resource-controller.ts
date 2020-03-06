import { Context } from 'koa';
import ApplicationController from './application-controller';

import { get } from 'lodash';
import BaseModel from '../models/base-model';

const { version } = global.config;
export default class BaseResourceController extends ApplicationController {
  constructor(resource: string, model: BaseModel, limit?: number) {
    super(resource, model, limit);
  }

  /**
   * Returns a selection by parameters from Context.state
   *
   * @param {Context} ctx
   * @param {Functions} next
   */
  public async select(ctx: Context, next: () => Promise<any>) {
    if (ctx.state.id) {
      ctx.state.response = {
        body: {
          ...(await this.getRowByField(ctx.state.id)),
          links: { self: ctx.originalUrl },
          meta: { available_includes: await this.model.getAvailableIncludes(), version }
        },
        status: 200
      };
      return await next();
    }

    const { filter } = ctx.state;
    const [data, count] = await Promise.all([this.getByParams(filter, '*', ctx.state), this.getCount(filter)]);

    const links = this.getLinks(count, ctx.state);
    const meta = { available_includes: await this.model.getAvailableIncludes(), count, version };

    ctx.state.response = { body: { meta, links, ...data }, status: 200 };

    await next();
  }

  /**
   * Creates new item
   *
   * @param {Context} ctx
   * @param {Functions} next
   */
  public async create(ctx: Context, next: () => Promise<any>) {
    const insertResult = await this.model.create(ctx.state.payload);
    this.checkDbResult(insertResult);

    const insertId = get(insertResult, 'data.insertId');
    const data = await this.getRowByField(insertId);
    const meta = { version };

    ctx.state.response = { body: { ...data, meta }, status: 201 };

    await next();
  }

  /**
   * Updates the selected item
   *
   * @param {Context} ctx
   * @param {Functions} next
   */
  public async update(ctx: Context, next: () => Promise<any>) {
    const { payload, id } = ctx.state;

    const dbResult = await this.model.update(payload, id);
    this.checkDbResult(dbResult, true, true);

    const data = await this.getRowByField(id);
    const meta = { version };

    ctx.state.response = { body: { ...data, meta }, status: 200 };

    await next();
  }

  /**
   * Deletes the selected item
   *
   * @param {Context} ctx
   * @param {Functions} next
   */
  public async delete(ctx: Context, next: () => Promise<any>) {
    const { id } = ctx.state;

    const dbResult = await this.model.delete(id);
    this.checkDbResult(dbResult, false, true);

    ctx.state.response = { status: 204 };

    await next();
  }
}
