import express from "express";

const app = express();
const targets = new Set<{
  [key: string]: (...args: any[]) => any,
} & {
  __root__: string,
  __meta__: { [key: string]: { method: "get" | "post" | "put", path: string } }
}>();

export const root: (path: string) => ClassDecorator = function(path) {
  return function(target: any) {
    target.prototype.__root__ = path;
    return target;
  }
}

export const path: (path: string) => MethodDecorator = function(path) {
  return function(target: any, key) {
    const meta = { ...(target.__meta__ || {})[key] || {}, path };
    target.__meta__ = { ...target.__meta__ || {}, [key]: meta };
    targets.add(target);
    return target;
  }
}

function method(target: any, key: string | symbol, type: string) {
  const meta = { ...(target.__meta__ || {})[key] || {}, method: type };
  target.__meta__ = { ...target.__meta__ || {}, [key]: meta };
  targets.add(target);
  return target;
}

export const get: MethodDecorator = function(target: any, key) {
  return method(target, key, "get");
}

export const post: MethodDecorator = function(target: any, key) {
  return method(target, key, "post");
}

export const put: MethodDecorator = function(target: any, key) {
  return method(target, key, "put");
}

export const customMethod: (type: string) => MethodDecorator = function(type: string) {
  return function(target: any, key) {
    return method(target, key, type);
  }
}

export function listen(port: number) {
  app.use(express.json());
  targets.forEach((target) => {
    const meta = target.__meta__;
    const root = target.__root__ || "";
    Object.keys(meta).forEach(key => {
      const { method = "get", path } = meta[key];
      const fullPath = root + path;
      debug(`${fullPath}: ${(method).toUpperCase()}`)
      app[method](fullPath, async (req, res) => {
        debug(`${req.url}`)
        const { params, body, query } = req;
        try {
          const result = await target[key](params, query, body);
          res.json(result);
        } catch (e) {
          error(e.stack);
          res.status(500).json({});
        }
      });
    });
  });


  app.listen(port);
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
