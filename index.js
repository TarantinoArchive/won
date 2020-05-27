#!/usr/bin/env node
const htmlparser2 = require("htmlparser2");
const fs = require("fs");

// In case user uses only "won"
if (process.argv.length<=2) {
    console.log("Wrong usage of won. Type \"won --help\" for help.");
    process.exit(0);
}


// Checking if user want to convert html to JSON
if (process.argv.some((el) => el=="-h")) {

    // In case user uses only "won -j"
    if (process.argv.length===3) {
        console.log("Wrong usage of won. Type \"won --help\" for help.");
        process.exit(0);
    }

    fileToRead = process.argv[process.argv.indexOf("-h")+1];

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
            if (openedTags.length>0) {
                openedTags[openedTags.length-1].text = text;
            }
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
        parser.write(data.replace(/(\r\n|\n|\r)/gm, ""));
        fs.writeFile(fileOutput ? fileOutput : "o.json", JSON.stringify(structure, null, 2), err => {
            if (err) throw err;
        });
    });
} 
// Checking if the user want to convert json to html
else if (process.argv.some((el) => el=="-j")) {

        // In case user uses only "won -j"
        if (process.argv.length===3) {
            console.log("Wrong usage of won. Type \"won --help\" for help.");
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
                console.log("Wrong usage of -o. Type \"won --help\" for help.");
            }
            fileOutput = process.argv[process.argv.indexOf("-o")+1];
        }

    /*
        Function to generate the tag and the text of the tag with the right attributes and indentation

        @param tagInfo: the won Object of the tag
        @param indent?: the spaces to write before the tag
        @param closing?: boolean that determines if the tag is a closing tag
    */
    let generateTag = (tagInfo, indent = "", closing = false) => {
        let returnTag = (closing ? "</" : "<") + tagInfo.name;
        if (closing) return indent + returnTag + ">\n";
        for (let attr in tagInfo.attributes) {
            returnTag += " " + attr + "=\"" + tagInfo.attributes[attr] + "\"";
        }
        if (/\S/.test(tagInfo.text) && tagInfo.text!=undefined) {
            return indent + returnTag + ">\n" + tagInfo.text + "\n";
        }
        else return indent + returnTag + ">\n";
    };


    let obj = JSON.parse(fs.readFileSync(fileToRead, "utf-8"));
    let currentObj = obj;
    let indentSpaces = "", htmlBody = "";
    let lastKey = 0;
    let oldObjs = [], lastKeys = [];


    /*
        Here I just iterate through the entire JSON, checking if each Object that I encounter has children.
        Everytime I find a children, I iterate through that children's children and so on.
        Everytime I finish the work that I have to do with the child (it has no more children),
        I delete that child from the parent (the last element in oldObjs)
    */
    while (obj.children[0]) {
        
        // Checking if the Object has some children left
        if (currentObj.children[0]) {

            // Checking if I already opened the tag in the HTML string
            if (!currentObj.alreadyOpened) {
                htmlBody += generateTag(currentObj, indentSpaces);
                currentObj.alreadyOpened = true;
                indentSpaces += "  ";
            }

            // Pushing the Object into the oldObjs array to access it later
            oldObjs.push(currentObj);
            currentObj = currentObj.children[0];

        } 
        
        // If the Object has no children or has no children left
        else {

            // If the Object had no children from the start, I have to write his opening tag
            if (!currentObj.alreadyOpened) { 
                htmlBody += generateTag(currentObj, indentSpaces);
                currentObj.alreadyOpened = true;
                indentSpaces += "  ";
            }
            // If the Object has no children, I write the closing tag
            indentSpaces = indentSpaces.slice(0, -2);
            htmlBody += generateTag(currentObj, indentSpaces, true);

            // Assigning to currentObj the parent Object of the just closed Object
            currentObj = oldObjs.pop();
            // removing the just closed child from the parent Object children
            currentObj.children.splice(0, 1);
        }
    }
    htmlBody += "</html>";
    fs.writeFile(fileOutput ? fileOutput : "o.html", htmlBody, err => {
        if (err) throw err;
    });
}
