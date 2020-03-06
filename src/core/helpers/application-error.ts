interface IErrorInfo {
  status: number;
  detail: string;
  title: string;
  message?: string;
  code?: number;
  statusCode?: number;
}

import { errorTitles } from '../application-settings';

export default class ApplicationError extends Error {
  public status: number;
  public title: string;
  public detail: string;

  constructor(errorInfo: IErrorInfo | any = {}) {
    const { message, detail, status, title } = errorInfo;
    super(message || detail || 'Application Error');

    this.status = status;
    this.title = title;
    this.detail = detail;
  }

  /**
   * Parse errors for returns status and body to client
   *
   * @param {IErrorInfo} error
   * @returns { status: number; body: any }
   */
  public parseError(error: IErrorInfo): { status: number; body: any } {
    const { detail, title, message } = error;

    const status: number = error.status || error.code || error.statusCode || 500;
    const body = { errors: [{ title: title || errorTitles.get(status), detail: detail || message, status }] };

    return { status, body };
  }
}
