#!/usr/bin/env node
const htmlparser2 = require("htmlparser2");
const fs = require("fs");

// In case user uses only "won"
if (process.argv.length<=2) {
    console.log("Wrong usage of won. Type \"won -h\" for help.");
    process.exit(0);
}


// Checking what user want to convert
if (process.argv.some((el) => el=="-j")) {

    // In case user uses only "won -j"
    if (process.argv.length===3) {
        console.log("Wrong usage of won. Type \"won -h\" for help.");
        process.exit(0);
    }

    fileToRead = process.argv[process.argv.indexOf("-j")+1];

    // Checking if user-specified file exists
    fs.exists(fileToRead, exists => {
        if (!exists) {
            console.log("Error. No file in the specified path.");
            process.exit(0);
        }
    });

    // Checking if user want a custom output name
    if (process.argv.some((el) => el=="-o")) {
        if (process.argv.length-1==process.argv.indexOf("-o")) {
            console.log("Wrong usage of -o. Type \"won -h\" for help.");
        }
        fileOutput = process.argv[process.argv.indexOf("-o")+1];
    }

    let openedTags = [];
    let structure = {}, openTagStructure = {};
    let openTag = "", closedTag = "";

    const parser = new htmlparser2.Parser({
        onopentag(name, attribs) {
            // Pusing current tag to the tag queue
            openedTags.push({"name": name, "attributes": attribs, "children": []});
        },
        ontext(text) {
            // Adding text to the latest tag
            openedTags[openedTags.length-1].text = text;
        },
        onclosetag() {
            /* 
                Deleting latest element from the queue and assigning it to closedTag variable.
                Checking if this was the last element. If it was, the function gives to structure the full JSON file
                Else it adds the closedTag to the children of the last tag in the openedTags array
            */
            closedTag = openedTags.pop();
            if (openedTags.length===0) {
                structure = closedTag;
            } else {
                openedTags[openedTags.length-1].children.push(closedTag); 
            }
        }},
        { decodeEntities: true }
    );
    
    // Writing data to output file
    fs.readFile(fileToRead, "utf-8", (err, data) => {
        if (err) throw err;
        parser.write(data);
        fs.writeFile(fileOutput ? fileOutput : "o.json", JSON.stringify(structure, null, 2), err => {
            if(err) throw err;
        });
    });
}
