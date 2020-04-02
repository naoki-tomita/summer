import { path, root, get, listen, post, close, handle, auth, Response, Request } from "..";
import fetch from "node-fetch";
import { deepStrictEqual } from "assert";

function sleep(ms: number) {
  return new Promise(ok => setTimeout(ok, ms));
}

@root("/root")
class Test {
  @path("/path")
  @get
  async fun1() {
    await sleep(2000);
    return { wait: 2000 };
  }

  @path("/path/:id")
  @get
  async fun2({ params: { id } }: Request<{ id: string }>) {
    return { id };
  }

  @path("/path2")
  @get
  async fun3({ query }: Request) {
    return { ...query };
  }

  @path("/path3/:name/:age")
  @post
  async fun4(
    { params: {name, age}, query, body }: Request<{ name: string; age: string }>
  ) {
    return { name, age, query, body };
  }

  @path("/error")
  @get
  async fun5() {
    throw Error("an error occured.");
  }

  @path("/myerror")
  @get
  async fun6() {
    throw new MyError("MyError");
  }

  @path("/myerror2")
  @get
  async fun62() {
    throw new MyError2("MyError");
  }

  @path("/headers")
  @get
  async fun7({ headers }: Request) {
    return headers;
  }

  @auth
  async auth(cookies: any) {
    console.log(cookies);
    return { name: cookies.user };
  }

  @path("/response")
  async setHeader() {
    return new Response().status(302).headers({ "set-cookie": "foo=bar" }).body({ hello: "world" });
  }
}

class System {
  @path("/ping")
  @get
  async method() {
    await sleep(2000);
    return { wait: 2000 };
  }
}

class MyError extends Error {}
class MyError2 implements Error {
  name: string = "MyError2";
  message: string;
  stack?: string | undefined;
  constructor(message: string = "") {
    this.message = message;
    Error.captureStackTrace(this);
  }
}

class ErrorHandler {
  @handle(MyError)
  handler(error: MyError) {
    console.log(error);
    return { status: 400, body: { hello: "world" } };
  }

  @handle(MyError2)
  handler2(error: MyError2) {
    console.log(error);
    return new Response().status(403).headers({ foo: "bar" }).body({ error: "error" });
  }
}

const port = Math.floor(Math.random() * 30000 + 30000);
listen(port);

function polling() {
  return new Promise(async ok => {
    for (let i = 0; i < 30; i++) {
      const result = await fetch(`http://localhost:${port}/ping`);
      if (result.ok && result.status === 200) {
        return ok();
      }
      await sleep(500);
    }
  });
}

const tests: Array<{
  path: string;
  method: "get" | "post" | "put";
  body?: any;
  query?: any;
  headers?: any;
  status: number;
  response: any;
}> = [
  // async test.
  {
    path: "/root/path",
    method: "get",
    status: 200,
    response: { wait: 2000 }
  },
  // param test.
  {
    path: "/root/path/592",
    method: "get",
    status: 200,
    response: { id: "592" }
  },
  // query test.
  {
    path: "/root/path2",
    method: "get",
    query: { query1: "foo", query2: "bar" },
    status: 200,
    response: { query1: "foo", query2: "bar" }
  },
  // all test
  {
    path: "/root/path3/taro/23",
    method: "post",
    body: { greet: "hello world." },
    query: { language: "ja" },
    status: 200,
    response: {
      name: "taro",
      age: "23",
      body: { greet: "hello world." },
      query: { language: "ja" }
    }
  },
  // error test
  {
    path: "/root/error",
    method: "get",
    status: 500,
    response: {}
  },
  // original error handler test
  {
    path: "/root/myerror",
    method: "get",
    status: 400,
    response: { hello: "world" }
  },
  // original error handler test
  {
    path: "/root/myerror2",
    method: "get",
    status: 403,
    response: { error: "error" }
  },
  // request header response test.
  {
    path: "/root/headers",
    method: "get",
    headers: { foo: "bar", cookie: "user=tomita" },
    status: 200,
    response: {
      "accept": "*/*",
      "accept-encoding": "gzip,deflate",
      "connection": "close",
      "foo": "bar",
      "cookie": "user=tomita",
      "host": `localhost:${port}`,
      "user-agent": "node-fetch/1.0 (+https://github.com/bitinn/node-fetch)",
    }
  },
];

function toQueryString(obj: any) {
  const result = Object.entries(obj)
    .map(x => x.join("="))
    .join("&");
  return result === "" ? "" : `?${result}`;
}

describe("summer-framework test", () => {
  beforeAll(async () => {
    await polling();
  });

  afterAll(() => {
    close();
  });

  tests.forEach(({ status, path, method, body, query, response, headers }) => {
    it(`should response ${JSON.stringify(response)}`, async () => {
      const result = await fetch(
        `http://localhost:${port}${path}${toQueryString(query || {})}`,
        {
          method,
          headers: {
            ...(headers || {}),
            ...(method === "post"
              ? { "content-type": "application/json" }
              : {}
            ),
          },
          body: method === "post" ? JSON.stringify(body || {}) : undefined
        }
      );
      deepStrictEqual(result.status, status, "Status code are not equal.");
      deepStrictEqual(
        await result.json(),
        response,
        "Response body are not equal."
      );
    });
  });

  it("should parese Response object", async () => {
    // parse Response object.
    const { path, status, response } = {
      path: "/root/response",
      status: 302,
      response: {
        hello: "world"
      },
    }

    const result = await fetch(`http://localhost:${port}${path}`);
    deepStrictEqual(status, result.status, "Status code are not equal.");
    deepStrictEqual(
      response,
      await result.json(),
      "Response body are not equal."
    );
  })
});
