const vscode = require('vscode');
const fs = require('fs');
const https = require('https'); 
const path = require('path');
const { parse } = require('node-html-parser'); 

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
        if (word.length === 0) {
            return;
        }
        const lowerCaseWord = word.toLowerCase();
        if (this.contains(lowerCaseWord)) {
            return;
        }
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

// Helper function to check file existence
const fileExists = async (filePath) => {
    try {
        await fs.promises.access(filePath, fs.constants.F_OK);
        return true;
    } catch (error) {
        return false;
    }
};

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

// Function to read keywords from file2.txt
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

// Function to fetch data from a web page
function fetchHoverText(keyword) {
  return new Promise((resolve, reject) => {
      const url = `https://help.tradestation.com/10_00/eng/tsdevhelp/elword/word/${encodeURIComponent(keyword)}_reserved_word_.htm`;
      // function example:  https://help.tradestation.com/10_00/eng/tsdevhelp/elword/function/adx_function_.htm
      // reserved word example:  https://help.tradestation.com/10_00/eng/tsdevhelp/elword/word/above_reserved_word_.htm
      // class example:  https://help.tradestation.com/10_00/eng/tsdevhelp/elobject/class/account_class.htm

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

                    // Remove <p> tags with class "Disclaimer"
                    contentDiv.querySelectorAll('p.Disclaimer').forEach(disclaimer => {
                      disclaimer.remove(); // Remove the <p class="Disclaimer"> tag
                    });
                  
                    // Convert <br> and </p> to newline characters
                    const htmlWithLineBreaks = contentDiv.innerHTML
                        .replace(/<\/p>/gi, '\n') // Handle </p> tags
                        .replace(/<\/h1>/gi, '\n') // Handle </p> tags
                        .replace(/<\/h4>/gi, '\n'); // Handle </p> tags

                    // Re-parse the adjusted HTML
                    const rootWithLineBreaks = parse(htmlWithLineBreaks);

                    // Extract cleaned text while preserving line breaks
                    let plainText = rootWithLineBreaks.innerText;
                    plainText = plainText
                    .replace(/[ \t]+/g, ' ')         // Replace multiple spaces or tabs with a single space
                    // .replace(/\n\s*\n/g, '\n')        // Remove multiple blank lines
                    .trim();                         // Remove leading/trailing whitespace
                    
                    resolve(plainText);
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
async function activate(context) {
    const trie = new Trie();
    const file1Path = context.asAbsolutePath('file1.txt'); // Path to the first file
    const file2Path = context.asAbsolutePath('file2.txt'); // Path to the second file

    // Register hover provider
    registerHoverProvider(context);

    // Load attribute-keyword pairs from file1.txt
    const attributesMap = await loadAttributeKeywordsFromFile(file1Path);
    const reserved_keywords = Array.from(attributesMap.keys()); // Extract only keywords for highlighting

    // Load keywords from file2.txt
    const user_func_keywords = await loadKeywordsFromFile(file2Path);

    // Insert all keywords into the Trie
    reserved_keywords.forEach((keyword) => trie.insert(keyword));
    user_func_keywords.forEach((keyword) => trie.insert(keyword));
    console.log('Trie initialized with keywords from both files.');

    const usr_func_decorationType = vscode.window.createTextEditorDecorationType({
      light: {    // used in light color themes
        fontStyle: 'italic',
        color: '#b300ff',
        backgroundColor: 'rgba(188, 65, 250, 0.05)' // light plum
      },
      dark: {   // used in dark color themes
        fontStyle: 'bold',
        color: '#ff6f00',
        backgroundColor: 'rgba(255, 165, 0, 0.05)' // light orange
      }
    });

    let timeout = null;

    // Function to update decorations
    const updateDecorations = (editor) => {
        if (!editor) {
            return;
        }

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
            const hoverMessage = `${match[0]} : user function`;
            decorationsFile2.push({ 
              range: new vscode.Range(startPos, endPos),
              hoverMessage, 
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
                    // item.detail = 'Keyword from Trie';
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

// Deactivate function
function deactivate() {}

module.exports = {
    activate,
    deactivate,
};



// Function to register hover provider
function registerHoverProvider(context) {
  
  vscode.languages.registerHoverProvider('easylanguage', {
        async provideHover(document, position, token) {

            const wordRange = document.getWordRangeAtPosition(position);
            if (!wordRange) {
                return; // No word under the cursor
            }
            
            const word = document.getText(wordRange);

              try {
                  // Fetch the hover text from the web dynamically
                  const hoverText = await fetchHoverText(word);
                  return new vscode.Hover(hoverText);
              } catch (error) {
                  console.error(error);
                  return new vscode.Hover('Unable to fetch description at the moment.');
              }
        }
  });
}
