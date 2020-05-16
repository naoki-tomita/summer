/// <reference types="node" />
import { Server, IncomingMessage as RawIncomingMessage, ServerResponse as RawServerResponse } from "http";
export declare function express(): App;
interface IncomingMessage extends RawIncomingMessage {
    params: {
        [key: string]: string;
    };
    query: {
        [key: string]: string;
    };
    cookies: {
        [key: string]: string;
    };
    body?: any;
}
interface ServerResponse extends RawServerResponse {
    status(status: number): ServerResponse;
    header(header: {
        [key: string]: string;
    }): ServerResponse;
    json(json: object): void;
}
declare type RequestHandler = (req: IncomingMessage, res: ServerResponse) => Promise<void> | void;
declare class App {
    server: Server;
    callbacks: {
        method: string;
        path: string;
        handler: RequestHandler;
    }[];
    constructor();
    listen(port: number): Promise<App>;
    use(method: string, path: string, handler: RequestHandler): void;
    get(path: string, handler: RequestHandler): void;
    post(path: string, handler: RequestHandler): void;
    put(path: string, handler: RequestHandler): void;
    close(): void;
}
export {};
//# sourceMappingURL=Express.d.ts.map