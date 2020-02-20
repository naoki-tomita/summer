import { path, root, get, listen, post } from "..";
import fetch from "node-fetch";
import { deepStrictEqual, fail } from "assert";

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
  async fun4({ name, age }: { name: string, age: string }, query: any, body: any) {
    return { name, age, query, body };
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

listen(8000);


///////////////////////////////////////////////////////////// test
function polling() {
  return new Promise(async ok => {
    for (let i = 0; i < 30; i++) {
      const result = await fetch("http://localhost:8000/ping")
      if (result.ok && result.status === 200) {
        return ok();
      }
      await sleep(500);
    }
  });
}

const tests = [
  // async test.
  { path: "/root/path", method: "get", body: {}, query: {}, response: { wait: 2000 } },
  // param test.
  { path: "/root/path/592", method: "get", body: {}, query: {}, response: { id: "592" } },
  // query test.
  { path: "/root/path2", method: "get", body: {}, query: { query1: "foo", query2: "bar" }, response: { query1: "foo", query2: "bar" } },
  // all test
  { path: "/root/path3/taro/23", method: "post", body: { greet: "hello world." }, query: { language: "ja" }, response: { name: "taro", age: "23", body: { greet: "hello world." }, query: { language: "ja" } } },

];

function toQueryString(obj: any) {
  const result = Object.entries(obj).map(x => x.join("=")).join("&");
  return result === "" ? "" : `?${result}`;
}

async function main() {
  await polling();

  try {
    for (const { path, method, body, query, response } of tests) {
      const result = await fetch(`http://localhost:8000${path}${toQueryString(query)}`, {
        method,
        headers: method === "post" ? { "content-type": "application/json" } : undefined,
        body: method === "post" ? JSON.stringify(body) : undefined,
      });
      if (!result.ok) {
        fail(`${await result.text()}`);
      }
      deepStrictEqual(response, await result.json());
    }
  } catch (e) {
    console.error(e);
    process.exit(1);
  }

  process.exit(0);
}

main();
