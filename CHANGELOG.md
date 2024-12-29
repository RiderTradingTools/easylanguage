# Change Log

All notable changes to the "EasyLanguage" extension will be documented in this file.


## 1.0.1

- Initial release with syntax, themes, and simple auto complete.


## 1.0.2

- Added missing keywords and classes (in both language syntax and auto-complete). 
- Modified themes - unified and updated for the missing keywords and classes. 
- Updated snippets. 


## 1.0.3 
- Fixed error in snippets. 


## 1.0.4
 - Added support for **#region** sections. 
 - Updated themes for regions.
 - Fixed error in syntax of keywords.


## 1.0.5
 - Fixed issue in the Outline generation of Method.


## 1.0.6
 - Fixed Outline and folding sections to work with **Sticky Scroll**: 
   - Suggest setting `"editor.stickyScroll.defaultModel"` to `"foldingProviderModel"`. 
 - Fixed Outline when code line is a comment. 
 - Incorporated auto-indentation / de-indentation. 
 - Included additional keywords. 


## 1.0.7
 - Added support for file extension **.el** and **.elf** for MultiCharts PowerLanguage compatibility.


## 1.0.8
 - Fixed the **Plot** and **Plot1-99** keywords regex match compared to PlotClickEventArgs, PlotPaintBar, PlotPB, PlotVisualElement.
 

## 1.0.9
 - Fixed the **Range** function keyword.
 

## 2.0.1  <i> &nbsp; Major update </i>
  - Hovering over keywords reveals EasyLanguage definitions from help.tradestation.com.
  - Auto-complete for the EasyLanguage classes, functions, reserved keywords, and enumerations.
  - Better syntax highlighting for all EasyLanguage keywords.
  - Ability to add custom User Functions so they are highlighted, with capability to modify the font styling.
  - Fixed the Code Outline to handle Begin/End blocks within Methods, and handle multi-line comment blocks. 
  - Updated color themes.
 

## 2.0.2
  - Added 'Espresso' theme.
  - Fixed a issue with refreshing outline when large chunks of code is removed or added.
  - Cleaned up few mismatched keywords in syntax.
 

## 2.0.3
  - Fixed issue with syntax highlighting of user functions and user methods when large chunks of code is removed or added. 
  - For clarity added file extension **.eslfunc** to distinctly show function files in Explorer panel. 
