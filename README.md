![test](https://github.com/naoki-tomita/summer/workflows/test/badge.svg)

# summer-framework

A web framework like spring framework.


# how to use

```ts
import { listen, get, path, post, root, handle } from "summer-framework";

@root("/root")
class FooBarResource {

  // /root/foo
  @path("/foo")
  foo() {
    return { foo: "foo" };
  }

  // /root/foo/bar?query=string
  // params -> { param: "bar" }, query -> { query: "string" }
  @path("/foo/:param")
  @get
  async fooParam(params: { param: string }, query: { query: string }) {
    return await someAsyncFunction();
  }

  // /root/bar
  // body -> requestBody
  @post
  @path("/bar")
  async barPost(params: {}, query: {}, body: { some: string, parameter: string }) {
    return body;
  }

  @handle(MyException)
  async handleMyException(error: MyException): { status: number, body: any } {
    return { status: 404, body: { error: "this is my exception." } }
  }
}

launch(8000);
```
