const htmlparser2 = require("htmlparser2");

/*
    Function to generate a JSON string from a HTML string

    @param html: a valid HTML document
    @return: JSON string (WON-formatted) corresponding to that JSON
*/
function HTMLtoJSON(html) {
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
    parser.write(html.replace(/(\r\n|\n|\r)/gm, ""));
    return JSON.stringify(structure, null, 2);
}

/*
    Function to generate an HTML string from a WON-formatted JSON

    @param json: a JSON (WON-formatted) object or string
    @return: HTML string corresponding to that JSON
*/
function JSONtoHTML(json) {

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

    let obj = JSON.parse(JSON.stringify(json));
    let currentObj = obj;
    let indentSpaces = "", htmlBody = "";
    let oldObjs = [];


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
    return htmlBody + "</html>";
    
}

/*
    Function to generate an HTML string from a WON-formatted JSON

    @param cssStr: a valid CSS document
    @return: JSON string (WON-formatted) corresponding to the cssStr passed
*/
function CSStoJSON(cssStr) {

    let openBrace = false, currentKey = "", returnObj = {};

    // Formatting eventual single-line CSS string to a multiline CSS string
    cssStr.replace(";", ";\n");
    cssStr.replace("{", "{\n");
    cssStr.replace("}", "}\n");

    // Iterating through each line of the CSS document
    for (let line of cssStr.split(/\r?\n/)) {
        if (openBrace) {
            if (line.indexOf("}") >= 0) {
                openBrace = false;
                currentKey = "";
            }
            else if (line.indexOf(":" >= 0)) {
                let splittedString = line.split(":");
                if (returnObj[currentKey][splittedString[0].replace(/\s/g,'')]) {
                    returnObj[currentKey][splittedString[0].replace(/\s/g,'')].push(splittedString[1].replace(/\s/g,'').replace(";", ""));
                }
                else {
                    returnObj[currentKey][splittedString[0].replace(/\s/g,'')] = [splittedString[1].replace(/\s/g,'').replace(";", "")];
                }
            }
        }
        else if (line.indexOf("{")>=0) {
            currentKey = line.split("{")[0].replace(/\s/g,'');
            returnObj[currentKey] = {};
            openBrace = true;
        }
    }
    console.log(returnObj);
    return JSON.stringify(returnObj, null, 2);
}

/*
    Function to generate an HTML string from a WON-formatted JSON

    @param json: a JSON (WON-formatted) object or string
    @return: CSS string corresponding to the passed JSON
*/
function JSONtoCSS(json) {
    let cssString = "";
    json = JSON.parse(JSON.stringify(json));

    /*
        Here I just build a CSS string iterating through each child of each key,
        following basilar CSS rules
    */
    for (let key in json) {
        cssString += key + " {\n";
        for (let style in json[key]) {
            for (let styleInfo in json[key][style]) {
                cssString += "  " + style + ": " + json[key][style][styleInfo] + ";\n";
            }
        }
        cssString += "}\n";
    }
    return cssString;
}


module.exports = {
    "JSONtoHTML": JSONtoHTML,
    "JSONtoCSS": JSONtoCSS,
    "HTMLtoJSON": HTMLtoJSON,
    "CSStoJSON": CSStoJSON
};