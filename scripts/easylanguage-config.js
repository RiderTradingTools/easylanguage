const vscode = require('vscode');
const fs = require('fs');
const https = require('https'); 
const { parse } = require('node-html-parser'); 
const TurndownService = require('turndown');


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
class ESLDocumentSymbolProvider {
  provideDocumentSymbols(document, token) {
    return new Promise((resolve, reject) => {

      const symbols = [];
      const nodes = [symbols];
      let icon_using = vscode.SymbolKind.Interface;
      let icon_inputs = vscode.SymbolKind.Null;
      let icon_vars = vscode.SymbolKind.Variable;
      let icon_method = vscode.SymbolKind.Class;
      let icon_region = vscode.SymbolKind.Number;
      let icon_begin = vscode.SymbolKind.Array;
      let inside_X = false;
      let previous_X = "";
      let comment_block = false;

      for (let i = 0; i < document.lineCount; i++) {
          
          let line = document.lineAt(i);
          let lineText = line.text.trim().toLowerCase().replace(/\s+/g, ' ');
          let lineTextLen = line.text.trim().length;
          let prevLineText = "";
          let lineRange = new vscode.Range(i, 0, i, 199);
          let getlineText = document.lineAt(i).text.trim().replace(/\s+/g, ' ');

          if ( i >= 1 ) {
            prevLineText = document.lineAt(i-1).text.trim().toLowerCase().replace(/\s+/g, ' ');
          }


          //-----------------------------------------------------------------------
          // comment block
          if ( lineText.startsWith("{") && !lineText.includes("}") ) {
            comment_block = true;
          } 
          else if ( comment_block && lineText.includes("}") ) {
            comment_block = false;
          } 

          //-----------------------------------------------------------------------
          // Using
          if ( lineText.startsWith("using") && !comment_block ) {
            const usingSymbol = new vscode.DocumentSymbol("Using", getlineText.substring(6,lineTextLen-1), icon_using, lineRange, lineRange);
            nodes[nodes.length-1].push(usingSymbol);  
          } 

          //-----------------------------------------------------------------------
          // Inputs
          else if ( !comment_block && ( lineText.startsWith("input:") || lineText.startsWith("inputs:") ) ) {
            const inputSymbol = new vscode.DocumentSymbol("Inputs", "", icon_inputs, lineRange, lineRange );
            nodes[nodes.length-1].push(inputSymbol); 
          }

          //-----------------------------------------------------------------------
          // Variables
          else if ( !comment_block && ( lineText.startsWith("variable") || lineText.startsWith("vars:") || lineText.startsWith("var:") ) ) {
            const variableSymbol = new vscode.DocumentSymbol("Variables", "", icon_vars, lineRange, lineRange );
            nodes[nodes.length-1].push(variableSymbol);  
          }

          //-----------------------------------------------------------------------
          // Constants
          else if ( !comment_block && ( lineText.startsWith("constants") || lineText.startsWith("constant:") || lineText.startsWith("const:") ) ) {
            const constantSymbol = new vscode.DocumentSymbol("Constants", "", icon_vars, lineRange, lineRange );
            nodes[nodes.length-1].push(constantSymbol);  
          }
         
          //-----------------------------------------------------------------------
          // Method, Region, Begin
          else if ( !comment_block && 
                ( lineText.startsWith("method") || lineText.startsWith("#region") || lineText.startsWith("begin") || lineText.startsWith("once")  
                  || ( lineText.endsWith("then begin") && !lineText.startsWith("//") && !lineText.startsWith("{") ) 
                  || ( lineText.includes("else begin") && !lineText.startsWith("//") && !lineText.startsWith("{") ) 
                ) ) {

            if ( lineText.startsWith("begin") && previous_X == "Method" ) {
                previous_X = "";
            } 
            else {

                // Begin
                if ( lineText == "begin" || lineText == "else begin" ) {
                  getlineText = prevLineText;
                  lineRange = new vscode.Range(i-1, 1, i, line.text.length);
                  previous_X = "Begin";
                }
                let xSymbol = new vscode.DocumentSymbol("Begin", getlineText, icon_begin, lineRange, lineRange );

                // Region
                if ( lineText.startsWith("#region") ) {
                  getlineText = getlineText.substring(8);
                  xSymbol = new vscode.DocumentSymbol("Region", getlineText, icon_region, lineRange, lineRange );
                  previous_X = "Region";
                }

                // Method
                else if ( lineText.startsWith("method") ) {
                  xSymbol = new vscode.DocumentSymbol("Method", getlineText.substring(7), icon_method, lineRange, lineRange );
                  previous_X = "Method";
                }

                // Once
                if ( lineText.startsWith("once") || prevLineText.startsWith("once") || lineText == "once begin" ) {
                  xSymbol = new vscode.DocumentSymbol("Once", "", icon_begin, lineRange, lineRange );
                }

                nodes[nodes.length-1].push(xSymbol);  

                if ( !inside_X ) {
                  nodes.push(xSymbol.children);
                  inside_X = true;
                }
                else if ( inside_X ) {
                  nodes.push(xSymbol.children);
                }
            }
          } 

          //-----------------------------------------------------------------------
          // End / End Region
          if ( !comment_block && ( lineText.startsWith("end") || lineText.startsWith("#endregion") ) ) {

            if ( inside_X ) {
              nodes.pop();
              if ( nodes.length <= 1 ) {
                inside_X = false;
              }
            }
          }

      }

      resolve(symbols);
    });
  }
}


