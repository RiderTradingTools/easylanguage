
<p align="center"> <img src="https://ridertradingtools.com/images/easylanguage/ts_dev_env_icon.png" alt="easylanguage logo"> </p>
<h1  align="center"> easylanguage support </h1> 

### Adds syntax support for easylanguage in Visual Studio Code. 

### <em>Why?</em>
Because the TradeStation development environment lacks the excellent features and usability of Visual Studio Code!

<br>

# Features

- Syntax Highlighting
  - Strings
  - Comments
  - Numbers
  - Skip words
  - Control
  - Orders
  - and majority of the reserved words and functions
- Code Outline
  - Outline view of code sections/symbols
- Simple Auto Complete
  - basic auto-complete of numerous reserved words and function names
- Themes
   - 2 light themes:
     - Standard (TradeStation development environment)
     - Solarized
   - 2 dark themes:
     - Dark 
     - Moss
- Auto Closing
  - brackets
  - begin..end
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
  

<br>

# Screenshots

<img src="https://ridertradingtools.com/images/easylanguage/screenshot_standard_theme.png" alt="easylanguage sample screenshot" width="80%">  

## Themes

- Standard theme  
<img src="https://ridertradingtools.com/images/easylanguage/screenshot_standard_theme.png" width="80%">    

- Solarized theme  
<img src="https://ridertradingtools.com/images/easylanguage/screenshot_solarized_theme.png" width="80%">    

- Dark theme  
<img src="https://ridertradingtools.com/images/easylanguage/screenshot_dark_theme.png" width="80%">    

- Moss theme  
<img src="https://ridertradingtools.com/images/easylanguage/screenshot_moss_theme.png" width="80%">    


## Side-by-Side Screenshots

- Standard theme
<img src="https://ridertradingtools.com/images/easylanguage/side-by-side_1__(standard_theme).png">  

- Solarized theme
<img src="https://ridertradingtools.com/images/easylanguage/side-by-side_2__(solarized_theme).png">  

- Dark theme
<img src="https://ridertradingtools.com/images/easylanguage/side-by-side_3__(dark_theme).png">  

- Moss theme
<img src="https://ridertradingtools.com/images/easylanguage/side-by-side_4b__(moss_theme).png">  


## File Extension

Supported file extension for code files: &nbsp; <strong><code>.easylanguage</code></strong>

<br>  

## Suggested Settings

For auto-complete, to assist in completion and set priority of completion, you may find these settings useful:  
- Set in your preferences settings:  
<code>
"editor.snippetSuggestions": "bottom",  
"editor.suggest.localityBonus": true,  
"editor.suggest.filterGraceful": true,  
"editor.suggest.snippetsPreventQuickSuggestions": true,  
"editor.autoIndent":"advanced",  
</code>

<br>  

You can create a Task to launch TradeStation web help:  
- Create a Task, such as:  
<code>
{  
&nbsp; &nbsp; // See https://go.microsoft.com/fwlink/?LinkId=733558   
&nbsp; &nbsp; // for the documentation about the tasks.json format   
&nbsp; &nbsp; "version": "2.0.0",  
&nbsp; &nbsp; "tasks": [{  
&nbsp; &nbsp; &nbsp; &nbsp;             // launch tradestation web help, and search on reserved word  
&nbsp; &nbsp; &nbsp; &nbsp;             "label": "easylanguage web help",  
&nbsp; &nbsp; &nbsp; &nbsp;             "type": "shell",  
&nbsp; &nbsp; &nbsp; &nbsp;             "presentation": {  
&nbsp; &nbsp; &nbsp; &nbsp;&nbsp; &nbsp;                  "echo": false,  
&nbsp; &nbsp; &nbsp; &nbsp;&nbsp; &nbsp;                  "reveal": "silent",  
&nbsp; &nbsp; &nbsp; &nbsp;&nbsp; &nbsp;                  "focus": false,  
&nbsp; &nbsp; &nbsp; &nbsp;&nbsp; &nbsp;                  "panel": "shared",  
&nbsp; &nbsp; &nbsp; &nbsp;&nbsp; &nbsp;                  "showReuseMessage": false  
&nbsp; &nbsp; &nbsp; &nbsp;             },  
&nbsp; &nbsp; &nbsp; &nbsp;             "command": "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",  
&nbsp; &nbsp; &nbsp; &nbsp;             "args": [  
&nbsp; &nbsp; &nbsp; &nbsp;&nbsp; &nbsp;                  "https://help.tradestation.com/10_00/eng/tsdevhelp/search.htm?q=${selectedText}"  
&nbsp; &nbsp; &nbsp; &nbsp;             ],  
&nbsp; &nbsp; &nbsp; &nbsp;             "problemMatcher": []  
&nbsp; &nbsp; }]  
}  
</code>

- Then create a keyboard shortcut (key binding in <code>keybindings.json</code>) and map a key (such as F1) to the Task to quickly launch help. &nbsp; <em>(select a keyword, press the shortcut key.)</em> &nbsp; Here's an example keybinding:  
<code>
{  
&nbsp; &nbsp;                 "key": "f1",  
&nbsp; &nbsp;                 "command": "workbench.action.tasks.runTask",  
&nbsp; &nbsp;                 "args": "easylanguage web help",  
&nbsp; &nbsp;                 "when": "editorHasSelection"  
}  
</code>


<br>

## Release Notes

 - Version *1.0.1* - intial release.  

<br>
<br>
<br>


---
#### Disclaimer
Not affiliated in any way, shape or form (other than a client) of TradeStation.

