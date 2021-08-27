const Luraph = require("./build/index").Luraph;
const api = new Luraph(process.env.LPH_API_KEY);

const main = async () => {
    const nodes = await api.getNodes();
    console.log("Recommended Node", nodes.recommendedId);

    const node = nodes.nodes[nodes.recommendedId];
    console.log("- CPU Usage: ", node.cpuUsage);
    console.log("- Options: ");
    for(const [optionId, optionInfo] of Object.entries(node.options)){
        console.log("*", optionId, "-", optionInfo.name + ":");
        console.log("  Description:", optionInfo.description);
        console.log("  Type:", optionInfo.type);
        console.log("  Tier:", optionInfo.tier);
        console.log("  Choices:", `[${optionInfo.choices.join(", ")}]`);
    }

    const options = {};
	const optionChoices = node.options;
	for(const [option, info] of Object.entries(optionChoices)){
		let value;
		switch(info.type){
		case "CHECKBOX":
			value = false;
			break;
		case "DROPDOWN":
			value = info.choices[0];
			break;
		case "TEXT":
			value = "";
			break;
		default:
			break;
		}
		options[option] = value;
	}

    const {jobId} = await api.createNewJob(nodes.recommendedId, `print'Hello World!'`, "hello-world.txt", options);
    console.log("Job ID", jobId);

    const {success, error} = await api.getJobStatus(jobId);
    console.log("Job finished", success ? "sucessfully" : "unsucessfully");
    if(success){
        const {fileName, data} = await api.downloadResult(jobId);
        console.log("Result Filename", fileName);
        console.log("First line of file", data.split("\n")[0]);
    }else{
        console.log("Error", error);
    }
};

main();