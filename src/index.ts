import { fetch } from "undici";

const CONTENT_REGEX = /filename[^;=\n]*=(?:(\\?['"])(.*?)\1|(?:[^\s]+'.*?')?([^;\n]*))/i;

export interface LuraphOptionInfo {
    readonly name: string;
    readonly description: string;

    readonly tier: "CUSTOMER_ONLY" | "PREMIUM_ONLY" | "ADMIN_ONLY";
    readonly type: "CHECKBOX" | "DROPDOWN" | "TEXT";

    //empty `[]` if `type !== DROPDOWN`
    readonly choices: readonly string[];
}

export interface LuraphNode {
    readonly cpuUsage: number;
    readonly options: {
        readonly [key: string]: LuraphOptionInfo;  
    };
}

export interface LuraphOptionList {
    [key: string]: [boolean, string];
}

export interface LuraphError {
    readonly param?: string;
    readonly message: string;
}

export class LuraphException extends Error {
    public readonly errors: LuraphError[];

    constructor(payload: LuraphError[]){
        let errorMsg = payload
            .map(({param, message}) => param ? `${param}: ${message}` : message)
            .join(" | ");

        super(`${errorMsg}`);
        this.name = this.constructor.name;

        this.errors = payload;
    }
}

export class Luraph {
    private readonly apiKey: string;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    private async doRequest(url: string, isPost = false, body: object | undefined = undefined, rawResponse = false) {
        const req = await fetch(
            new URL(url, "https://api.lura.ph/v1/"),
            {
                method: isPost ? "POST" : "GET",
                headers: {
                    "Luraph-API-Key": this.apiKey,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(body)
            }
        );
    
        //raw responses
        if(rawResponse && req.ok)
            return req;

        const rawResp = await req.text();
        const resp = rawResp.length ? JSON.parse(rawResp) : {};

        if(resp.warnings){
            for(const warning of resp.warnings){
                console.warn(`Luraph API warning: ${warning}`);
            }
        }

        if(req.ok){
           return resp;
        }else{
            let errors = (resp as any)?.errors;
            if(!errors)
                errors = [{
                    message: "An unknown error occurred",
                    rawBody: resp
                }];
    
            throw new LuraphException(errors);
        }
    }    

    public getNodes() {
        return this.doRequest("obfuscate/nodes") as Promise<{ nodes: {[nodeId: string]: LuraphNode}; recommendedId: string | null }>;
    }

    public createNewJob(node: string, script: string, fileName: string, options: LuraphOptionList, useTokens = false, enforceSettings = false) {
        script = Buffer.from(script).toString("base64");
        return this.doRequest("obfuscate/new", true, {
            node,
            script,
            fileName,
            options,
            useTokens,
            enforceSettings
        }) as Promise<{ jobId: string }>;
    }

    public async getJobStatus(jobId: string) {
        const data = await this.doRequest(`obfuscate/status/${jobId}`) as { error: string | null };
        return {
            success: !data.error,
            error: data.error
        } as ({ success: true, error: null } | { success: false, error: string });
    }

    public async downloadResult(jobId: string) {
        const req = await this.doRequest(`obfuscate/download/${jobId}`, false, undefined, true);
        const fileName = CONTENT_REGEX.exec(req.headers.get("content-disposition"))?.[2] || "script-obfuscated.lua";
        const data = await req.text();

        return {
            data,
            fileName
        };
    }
};

export default Luraph;