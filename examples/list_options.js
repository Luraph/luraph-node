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