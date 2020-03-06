/* tslint:disable */

import fs from 'fs';
import faker from 'faker';

exports.addSreUsers = (dbClient: any, insertUserTemplatePath: string, usersNumber: number) => {
  const insertUserTemplate = fs.readFileSync(insertUserTemplatePath, 'utf-8');
  const users = [];
  for (let i = 0; i < usersNumber; i++) {
    let sql = insertUserTemplate;
    let first_name = faker.name.findName();
    let last_name = faker.name.lastName();
    let login = `${first_name}.${last_name}`;
    const email = faker.internet.email();
    const phone = faker.phone.phoneNumber();
    const source_id = faker.random.number();
    const double_id = faker.random.number();

    login = login.replace("'", '');
    first_name = first_name.replace("'", '');
    last_name = last_name.replace("'", '');

    const accountTypes = ['18', '19', '20', '21'];
    const account_type_id = accountTypes[exports.getRandomInt(0, accountTypes.length - 1)];

    let created_by: number | null = faker.random.number();
    const updated_by: number | null = null;

    sql = sql.replace('{{id}}', String(i + 1));
    sql = sql.replace('{{first_name}}', first_name);
    sql = sql.replace('{{last_name}}', last_name);
    sql = sql.replace('{{account_type_id}}', account_type_id);
    sql = sql.replace('{{login}}', login);
    sql = sql.replace('{{email}}', email);
    sql = sql.replace('{{phone}}', phone);
    sql = sql.replace('{{skype_id}}', login);
    sql = sql.replace('{{created_by}}', String(created_by));
    sql = sql.replace('{{source_id}}', String(source_id));
    sql = sql.replace('{{double_id}}', String(double_id));

    dbClient.query(sql);
    users.push({
      id: i + 1,
      account_type_id,
      login,
      first_name,
      last_name,
      email,
      phone,
      source_id,
      double_id,
      created_by,
      updated_by
    });
  }

  return users;
};

exports.addSreUsersFromData = (dbClient: any, insertUserTemplatePath: string, usersData: any[]) => {
  if (typeof usersData !== 'object' || !usersData.length) return;

  const insertUserTemplate = fs.readFileSync(insertUserTemplatePath, 'utf-8');
  const users = [];

  let i = 0;
  for (let user of usersData) {
    let sql = insertUserTemplate;
    let first_name = user.first_name;
    let last_name = user.last_name;
    let login = `${first_name}.${last_name}`;
    const email = faker.internet.email();
    const phone = faker.phone.phoneNumber();
    const skype_id = faker.phone.phoneNumber();
    const source_id = faker.random.number();
    const double_id = faker.random.number();

    login = login.replace("'", '');
    first_name = first_name.replace("'", '');
    last_name = last_name.replace("'", '');

    const accountTypes = ['18', '19', '20', '21'];
    const account_type_id = accountTypes[exports.getRandomInt(0, accountTypes.length - 1)];

    let created_by: number | null = faker.random.number();
    const updated_by: number | null = null;

    sql = sql.replace('{{id}}', String(i + 1));
    sql = sql.replace('{{first_name}}', first_name);
    sql = sql.replace('{{last_name}}', last_name);
    sql = sql.replace('{{account_type_id}}', account_type_id);
    sql = sql.replace('{{login}}', login);
    sql = sql.replace('{{email}}', email);
    sql = sql.replace('{{phone}}', phone);
    sql = sql.replace('{{skype_id}}', login);
    sql = sql.replace('{{created_by}}', String(created_by));
    sql = sql.replace('{{source_id}}', String(source_id));
    sql = sql.replace('{{double_id}}', String(double_id));

    dbClient.query(sql);

    users.push({
      id: i + 1,
      account_type_id,
      login,
      first_name,
      last_name,
      email,
      phone,
      source_id,
      double_id,
      created_by,
      updated_by
    });
    i++;
  }

  return users;
};

exports.getRandomInt = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min)) + min;
};

exports.getSampleUser = () => {
  const first_name = faker.name.findName();
  const last_name = faker.name.lastName();
  const login = `${first_name}.${last_name}`;
  const timeZones = ['America/Los_Angeles', 'Etc/GMT', 'Europe/Kiev', 'Europe/Moscow', 'US/Pacific', 'America/Denver'];
  const boolenVars = ['0', '1'];

  return {
    login,
    first_name,
    last_name,
    title: faker.random.words(),
    time_zone: timeZones[exports.getRandomInt(0, 7)],
    email: faker.internet.email(),
    phone: faker.phone.phoneNumber(),
    city: faker.random.word(),
    state: faker.random.word(),
    country: faker.random.word(),
    is_active: boolenVars[exports.getRandomInt(0, 2)],
    is_terminate: boolenVars[exports.getRandomInt(0, 2)]
  };
};
