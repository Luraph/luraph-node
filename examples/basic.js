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