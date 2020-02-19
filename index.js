"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const app = express_1.default();
const targets = new Set();
exports.root = function (path) {
    return function (target) {
        target.prototype.__root__ = path;
        return target;
    };
};
exports.path = function (path) {
    return function (target, key) {
        const meta = { ...(target.__meta__ || {})[key] || {}, path };
        target.__meta__ = { ...target.__meta__ || {}, [key]: meta };
        targets.add(target);
        return target;
    };
};
function method(target, key, type) {
    const meta = { ...(target.__meta__ || {})[key] || {}, method: type };
    target.__meta__ = { ...target.__meta__ || {}, [key]: meta };
    targets.add(target);
    return target;
}
exports.get = function (target, key) {
    return method(target, key, "get");
};
exports.post = function (target, key) {
    return method(target, key, "post");
};
exports.put = function (target, key) {
    return method(target, key, "put");
};
exports.customMethod = function (type) {
    return function (target, key) {
        return method(target, key, type);
    };
};
function listen(port) {
    app.use(express_1.default.json());
    targets.forEach((target) => {
        const meta = target.__meta__;
        const root = target.__root__ || "";
        Object.keys(meta).forEach(key => {
            const { method = "get", path } = meta[key];
            const fullPath = root + path;
            debug(`${fullPath}: ${(method).toUpperCase()}`);
            app[method](fullPath, async (req, res) => {
                debug(`${req.url}`);
                const { params, body, query } = req;
                try {
                    const result = await target[key](params, query, body);
                    res.json(result);
                }
                catch (e) {
                    error(e.stack);
                    res.status(500).json({});
                }
            });
        });
    });
    app.listen(port);
}
exports.listen = listen;
function logFormat(type, text) {
    const date = new Date();
    return `${date.toISOString()} [${type.toUpperCase()}] ${text}`;
}
function debug(text) {
    console.log(logFormat("debug", text));
}
function error(text) {
    console.error(logFormat("error", text));
}
function warn(text) {
    console.warn(logFormat("warn ", text));
}
