import { createServer, Server, IncomingMessage as RawIncomingMessage, ServerResponse as RawServerResponse } from "http";

export function express() {
  return new App();
}

type RawRequestHandler = (req: RawIncomingMessage, res: RawServerResponse) => void;
interface IncomingMessage extends RawIncomingMessage {
  params: { [key: string]: string };
  query: { [key: string]: string };
  cookies: { [key: string]: string };
  body?: any;
}
interface ServerResponse extends RawServerResponse {
  status(status: number): ServerResponse;
  header(header: { [key: string]: string }): ServerResponse;
  json(json: object): void;
}
type RequestHandler = (req: IncomingMessage, res: ServerResponse) => Promise<void> | void;

function zipMax<T, R>(left: T[], right: R[]): { left: T, right?: R }[] {
  return zipLength(left, right, Math.max(left.length, right.length));
}

function zipMin<T, R>(left: T[], right: R[]): { left: T, right: R }[] {
  return zipLength(left, right, Math.min(left.length, right.length));
}

function zipLength<T, R>(left: T[], right: R[], length: number): { left: T, right: R }[] {
  const dst = [];
  for (let i = 0; i < length; i++) {
    dst.push({
      left: left[i],
      right: right[i],
    });
  }
  return dst;
}

function trimSlash(input: string) {
  input = input.startsWith("/") ? input.slice(1) : input;
  input = input.endsWith("/") ? input.slice(0, -1) : input;
  return input;
}


function hasFitsUrl(defined: string, incoming: string): boolean {
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

function getSimilarityUrl(defined: string, incoming: string): number {
  const r = zipMax(trimSlash(defined).split("/"), trimSlash(incoming)
    .split("/")).reduce<number>((prev, { left, right }) => {
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
  return r
}

function getParams(defined: string, incoming: string): { [key: string]: string } {
  return zipMin(trimSlash(defined).split("/"), trimSlash(incoming).split("/"))
    .reduce((prev, { left, right }) =>
      left.startsWith(":")
        ? ({ ...prev, [left.slice(1)]: right })
        : prev,
      {}
    );
}

function wrapAsIncomingMessage(message: RawIncomingMessage, params: any, query: any, cookies: any, body?: any): IncomingMessage {
  const dst = {
    ...message,
    params, query, cookies, body
  } as IncomingMessage;
  (dst as any).__proto__ = (message as any).__proto__;
  return dst;
}

function wrapAsServerResponse(response: RawServerResponse): ServerResponse {
  const dst: ServerResponse = {
    ...response,
    status(status: number) {
      response.statusCode = status;
      return wrapAsServerResponse(response);
    },
    header(header: { [key: string]: string }) {
      Object.entries(header).forEach(([key, value]) => response.setHeader(key, value));
      return wrapAsServerResponse(response);
    },
    json(json: any) {
      response.setHeader("content-type", "application/json");
      response.end(JSON.stringify(json));
    }
  } as unknown as ServerResponse;
  (dst as any).__proto__ = (response as any).__proto__;
  return dst;
}

function parseQuery(queryString: string) {
  return queryString.split("&")
    .map(item => item.trim())
    .filter(item => item !== "")
    .map(item => item.split("="))
    .reduce((prev, [key, value]) => ({ ...prev, [key]: value }), {});
}

async function parseBody(req: RawIncomingMessage): Promise<any> {
  let result = "";
  return new Promise(ok => {
    req.on("data", data => result = result + data.toString());
    req.on("end", () => {
      try {
        ok(JSON.parse(result));
      } catch {
        console.error(`Failed to parse body by json. This framework expect json body.: ${result}`);
        ok(result);
      }
    });
  });
}

"cookie: ANID=OPT_OUT; OTZ=5441785_20_20__20_; SID=xAfsG8CUYGo13vAS1xFvJNIHvpR1wXI8ZV9XEcnmNJgdD7j9UsC301ctrzro5bZ_94F1fg.; __Secure-3PSID=xAfsG8CUYGo13vAS1xFvJNIHvpR1wXI8ZV9XEcnmNJgdD7j9In3cQeasQ8a_YvKeGW-NGw.; HSID=AFYtuWZelr8tplf9-; SSID=AtCWTcibHNB1i51_9; APISID=dwxZSweQYDzibPaV/Aww3tpnS9u0GYENbz; SAPISID=108_4JPwFCtDf8v9/A-oSu2SJAZJbnm9s1; __Secure-HSID=AFYtuWZelr8tplf9-; __Secure-SSID=AtCWTcibHNB1i51_9; __Secure-APISID=dwxZSweQYDzibPaV/Aww3tpnS9u0GYENbz; __Secure-3PAPISID=108_4JPwFCtDf8v9/A-oSu2SJAZJbnm9s1; NID=204=HNoUpp5LPrakkaO0864b1Gm_JazMWtxfccZqohBOrjk_i41RLgLpGxGfzDSl-qzLiMJRR7w6D5EgX7N50LdCEhSlC5n7mAVrdxVYFvOaYc4jUkhqABaU69nbbBCnx_aeCPVFJ894hY8U3bh1C5BnwKdqpk_1mYGN-P9Exc9xFVsOI0QQdMOg9x_vteDQO7brVny6IInTPBscr49TQqLSsDp6zEwL3r6bi8kwPq7bNzCYnaghvS5xzuSX68MronMYXqLyk3e4jTCtTDUGQ6ZtY9FQ9kns4iIvAkhjuyQmHcwAVDyOgWazNmOy3ZuF01y9nkR3rXJVenFIiLc94WgoCLXVKwf4gkExdyfVgJxjoa8t6ZaTww; 1P_JAR=2020-05-15-23; SIDCC=AJi4QfHpQEgNC1eNPqANUNjeJxQW888u1HJH2-uc9IYtBrRKXYXbNp-2ziArzpzQ5o5aXesz-24"

function parseCookie(cookieString: string) {
  return cookieString.split(";")
    .map(item => item.trim())
    .filter(item => item !== "")
    .map(item => item.split("="))
    .reduce((prev, [key = "", value = ""]) => ({ ...prev, [key]: value }), {});
}

class App {
  server: Server;
  callbacks: {
    method: string;
    path: string;
    handler: RequestHandler;
  }[] = [];
  constructor() {
    this.server = createServer(async (req, res) => {
      try {
        const url = req.url ?? "";
        const [path = "", queryString = ""] = url.split("?")
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
        const found = founds.sort((a, b) =>
          getSimilarityUrl(b.path, path) - getSimilarityUrl(a.path, path))[0];
        await found.handler(
          wrapAsIncomingMessage(req, getParams(found.path, path), parseQuery(queryString), parseCookie(req.headers.cookie ?? ""), body),
          wrapAsServerResponse(res)
        );
      } catch (e) {
        console.error(e.stack);
        return res.writeHead(500).end(e.stack);
      }
    });
  }

  async listen(port: number): Promise<App> {
    return new Promise(ok =>
      this.server.listen(port, () => ok(this))
    );
  }

  use(method: string, path: string, handler: RequestHandler) {
    this.callbacks.push({
      method: method.toUpperCase(),
      path,
      handler,
    });
  }

  get(path: string, handler: RequestHandler) {
    this.use("get", path, handler);
  }

  post(path: string, handler: RequestHandler) {
    this.use("post", path, handler);
  }

  put(path: string, handler: RequestHandler) {
    this.use("put", path, handler);
  }

  close() {
    this.server.close();
  }
}
