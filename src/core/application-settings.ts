import { IKeyValue } from './types/model';

export const errorTitles = {
  400: 'bad request',
  401: 'unauthorized',
  403: 'forbidden',
  404: 'not found',
  405: 'method not allowed',
  418: "i'm a teapot",
  500: 'internal Server Error',
  501: 'not Implemented',
  502: 'bad Gateway',
  get(status: number) {
    return this[status] || 'unknown title';
  }
};

export const errors = {
  BAD_REQUEST: {
    detail: 'bad request',
    status: 400,
    title: errorTitles[400]
  },
  CONTROLLER_METHOD_NOT_ALLOWED: {
    detail: 'controller method not allowed',
    status: 400,
    title: errorTitles[400]
  },
  CUSTOM_ERROR_RESPONSE: (detail: string, status: number, title: string) => ({ detail, status, title }),
  FAIL_REQUEST_TO_DATABASE: {
    detail: 'an error occurred while requesting to the database',
    status: 400,
    title: errorTitles[400]
  },
  INVALID_DATA: {
    detail: 'invalid data',
    status: 400,
    title: errorTitles[400]
  },
  INVALID_ID: {
    detail: 'id must be a number',
    status: 400,
    title: errorTitles[400]
  },
  INVALID_PAGE_NUMBER: {
    detail: 'page[number] must be a number',
    status: 400,
    title: errorTitles[400]
  },
  INVALID_PAGE_SIZE: {
    detail: 'page[size] must be a number',
    status: 400,
    title: errorTitles[400]
  },
  INVALID_QUERY_OPERAND: (detail: string) => ({
    detail: `invalid query operand - ${detail}`,
    status: 400,
    title: errorTitles[400]
  }),
  INVALID_QUERY_PARAMETER: (detail: string) => ({
    detail: `invalid query parameter - ${detail}`,
    status: 400,
    title: errorTitles[400]
  }),
  METHOD_NOT_ALLOWED: {
    detail: 'method not allowed',
    status: 405,
    title: errorTitles[405]
  },
  NO_CONTENT: {
    detail: 'no content',
    status: 204
  },
  RESOURCE_NOT_FOUND: {
    detail: 'resource not found',
    status: 404,
    title: errorTitles[404]
  },
  UNAVAILABLE_INCLUDE: {
    detail: 'unavailable include',
    status: 400,
    title: errorTitles[400]
  },
  UNAVAILABLE_INCLUDE_RESOURCE: {
    detail: 'unavailable include resource',
    status: 400,
    title: errorTitles[400]
  },
  UNDEFINED_RELATIONSHIP_MODEL: {
    detail: 'undefined neccessary relashionship model',
    status: 400,
    title: errorTitles[400]
  },
  UNDEFINED_RELATIONSHIP_MODEL_SCHEMA: {
    detail: 'undefined or not correct relashionship model schema',
    status: 400,
    title: errorTitles[400]
  },
  UNDEFINED_RELATIONSHIP_SCHEMA_SECTION: {
    detail: 'undefined neccessary relashionship schema',
    status: 400,
    title: errorTitles[400]
  },
  UNDEFINED_RELATIONSHIP_TABLE: {
    detail: 'undefined neccessary relashionship table',
    status: 400,
    title: errorTitles[400]
  },
  UNKNOWN_DATABASE_ERROR: {
    detail: 'unknown database error',
    status: 400,
    title: errorTitles[400]
  },
  UNKNOWN_RESOURCE_TYPE: (detail: string) => ({
    detail: `unknown resource type - ${detail}`,
    status: 400,
    title: errorTitles[400]
  }),
  UNKNOWN_SORT_PARAMETER: (detail: string) => ({
    detail: `unknown sort parameter - ${detail}`,
    status: 400,
    title: errorTitles[400]
  }),
  VALIDATE_ERROR: (detail: string) => ({ detail, status: 400, title: errorTitles[400] })
};

export const operands: IKeyValue = {
  eq: '=?',
  gt: '>?',
  gte: '>=?',
  in: 'IN',
  like: 'LIKE',
  lt: '<?',
  lte: '<=?',
  ne: '<>?',
  nin: 'NOT IN',
  regexp: 'REGEXP'
};