//////////////////////////////////
// Helper function to check file existence
const fileExists = async (filePath) => {
    try {
        await fs.promises.access(filePath, fs.constants.F_OK);
        return true;
    } catch (error) {
        return false;
    }
};


//////////////////////////////////
// Function to read attribute-value pairs from file1.txt
const loadAttributeKeywordsFromFile = async (filePath) => {
    const attributesMap = new Map();
    const exists = await fileExists(filePath);
    if (!exists) {
        console.warn(`File not found: ${filePath}`);
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
        console.error(`Error reading file: ${filePath}`, error);
    }

    return attributesMap;
};


//////////////////////////////////
// Function to read keywords from file
const loadKeywordsFromFile = async (filePath) => {
    const keywordsSet = new Set();
    const exists = await fileExists(filePath);
    if (!exists) {
        console.warn(`File not found: ${filePath}`);
        return [];
    }

    try {
        const data = await fs.promises.readFile(filePath, 'utf8');
        const keywords = data.split('\n').map((line) => line.trim()).filter((line) => line !== '');
        keywords.forEach((keyword) => keywordsSet.add(keyword));
    } catch (error) {
        console.error(`Error reading file: ${filePath}`, error);
    }

    return Array.from(keywordsSet); // Convert Set to Array to avoid duplicates
};


