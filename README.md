![test](https://github.com/naoki-tomita/summer/workflows/test/badge.svg)

# summer-framework

A web framework like spring framework.


# how to use

```ts
import { listen, get, path, post, root } from "summer-framework";

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

}

launch(8000);
```
