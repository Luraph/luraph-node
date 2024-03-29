# luraph-node

[![Version](https://img.shields.io/npm/v/luraph.svg)](https://www.npmjs.org/package/luraph)
[![Downloads](https://img.shields.io/npm/dm/luraph.svg)](https://www.npmjs.com/package/luraph)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/luraph)](https://bundlephobia.com/package/luraph)
[![Build Status](https://github.com/Luraph/luraph-node/actions/workflows/release.yml/badge.svg)](https://github.com/Luraph/luraph-node/actions/workflows/release.yml)
[![License](https://img.shields.io/github/license/Luraph/luraph-node)](LICENSE)

This repository hosts the official SDK for interacting with the Luraph API from Node.js environments.

**Luraph API access is only available for accounts under certain plans. For more information, please check out the pricing plans on the [Luraph website](https://lura.ph/#pricing).**

## Installation

Install the [luraph](https://npmjs.org/package/luraph) package from npm using your package manager of choice.

Example:
```sh
npm install luraph
# or
yarn add luraph
# or
pnpm install luraph
```

## Usage

*The official [Luraph API documentation](https://lura.ph/dashboard/documents/apidoc) contains the most up-to-date and complete information and instructions for integrating with the Luraph API.*

#### [Basic](examples/basic.js)

```js
const { Luraph } = require("luraph");

const apiKey = process.env.LPH_API_KEY; //replace with your api key
const luraph = new Luraph(apiKey);

const obfuscate = async (script, fileName) => {
    console.log(`[*] file name: ${fileName}`);

    const nodes = await luraph.getNodes();
    console.log(`[*] recommended node: ${nodes.recommendedId}`);

    const node = nodes.nodes[nodes.recommendedId];
    console.log(`[*] cpu usage: ${node.cpuUsage}`);

    const { jobId } = await luraph.createNewJob(nodes.recommendedId, script, fileName, {});
    console.log(`[*] job id: ${jobId}`);

    const { success, error } = await luraph.getJobStatus(jobId);
    console.log(`[*] job status: ${success ? "success" : "error"}`);

    if(success){
        const {fileName: resultName, data} = await luraph.downloadResult(jobId);
        console.log(`[*] result name: ${resultName}`);
        
        return data;
    }else{
        throw error; //error is a string
    }
};

obfuscate("print'Hello World!'", `luraph-node-${Date.now()}.lua`)
    .then(result => console.log(`[*] obfuscation successful: ${result.split("\n")[0]}`))
    .catch(error => console.error(`[*] obfuscation failed: ${error}`));
```

#### [List Options](examples/list_options.js)

```js
const { Luraph } = require("luraph");

const apiKey = process.env.LPH_API_KEY; //replace with your api key
const luraph = new Luraph(apiKey);

const listOptions = async () => {
    const nodes = await luraph.getNodes();
    console.log(`[*] recommended node: ${nodes.recommendedId}`);

    const node = nodes.nodes[nodes.recommendedId];
    console.log(`[*] cpu usage: ${node.cpuUsage}`);
    
    console.log("[*] options:");
    for(const [optionId, optionInfo] of Object.entries(node.options)){
        console.log("  *", optionId, "-", optionInfo.name + ":");
        console.log("  |- desc:", optionInfo.description);
        console.log("  |- type:", optionInfo.type);
        console.log("  |- tier:", optionInfo.tier);
        console.log("  |- choices:", `[${optionInfo.choices.join(", ")}]`);
        console.log("  |- required:", optionInfo.required);
        if(optionInfo.dependencies) console.log("  |- dependencies: ", optionInfo.dependencies);
    }
};

listOptions();
```

#### [Setting Options](examples/set_options.js)

```js
const { Luraph } = require("luraph");

const apiKey = process.env.LPH_API_KEY; //replace with your api key
const luraph = new Luraph(apiKey);

const obfuscate = async (script, fileName) => {
    console.log(`[*] file name: ${fileName}`);

    const nodes = await luraph.getNodes();
    console.log(`[*] recommended node: ${nodes.recommendedId}`);

    const node = nodes.nodes[nodes.recommendedId];
    console.log(`[*] cpu usage: ${node.cpuUsage}`);

    const { jobId } = await luraph.createNewJob(nodes.recommendedId, script, fileName, {
        "TARGET_VERSION": "Lua 5.2"
    });
    console.log(`[*] job id: ${jobId}`);

    const { success, error } = await luraph.getJobStatus(jobId);
    console.log(`[*] job status: ${success ? "success" : "error"}`);

    if(success){
        const {fileName: resultName, data} = await luraph.downloadResult(jobId);
        console.log(`[*] result name: ${resultName}`);
        
        return data;
    }else{
        throw error; //error is a string
    }
};

obfuscate("print'Hello World!'", `luraph-node-${Date.now()}.lua`)
    .then(result => console.log(`[*] obfuscation successful: ${result.split("\n")[0]}`))
    .catch(error => console.error(`[*] obfuscation failed: ${error}`));
```

## Documentation

*The official [Luraph API documentation](https://lura.ph/dashboard/documents/apidoc) contains the most up-to-date and complete information and instructions for integrating with the Luraph API.*

### class Luraph

#### constructor(apiKey: string): Luraph

Description: Creates an instance of the SDK.

Parameters:
- **apiKey** - API key to authenticate your requests. You can fetch your API key from your [account page](https://lura.ph/dashboard/account).

Returns: An instance of the Luraph class allowing API requests to be made.

---

#### getNodes(): Promise<{ nodes: {[nodeId: string]: LuraphNode}; recommendedId: string | null }>

Description: Obtains a list of available obfuscation nodes.

Parameters: *None!*

Returns: *&lt;object&gt;*
- **recommendedId** - The most suitable node to perform an obfuscation based on current service load and other possible factors.
- **nodes** - A list of all available nodes to submit obfuscation jobs to. For more information on the structure of this field, please refer to the [Luraph API documentation](https://lura.ph/dashboard/documents/apidoc).

---

#### createNewJob(node: string, script: string, fileName: string, options: LuraphOptionList, useTokens = false, enforceSettings = false): Promise<{ jobId: string }>

Description: Queues a new obfuscation task.

Parameters:
- **node**: The node to assign the obfuscation job to.
- **script**: The script to be obfuscated.
- **fileName**: A file name to associate with this script. The maximum file name is 255 characters.
- **options**: An object containing keys that represent the option identifiers, and values that represent the desired settings. Unless `enforceSettings` is set to false, all options supported by the node must have a value specified, else the endpoint will error.
- **useTokens** - A boolean on whether you'd like to use tokens regardless of your active subscription.
- **enforceSettings** - A boolean on whether you'd like the `options` field to require *every* option requested by the server to be present with a valid value. If this is false, your integration will not break when invalid options are provided; however, updates that change Luraph's options will result in your integration using default settings when invalid values are specified. By default, this is set to `true`.

Returns: *&lt;object&gt;*
- **jobId** - A unique identifier for the queued obfuscation job.

---

#### getJobStatus(jobId: string): Promise<({ success: true, error: null } | { success: false, error: string })>

Description: This endpoint does not return until the referenced obfuscation job is complete. The maximum timeout is 60 seconds, and this endpoint can be called a **maximum** of 3 times per job.

Parameters:
- **jobId** - The job ID of the obfuscation to wait for.

Returns: *&lt;object&gt;*
- **success** - A boolean indicating whether the job was successful.
- **error** - An error message if the job failed, or null if the job succeeded.

---

#### downloadResult(jobId: string): Promise<{ data: string; fileName: string }>

Description: Downloads the resulting file associated with an obfuscation job.

Parameters:
- **jobId** - The job ID of the obfuscation to download.

Returns: *&lt;object&gt;*
- **fileName** - A sanitized version of the initial filename, including a suffix to differentiate it from the original filename.
- **data** - The obfuscated script.

---

### interface LuraphOptionInfo

Fields:
- **name** - The human readable name associated with an option.
- **description** - The markdown formatted description for an option.
- **tier** - One of `CUSTOMER_ONLY`, `PREMIUM_ONLY`, `ADMIN_ONLY`.
- **type** - One of `CHECKBOX`, `DROPDOWN`, `TEXT`.
- **required** - If creating a user interface to integrate with Luraph, settings that contain a value of `true` for this field should be explicitly set by the user, since they have a high chance of causing incorrect output when not set properly.
- **choices** - An array of acceptable option values when `type == DROPDOWN`.
- **dependencies** - An array of required prerequisite values before this setting can be changed from the default value.

---

### interface LuraphNode

Fields:
- **cpuUsage** - The current CPU usage of the node.
- **options** - An object with option identifiers as keys and `LuraphOptionInfo` as values.

---

### interface LuraphOptionList

An array of string keys, and values that may either be a string or boolean.

---

### interface LuraphError

Fields:
- **param** - The parameter associated with the cause of the error.
- **message** - A human readable error message.

---

### class LuraphException extends Error

Fields:
- **errors** - An array of `LuraphError`.
- **message** - A human readable collection of error messages returned by a request.

## Useful Links
- [Visit the Luraph Website](https://lura.ph/ "Luraph - Online Lua Obfuscation")
- [Join the Luraph Discord](https://discord.lura.ph/ "Luraph Discord Server")
- [Read the Luraph Documentation](https://lura.ph/dashboard/documents "Luraph Documentation")
- [Read the Luraph FAQs](https://lura.ph/dashboard/faq "Luraph Frequently Asked Questions")