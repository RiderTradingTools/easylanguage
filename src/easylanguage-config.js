const vscode = require('vscode');
const fs = require('fs');
const https = require('https');
const { parse } = require('node-html-parser');
const TurndownService = require('turndown');
const { gfm } = require('turndown-plugin-gfm');
let symbols = [];


//////////////////////////////////
// Trie and TrieNode classes
class TrieNode {
    constructor(key) {
        this.key = key;
        this.parent = null;
        this.children = {};
        this.end = false;
        this.originalWord = null;
    }

    getWord() {
        let word = '';
        let node = this;
        while (node !== null && node.key !== null) {
            word = node.key + word;
            node = node.parent;
        }
        return word;
    }
}


//////////////////////////////////
class Trie {
    constructor() {
        this.root = new TrieNode(null);
    }

    contains(word) {
        if (word.length === 0) {
            return false;
        }
        word = word.toLowerCase();
        let node = this.root;
        for (let i = 0; i < word.length; i++) {
            node = node.children[word[i]];
            if (!node) {
                return false;
            }
        }
        return node.end;
    }

    insert(word) {
        if (word.length === 0) { return; }
        const lowerCaseWord = word.toLowerCase();
        if (lowerCaseWord.startsWith('/**/')) { return; }
        if (this.contains(lowerCaseWord)) { return; }
        let node = this.root;
        for (let i = 0; i < lowerCaseWord.length; i++) {
            const char = lowerCaseWord[i];
            if (!node.children[char]) {
                node.children[char] = new TrieNode(char);
                node.children[char].parent = node;
            }
            node = node.children[char];
        }
        node.end = true;
        node.originalWord = word;
    }

    getAllWords() {
        let words = [];
        this.findAllWords(this.root, words);
        return words;
    }

    findAllWords(node, words) {
        if (node.end) {
            words.push(node.originalWord);
        }
        for (let child in node.children) {
            this.findAllWords(node.children[child], words);
        }
    }
}


