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
 <img src="https://ridertradingtools.com/images/easylanguage/example-hover.gif" width="50%" alt="hover reveals easylanguage definition">  
 - Better syntax highlighting for all EasyLanguage keywords.
 - Auto-complete for the EasyLanguage classes, functions, reserved keywords, and enumerations.
 <img src="https://ridertradingtools.com/images/easylanguage/auto-complete.gif" width="50%" alt="easylanguage auto-complete">  
 - Fixed code outline to handle Begin/End blocks within Methods, and handle multi-line comment blocks.
 <img src="https://ridertradingtools.com/images/easylanguage/example-code-outline.gif" width="50%" alt="easylanguage code outline">  
 - Include custom user functions so they get highlighted, with capability to modify styling.
 <img src="https://ridertradingtools.com/images/easylanguage/user-function-styling.gif" width="50%" alt="easylanguage add custom user functions">  
