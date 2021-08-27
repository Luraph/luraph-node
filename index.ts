import axios, { AxiosError, AxiosInstance, AxiosResponse } from "axios";

const CONTENT_REGEX = /filename[^;=\n]*=(?:(\\?['"])(.*?)\1|(?:[^\s]+'.*?')?([^;\n]*))/i;

export interface LuraphOptionSpec {
    readonly name: string;
    readonly description: string;
    readonly tier: string;
    readonly type: string;
    readonly choices: readonly string[];
}

export interface LuraphOptionSpecList {
    readonly [optionName: string]: LuraphOptionSpec;
}

export interface LuraphOptionList {
    [optionName: string]: [boolean, string];
}

export interface LuraphNode {
    readonly cpuUsage: number;
    readonly options: LuraphOptionSpecList;
}

export interface LuraphNodeList {
    readonly [nodeId: string]: LuraphNode;
}

export interface LuraphNodesResponse {
    readonly recommendedId: string;
    readonly nodes: LuraphNodeList;
}

export interface LuraphNewJobResponse {
    readonly jobId: string;
}

export interface LuraphJobStatusResponse {
    readonly success: boolean;
    readonly error?: string;
}

export interface LuraphDownloadResponse {
    readonly fileName: string;
    readonly data: string;
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

        super(`Luraph API Error: ${errorMsg}`);
        this.name = this.constructor.name;

        this.errors = payload;
    }
}

export class LuraphAPI {
    private readonly api: AxiosInstance;

    constructor(apiKey: string) {
        this.api = axios.create({
            baseURL: "https://api.lura.ph/v1/",
            headers: {
                "Luraph-API-Key": apiKey
            }
        });

        this.api.interceptors.response.use(this.onResponseFufilled, this.onResponseRejected);
    }

    private onResponseFufilled(resp: AxiosResponse) {
        if(!resp.data)
            resp.data = {};
        return Promise.resolve(resp);
    }

    private onResponseRejected(err: AxiosError) {
        if(err.isAxiosError && err.response && err.response.data && err.response.data.errors){
            return Promise.reject(new LuraphException(err.response.data.errors));
        }
        return Promise.reject(err);
    }

    async getNodes() {
        return (await this.api.get("/obfuscate/nodes")).data as LuraphNodesResponse;
    }

    async createNewJob(node: string, script: string, fileName: string, options: LuraphOptionList) {
        script = Buffer.from(script).toString("base64");
        return (await this.api.post("/obfuscate/new", {
            node,
            script,
            fileName,
            options
        })).data as LuraphNewJobResponse;
    }

    async getJobStatus(jobId: string) {
        const {data} = await this.api.get(`/obfuscate/status/${jobId}`);
        return {
            success: !data.error,
            error: data.error
        } as LuraphJobStatusResponse;
    }

    async downloadResult(jobId: string) {
        const {data, headers} = await this.api.get(`/obfuscate/download/${jobId}`);
        const fileName = (CONTENT_REGEX.exec(headers['content-disposition'] || '') || [])[2]
        return {
            data,
            fileName
        } as LuraphDownloadResponse;
    }

};

export default LuraphAPI;
export const Luraph = LuraphAPI;
export const API = LuraphAPI;