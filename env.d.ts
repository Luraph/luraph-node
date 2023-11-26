declare namespace NodeJS {
    namespace undici {
        type Request = typeof globalThis extends { onmessage: any } ? {} : import("undici").Request;
        type Response = typeof globalThis extends { onmessage: any } ? {} : import("undici").Response;
        type File = typeof globalThis extends { onmessage: any } ? {} : import("undici").File;
        type FormData = typeof globalThis extends { onmessage: any } ? {} : import("undici").FormData;
        type Headers = typeof globalThis extends { onmessage: any } ? {} : import("undici").Headers;
    }
}

declare function fetch(
    input: import("undici").RequestInfo,
    init?: import("undici").RequestInit
): Promise<Response>;