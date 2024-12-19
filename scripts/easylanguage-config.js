const vscode = require('vscode');
const fs = require('fs');
const https = require('https'); 
const { parse } = require('node-html-parser'); 
const TurndownService = require('turndown');
const { gfm } = require('turndown-plugin-gfm');


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
// Class to create the code Outline view
class ESLDocumentSymbolProvider {
  provideDocumentSymbols(document, token) {
	return new Promise((resolve, reject) => {

	  const symbols = [];
	  const nodes = [symbols];
	  let icon_using = vscode.SymbolKind.Interface;
	  let icon_inputs = vscode.SymbolKind.Null;
	  let icon_vars = vscode.SymbolKind.Variable;
	  let icon_method = vscode.SymbolKind.Method;
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
	  url =      `https://help.tradestation.com/10_00/eng/tsdevhelp/elword/word/${encodeURIComponent(keyword)}_reserved_word_.htm`;
	  rep_url =  `https://help.tradestation.com/10_00/eng/tsdevhelp/elword`;
	  rep_url2 = `https://help.tradestation.com/10_00/eng/tsdevhelp/elword/word/`;
	  title_icon = `$(symbol-keyword)`;
	}
	else if (keyword_attributeValue == 'function') {
	  url =      `https://help.tradestation.com/10_00/eng/tsdevhelp/elword/function/${encodeURIComponent(keyword)}_function_.htm`;
	  rep_url =  `https://help.tradestation.com/10_00/eng/tsdevhelp/elword`;
	  rep_url2 = `https://help.tradestation.com/10_00/eng/tsdevhelp/elword/function/`;
	  title_icon = `$(symbol-function)`;
	}
	else if (keyword_attributeValue.startsWith('class') || keyword_attributeValue == 'collection') {
	  url =      `https://help.tradestation.com/10_00/eng/tsdevhelp/elobject/${encodeURIComponent(keyword_attributeValue)}/${encodeURIComponent(keyword)}${encodeURIComponent(classSuffix)}.htm`;
	  rep_url =  `https://help.tradestation.com/10_00/eng/tsdevhelp/elobject`;
	  rep_url2 = `https://help.tradestation.com/10_00/eng/tsdevhelp/elobject/class/`;
	  keyword_attributeValue = 'class';
	  title_icon = `$(symbol-class)`;
	}
	else if (keyword_attributeValue == 'enumeration') {
	  url =      `https://help.tradestation.com/10_00/eng/tsdevhelp/elobject/enumeration/${encodeURIComponent(keyword)}_enumeration.htm`;
	  rep_url =  `https://help.tradestation.com/10_00/eng/tsdevhelp/elobject`;
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
					  .replace(/href=\"(?=[a-z])/gi, 'href="'+rep_url2)
					  .replace(/href=\"\.\./gi, 'href="'+rep_url)
					  .replace(/href=\"#\"/gi, '')
					  .replace(/xmlns=\"http:\/\/www.w3.org\/1999\/xhtml\"/gi, '')
					  .replace(/<\/td>/gi,'&nbsp;</td>&nbsp;')
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
					markdownText.appendText(`  (`+keyword_attributeValue+`)\n`);
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
// VS Code extension main: activate 
/////////////////////////////////////////////////////////
async function activate(context) {

  const provider = new ESLDocumentSymbolProvider();
  context.subscriptions.push(vscode.languages.registerDocumentSymbolProvider({ language: 'easylanguage', scheme: 'file' }, provider));

  const trie = new Trie();

  // Register the reload command
  const reloadCommand = vscode.commands.registerCommand('easylanguage.reloadExtension', () => {
	  vscode.commands.executeCommand('workbench.action.reloadWindow'); // Reloads the vsCode window
  });
  context.subscriptions.push(reloadCommand);    

  // Load attribute-keyword pairs from easylanguage-complete.txt
  const filePath_keywords = context.asAbsolutePath('easylanguage-complete.txt'); 
  const attributesMap = await loadAttributeKeywordsFromFile(filePath_keywords);
  let reserved_keywords = null;
  if (attributesMap.size > 0){

	  reserved_keywords = Array.from(attributesMap.keys()); // Extract keywords for highlighting
	  // Insert keywords into the Trie
	  reserved_keywords.forEach((keyword) => trie.insert(keyword));
	  console.log('[RTT EasyLanguage] Trie initialized with EasyLanguage keywords');
	  // Register hover provider
	  registerHoverProvider(context, reserved_keywords, attributesMap);
  }

  // Setup decorations
  let usr_func_decorationType = null;

  // Load user keywords from the vsCode settings
  const user_func_keywords = loadUserFunctionsFromSettings();
  if (user_func_keywords.length > 0) {

	  user_func_keywords.forEach((keyword) => trie.insert(keyword));
	  console.log('[RTT EasyLanguage] Trie initialized with custom user function keywords from vsCode settings');
	  
	  // Function to create decoration type based on the current settings
	  const createDecorationType = () => {
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

	  // Create initial decoration type
	  usr_func_decorationType = createDecorationType();
  }

  let timeout = null;

  // Function to update decorations
  const updateDecorations = (editor) => {
	  if (!editor || !usr_func_decorationType) { return; }

	  // Scan document for user Methods
	  const text = editor.document.getText();
	  const docLines = text.split('\n');
	  const methodRegex = /^Method\s+(\w+)\s+(\w+)\s*\(/i;  // Case-insensitive method detection
	  const docMethods = new Array();
	  let commentsON = false;

	  docLines.forEach(line => {
		  if (line.trim().startsWith('//') ) { return; }                // ignore comment lines
		  if (line.trim().startsWith('{'))   { commentsON = true;  }	// ignore comment lines
		  if (line.trim().includes('}'))     { commentsON = false; }
		  if (commentsON)                    { return; }                // ignore comment lines

		  let mMatch;

		  if ((mMatch = methodRegex.exec(line)) !== null) {
			// Extract Methods 
			const methodName = mMatch[2];
			if (docMethods.indexOf(methodName) == -1) {
				docMethods.push(methodName);
			}
		  }
	  });

	  // Match and decorate custom User Function keywords, and user Methods
	  const regexUserFuncs = new RegExp(`\\b(${user_func_keywords.join('|')})\\b`, 'gi');
	  const regexUserMethods = new RegExp(`\\b(${docMethods.join('|')})\\b`, 'gi');
	  const decorationsAttr = [];
	  let match;

	  // Decorate custom User Functions
	  while ((match = regexUserFuncs.exec(text)) !== null) {
		  const startPos = editor.document.positionAt(match.index);
		  const endPos = editor.document.positionAt(match.index + match[0].length);
		  const lineStartPos = new vscode.Position(startPos.line, 0);
		  const lineText = editor.document.getText(new vscode.Range(lineStartPos, startPos)).trim();
		  if (lineText.startsWith('//') || lineText.startsWith('{')) { continue; } // Skip matches on commented lines

		  const styledString = ` &nbsp; <span style="color:#fff;background-color:#666;">&nbsp;${match[0]}&nbsp;</span>`;
		  const markdownText = new vscode.MarkdownString(`&nbsp;$(symbol-function)`);
		  markdownText.supportHtml = true;
		  markdownText.appendMarkdown(styledString);
		  markdownText.appendText(`  (user function)\n`);
		  markdownText.appendMarkdown(`\n`);
		  markdownText.isTrusted = true; 
		  markdownText.supportThemeIcons = true;
		  
		  decorationsAttr.push({ 
			  range: new vscode.Range(startPos, endPos), 
			  hoverMessage: markdownText 
		  });
	  }

	  // Decorate custom User Methods
	  while ((match = regexUserMethods.exec(text)) !== null) {
		const startPos = editor.document.positionAt(match.index);
		const endPos = editor.document.positionAt(match.index + match[0].length);
		const lineStartPos = new vscode.Position(startPos.line, 0);
		const lineText = editor.document.getText(new vscode.Range(lineStartPos, startPos)).trim();
		if (lineText.startsWith('//') || lineText.startsWith('{')) { continue; } // Skip matches on commented lines

		const styledString = ` &nbsp; <span style="color:#fff;background-color:#666;">&nbsp;${match[0]}&nbsp;</span>`;
		const markdownText = new vscode.MarkdownString(`&nbsp;$(symbol-method)`);
		markdownText.supportHtml = true;
		markdownText.appendMarkdown(styledString);
		markdownText.appendText(`  (user method)\n`);
		markdownText.appendMarkdown(`\n`);
		markdownText.isTrusted = true; 
		markdownText.supportThemeIcons = true;
		
		decorationsAttr.push({ 
			range: new vscode.Range(startPos, endPos), 
			hoverMessage: markdownText 
		});
	}

	editor.setDecorations(usr_func_decorationType, decorationsAttr);
  };


  const triggerUpdateDecorations = (editor) => {
	  if (timeout) {
		  clearTimeout(timeout);
	  }
	  timeout = setTimeout(() => updateDecorations(editor), 500);
  };

  
  // Register completion provider
  const completionProvider = vscode.languages.registerCompletionItemProvider(
	{ scheme: 'file', language: 'easylanguage' }, {

		provideCompletionItems(document, position, token, context) {
			// Custom keywords from the Trie
			const allKeywords = trie.getAllWords();
			const customKeywords = allKeywords.map((keyword) => {

				let itemKind = vscode.CompletionItemKind.Function;
				let itemKindDetail = ``;

				// Check if keyword exists in attributesMap (case-insensitive) and pull attribute
				let keyword_attributeValue = null;
				for (const [keyword_map, attribute] of attributesMap.entries()) {
					if (keyword_map.toLowerCase() === keyword.toLowerCase()) {
						keyword_attributeValue = attribute;
						break;
					}
				}                     

				if (keyword_attributeValue === 'function') { itemKind = vscode.CompletionItemKind.Function; itemKindDetail = `function` }
				else if (keyword_attributeValue === 'class') { itemKind = vscode.CompletionItemKind.Class; itemKindDetail = `class` }
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
			const methodRegex = /^Method\s+(\w+)\s+(\w+)\s*\(/i;    // Case-insensitive method detection
			const documentVariables = new Map();
			const documentMethods = new Map();

			let commentsON = false;

			lines.forEach(line => {

				if (line.trim().startsWith('//') ) { return; }              // ignore comment lines
				if (line.trim().startsWith('{'))   { commentsON = true;  }	// ignore comment lines
				if (line.trim().includes('}'))     { commentsON = false; }
				if (commentsON)                    { return; }              // ignore comment lines
	  
				let match;

				if ((match = methodRegex.exec(line)) !== null) {
					// Extract Methods first
					const returnType = match[1];
					const methodName = match[2];
					if (!documentMethods.has(methodName)) {
						const item = new vscode.CompletionItem(methodName, vscode.CompletionItemKind.Method);
						item.detail = `method returns: ${returnType}`; // Explicit Method return type
						documentMethods.set(methodName, item);
					}
				} else {
					// Extract variables only if not already identified as Methods
					const methodNames = Array.from(documentMethods.keys());
					while ((match = variableRegex.exec(line)) !== null) {
						const variable = match[1];
						if (!documentVariables.has(variable) && !methodNames.includes(variable)) {
							const item = new vscode.CompletionItem(variable, vscode.CompletionItemKind.Variable);
							item.detail = `variable`;
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
		console.log('[RTT EasyLanguage] Custom user function keywords style updated from vsCode settings');

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
// Function to Deactivate the extension
function deactivate() {}



//////////////////////////////////
// Exports
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
			
			let cursor_word = document.getText(wordRange);
			const lineText = document.lineAt(position).text.trim();

			if (lineText.startsWith('//') || lineText.startsWith('{')) { return; } // Skip matches on commented lines

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
}