//////////////////////////////////
// create the code Outline view
function createDocumentSymbols(document) {

    const symbols = [];
    const symbolStack = [symbols];
    let currentSymbol = [];
    let icon_using = vscode.SymbolKind.Interface;
    let icon_inputs = vscode.SymbolKind.TypeParameter;
    let icon_vars = vscode.SymbolKind.Variable;
    let icon_method = vscode.SymbolKind.Method;
    let icon_region = vscode.SymbolKind.Number;
    let icon_begin = vscode.SymbolKind.Array;
    let skipNextBegin = false;
    let comment_block = false;
    let before = '';
    let quotesBefore = (before.match(/["']/g) || []).length;

    let usingSymbol = null;

    let inpSymbol = null;
    let inpStartLine = [];
    let inpCntr = 0;
    
    let varSymbol = null;
    let varStartLine = [];
    let varCntr = 0;
    
    let regSymbol = [];
    let regStartLine = [];
    let regCntr = 0;

    let mtdSymbol = null;
    let mtdStartLine = [];
    let mtdCntr = 0;

    let begSymbol = [];
    let begStartLine = [];
    let begCntr = 0;

    let loopSymbol = [];
    let loopStartLine = [];
    let loopCntr = 0;

    let lastSymbol = null;
    let currentLevel = 0;
    const endRegex = /(^|\s)end(\s|$)/;

    if (document.lineCount === 0) { return symbols; } // Return an empty array if the document is empty }

    for (let i = 0; i < document.lineCount; i++) {

        let line = document.lineAt(i);
        let lineText = line.text.trim().toLowerCase().replace(/\s+/g, ' ');
        let prevLineText = "";
        let lineRange = new vscode.Range( new vscode.Position(i, 0), new vscode.Position(i, line.text.length) );
        let getlineText = document.lineAt(i).text.trim().replace(/\s+/g, ' ');

        if (i >= 1) {
            prevLineText = document.lineAt(i - 1).text.trim().toLowerCase().replace(/\s+/g, ' ');
        }

        //-----------------------------------------------------------------------
        // handle comments & comment blocks
        if ( lineText.startsWith("//") || getlineText == '' )           { continue; }
        if ( lineText.startsWith("{") && lineText.endsWith("}")  )      { continue; }
        if ( lineText.startsWith("{") && !lineText.includes("}") )      { comment_block = true; continue; }
        if ( comment_block && lineText.endsWith("}") )                  { comment_block = false; continue; }
        if ( comment_block && lineText.includes("}") )                  { comment_block = false; }
        else if ( comment_block )                                       { continue; }

        //-----------------------------------------------------------------------
        // exception:  check for " end "
        if ( currentSymbol[currentLevel] != null && currentSymbol[currentLevel] == 'Begin' && !lineText.includes("end;") && ( lineText == "end" || endRegex.test(lineText) ) ) {
            // console.log(`[DEBUG] 'end' found on line: ${i+1}    ...will skip next Begin`);
            skipNextBegin = true;
        }

        //-----------------------------------------------------------------------
        // Using
        if ( lineText.startsWith("using") ) {

            usingSymbol = new vscode.DocumentSymbol("Using", getlineText.substring(6, line.text.length - 1), icon_using, lineRange, lineRange);
            symbolStack[symbolStack.length - 1].push(usingSymbol);
            usingSymbol.range = new vscode.Range( new vscode.Position(i, 0), new vscode.Position(i, line.text.length) );
            usingSymbol.selectionRange = new vscode.Range( new vscode.Position(i, 0), new vscode.Position(i, line.text.length) );
            // console.log(`[DEBUG] new symbol:   ${usingSymbol.name}  on line: ${i+1}`);
            continue;        
        }

        //-----------------------------------------------------------------------
        // Inputs
        if ( lineText.startsWith("input:") || lineText.startsWith("inputs:") ) {
            
            inpCntr ++;
            inpStartLine[inpCntr] = i;
            inpSymbol = new vscode.DocumentSymbol("Inputs", "", icon_inputs, lineRange, lineRange);
            symbolStack[symbolStack.length - 1].push(inpSymbol);
            // console.log(`[DEBUG] new symbol:   ${inpSymbol.name}  on line: ${i+1}`);
            if (symbolStack.length > 0) {
                symbolStack.push(inpSymbol.children);
            }
            currentLevel++;
            currentSymbol[currentLevel] = "Inputs";
        }

        //-----------------------------------------------------------------------
        // Variables
        else if ( lineText.startsWith("variables:") || lineText.startsWith("variable:") || lineText.startsWith("vars:") || lineText.startsWith("var:") ) {
            
            varCntr ++;
            varStartLine[varCntr] = i;
            varSymbol = new vscode.DocumentSymbol("Variables", "", icon_vars, lineRange, lineRange);
            symbolStack[symbolStack.length - 1].push(varSymbol);
            // console.log(`[DEBUG] new symbol:   ${varSymbol.name}  on line: ${i+1}`);
            if (symbolStack.length > 0) {
                symbolStack.push(varSymbol.children);
            }
            currentLevel++;
            currentSymbol[currentLevel] = "Variables";
        }

        //-----------------------------------------------------------------------
        // Constants
        else if ( lineText.startsWith("constants:") || lineText.startsWith("constant:") || lineText.startsWith("const:") ) {

            varCntr ++;
            varStartLine[varCntr] = i;
            varSymbol = new vscode.DocumentSymbol("Constants", "", icon_vars, lineRange, lineRange);
            symbolStack[symbolStack.length - 1].push(varSymbol);
            // console.log(`[DEBUG] new symbol:   ${varSymbol.name}  on line: ${i+1}`);
            if (symbolStack.length > 0) {
                symbolStack.push(varSymbol.children);
            }
            currentLevel++;
            currentSymbol[currentLevel] = "Constants";
        }

        //-----------------------------------------------------------------------
        // Region
        if ( lineText.startsWith("#region") ) {

            regCntr ++;
            regStartLine[regCntr] = i;
            regSymbol[regCntr] = new vscode.DocumentSymbol("Region", getlineText.substring(8), icon_region, lineRange, lineRange);
            symbolStack[symbolStack.length - 1].push(regSymbol[regCntr]);
            // console.log(`[DEBUG] new symbol:   ${regSymbol[regCntr].name}  on line: ${i+1}`);
            if (symbolStack.length > 0) {
                symbolStack.push(regSymbol[regCntr].children);
            }
            currentLevel++;
            currentSymbol[currentLevel] = "Region";
            continue;
        }

        //-----------------------------------------------------------------------
        // Method
        else if ( lineText.startsWith("method ") ) {

            if (mtdCntr > 0) {
                // console.log(`[DEBUG] failsafe - method symbol already exists when arriving at line: ${i+1}    mtdCntr: ${mtdCntr}`);
                if (currentSymbol[currentLevel] = "Method") {
                    mtdSymbol.range = new vscode.Range( new vscode.Position(mtdStartLine[mtdCntr], 0), new vscode.Position(i-1, line.text.length) );
                    mtdSymbol.selectionRange = new vscode.Range( new vscode.Position(mtdStartLine[mtdCntr], 0), new vscode.Position(i-1, line.text.length) );
                    symbolStack.pop();
                    mtdCntr = 0;
                    mtdSymbol = null;
                    currentSymbol[currentLevel] = null;
                    currentLevel --;
                }
            }
            
            mtdCntr ++;
            mtdStartLine[mtdCntr] = i;
            mtdSymbol = new vscode.DocumentSymbol("Method", getlineText.substring(7), icon_method, lineRange, lineRange);
            skipNextBegin = true;
            symbolStack[symbolStack.length - 1].push(mtdSymbol);
            // console.log(`[DEBUG] new symbol:   ${mtdSymbol.name}  on line: ${i+1}`);
            symbolStack.push(mtdSymbol.children);
            currentLevel++;
            currentSymbol[currentLevel] = "Method";
            continue;
        }

        //-----------------------------------------------------------------------
        // Once
        else if ( lineText == "once" || lineText == "once begin" || ( prevLineText.startsWith("once ") && lineText.includes("begin") ) ) {

            before = lineText.slice(0, lineText.indexOf("once") + 4);
            quotesBefore = (before.match(/["']/g) || []).length;

            if (quotesBefore % 2 === 0) {        // If the number of quotes before the match is even, it's outside quotes
                begCntr ++;
                begStartLine[begCntr] = i;
                begSymbol[begCntr] = new vscode.DocumentSymbol("Once", "", icon_begin, lineRange, lineRange);
                symbolStack[symbolStack.length - 1].push(begSymbol[begCntr]);
                // console.log(`[DEBUG] new symbol:   ${begSymbol[begCntr].name}  on line: ${i+1}`);
                if (symbolStack.length > 0) {
                    symbolStack.push(begSymbol[begCntr].children);
                }
                currentLevel++;
                currentSymbol[currentLevel] = "Once";
                continue;
            }
        }

        //-----------------------------------------------------------------------
        // For loop
        else if ( ( lineText.includes("for ") && lineText.includes(" to ") ) || lineText.includes("while ") ) {

            if ( lineText.includes("for ") ) {
                before = lineText.slice(0, lineText.indexOf("for ") + 4);
                quotesBefore = (before.match(/["']/g) || []).length;
            }
            else if ( lineText.includes("while ") ) {
                before = lineText.slice(0, lineText.indexOf("while ") + 6);
                quotesBefore = (before.match(/["']/g) || []).length;
            }

            if (quotesBefore % 2 === 0) {        // If the number of quotes before the match is even, it's outside quotes

                loopCntr ++;
                loopStartLine[loopCntr] = i;
                loopSymbol[loopCntr] = new vscode.DocumentSymbol("Loop", getlineText, icon_begin, lineRange, lineRange);
                symbolStack[symbolStack.length - 1].push(loopSymbol[loopCntr]);
                // console.log(`[DEBUG] new symbol:   ${loopSymbol[loopCntr].name}  on line: ${i+1}`);
                if (symbolStack.length > 0) {
                    symbolStack.push(loopSymbol[loopCntr].children);
                }
                currentLevel++;
                currentSymbol[currentLevel] = "Loop";
                if ( !lineText.includes("begin") ) {
                    skipNextBegin = true;
                }
                continue;
            }
        }

        //-----------------------------------------------------------------------
        // Begin
        else if ( lineText.startsWith("begin") || lineText.includes(" begin") || lineText.includes("begin ") ) {

            before = lineText.slice(0, lineText.indexOf("begin") + 5);
            quotesBefore = (before.match(/["']/g) || []).length;
            
            if (quotesBefore % 2 === 0) {        // If the number of quotes before the match is even, it's outside quotes

                if (skipNextBegin) {
                    // console.log(`[DEBUG] skipped this begin...    ${i+1}`);
                    skipNextBegin = false;
                } else {
                    begCntr ++;
                    begStartLine[begCntr] = i;
                    begSymbol[begCntr] = new vscode.DocumentSymbol("Begin", getlineText, icon_begin, lineRange, lineRange);
                    symbolStack[symbolStack.length - 1].push(begSymbol[begCntr]);
                    // console.log(`[DEBUG] new symbol:   ${begSymbol[begCntr].name}  on line: ${i+1}`);
                    if (symbolStack.length > 0) {
                        symbolStack.push(begSymbol[begCntr].children);
                    }
                    currentLevel++;
                    currentSymbol[currentLevel] = "Begin";
                    continue;
                }
            }
        }


        lastSymbol = null; 
        if (currentLevel >= 1) {
            lastSymbol = currentSymbol[currentLevel];
        }


        
        //-----------------------------------------------------------------------
        // End / End Region
        if ( lastSymbol != null && !comment_block && (lineText.includes("end;") || lineText.startsWith("#endregion")) ) {

            let preCheck = true; 

            if ( lineText.includes("end;") ) {
                before = lineText.slice(0, lineText.indexOf("once") + 4);
                quotesBefore = (before.match(/["']/g) || []).length;

                if (quotesBefore % 2 !== 0) {        // If the number of quotes before the match is even, it's outside quotes
                    preCheck = false;
                }
            }

            if ( preCheck && regSymbol[regCntr] && lastSymbol == "Region" && lineText.startsWith("#endregion") ) {
                // console.log(`[DEBUG] --- Region [end]  on line: ${i+1}`);
                regSymbol[regCntr].range = new vscode.Range( new vscode.Position(regStartLine[regCntr], 0), new vscode.Position(i, line.text.length) );
                regSymbol[regCntr].selectionRange = new vscode.Range( new vscode.Position(regStartLine[regCntr], 0), new vscode.Position(i, line.text.length) );
                regCntr --;
                symbolStack.pop();
                currentSymbol[currentLevel] = null;
                currentLevel --;
            }
            if ( preCheck && mtdSymbol && lastSymbol == "Method" ) {
                // console.log(`[DEBUG] --- Method [end]  on line: ${i+1}`);
                mtdSymbol.range = new vscode.Range( new vscode.Position(mtdStartLine[mtdCntr], 0), new vscode.Position(i, line.text.length) );
                mtdSymbol.selectionRange = new vscode.Range( new vscode.Position(mtdStartLine[mtdCntr], 0), new vscode.Position(i, line.text.length) );
                symbolStack.pop();
                mtdCntr = 0;
                mtdSymbol = null;
                currentSymbol[currentLevel] = null;
                currentLevel --;
            }            
            if ( preCheck && loopSymbol[loopCntr] && lastSymbol == "Loop" ) {
                // console.log(`[DEBUG] --- Loop [end]  on line: ${i+1}`);
                loopSymbol[loopCntr].range = new vscode.Range( new vscode.Position(loopStartLine[loopCntr], 0), new vscode.Position(i, line.text.length) );
                loopSymbol[loopCntr].selectionRange = new vscode.Range( new vscode.Position(loopStartLine[loopCntr], 0), new vscode.Position(i, line.text.length) );
                loopCntr --;
                symbolStack.pop();
                currentSymbol[currentLevel] = null;
                currentLevel --;
            }            
            if ( preCheck && begSymbol[begCntr] && (lastSymbol == "Begin" || lastSymbol == "Once") ) {
                // console.log(`[DEBUG] --- Begin [end]  on line: ${i+1}`);
                begSymbol[begCntr].range = new vscode.Range( new vscode.Position(begStartLine[begCntr], 0), new vscode.Position(i, line.text.length) );
                begSymbol[begCntr].selectionRange = new vscode.Range( new vscode.Position(begStartLine[begCntr], 0), new vscode.Position(i, line.text.length) );
                begCntr --;
                symbolStack.pop();
                currentSymbol[currentLevel] = null;
                currentLevel --;
            }            
        }

        //-----------------------------------------------------------------------
        // handle each Input            exit INPUTS at the  ;
        if ( lastSymbol != null && lastSymbol == 'Inputs' ) {

            if ( lineText.endsWith(';') && ( lineText.startsWith('input:') || lineText.startsWith('inputs:') ) ) {
                inpSymbol.range = new vscode.Range( new vscode.Position(inpStartLine[inpCntr], 0), new vscode.Position(i, line.text.length) );
                inpSymbol.selectionRange = new vscode.Range( new vscode.Position(inpStartLine[inpCntr], 0), new vscode.Position(i, line.text.length) );
                symbolStack.pop();
                // console.log(`[DEBUG] --- input [end1]  on line: ${i+1}`);
                currentSymbol[currentLevel] = null;
                currentLevel --;
            }
            else {
                let inpLineText = line.text.trim().replace(/\s+/g, ' ');
                const inp_regex = /^(?:\bintrabarpersist\b\s+)?(\b\w+\b)(?:\s+(\b\w+\b))?\s*(?=\()/;
                let inp_match;

                if ((inp_match = inp_regex.exec(inpLineText)) !== null) {
                    let inpSymbol = new vscode.DocumentSymbol(inp_match[1], inp_match[2], icon_inputs, lineRange, lineRange);
                    symbolStack[symbolStack.length - 1].push(inpSymbol);
                }

                if ( lineText.endsWith(';') ) {

                    inpSymbol.range = new vscode.Range( new vscode.Position(inpStartLine[inpCntr], 0), new vscode.Position(i, line.text.length) );
                    inpSymbol.selectionRange = new vscode.Range( new vscode.Position(inpStartLine[inpCntr], 0), new vscode.Position(i, line.text.length) );
                    symbolStack.pop();
                    // console.log(`[DEBUG] --- input [end2]  on line: ${i+1}`);
                    currentSymbol[currentLevel] = null;
                    currentLevel --;
                }
            }
        }

        //-----------------------------------------------------------------------
        // handle each variable/constant            exit VARS at the  ;
        if ( lastSymbol != null && ( lastSymbol == 'Variables' || lastSymbol == 'Constants' ) ) { 

            if ( lineText.endsWith(';') && ( lineText.startsWith("constants:") || lineText.startsWith("constant:") || lineText.startsWith("const:") 
               || lineText.startsWith("variables:") || lineText.startsWith("variable:") || lineText.startsWith("vars:") || lineText.startsWith("var:") ) ) {
                varSymbol.range = new vscode.Range( new vscode.Position(varStartLine[varCntr], 0), new vscode.Position(i, line.text.length) );
                varSymbol.selectionRange = new vscode.Range( new vscode.Position(varStartLine[varCntr], 0), new vscode.Position(i, line.text.length) );
                symbolStack.pop();
                // console.log(`[DEBUG] --- variables [end1]  on line: ${i+1}`);
                currentSymbol[currentLevel] = null;
                currentLevel --;
            }
            else {
                let varLineText = line.text.trim().replace(/\s+/g, ' ');
                let var_regex = /^(?:\bintrabarpersist\b\s+)?(\b\w+\b)\s+(\b\w+\b)\s*(?:\()?/;
                let var_match;

                if ((var_match = var_regex.exec(varLineText)) !== null) {
                    let icon_varItem;
                    switch (var_match[1].toLowerCase()) {

                        case "string":
                            icon_varItem = 14;
                            break;
                        case "int":
                        case "double":
                            icon_varItem = 13;
                            break;
                        case "bool":
                            icon_varItem = 16;
                            break;
                        default:
                            icon_varItem = 6;
                            break;
                    }
                    let vSymbol = new vscode.DocumentSymbol(var_match[2], var_match[1], icon_varItem, lineRange, lineRange);
                    symbolStack[symbolStack.length - 1].push(vSymbol);
                }

                if ( lineText.endsWith(';') ) {

                    before = lineText.slice(0, lineText.indexOf(";") + 1);
                    quotesBefore = (before.match(/["']/g) || []).length;
                    
                    if (quotesBefore % 2 === 0) {        // If the number of quotes before the match is even, it's outside quotes
    
                        varSymbol.range = new vscode.Range( new vscode.Position(varStartLine[varCntr], 0), new vscode.Position(i, line.text.length) );
                        varSymbol.selectionRange = new vscode.Range( new vscode.Position(varStartLine[varCntr], 0), new vscode.Position(i, line.text.length) );
                        symbolStack.pop();
                        // console.log(`[DEBUG] --- variables [end2]  on line: ${i+1}`);
                        currentSymbol[currentLevel] = null;
                        currentLevel --;
                    }
                }
            }                    
        }

        let kc = '';
        let j = 1;
        if (currentLevel > 0) {
            for (j = 1; j <= currentLevel; j++) {
                if (currentSymbol[j] === null) { continue; }
                kc = kc + '>> ' + currentSymbol[j] + ' ';
            }
            if (kc != '') { 
                // console.log(`[DEBUG]                                                                            ${i+1}   ${kc}`);
            }
        }
    }

    return symbols;
};


//////////////////////////////////
// Helper function to check/confirm file exists
const fileExists = async (filePath) => {
    try {
        await fs.promises.access(filePath, fs.constants.F_OK);
        return true;
    } catch (error) {
        return false;
    }
};


//////////////////////////////////
// Function to read EasyLanguage attribute-value pairs from easylanguage-complete.txt
const loadAttributeKeywordsFromFile = async (filePath) => {
    const attributesMap = new Map();
    const exists = await fileExists(filePath);
    if (!exists) {
        console.warn(`[RTT EasyLanguage] WARNING: EasyLanguage keywords are disabled; file not found: ${filePath}`);
        return attributesMap;
    }

    try {
        const data = await fs.promises.readFile(filePath, 'utf8');
        const lines = data.split('\n').map((line) => line.trim()).filter((line) => line !== '');
        lines.forEach((line) => {
            const [keyword, attribute] = line.split(':').map((part) => part.trim());
            if (keyword && attribute) {
                attributesMap.set(keyword, attribute);
            }
        });
    } catch (error) {
        console.error(`[RTT EasyLanguage] Error reading file: ${filePath}`, error);
    }

    return attributesMap;
};



//////////////////////////////////
// Function to fetch content from web page -- clean it up, and present in hover
function fetchHoverText(hovered_keyword, keyword_attributeValue) {
    return new Promise((resolve, reject) => {

        const turndownService = new TurndownService();
        turndownService.use(gfm);

        let keyword = hovered_keyword.toLowerCase();
        let display_keyword = hovered_keyword;
        let url = ``;
        let rep_url = ``;
        let rep_url2 = ``;
        let title_icon = ``;
        let classSuffix = `_class`;

        if (keyword == 'var' || keyword == 'vars' || keyword == 'variables') { keyword = 'Variable'; }
        if (keyword == 'input' || keyword == 'displayname' || keyword == 'tooltip') { keyword = 'Inputs'; }
        if (keyword == 'consts' || keyword == 'constant' || keyword == 'constants') { keyword = 'Const'; }
        if (keyword == 'drawingobjects') { keyword = 'drawobjects'; }
        if (keyword == 'namevaluecollection') { keyword = 'namevalueollection'; }
        if (keyword == 'globaldictionary') { keyword = 'global_dictionary'; }
        if (keyword == 'systemexception' || keyword == 'object' || keyword == 'exception' || keyword == 'valuetype' || keyword == 'eventargs' || keyword == 'elcomponent' || keyword == 'analysistechnique') { keyword = 'elsystem_' + keyword; }
        if (keyword == 'preshowelementmenueventargs' || keyword == 'predeleteelementeventargs' || keyword == 'plotclickeventargs' || keyword == 'orderelementmoveeventargs' || keyword == 'elementselectedeventargs' || keyword == 'chartelementclickeventargs' || keyword == 'cellclickeventargs') { classSuffix = ``; }
        if (keyword.startsWith('#')) { keyword = keyword.replace(/#/gi, '_'); }

        // function example:  https://help.tradestation.com/10_00/eng/tsdevhelp/elword/function/adx_function_.htm
        // reserved word example:  https://help.tradestation.com/10_00/eng/tsdevhelp/elword/word/above_reserved_word_.htm
        // class example:  https://help.tradestation.com/10_00/eng/tsdevhelp/elobject/class/account_class.htm

        if (keyword_attributeValue == 'reserved word') {
            url = `https://help.tradestation.com/10_00/eng/tsdevhelp/elword/word/${encodeURIComponent(keyword)}_reserved_word_.htm`;
            rep_url = `https://help.tradestation.com/10_00/eng/tsdevhelp/elword`;
            rep_url2 = `https://help.tradestation.com/10_00/eng/tsdevhelp/elword/word/`;
            title_icon = `$(symbol-keyword)`;
        }
        else if (keyword_attributeValue == 'function') {
            url = `https://help.tradestation.com/10_00/eng/tsdevhelp/elword/function/${encodeURIComponent(keyword)}_function_.htm`;
            rep_url = `https://help.tradestation.com/10_00/eng/tsdevhelp/elword`;
            rep_url2 = `https://help.tradestation.com/10_00/eng/tsdevhelp/elword/function/`;
            title_icon = `$(symbol-function)`;
        }
        else if (keyword_attributeValue.startsWith('class') || keyword_attributeValue == 'collection') {
            url = `https://help.tradestation.com/10_00/eng/tsdevhelp/elobject/${encodeURIComponent(keyword_attributeValue)}/${encodeURIComponent(keyword)}${encodeURIComponent(classSuffix)}.htm`;
            rep_url = `https://help.tradestation.com/10_00/eng/tsdevhelp/elobject`;
            rep_url2 = `https://help.tradestation.com/10_00/eng/tsdevhelp/elobject/class/`;
            keyword_attributeValue = 'class';
            title_icon = `$(symbol-class)`;
        }
        else if (keyword_attributeValue == 'enumeration') {
            url = `https://help.tradestation.com/10_00/eng/tsdevhelp/elobject/enumeration/${encodeURIComponent(keyword)}_enumeration.htm`;
            rep_url = `https://help.tradestation.com/10_00/eng/tsdevhelp/elobject`;
            rep_url2 = `https://help.tradestation.com/10_00/eng/tsdevhelp/elobject/enumeration/`;
            title_icon = `$(symbol-enum)`;
        }

        if (url == ``) { return; } // no match, no url to pull 

        https.get(url, (response) => {
            let data = '';

            response.on('data', chunk => {
                data += chunk;
            });

            response.on('end', () => {
                try {

                    // Parse the HTML response
                    const root = parse(data);

                    // Extract the div content by id
                    const contentDiv = root.querySelector('div#mc-main-content');

                    if (contentDiv) {

                        contentDiv.querySelectorAll('p.Disclaimer').forEach(disclaimer => {
                            disclaimer.remove();
                        });
                        contentDiv.querySelectorAll('div.expander').forEach(expander => {
                            expander.remove();
                        });
                        contentDiv.querySelectorAll('h1').forEach(header1 => {
                            header1.remove();
                        });
                        contentDiv.querySelectorAll('img').forEach(imgs => {
                            imgs.replaceWith(' ');
                        });

                        // replace some tags, fix web links
                        const htmlFixedText = contentDiv.innerHTML
                            .replace(/href=\"(?=[a-z])/gi, 'href="' + rep_url2)
                            .replace(/href=\"\.\./gi, 'href="' + rep_url)
                            .replace(/href=\"#\"/gi, '')
                            .replace(/xmlns=\"http:\/\/www.w3.org\/1999\/xhtml\"/gi, '')
                            .replace(/<\/td>/gi, '&nbsp;</td>&nbsp;')
                            .replace(/<div class=\"collapsable\"/gi, '<br>&nbsp; <div class="collapsable"')
                            .replace(/<h5/gi, '<h4')
                            .replace(/h5>/gi, 'h4>')
                            .replace(/<h2/gi, '<h4')
                            .replace(/h2>/gi, 'h4>');

                        // Convert HTML to Markdown
                        let markdown = turndownService.turndown(htmlFixedText);

                        const styledString = ` &nbsp; <span style="color:#fff;background-color:#666;">&nbsp;${display_keyword}&nbsp;</span>`;
                        const markdownText = new vscode.MarkdownString(`&nbsp;${title_icon}`);
                        markdownText.isTrusted = true;
                        markdownText.supportHtml = true;
                        markdownText.supportThemeIcons = true;

                        markdownText.appendMarkdown(styledString);
                        markdownText.appendText(`  (` + keyword_attributeValue + `)\n`);
                        markdownText.appendMarkdown(`\n<hr>\n`);
                        markdownText.appendMarkdown(markdown);
                        markdownText.appendMarkdown(`\n<hr>\n`);
                        markdownText.appendMarkdown(`\n\n&nbsp;$(link) &nbsp; ` + url);

                        resolve(markdownText);

                    } else {
                        resolve(`No description found for "${display_keyword}"`);
                    }
                } catch (error) {
                    reject(`Error parsing response: ${error}`);
                }
            });
        }).on('error', error => {
            reject(`Error fetching hover text: ${error}`);
        });
    });
}


//////////////////////////////////
// Load any custom user function keywords from the vsCode settings
const loadUserFunctionsFromSettings = () => {
    const config = vscode.workspace.getConfiguration('easylanguage');
    const userFuncKeywords = config.get('customUserFunctions', []);
    return userFuncKeywords;
};





/////////////////////////////////////////////////////////
// vsCode extension main: activate 
/////////////////////////////////////////////////////////
async function activate(context) {

    // Register the document symbol provider
    const codeOutlineSymbols = vscode.languages.registerDocumentSymbolProvider({ language: 'easylanguage', scheme: 'file' }, {
        provideDocumentSymbols(document) {
            symbols = createDocumentSymbols(document);
            return symbols;
        }
    });
    context.subscriptions.push(codeOutlineSymbols);

    // Register ...
    const trie = new Trie();

    // Register the Reload Extension command on the command palette
    const reloadCommand = vscode.commands.registerCommand('easylanguage.reloadExtension', () => {
        vscode.commands.executeCommand('workbench.action.reloadWindow'); // Reloads the vsCode window
    });
    context.subscriptions.push(reloadCommand);

    let collapseOutlineCommand = vscode.commands.registerCommand('easylanguage.outlineCollapse', function () {
        vscode.commands.executeCommand('outline.collapse');
    });
    context.subscriptions.push(collapseOutlineCommand);
    

    // Load attribute-keyword pairs from easylanguage-complete.txt
    const filePath_keywords = context.asAbsolutePath('easylanguage-complete.txt');
    const attributesMap = await loadAttributeKeywordsFromFile(filePath_keywords);
    let reserved_keywords = null;
    if (attributesMap.size > 0) {

        reserved_keywords = Array.from(attributesMap.keys()); // Extract keywords for highlighting
        // Insert keywords into the Trie data structure
        reserved_keywords.forEach((keyword) => trie.insert(keyword));
        console.log('[RTT EasyLanguage] Data structure initialized with the EasyLanguage keywords');
        // Register hover provider for keywords
        registerHoverProvider(context, reserved_keywords, attributesMap);
    }

    
    // Load user keywords from the vsCode settings
    const user_func_keywords = loadUserFunctionsFromSettings();
    if (user_func_keywords.length > 0) {

        user_func_keywords.forEach((keyword) => trie.insert(keyword));
        console.log('[RTT EasyLanguage] Data structure updated with custom User Function keywords from vsCode settings');
    }


    // Setup & create decoration type based on the current settings
    let usr_func_decorationType = null;
    const createDecorationType = () => {
        let lightBackgroundColor = vscode.workspace.getConfiguration('easylanguage').get('customUserFunctionsLightThemeBackgroundColor');
        let lightColor = vscode.workspace.getConfiguration('easylanguage').get('customUserFunctionsLightThemeColor');
        let lightFontStyle = vscode.workspace.getConfiguration('easylanguage').get('customUserFunctionsLightThemeStyle');

        let darkBackgroundColor = vscode.workspace.getConfiguration('easylanguage').get('customUserFunctionsDarkThemeBackgroundColor');
        let darkColor = vscode.workspace.getConfiguration('easylanguage').get('customUserFunctionsDarkThemeColor');
        let darkFontStyle = vscode.workspace.getConfiguration('easylanguage').get('customUserFunctionsDarkThemeStyle');

        return vscode.window.createTextEditorDecorationType({
            light: { // Used in light themes
                backgroundColor: lightBackgroundColor,
                color: lightColor,
                fontStyle: lightFontStyle,
            },
            dark: { // Used in dark themes
                backgroundColor: darkBackgroundColor,
                color: darkColor,
                fontStyle: darkFontStyle,
            },
        });
    };
    // Create initial decoration type
    usr_func_decorationType = createDecorationType();
    

    let timeout = null;

    // Function to update decorations
    const updateDecorations = (editor) => {
        if (!editor || !usr_func_decorationType) { return; }
        
        // Match and decorate custom User Function keywords, and user Methods
        let text = editor.document.getText();
        let docLines = text.split('\n');
        // let methodRegex = /^Method\s+(\w+)\s+(\w+)\s*\(/i;  // Case-insensitive method detection
        let methodRegex = /^Method\s+(\w+)\s+(\w+)\s*\(([^)]*)\)/i;     // Case-insensitive method detection
        let documentMethods = new Map();
        let commentsON = false;

        docLines.forEach(line => {
            if (line.trim().startsWith('//') ) { return; }                // ignore comment lines
            if (line.trim().startsWith('{'))   { commentsON = true;  }	// ignore comment lines
            if (line.trim().includes('}'))     { commentsON = false; }
            if (commentsON)                    { return; }                // ignore comment lines

            let match;

            if ((match = methodRegex.exec(line)) !== null) {
                // Extract Methods 
                let returnType = match[1];
                let methodName = match[2];
                let methodInputs = match[3];
                if (!documentMethods.has(methodName)) {
                    let map_items = { rtn_type: returnType, mtd_inps: methodInputs }
                    documentMethods.set(methodName, map_items);
                }
            }
        });

        let decorationsAttr = [];
        let match;
        
        if (user_func_keywords.length > 0) {

            // Decorate custom User Functions
            let regexUserFuncs = new RegExp(`\\b(${user_func_keywords.join('|')})\\b`, 'gi');
                    
            while ( (match = regexUserFuncs.exec(text)) !== null ) {
                
                let startPos = editor.document.positionAt(match.index);
                let endPos = editor.document.positionAt(match.index + match[0].length);
                let lineStartPos = new vscode.Position(startPos.line, 0);
                let lineText = editor.document.getText(new vscode.Range(lineStartPos, startPos)).trim();
                if (lineText.startsWith('//') || lineText.startsWith('{')) { continue; } // ignore comment lines

                let styledString = ` &nbsp; <span style="color:#fff;background-color:#666;">&nbsp;${match[0]}&nbsp;</span>`;
                let mkdnText = `  (user function)\n`;
                let markdownText = new vscode.MarkdownString(`&nbsp;$(symbol-function)`);
                markdownText.isTrusted = true;
                markdownText.supportHtml = true;
                markdownText.supportThemeIcons = true;

                markdownText.appendMarkdown(styledString);
                markdownText.appendText(mkdnText);
                markdownText.appendMarkdown(`\n<hr>\n`);
                
                decorationsAttr.push({
                    range: new vscode.Range(startPos, endPos),
                    hoverMessage: markdownText
                });
            }
        }

        if (documentMethods.size > 0) {

            // Decorate custom User Methods
            let methodNames = Array.from(documentMethods.keys());
            let regexUserMethods = new RegExp(`\\b(${methodNames.join('|')})\\b`, 'gi');

            while ( (match = regexUserMethods.exec(text)) !== null ) {
                
                let startPos = editor.document.positionAt(match.index);
                let endPos = editor.document.positionAt(match.index + match[0].length);
                let lineStartPos = new vscode.Position(startPos.line, 0);
                let lineText = editor.document.getText(new vscode.Range(lineStartPos, startPos)).trim();
                if (lineText.startsWith('//') || lineText.startsWith('{')) { continue; } // ignore comment lines
                
                let display_keyword = match[0];
                let title_icon = `$(symbol-method)`;
                let markdown = `\n` + display_keyword + ` (` + documentMethods.get(match[0]).mtd_inps + `) \n\n<b>Returns (` + documentMethods.get(match[0]).rtn_type + `)</b>` ;

                const styledString = ` &nbsp; <span style="color:#fff;background-color:#666;">&nbsp;${display_keyword}&nbsp;</span>`;
                const markdownText = new vscode.MarkdownString(`&nbsp;${title_icon}`);
                markdownText.isTrusted = true;
                markdownText.supportHtml = true;
                markdownText.supportThemeIcons = true;

                markdownText.appendMarkdown(styledString);
                markdownText.appendText(`  (local user method)\n`);
                markdownText.appendMarkdown(`\n<hr>\n`);
                markdownText.appendMarkdown(markdown);
                markdownText.appendMarkdown(`\n&nbsp;  &nbsp; `);

                decorationsAttr.push({
                    range: new vscode.Range(startPos, endPos),
                    hoverMessage: markdownText
                });
            }
        }

        if (decorationsAttr.length > 0) {
            editor.setDecorations(usr_func_decorationType, decorationsAttr);
        }
    };


    // Trigger the updated decorations
    const triggerUpdateDecorations = (editor) => {
        if (timeout) {
            clearTimeout(timeout);
        }
        timeout = setTimeout(() => updateDecorations(editor), 500);
    };


    // Register completion provider
    const completionProvider = vscode.languages.registerCompletionItemProvider(
        { scheme: 'file', language: 'easylanguage' },
        {
            provideCompletionItems(document, position, token, context) {
                
                // Custom keywords from the Trie
                const allKeywords = trie.getAllWords();
                const customKeywords = allKeywords.map((keyword) => {

                    let itemKind = vscode.CompletionItemKind.Function;
                    let itemKindDetail = ``;

                    // Check if keyword exists in attributesMap (case-insensitive) and pull attribute
                    let keyword_attributeValue = '';
                    for (const [keyword_map, attribute] of attributesMap.entries()) {
                        if (keyword_map.toLowerCase() === keyword.toLowerCase()) {
                            keyword_attributeValue = attribute;
                            break;
                        }
                    }

                    if (keyword_attributeValue === 'function') { itemKind = vscode.CompletionItemKind.Function; itemKindDetail = `function` }
                    else if (keyword_attributeValue.trim().startsWith('class')) { itemKind = vscode.CompletionItemKind.Class; itemKindDetail = `class` }
                    else if (keyword_attributeValue === 'collection') { itemKind = vscode.CompletionItemKind.Class; itemKindDetail = `class` }
                    else if (keyword_attributeValue === 'reserved word') { itemKind = vscode.CompletionItemKind.Keyword; itemKindDetail = `reserved keyword` }
                    else if (keyword_attributeValue === 'enumeration') { itemKind = vscode.CompletionItemKind.Enum; itemKindDetail = `enumeration` }
                    else { itemKind = vscode.CompletionItemKind.Function; itemKindDetail = `user function` }
    
                    const item = new vscode.CompletionItem(keyword, itemKind);
                    item.detail = itemKindDetail;
                    item.sortText = ('a' + keyword).toLowerCase();
                    return item;
                });

                const documentText = document.getText();
                const lines = documentText.split('\n');
                const variableRegex = /\b(\w+)\b/g;
                const methodRegex = /^Method\s+(\w+)\s+(\w+)\s*\(/i; // Case-insensitive method detection
                const documentVariables = new Map();
                const documentMethods = new Map();
                let   commentsON = false;

                lines.forEach(line => {

                    if (line.trim().startsWith('//') ) { return; }              // ignore comment lines
                    if (line.trim().startsWith('{'))   { commentsON = true;  }	// ignore comment lines
                    if (line.trim().includes('}'))     { commentsON = false; }
                    if (commentsON)                    { return; }              // ignore comment lines

                    let match;

                    // Extract methods first
                    if ((match = methodRegex.exec(line)) !== null) {
                        const returnType = match[1];
                        const methodName = match[2];
                        if (!documentMethods.has(methodName)) {
                            const item = new vscode.CompletionItem(methodName, vscode.CompletionItemKind.Method);
                            item.detail = `user method returns: ${returnType}`; // Explicit return type
                            documentMethods.set(methodName, item);
                        }
                    } else {
                        // Extract variables only if not already identified as methods
                        const methodNames = Array.from(documentMethods.keys());
                        while ((match = variableRegex.exec(line)) !== null) {
                            const variable = match[1];
                            if (!documentVariables.has(variable) && !methodNames.includes(variable)) {
                                const item = new vscode.CompletionItem(variable, vscode.CompletionItemKind.Variable);
                                documentVariables.set(variable, item);
                            }
                        }
                    }
                });

                const uniqueDocumentVariables = Array.from(documentVariables.values());
                const uniqueDocumentMethods = Array.from(documentMethods.values());

                // Combine all completion items
                const allCompletions = [
                    ...customKeywords,
                    ...uniqueDocumentVariables,
                    ...uniqueDocumentMethods
                ];

                // Remove duplicate items
                const uniqueCompletions = allCompletions.reduce((acc, current) => {
                    const exists = acc.find(item => item.label.toLowerCase() === current.label.toLowerCase());
                    if (!exists) {
                        acc.push(current);
                    }
                    return acc;
                }, []);

                return uniqueCompletions;
            },
        }
    );


    // Register listeners for updating decorations
    const activeEditor = vscode.window.activeTextEditor;
    if (activeEditor) {
        triggerUpdateDecorations(activeEditor);
    }

    // Check if the editor changed
    vscode.window.onDidChangeActiveTextEditor((editor) => {
        if (editor) {
            triggerUpdateDecorations(editor);
        }
    }, null, context.subscriptions);

    // Watch for text changes on document
    vscode.workspace.onDidChangeTextDocument((event) => {
        const activeEditor = vscode.window.activeTextEditor;
        if (activeEditor && event.document === activeEditor.document) {
            triggerUpdateDecorations(activeEditor);
        }
    }, null, context.subscriptions);

    // Watch for changes in settings to refresh the keywords and/or decoration style dynamically
    vscode.workspace.onDidChangeConfiguration((event) => {
        if (event.affectsConfiguration('easylanguage')) {

            // Refresh the decoration type when settings change
            if (usr_func_decorationType) {
                usr_func_decorationType.dispose(); // Dispose of old decoration type
            }

            // Create decoration type based on the current settings
            let updateDecorationType = () => {
                const lightBackgroundColor = vscode.workspace.getConfiguration('easylanguage').get('customUserFunctionsLightThemeBackgroundColor');
                const lightColor = vscode.workspace.getConfiguration('easylanguage').get('customUserFunctionsLightThemeColor');
                const lightFontStyle = vscode.workspace.getConfiguration('easylanguage').get('customUserFunctionsLightThemeStyle');

                const darkBackgroundColor = vscode.workspace.getConfiguration('easylanguage').get('customUserFunctionsDarkThemeBackgroundColor');
                const darkColor = vscode.workspace.getConfiguration('easylanguage').get('customUserFunctionsDarkThemeColor');
                const darkFontStyle = vscode.workspace.getConfiguration('easylanguage').get('customUserFunctionsDarkThemeStyle');

                return vscode.window.createTextEditorDecorationType({
                    light: { // Used in light themes
                        backgroundColor: lightBackgroundColor,
                        color: lightColor,
                        fontStyle: lightFontStyle,
                    },
                    dark: { // Used in dark themes
                        backgroundColor: darkBackgroundColor,
                        color: darkColor,
                        fontStyle: darkFontStyle,
                    },
                });
            };

            usr_func_decorationType = updateDecorationType(); // update new decoration type
            console.log('[RTT EasyLanguage] Custom User Function keywords styles updated from vsCode settings');

            const activeEditor = vscode.window.activeTextEditor;
            if (activeEditor) {
                updateDecorations(activeEditor); // Reapply decorations
            }
        }
    }, null, context.subscriptions);

    // Push the completion provider to the context
    context.subscriptions.push(completionProvider);
}
/////////////////////////////////////////////////////////


//////////////////////////////////
// Function to register hover provider
function registerHoverProvider(context, reserved_keywords, attributesMap) {

    vscode.languages.registerHoverProvider('easylanguage', {
        async provideHover(document, position, token) {

            const wordRange = document.getWordRangeAtPosition(position);
            if (!wordRange) { return; } // No word under the cursor

            let cursor_word = document.getText(wordRange);
            const lineText = document.lineAt(position).text.trim();
            const plotRegex = /^plot([1-9][0-9]?)$/i;    // Regex to match 'plot1' to 'plot99'
            const valueRegex = /^value([1-9][0-9]?)$/i;    // Regex to match value
            const conditionRegex = /^condition([1-9][0-9]?)$/i;    // Regex to match condition

            if (lineText.startsWith('//') || lineText.startsWith('{')) { return; } // Skip matches on commented lines

            if (plotRegex.test(cursor_word)) { cursor_word = 'plot'; }
            if (valueRegex.test(cursor_word)) { cursor_word = 'value'; }
            if (conditionRegex.test(cursor_word)) { cursor_word = 'condition'; }

            // Check if the cursor_word exists in reserved_keywords (case-insensitive)
            let isReservedKeyword = reserved_keywords.some(
                (keyword) => keyword.toLowerCase() === cursor_word.toLowerCase()
            );

            if (!isReservedKeyword && wordRange.c.e > 0) {
                wordRange.c.e = wordRange.c.e - 1;
                cursor_word = document.getText(wordRange);
                isReservedKeyword = reserved_keywords.some(
                    (keyword) => keyword.toLowerCase() === cursor_word.toLowerCase()
                );
            }

            if (!isReservedKeyword) { return; } // Not a reserved keyword, no hover

            // Check if cursor_word exists in attributesMap (case-insensitive)
            let hovered_keyword = null;
            let keyword_attributeValue = null;
            for (const [keyword, attribute] of attributesMap.entries()) {
                if (keyword.toLowerCase() === cursor_word.toLowerCase()) {
                    keyword_attributeValue = attribute;
                    hovered_keyword = keyword;
                    break;
                }
            }

            if (keyword_attributeValue == null) { return; } // Nothing found in attributesMap

            try {
                // Fetch the hover text from the web dynamically
                const hoverText = await fetchHoverText(hovered_keyword, keyword_attributeValue);
                return new vscode.Hover(hoverText);
            } catch (error) {
                console.error(`[RTT EasyLanguage] ` + error);
                return new vscode.Hover('Unable to fetch description at the moment.');
            }
        }
    });

    // Listen for document open events
    vscode.workspace.onDidOpenTextDocument((document) => {
        if (document.languageId === 'easylanguage') {
            setTimeout(() => {
                vscode.commands.executeCommand('easylanguage.outlineCollapse');
            }, 750); 
        }
    });

    setTimeout(() => {
        vscode.commands.executeCommand('easylanguage.outlineCollapse');
    }, 750);
}




//////////////////////////////////
// vsCode extension: Deactivate the extension
function deactivate() { }



//////////////////////////////////
// Exports
module.exports = {
    activate,
    deactivate,
};



