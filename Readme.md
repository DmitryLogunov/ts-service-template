# Base TS template for microservice

The next endpoints are implemented:

```
GET:
/resource
/resource/:id
 
POST:
/resource

PATCH
/resource/:id

DELETE:
/resource/:id
```

## Usage

1. Copy config.yaml.template to config.yaml
2. Add port and resource if not exists
3. Add DBSettings to config.yaml
4. Change value **logSettings** in config
    1. **level** [string]
       1. development - debug
       2. production - info
       3. test - off
    2. **format** [number] - Format of logs in JSON
       1. **1** - SIMPLE
       2. **2** - JSON
    3. **colorize** [boolean] - Logs in colors

## Development

```bash
$ yarn
$ yarn dev
```

## Deployment

```bash
$ yarn
$ yarn test
$ yarn build
$ yarn start
$ open http://localhost:<port>/
```
