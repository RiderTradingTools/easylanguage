
<p align="center"> <img src="https://ridertradingtools.com/images/easylanguage/ts_dev_env_icon.png" alt="easylanguage logo"> </p>
<h1  align="center"> EasyLanguage Support </h1> 

### Adds syntax support for EasyLanguage in Visual Studio Code. 

### <em>Why?</em>
Because the TradeStation development environment lacks the excellent features and usability of Visual Studio Code!

<br><br>


# <strong>Features</strong>

## Syntax Highlighting
  - Reserved Keywords
  - Functions
  - Custom User Functions
  - Classes
  - Skip Words
  - Strings
  - Comments
  - Numbers


## EasyLanguage Definition Pop-up
Hovering over keywords reveals EasyLanguage definitions from help.tradestation.com.

<img src="https://ridertradingtools.com/images/easylanguage/hover-over-definitions.gif" width="1000" alt="hover reveals easylanguage definition">  


## Keyword Auto Complete
Auto-complete for the EasyLanguage classes, functions, reserved keywords, and enumerations.

<img src="https://ridertradingtools.com/images/easylanguage/auto-complete.gif" width="1000" alt="easylanguage auto-complete">  


## Highlight Custom User Functions
Ability to add custom User Functions so they are highlighted, with capability to modify the font styling.

<img src="https://ridertradingtools.com/images/easylanguage/user-function-styling.gif" width="1000" alt="easylanguage add custom user functions">  


## Code Outline
View the Code Outline showing sections/symbols.

<img src="https://ridertradingtools.com/images/easylanguage/example-code-outline.gif" width="1000" alt="easylanguage code outline">  


## Color Themes
Several custom color themes to choose from: &nbsp; Standard, &nbsp;Solarized, &nbsp;Dark, &nbsp;Moss

<a href="https://ridertradingtools.com/images/easylanguage/standard_theme.png" target="_blank"><img src="https://ridertradingtools.com/images/easylanguage/standard_theme.png" width="400" /></a><a href="https://ridertradingtools.com/images/easylanguage/solarized_theme.png" target="_blank"><img src="https://ridertradingtools.com/images/easylanguage/solarized_theme.png" width="400" /><a href="https://ridertradingtools.com/images/easylanguage/dark_theme.png" target="_blank"><img src="https://ridertradingtools.com/images/easylanguage/dark_theme.png" width="400" /></a><a href="https://ridertradingtools.com/images/easylanguage/moss_theme.png" target="_blank"><img src="https://ridertradingtools.com/images/easylanguage/moss_theme.png" width="400" /></a>

## Snippets
  - if
  - for loop
  - while loop
  - begin...end
  - highest, lowest
  - cross
  - Day Trade
  - others  


<br><br><br>

# <strong>File Extension</strong>

Supported file extension for code files:
- &nbsp; <strong><code>.easylanguage</code></strong>
- &nbsp; <strong><code>.el</code></strong>
- &nbsp; <strong><code>.elf</code></strong>

<br><br><br>

# <strong>Suggested Settings</strong>

For auto-complete, to assist in completion and set priority of completion, you may find these settings useful:  
- Set in your preferences settings:  <br>
<code>  
"editor.snippetSuggestions": "bottom",  <br>
"editor.suggest.localityBonus": true,  <br>
"editor.suggest.filterGraceful": true,  <br>
"editor.suggest.snippetsPreventQuickSuggestions": true,  <br>
"editor.autoIndent":"advanced",  <br>
</code>

<br>  

