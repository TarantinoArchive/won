#!/usr/bin/env node

const fs = require("fs");
const won = require("./won.js");

if (process.argv.some(el => el=="--help")) {
    console.log("Won stands for \"Web Object Notation\" and this CLI is a \
                fast tool to do convertion between HTML, CSS and JSON.\n\n\
                Usage: \n\
                `-jh <filepath>` to convert from JSON to HTML\n\
                `-hj <filepath>` to convert from HTML to JSON\n\
                `-cj <filepath>` to convert from CSS to JSON\n\
                `-jc <filepath>` to convert from JSON to CSS\n\
                `-o <filepath>` to specify an output name for the file\n\n\
                Support: https://github.com/GianlucaTarantino/won");
}

// In case user uses only "won"
if (process.argv.length<=3) {
    console.log("Error: Wrong usage of won. Type \"won --help\" for help.");
    process.exit(0);
}

const acceptedArgs = ["-jh", "-hj", "-cj", "-jc"];
const mainArg = acceptedArgs.indexOf(process.argv[2]); 

if (mainArg<0) {
    console.log("Error: First argument is invalid. Type \"won --help\" for help.");
    process.exit(0);
}

let fileToRead = process.argv[3], fileOutput, outputContent;
let fileContent = fs.readFileSync(fileToRead, "utf-8");

switch (acceptedArgs[mainArg]) {
    case "-jh":
        outputContent = won.JSONtoHTML(JSON.parse(fileContent));
        fileOutput = "outJSON.html";
        break;
    case "-hj":
        outputContent = won.HTMLtoJSON(fileContent);
        fileOutput = "outHTML.json";
        break;
    case "-cj":
        outputContent = won.CSStoJSON(fileContent);
        fileOutput = "outCSS.json";
        break;
    case "-jc":
        outputContent = won.JSONtoCSS(JSON.parse(fileContent));
        fileOutput = "outJSON.css";
        break;
    default:
        throw "Unknown Error.";
        break;
}

if (process.argv.some((el) => el=="-o")) {
    if (process.argv.length-1 == process.argv.indexOf("-o")) {
        console.log("Error: Wrong usage of -o. Type \"won --help\" for help.");
        process.exit(0);
    }
    fileOutput = process.argv[process.argv.indexOf("-o")+1];
}

fs.writeFile(fileOutput, outputContent, err => {
    if (err) throw "Error: " + err;
})