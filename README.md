
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
&nbsp; &nbsp; &nbsp; &nbsp;             "label": "easylanguage web help",   <br>
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
&nbsp; &nbsp;                 "args": "easylanguage web help",   <br>
&nbsp; &nbsp;                 "when": "editorHasSelection"   <br>
}   <br>
</code>


<br>

## Release Notes

 - Version *1.0.1* &nbsp; - Intial release.  
 - Version *1.0.2* &nbsp; - Added missing keywords and classes (in syntax and auto-complete). Modified themes. Updated snippets. 
 - Version *1.0.3* &nbsp; - Fixed error in snippets. 
 - Version *1.0.4* &nbsp; - Added support for #region sections. Updated themes for regions. Fixed error in syntax of keywords. 
 - Version *1.0.5* &nbsp; - Fixed issue in the Outline generation method.
 - Version *1.0.6* &nbsp; - Fixed Outline and folding sections to work with Sticky Scroll (for 'editor.stickyScroll.defaultModel', suggest using 'foldingProviderModel'). Fixed Outline when line is a comment. Incorporated auto-indentation / de-indentation. Included additional keywords. 
 - Version *1.0.7* &nbsp; - Added support for file extension .el and .elf for MultiCharts PowerLanguage compatibility
 - Version *1.0.8* &nbsp; - Fixed the Plot and Plot1-99 keywords regex match compared to PlotClickEventArgs, PlotPaintBar, PlotPB, PlotVisualElement


<br>
<br>
<br>


---
#### Disclaimer
Not affiliated in any way, shape or form (other than a client) of TradeStation or TradeStation Group, Inc.
