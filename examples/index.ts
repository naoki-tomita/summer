import { get, path, listen, post, root } from "summer-framework";
import { inject, register } from "omusubi";

interface PongJson {
  pong: boolean;
}

class Foo {
  call() {
    console.log("foo call");
  }
}

@root("/v1")
export class SystemsResource {
  @inject(Foo)
  parameter!: Foo;

  @path("/systems/ping")
  @get
  ping(): PongJson {
    this.parameter.call();
    throw Error("error");
    // return { pong: true };
  }

  @path("/systems/:id")
  id(params: any, query: any) {
    this.parameter.call();
    console.log(params, query);
    return params;
  }

  @path("/systems/:id")
  @post
  post(params: any, query: any, body: any) {
    this.parameter.call();
    console.log(params, query, body);
    return { body, params };
  }
}

register(new Foo()).as(Foo);
listen(8000);
