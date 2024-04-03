const CONTENT_REGEX =
    /filename[^;=\n]*=(?:(\\?['"])(.*?)\1|(?:[^\s]+'.*?')?([^;\n]*))/i;

export type LuraphOptionValue = string | boolean;

export interface LuraphOptionDependencies {
    readonly [target: string]: readonly LuraphOptionValue[];
}

export type LuraphOptionInfo = Readonly<{
    name: string;
    description: string;

    tier: "CUSTOMER_ONLY" | "PREMIUM_ONLY" | "ADMIN_ONLY";
    type: "CHECKBOX" | "DROPDOWN" | "TEXT";

    /**
     * empty `[]` if `type !== DROPDOWN`
     */
    choices: readonly string[];

    required: boolean;
    dependencies?: LuraphOptionDependencies;
}>;

export type LuraphNode = Readonly<{
    cpuUsage: number;
    options: {
        readonly [key: string]: LuraphOptionInfo;
    };
}>;

export interface LuraphOptionList {
    [key: string]: LuraphOptionValue;
}

export type LuraphError = Readonly<{
    param?: string;
    message: string;
}>;

export class LuraphException extends Error {
    public readonly errors: LuraphError[];

    constructor(payload: LuraphError[]) {
        let errorMsg = payload
            .map(({ param, message }) =>
                param ? `${param}: ${message}` : message
            )
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

    private async request<
        Parsed extends Object,
        isRaw extends boolean = false,
        R = isRaw extends true ? Response : Parsed
    >(
        url: string,
        isPost = false,
        body: object | undefined = undefined,
        rawResponse: isRaw = false as isRaw
    ): Promise<R> {
        const req = await fetch(new URL(url, "https://api.lura.ph/v1/"), {
            method: isPost ? "POST" : "GET",
            headers: {
                "Luraph-API-Key": this.apiKey,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });

        //raw responses
        // @ts-ignore type can't be inferred even though in this branch rawResponse is true
        if (rawResponse && req.ok) return req;

        const rawResp = await req.text();
        const resp = rawResp.length ? JSON.parse(rawResp) : {};

        if (resp.warnings) {
            for (const warning of resp.warnings) {
                console.warn(`Luraph API warning: ${warning}`);
            }
        }

        if (req.ok) {
            return resp;
        } else {
            let errors = (
                resp as {
                    errors: (LuraphError & { rawBody?: string })[];
                }
            )?.errors;
            if (!errors)
                errors = [
                    {
                        message: "An unknown error occurred",
                        rawBody: resp,
                    },
                ];

            throw new LuraphException(errors);
        }
    }

    public getNodes() {
        return this.request<{
            nodes: { [nodeId: string]: LuraphNode };
            recommendedId: string | null;
        }>("obfuscate/nodes");
    }

    public createNewJob(
        node: string,
        script: string,
        fileName: string,
        options: LuraphOptionList,
        useTokens = false,
        enforceSettings = false
    ) {
        script = Buffer.from(script).toString("base64");
        return this.request<{ jobId: string }>("obfuscate/new", true, {
            node,
            script,
            fileName,
            options,
            useTokens,
            enforceSettings,
        });
    }

    public async getJobStatus(jobId: string) {
        const data = await this.request<{
            error: string | null;
        }>(`obfuscate/status/${jobId}`);

        return {
            success: !data.error,
            error: data.error,
        } as { success: true; error: null } | { success: false; error: string };
    }

    public async downloadResult(jobId: string) {
        const req = await this.request(
            `obfuscate/download/${jobId}`,
            false,
            undefined,
            true
        );

        const fileName =
            CONTENT_REGEX.exec(
                req.headers.get("content-disposition") ?? ""
            )?.[2] || "script-obfuscated.lua";

        const data = await req.text();

        return {
            data,
            fileName,
        };
    }
}

export default Luraph;