//////////////////////////////////
// Function to fetch content from web page
function fetchHoverText(keyword, keyword_attributeValue) {
  return new Promise((resolve, reject) => {

    const turndownService = new TurndownService();
    let url = ``;

    // function example:  https://help.tradestation.com/10_00/eng/tsdevhelp/elword/function/adx_function_.htm
    // reserved word example:  https://help.tradestation.com/10_00/eng/tsdevhelp/elword/word/above_reserved_word_.htm
    // class example:  https://help.tradestation.com/10_00/eng/tsdevhelp/elobject/class/account_class.htm
    
    if (keyword_attributeValue == 'reserved word') {
      url = `https://help.tradestation.com/10_00/eng/tsdevhelp/elword/word/${encodeURIComponent(keyword)}_reserved_word_.htm`;
    }
    else if (keyword_attributeValue == 'function') {
      url = `https://help.tradestation.com/10_00/eng/tsdevhelp/elword/function/${encodeURIComponent(keyword)}_function_.htm`;
    }
    else if (keyword_attributeValue == 'class') {
      url = `https://help.tradestation.com/10_00/eng/tsdevhelp/elobject/class/${encodeURIComponent(keyword)}_class.htm`;
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
                      imgs.remove(); 
                    });
                    contentDiv.querySelectorAll('a').forEach(aTags => {
                      aTags.remove(); 
                    });

                    const htmlFixedText = contentDiv.innerHTML
                      .replace(/<h2/gi, '<h4') // Handle </h2> tags
                      .replace(/h2>/gi, 'h4>'); // Handle </h2> tags

                    // Convert HTML to Markdown
                    let markdown = turndownService.turndown(htmlFixedText);
                                        
                    const styledString = `&nbsp;&nbsp;<span style="color:#fff;background-color:#666;">&nbsp;${encodeURIComponent(keyword)}&nbsp;</span>`;
                    const markdownText = new vscode.MarkdownString(`$(getting-started-beginner)`);
                      markdownText.appendMarkdown(styledString);
                      markdownText.appendText(`  (`+keyword_attributeValue+`)\n`);
                      markdownText.appendMarkdown(`\n<hr>\n`);
                      markdownText.appendMarkdown(markdown);
                      markdownText.appendMarkdown(`\n<hr>\n`);
                      markdownText.appendText(`\n&nbsp;$(link-external)  ` + url);

                    markdownText.isTrusted = true; 
                    markdownText.supportHtml = true;
                    markdownText.supportThemeIcons = true;
                    
                    resolve(markdownText);
                  } else {
                      resolve(`No description available for "${keyword}".`);
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





/////////////////////////////////////////////////////////
// VS Code extension activate function
/////////////////////////////////////////////////////////
async function activate(context) {

    const provider = new ESLDocumentSymbolProvider();
    context.subscriptions.push(vscode.languages.registerDocumentSymbolProvider({ language: 'easylanguage', scheme: 'file' }, provider));

    const trie = new Trie();
    const file1Path = context.asAbsolutePath('file1.txt'); // Path to the first file
    const file2Path = context.asAbsolutePath('file2.txt'); // Path to the second file
    // const turndownService = new TurndownService();

    // Load attribute-keyword pairs from file1.txt
    const attributesMap = await loadAttributeKeywordsFromFile(file1Path);
    const reserved_keywords = Array.from(attributesMap.keys()); // Extract only keywords for highlighting

    // Load keywords from file2.txt
    const user_func_keywords = await loadKeywordsFromFile(file2Path);

    // Insert all keywords into the Trie
    reserved_keywords.forEach((keyword) => trie.insert(keyword));
    user_func_keywords.forEach((keyword) => trie.insert(keyword));
    console.log('Trie initialized with keywords from both files.');

    // Register hover provider
    registerHoverProvider(context, reserved_keywords, attributesMap);

    const usr_func_decorationType = vscode.window.createTextEditorDecorationType({
      light: {    // used in light color themes
        fontStyle: 'italic',
        color: '#b300ff',
        backgroundColor: 'rgba(188, 65, 250, 0.05)'
      },
      dark: {   // used in dark color themes
        fontStyle: 'bold',
        color: '#ff6f00',
        backgroundColor: 'rgba(255, 165, 0, 0.05)'
      }
    });

    let timeout = null;

    // Function to update decorations
    const updateDecorations = (editor) => {
        if (!editor) { return; }

        const text = editor.document.getText();

        // Match and decorate custom user function keywords
        const regexFile2 = new RegExp(`\\b(${user_func_keywords.join('|')})\\b`, 'gi');
        const decorationsFile2 = [];
        while ((match = regexFile2.exec(text)) !== null) {
            const startPos = editor.document.positionAt(match.index);
            const endPos = editor.document.positionAt(match.index + match[0].length);
            const lineStartPos = new vscode.Position(startPos.line, 0);
            const lineText = editor.document.getText(new vscode.Range(lineStartPos, startPos)).trim();
            if (lineText.startsWith('//') || lineText.startsWith('{')) { continue; } // Skip matches on commented lines
            
            const styledString = `&nbsp;&nbsp;<span style="color:#fff;background-color:#666;">&nbsp;${match[0]}&nbsp;</span>`;
            const markdownText = new vscode.MarkdownString(`$(getting-started-beginner)`);
              markdownText.supportHtml = true;
              markdownText.appendMarkdown(styledString);
              markdownText.appendText(`  (user function)\n`);
              markdownText.appendMarkdown(`\n`);

            markdownText.isTrusted = true; 
            markdownText.supportThemeIcons = true;
            
            decorationsFile2.push({ 
              range: new vscode.Range(startPos, endPos), 
              hoverMessage: markdownText 
            });
        }
        editor.setDecorations(usr_func_decorationType, decorationsFile2);
    };

    const triggerUpdateDecorations = (editor) => {
        if (timeout) {
            clearTimeout(timeout);
        }
        timeout = setTimeout(() => updateDecorations(editor), 500);
    };

    // Register completion provider
    const completionProvider = vscode.languages.registerCompletionItemProvider(
        { scheme: 'file', language: 'easylanguage' }, // Apply to all files
        {
            provideCompletionItems(document, position) {
                const allKeywords = trie.getAllWords();
                return allKeywords.map((keyword) => {
                    const item = new vscode.CompletionItem(keyword, vscode.CompletionItemKind.Keyword);
                    return item;
                });
            },
        }
    );

    // Register listeners for updating decorations
    const activeEditor = vscode.window.activeTextEditor;
    if (activeEditor) {
        triggerUpdateDecorations(activeEditor);
    }

    vscode.window.onDidChangeActiveTextEditor((editor) => {
        if (editor) {
            triggerUpdateDecorations(editor);
        }
    }, null, context.subscriptions);

    vscode.workspace.onDidChangeTextDocument((event) => {
        const activeEditor = vscode.window.activeTextEditor;
        if (activeEditor && event.document === activeEditor.document) {
            triggerUpdateDecorations(activeEditor);
        }
    }, null, context.subscriptions);

    // Push the completion provider to the context
    context.subscriptions.push(completionProvider);
}


//////////////////////////////////
// Deactivate function
function deactivate() {}


//////////////////////////////////
module.exports = {
    activate,
    deactivate,
};


//////////////////////////////////
// Function to register hover provider
function registerHoverProvider(context, reserved_keywords, attributesMap) {
  
  vscode.languages.registerHoverProvider('easylanguage', {
        async provideHover(document, position, token) {

            const wordRange = document.getWordRangeAtPosition(position);
            if (!wordRange) { return; } // No word under the cursor
            
            const cursor_word = document.getText(wordRange);
            const lineText = document.lineAt(position).text.trim();

            if (lineText.startsWith('//') || lineText.startsWith('{')) { return; } // Skip matches on commented lines

            // Check if the cursor_word exists in reserved_keywords (case-insensitive)
            const isReservedKeyword = reserved_keywords.some(
                (keyword) => keyword.toLowerCase() === cursor_word.toLowerCase()
            );

            if (!isReservedKeyword) { return; } // Not a reserved keyword, no hover

            // Check if cursor_word exists in attributesMap (case-insensitive)
            let keyword_attributeValue = null;
            for (const [keyword, attribute] of attributesMap.entries()) {
                if (keyword.toLowerCase() === cursor_word.toLowerCase()) {
                    keyword_attributeValue = attribute;
                    break;
                }
            }            

            if (keyword_attributeValue == null) { return; } // Nothing found in attributesMap

            try {
                // Fetch the hover text from the web dynamically
                const hoverText = await fetchHoverText(cursor_word, keyword_attributeValue);
                return new vscode.Hover(hoverText);
            } catch (error) {
                console.error(error);
                return new vscode.Hover('Unable to fetch description at the moment.');
            }
        }
  });
}
