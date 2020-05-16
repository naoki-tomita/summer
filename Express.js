"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.express = void 0;
const http_1 = require("http");
function express() {
    return new App();
}
exports.express = express;
function zipMax(left, right) {
    return zipLength(left, right, Math.max(left.length, right.length));
}
function zipMin(left, right) {
    return zipLength(left, right, Math.min(left.length, right.length));
}
function zipLength(left, right, length) {
    const dst = [];
    for (let i = 0; i < length; i++) {
        dst.push({
            left: left[i],
            right: right[i],
        });
    }
    return dst;
}
function trimSlash(input) {
    input = input.startsWith("/") ? input.slice(1) : input;
    input = input.endsWith("/") ? input.slice(0, -1) : input;
    return input;
}
function hasFitsUrl(defined, incoming) {
    return zipMax(trimSlash(defined).split("/"), trimSlash(incoming)
        .split("/")).every(({ left, right }) => {
        if (left === right) {
            return true;
        }
        if (left == null || right == null) {
            return false;
        }
        if (left.startsWith(":")) {
            return true;
        }
        return false;
    });
}
function getSimilarityUrl(defined, incoming) {
    const r = zipMax(trimSlash(defined).split("/"), trimSlash(incoming)
        .split("/")).reduce((prev, { left, right }) => {
        if (right == null) {
            return prev;
        }
        if (left === right) {
            return prev + 1;
        }
        if (left.startsWith(":")) {
            return prev + 1;
        }
        return prev;
    }, 0);
    console.log(defined, r);
    return r;
}
function getParams(defined, incoming) {
    return zipMin(trimSlash(defined).split("/"), trimSlash(incoming).split("/"))
        .reduce((prev, { left, right }) => left.startsWith(":")
        ? ({ ...prev, [left.slice(1)]: right })
        : prev, {});
}
function wrapAsIncomingMessage(message, params, query, cookies, body) {
    const dst = {
        ...message,
        params, query, cookies, body
    };
    dst.__proto__ = message.__proto__;
    return dst;
}
function wrapAsServerResponse(response) {
    const dst = {
        ...response,
        status(status) {
            response.statusCode = status;
            return wrapAsServerResponse(response);
        },
        header(header) {
            Object.entries(header).forEach(([key, value]) => response.setHeader(key, value));
            return wrapAsServerResponse(response);
        },
        json(json) {
            console.log(json);
            response.setHeader("content-type", "application/json");
            response.end(JSON.stringify(json));
        }
    };
    dst.__proto__ = response.__proto__;
    return dst;
}
function parseQuery(queryString) {
    return queryString.split("&")
        .map(item => item.trim())
        .filter(item => item !== "")
        .map(item => item.split("="))
        .reduce((prev, [key, value]) => ({ ...prev, [key]: value }), {});
}
async function parseBody(req) {
    let result = "";
    return new Promise(ok => {
        req.on("data", data => result = result + data.toString());
        req.on("end", () => {
            try {
                ok(JSON.parse(result));
            }
            catch {
                console.log(result);
                ok(result);
            }
        });
    });
}
"cookie: ANID=OPT_OUT; OTZ=5441785_20_20__20_; SID=xAfsG8CUYGo13vAS1xFvJNIHvpR1wXI8ZV9XEcnmNJgdD7j9UsC301ctrzro5bZ_94F1fg.; __Secure-3PSID=xAfsG8CUYGo13vAS1xFvJNIHvpR1wXI8ZV9XEcnmNJgdD7j9In3cQeasQ8a_YvKeGW-NGw.; HSID=AFYtuWZelr8tplf9-; SSID=AtCWTcibHNB1i51_9; APISID=dwxZSweQYDzibPaV/Aww3tpnS9u0GYENbz; SAPISID=108_4JPwFCtDf8v9/A-oSu2SJAZJbnm9s1; __Secure-HSID=AFYtuWZelr8tplf9-; __Secure-SSID=AtCWTcibHNB1i51_9; __Secure-APISID=dwxZSweQYDzibPaV/Aww3tpnS9u0GYENbz; __Secure-3PAPISID=108_4JPwFCtDf8v9/A-oSu2SJAZJbnm9s1; NID=204=HNoUpp5LPrakkaO0864b1Gm_JazMWtxfccZqohBOrjk_i41RLgLpGxGfzDSl-qzLiMJRR7w6D5EgX7N50LdCEhSlC5n7mAVrdxVYFvOaYc4jUkhqABaU69nbbBCnx_aeCPVFJ894hY8U3bh1C5BnwKdqpk_1mYGN-P9Exc9xFVsOI0QQdMOg9x_vteDQO7brVny6IInTPBscr49TQqLSsDp6zEwL3r6bi8kwPq7bNzCYnaghvS5xzuSX68MronMYXqLyk3e4jTCtTDUGQ6ZtY9FQ9kns4iIvAkhjuyQmHcwAVDyOgWazNmOy3ZuF01y9nkR3rXJVenFIiLc94WgoCLXVKwf4gkExdyfVgJxjoa8t6ZaTww; 1P_JAR=2020-05-15-23; SIDCC=AJi4QfHpQEgNC1eNPqANUNjeJxQW888u1HJH2-uc9IYtBrRKXYXbNp-2ziArzpzQ5o5aXesz-24";
function parseCookie(cookieString) {
    return cookieString.split(";")
        .map(item => item.trim())
        .filter(item => item !== "")
        .map(item => item.split("="))
        .reduce((prev, [key = "", value = ""]) => ({ ...prev, [key]: value }), {});
}
class App {
    constructor() {
        this.callbacks = [];
        this.server = http_1.createServer(async (req, res) => {
            try {
                const url = req.url ?? "";
                const [path = "", queryString = ""] = url.split("?");
                const founds = this.callbacks
                    .filter(it => it.method === (req.method ?? "").toUpperCase())
                    .filter(it => hasFitsUrl(it.path, path));
                if (founds.length === 0) {
                    return res.writeHead(404).end();
                }
                let body = {};
                if (req.method?.toUpperCase() === "POST" || req.method?.toUpperCase() === "PUT") {
                    body = await parseBody(req);
                }
                const found = founds.sort((a, b) => getSimilarityUrl(b.path, path) - getSimilarityUrl(a.path, path))[0];
                await found.handler(wrapAsIncomingMessage(req, getParams(found.path, path), parseQuery(queryString), parseCookie(req.headers.cookie ?? ""), body), wrapAsServerResponse(res));
            }
            catch (e) {
                console.error(e.stack);
                return res.writeHead(500).end(e.stack);
            }
        });
    }
    async listen(port) {
        return new Promise(ok => this.server.listen(port, () => ok(this)));
    }
    use(method, path, handler) {
        this.callbacks.push({
            method: method.toUpperCase(),
            path,
            handler,
        });
    }
    get(path, handler) {
        this.use("get", path, handler);
    }
    post(path, handler) {
        this.use("post", path, handler);
    }
    put(path, handler) {
        this.use("put", path, handler);
    }
    close() {
        this.server.close();
    }
}
