import { path, root, get, listen, post, close, handle } from "..";
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
  async fun2({ id }: { id: string }) {
    return { id };
  }

  @path("/path2")
  @get
  async fun3(_: any, query: any) {
    return { ...query };
  }

  @path("/path3/:name/:age")
  @post
  async fun4(
    { name, age }: { name: string; age: string },
    query: any,
    body: any
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

class ErrorHandler {
  @handle(MyError)
  handler(error: MyError) {
    console.log(error);
    return { status: 400, body: { hello: "world" } };
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

const tests = [
  // async test.
  {
    path: "/root/path",
    method: "get",
    body: {},
    query: {},
    status: 200,
    response: { wait: 2000 }
  },
  // param test.
  {
    path: "/root/path/592",
    method: "get",
    body: {},
    query: {},
    status: 200,
    response: { id: "592" }
  },
  // query test.
  {
    path: "/root/path2",
    method: "get",
    body: {},
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
    body: {},
    query: {},
    status: 500,
    response: {}
  },
  // original error handler test
  {
    path: "/root/myerror",
    method: "get",
    body: {},
    query: {},
    status: 400,
    response: { hello: "world" }
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

  tests.forEach(({ status, path, method, body, query, response }) => {
    it(`should response ${JSON.stringify(response)}`, async () => {
      const result = await fetch(
        `http://localhost:${port}${path}${toQueryString(query)}`,
        {
          method,
          headers:
            method === "post"
              ? { "content-type": "application/json" }
              : undefined,
          body: method === "post" ? JSON.stringify(body) : undefined
        }
      );
      deepStrictEqual(status, result.status, "Status code are not equal.");
      deepStrictEqual(
        response,
        await result.json(),
        "Response body are not equal."
      );
    });
  });
});
