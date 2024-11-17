const vscode = require('vscode');

let configName = 'easylanguage-keyword-completions';

class TrieNode {

  constructor(key) {
    this.key = key;
    this.parent = null;
    this.children = {};
    this.end = false;
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

class Trie {

  constructor() {
    this.root = new TrieNode(null);
  }

  contains(word) {
    if (word.length === 0) { return false; }
    let node = this.root;
    for (let i = 0; i < word.length; i++) {
      node = node.children[word[i]];
      if (!node) { return false; }
    }
    return node.end;
  }

  insert(word) {
    if (word.length === 0) { return; }
    if (this.contains(word)) { return; }
    let node = this.root;
    for (let i = 0; i < word.length; i++) {
      const char = word[i];
      if (!node.children[char]) {
        node.children[char] = new TrieNode(char);
        node.children[char].parent = node;
      }
      node = node.children[char];
    }
    node.end = true;
  }

  find(prefix) {
    let node  = this.root;
    let words = [];

    for(let i = 0; i < prefix.length; i++) {
      node  = node.children[prefix[i]];
      if (!node) { return words; }
    }
    this.findAllWords(node, words);
    return words;
  }

  findAllWords(node, words) {
    if (node.end) {
      words.push(node.getWord());
    }
    for (let child in node.children) {
      this.findAllWords(node.children[child], words);
    }
  }
}

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



function getProperty(obj, prop, deflt) { return obj.hasOwnProperty(prop) ? obj[prop] : deflt; }

function utf8_to_str (src, off, lim) {  // https://github.com/quicbit-js/qb-utf8-to-str-tiny
  lim = lim == null ? src.length : lim;
  for (var i = off || 0, s = ''; i < lim; i++) {
    var h = src[i].toString(16);
    if (h.length < 2) h = '0' + h;
    s += '%' + h;
  }
  return decodeURIComponent(s);
}

async function readFileContent(filePath) {
  filePath = filePath;
  let uri = vscode.Uri.file(filePath);
  let contentUTF8 = await vscode.workspace.fs.readFile(uri);
  return utf8_to_str(contentUTF8);
};

function activate(context) {

  const provider = new ESLDocumentSymbolProvider();
  context.subscriptions.push(vscode.languages.registerDocumentSymbolProvider({ language: 'easylanguage', scheme: 'file' }, provider));

  // vscode.commands.executeCommand('outline.collapse');
  // vscode.commands.executeCommand('workbench.actions.treeView.workbench.panel.markers.view.collapseAll');

  let languageIDProviderRegistered = new Set();
  let languageID2Trie = {};
  let minimalCharacterCount = 2;
  let completionItemProvider = {
    /** @param {vscode.TextDocument} document @param {vscode.Position} position */
    provideCompletionItems(document, position) {
      let trie = languageID2Trie[document.languageId];
      if (!trie) { return undefined; }
      const linePrefix = document.lineAt(position).text.substring(0, position.character).trimStart();
      const match = linePrefix.match(/(\w+)$/);
      if (!match) { return undefined; }
      let prefix = match[1];
      if (prefix.length < minimalCharacterCount) { return undefined; }
      const range = new vscode.Range(position.line, position.character - prefix.length, position.line, position.character);
      let result = [];
      trie.find(prefix).forEach(word => {
        let item = new vscode.CompletionItem(word, vscode.CompletionItemKind.Text);
        item.range = range;
        result.push(item);
      });
      return result;
    }
  };

  function updateConfig() {
    languageID2Trie = {};
  }

  updateConfig();

  context.subscriptions.push(vscode.workspace.onDidChangeConfiguration( e => {
    if (!e.affectsConfiguration(configName)) { return; }
    updateConfig();
  }));

  async function onMatchLanguageID(check_languageID, async_action_file) {
      let selectors = JSON.parse('[{ "language": "easylanguage", "scheme": "file" }]'); 
      for (const selector of selectors) {
        let languageIDSelector = getProperty(selector, 'language');
        if (!check_languageID(languageIDSelector, selector)) { continue; }
          const filePath = context.asAbsolutePath("./easylanguage-complete.txt");
          if (!await async_action_file(filePath)) { return; }
      }
  }

  context.subscriptions.push(vscode.workspace.onDidSaveTextDocument( async document => {
    await onMatchLanguageID( () => true,
      async filePath => {
        if (document.fileName === filePath) {
          updateConfig();
          return false;
        }
        return true;
    });
  }));

  async function changeActiveTextEditor(editor) {
    if (!editor) { return; }
    let languageIDEditor = 'easylanguage';
    await onMatchLanguageID(
      (languageIDSelector, selector) => {
        if (languageIDSelector !== languageIDEditor) { return false; }
        if (!languageIDProviderRegistered.has(languageIDEditor)) {
          context.subscriptions.push(vscode.languages.registerCompletionItemProvider([selector], completionItemProvider));
          languageIDProviderRegistered.add(languageIDEditor);
        }
        let trie = new Trie();
        languageID2Trie[languageIDEditor] = trie;
        return true;
      },
      async (filePath) => {
        let trie = languageID2Trie[languageIDEditor];
        let content = await readFileContent(filePath);
        for (const line of content.split(/\r?\n/)) {
          // if (line.match(/^\s*($|\/\/|#)/)) { continue; }  // skip empty and comment lines
          trie.insert(line);
          trie.insert(line.toLowerCase());
          trie.insert(line.toUpperCase());
        }
        return true; 
      });
    if (languageID2Trie[languageIDEditor] === undefined) {
      languageID2Trie[languageIDEditor] = null;
    }
  }
  context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor( editor => changeActiveTextEditor(editor) ));
  changeActiveTextEditor(vscode.window.activeTextEditor);
}

function deactivate() {
}

module.exports = {
  activate,
  deactivate
}
