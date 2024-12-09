
<p align="center"> <img src="https://ridertradingtools.com/images/easylanguage/ts_dev_env_icon.png" alt="easylanguage logo"> </p>
<h1  align="center"> EasyLanguage Support </h1> 

### Adds syntax support for EasyLanguage in Visual Studio Code. 

### <em>Why?</em>
Because the TradeStation development environment lacks the excellent features and usability of Visual Studio Code!

<br>

# Feature Overview

- Syntax Highlighting
  - Reserved Keywords
  - Functions
  - Custom User Functions
  - Classes
  - Skip Words
  - Strings
  - Comments
  - Numbers
- **EasyLanguage Keyword Definitions** &nbsp; <i>( new! )</i>
  - Hovering will reveal the EasyLanguage definitions from help.tradestation.com
- **Auto Complete** &nbsp; <i>( new! )</i>
  - Auto-complete of EasyLanguage reserved keywords, classes, functions, enumerations
- **Custom User Functions** &nbsp; <i>( new! )</i> 
  - Include custom user functions so they get highlighted, with capability to modify styling.
- **Code Outline** &nbsp; <i>( updated )</i>
  - Outline view of code sections/symbols
- **Themes** &nbsp; <i>( updated )</i>
   - 2 light themes:
     - Standard (TradeStation development environment)
     - Solarized
   - 2 dark themes:
     - Dark 
     - Moss
- Auto Closing
  - brackets
  - begin ... end
  - quotes
- Snippets
  - if
  - for loop
  - while loop
  - begin..end
  - highest, lowest
  - cross
  - Day Trade
  - others  
  

<br><br>

# Features

## EasyLanguage definitions
Hovering over keywords reveals EasyLanguage definitions from help.tradestation.com.

<img src="https://ridertradingtools.com/images/easylanguage/hover-over-definitions.gif" alt="hover reveals easylanguage definition">  


## Auto Complete
Auto-complete for the EasyLanguage classes, functions, reserved keywords, and enumerations.

<img src="https://ridertradingtools.com/images/easylanguage/auto-complete.gif" alt="easylanguage auto-complete">  


## Include Custom User Functions
Include custom user functions so they get highlighted, with capability to modify styling.

<img src="https://ridertradingtools.com/images/easylanguage/user-function-styling.gif" alt="easylanguage add custom user functions">  


## Code Outline
View the Code Outline showing sections/symbols.

<img src="https://ridertradingtools.com/images/easylanguage/example-code-outline.gif" alt="easylanguage code outline">  


## Themes
Several custom color themes to chose from.

<img src="https://ridertradingtools.com/images/easylanguage/example-themes.gif" alt="easylanguage themes">  

- Standard theme -- extends the TradeStation development environment colors
<img src="https://ridertradingtools.com/images/easylanguage/screenshot_standard_theme.png" width="50%">    

- Solarized theme  
<img src="https://ridertradingtools.com/images/easylanguage/screenshot_solarized_theme.png" width="50%">    

- Dark theme  
<img src="https://ridertradingtools.com/images/easylanguage/screenshot_dark_theme.png" width="50%">    

- Moss theme  
<img src="https://ridertradingtools.com/images/easylanguage/screenshot_moss_theme.png" width="50%">    


<br><br>

# File Extension

Supported file extension for code files:
- &nbsp; <strong><code>.easylanguage</code></strong>
- &nbsp; <strong><code>.el</code></strong>
- &nbsp; <strong><code>.elf</code></strong>

<br>  

## Suggested Settings

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
&nbsp; &nbsp; &nbsp; &nbsp;             // launch tradestation web help, and search on reserved word   <br>
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

# Release Notes
*(see CHANGELOG for additional details and screenshots)*
 - Version *1.0.1* &nbsp; - Intial release.  
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
    - Ability to add custom user functions so they are highlighted as well; with editable font styling.
    - Fixed code outline to handle Begin/End blocks within Methods, and handle multi-line comment blocks. 

<br>
<br>
<br>
<br>

---
### Disclaimer
Not affiliated in any way, shape or form (other than a client) of TradeStation or TradeStation Group, Inc.
