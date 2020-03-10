import express from "express";
import parser from "cookie-parser";

const app = express();

const targetMap = new Map<
  any,
  {
    Class: Function;
    root: string;
    resources: {
      [key: string]: {
        method: "get" | "post" | "put";
        path: string;
      };
    };
  }
>();

export const root: (path: string) => ClassDecorator = function(path) {
  return function(TargetClass) {
    const targetData =
      targetMap.get(TargetClass.prototype) ||
      ({ Class: undefined, root: path, resources: {} } as any);
    targetData.class = TargetClass;
    targetData.root = path;
    targetMap.set(TargetClass.prototype, targetData);
    return TargetClass;
  };
};

export const path: (path: string) => MethodDecorator = function(path) {
  return function(target: any, key) {
    const targetData =
      targetMap.get(target) ||
      ({ Class: undefined, root: "", resources: {} } as any);
    targetData.resources[key] = { ...targetData.resources[key], path };
    targetMap.set(target, targetData);
    return target;
  };
};

function method(target: any, key: any, type: string) {
  const targetData =
    targetMap.get(target) ||
    ({ Class: undefined, root: "", resources: {} } as any);
  targetData.resources[key] = { ...targetData.resources[key], method: type };
  targetMap.set(target, targetData);
  return target;
}

const errorHandlerMap = new Map<any, { target: any, key: any }>();
export const handle: (error: any) => MethodDecorator = error => {
  return function(target, key) {
    errorHandlerMap.set(error, { target, key });
  }
}

export const get: MethodDecorator = (target: any, key) => method(target, key, "get");
export const post: MethodDecorator = (target: any, key) => method(target, key, "post");
export const put: MethodDecorator = (target: any, key) => method(target, key, "put");
export const customMethod: (type: string) => MethodDecorator =
  (type: string) => (target: any, key) => method(target, key, type);

let authHandler: { target: any, key: string | symbol } | undefined;
export const auth: MethodDecorator = function(target: any, key) {
  authHandler = { target, key };
}

let server: any;
export function listen(port: number) {
  app.use(express.json());
  app.use(parser());
  [...targetMap.entries()].forEach(([target, meta]) => {
    const { resources, root = "" } = meta;
    Object.keys(resources).forEach(key => {
      const { method = "get", path } = resources[key];
      const fullPath = root + path;
      debug(`${fullPath}: ${method.toUpperCase()}`);
      app[method](fullPath, async (req, res) => {
        const { params, body, query, headers, cookies } = req;
        debug(`${req.url}`);
        try {
          const authResult = authHandler && await (authHandler.target[authHandler.key](cookies));
          const result: any = await target[key](params, query, body, { headers, authResult });
          if (result instanceof Response) {
            res.status(result._status).header(result._headers).json(result._body);
          } else {
            res.status(200).header({}).json(result);
          }
        } catch (e) {
          try {
            error(e.stack);
            const found = [...errorHandlerMap.entries()].find(([key]) => e instanceof key);
            if (found == null) {
              return res.status(500).json({});
            }
            const [_,{ target, key }] = found;
            const result = await target[key](e);
            if (result instanceof Response) {
              res.status(result._status).json(result._body);
            } else {
              res.status(result.status).json(result.body);
            }
          } catch (e) {
            res.status(500).json({});
          }
        }
      });
    });
  });

  server = app.listen(port);
}

export function close() {
  (server as any).close();
}

function logFormat(type: string, text: string) {
  const date = new Date();
  return `${date.toISOString()} [${type.toUpperCase()}] ${text}`;
}

function debug(text: string) {
  console.log(logFormat("debug", text));
}

function error(text: string) {
  console.error(logFormat("error", text));
}

function warn(text: string) {
  console.warn(logFormat("warn ", text));
}


export class Response {
  _status: number = 200;
  _body: any = {};
  _headers: any = {};

  status(status: number) {
    this._status = status;
    return this;
  }

  body(json: any) {
    this._body = json;
    return this;
  }

  headers(headers: any) {
    this._headers = headers;
    return this;
  }
}
