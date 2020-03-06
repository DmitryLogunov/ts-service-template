import qs from 'querystring';
import { IKeyValue, IPaginationLinks } from '../../types/helpers';

export default class PaginationHelper {
  /**
   * Makes object links for pagination by specification <Json:Api>
   *
   * @param {number} page
   * @param {number} limit
   * @param {number} count
   * @param {IKeyValue} query
   *
   * @returns {IPaginationLinks}
   */
  public getLinks(page: number, limit: number, count: number, query: IKeyValue): IPaginationLinks {
    const lastPage = Math.ceil(count / limit);

    const countCondition = count > limit;

    const links: IPaginationLinks = {
      first: countCondition ? this.getStringLinks(1, limit, query) : undefined,
      last: countCondition ? this.getStringLinks(lastPage, limit, query) : undefined,
      next: page + 2 <= lastPage ? this.getStringLinks(page + 2, limit, query) : undefined,
      prev: page < lastPage && page > 0 ? this.getStringLinks(page, limit, query) : undefined,
      self: this.getStringLinks(page + 1, limit, query)
    };

    return { ...links };
  }

  /**
   * Makes one link
   *
   * @param {number} page
   * @param {number} limit
   * @param {IKeyValue} query
   *
   * @returns {string}
   */
  private getStringLinks(page: number, limit: number, query: IKeyValue): string {
    query['page[number]'] = String(page);
    query['page[size]'] = String(limit);

    const rawQuerystring: string = qs.stringify(query);
    const unescapeQuerystring = '/?' + qs.unescape(rawQuerystring);

    return unescapeQuerystring;
  }
}
