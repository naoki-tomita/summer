![test](https://github.com/naoki-tomita/summer/workflows/test/badge.svg)

# summer-framework

A web framework like spring framework.


# how to use

```ts
import { listen, get, path, post, root, handle, Request, Response } from "summer-framework";

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
  async fooParam({ params, query }: Request) {
    return new Response(200).body(await someAsyncFunction());
  }

  // /root/bar
  // body -> requestBody
  @post
  @path("/bar")
  async barPost({ body }: Request) {
    return new Response().status(200).body({ ...body });
  }

  @handle(MyException)
  async handleMyException(error: MyException): Response {
    return new Response().status(404).header({ foo: "bar" }).body({ error: "message" });
  }
}

launch(8000);
```