You can create a Task to launch TradeStation web help:  
- Create a Task, such as:  
<code> 
{   <br>
&nbsp; &nbsp; // See https://go.microsoft.com/fwlink/?LinkId=733558    <br>
&nbsp; &nbsp; // for the documentation about the tasks.json format    <br>
&nbsp; &nbsp; "version": "2.0.0",   <br>
&nbsp; &nbsp; "tasks": [{   <br>
&nbsp; &nbsp; &nbsp; &nbsp;             // launch TradeStation web help, and search on reserved word   <br>
&nbsp; &nbsp; &nbsp; &nbsp;             "label": "EasyLanguage web help",   <br>
&nbsp; &nbsp; &nbsp; &nbsp;             "type": "shell",   <br>
&nbsp; &nbsp; &nbsp; &nbsp;             "presentation": {   <br>
&nbsp; &nbsp; &nbsp; &nbsp;&nbsp; &nbsp;                  "echo": false,   <br>
&nbsp; &nbsp; &nbsp; &nbsp;&nbsp; &nbsp;                  "reveal": "silent",   <br>
&nbsp; &nbsp; &nbsp; &nbsp;&nbsp; &nbsp;                  "focus": false,   <br>
&nbsp; &nbsp; &nbsp; &nbsp;&nbsp; &nbsp;                  "panel": "shared",   <br>
&nbsp; &nbsp; &nbsp; &nbsp;&nbsp; &nbsp;                  "showReuseMessage": false   <br>
&nbsp; &nbsp; &nbsp; &nbsp;             },   <br>
&nbsp; &nbsp; &nbsp; &nbsp;             "command": "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",   <br>
&nbsp; &nbsp; &nbsp; &nbsp;             "args": [   <br>
&nbsp; &nbsp; &nbsp; &nbsp;&nbsp; &nbsp;                  "https://help.tradestation.com/10_00/eng/tsdevhelp/search.htm?q=${selectedText}"   <br>
&nbsp; &nbsp; &nbsp; &nbsp;             ],   <br>
&nbsp; &nbsp; &nbsp; &nbsp;             "problemMatcher": []   <br>
&nbsp; &nbsp; }]   <br>
}   <br>
</code>

- Then create a keyboard shortcut (key binding in <code>keybindings.json</code>) and map a key (such as F1) to the Task to quickly launch help. &nbsp; <em>(double-click to select a keyword, then press the shortcut key.)</em> &nbsp; Here's an example keybinding:  
<code> 
{ <br>
&nbsp; &nbsp;                 "key": "f1",   <br>
&nbsp; &nbsp;                 "command": "workbench.action.tasks.runTask",   <br>
&nbsp; &nbsp;                 "args": "EasyLanguage web help",   <br>
&nbsp; &nbsp;                 "when": "editorHasSelection"   <br>
}   <br>
</code>


<br><br>

# <strong>Appreciation</strong>
This extension is free!  &nbsp;  If you enjoy it and <strong>want to support the work - [please consider making a donation](https://ridertradingtools.com/product/donation/)</strong>.  &nbsp; <i>Thank you!</i>


<br><br>

# <strong>Release Notes</strong>
*(see CHANGELOG for additional details)*
 - Version *1.0.1* &nbsp; - Initial release.  
 - Version *1.0.2* &nbsp; - Added missing keywords and classes. Modified themes. Updated snippets. 
 - Version *1.0.3* &nbsp; - Fixed error in snippets. 
 - Version *1.0.4* &nbsp; - Added support for #region sections. Updated themes for regions. Fixed error in syntax of keywords. 
 - Version *1.0.5* &nbsp; - Fixed issue in the Outline generation method.
 - Version *1.0.6* &nbsp; - Fixed Outline and folding sections to work with Sticky Scroll. Fixed Outline when line is a comment. Included additional keywords. 
 - Version *1.0.7* &nbsp; - Added support for file extension .el and .elf for MultiCharts PowerLanguage compatibility.
 - Version *1.0.8* &nbsp; - Fixed the Plot and Plot1-99 keywords regex.
 - Version *1.0.9* &nbsp; - Fixed the Range function keyword.
 - Version *2.0.1* &nbsp; - Major update! 
    - Hovering over keywords reveals EasyLanguage definitions from help.tradestation.com.
    - Auto-complete for the EasyLanguage classes, functions, reserved keywords, and enumerations.
    - Better syntax highlighting for all EasyLanguage keywords.
    - Ability to add custom user functions so they are highlighted, with editable font styling.
    - Fixed code outline to handle Begin/End blocks within Methods, and handle multi-line comment blocks. 


<br>
<br>
<br>


---
### <strong>Disclaimer</strong>
Not affiliated in any way, shape or form (other than a client) of TradeStation or TradeStation Group, Inc.
