/* tslint:disable */

import faker from 'faker';
import fs from 'fs';
import { has } from 'lodash';
import { IKeyValue } from '../../../src/core/types/helpers';

const data: any[] = [];

export const insertData = async (
  dbClient: any,
  insertTemplatePath: string,
  fieldsTypes: IKeyValue,
  count: number,
  sampleData?: IKeyValue[]
) => {
  const insertTemplate = fs.readFileSync(insertTemplatePath, 'utf-8') as string;
  for (let i = 0; i < count; i++) {
    let sql = insertTemplate;

    const dataRow: IKeyValue = {};
    for (const key in fieldsTypes) {
      if (fieldsTypes.hasOwnProperty(key)) {
        let randomValue = await getFakeData(dbClient, fieldsTypes[key]);
        if (sampleData && sampleData.length && typeof sampleData[i] === 'object' && has(sampleData[i], key)) {
          randomValue = sampleData[i][key];
        }

        sql = sql.replace(`{{${key}}}`, randomValue);
        dataRow[key] = randomValue;
      }
    }

    const res = await dbClient.query(sql);
    data.push({ id: res.data.insertId, ...dataRow });
  }

  return data;
};

export const generateRandomDataItem = async (dbClient: any, fieldsTypes: IKeyValue) => {
  const randomDataItem: IKeyValue = {};
  for (const key in fieldsTypes) {
    if (fieldsTypes.hasOwnProperty(key)) {
      const randomValue = await getFakeData(dbClient, fieldsTypes[key]);
      randomDataItem[key] = randomValue;
    }
  }

  return randomDataItem;
};

export const getRandomDataItem = (dataItems: any[]) => {
  const randomIndex = Math.round(Math.random() * (dataItems.length - 1));
  return { randomIndex, data: dataItems[randomIndex] };
};

export const getInsertData = () => {
  const payload: any = {};

  return payload;
};

export const getUpdateData = () => {
  const payload: any = {};

  return payload;
};

const getFakeData = async (dbClient: any, typeData: string): Promise<string> => {
  switch (typeData) {
    case 'word':
      return faker.lorem.word();
    case 'words':
      return faker.lorem.words();
    case 'text':
      return faker.lorem.text();
    case 'number':
      return `${faker.random.number({ min: 1, max: 3 })}`;
    case 'first_name':
      return faker.name.findName();
    case 'last_name':
      return faker.name.lastName();
    case 'phone':
      return faker.phone.phoneNumber();
    case 'email':
      return faker.internet.email();
    case 'skype_id':
      return faker.phone.phoneNumber();
    case 'dictionaries.resource_type':
      return `${await getValueFromDictionary(dbClient, 'resource_type')}`;
    case 'dictionaries.account_type':
      return `${await getValueFromDictionary(dbClient, 'account_type')}`;
    case 'dictionaries.comment_type':
      return `${await getValueFromDictionary(dbClient, 'comment_type')}`;
  }
};

const getValueFromDictionary = async (dbClient: any, typeDictionaryItem: string): Promise<string> => {
  const sql = `SELECT id FROM \`dictionaries\` WHERE \`dictionaries\`.\`type\` = '${typeDictionaryItem}'`;
  const dbResult = await dbClient.query(sql);

  if (!dbResult.status) {
    console.log(
      `tests/data/helpers/fake-data:80 => WARNING! Couldn\'t get dictionaries items with type ${typeDictionaryItem}`
    );
    return;
  }

  if (!dbResult.data.length || dbResult.data.length === 0) {
    return;
  }

  return dbResult.data[Math.round(Math.random() * (dbResult.data.length - 1))].id;
};
