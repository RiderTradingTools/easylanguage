# Change Log

All notable changes to the "easylanguage" extension will be documented in this file.


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
 

## 2.0.1
 - Added syntax highlighting for Methods and user functions: 
   - Keywords starting with `_` character will be highlighted as Methods/Functions
   - For example:  `_GetColorFromInteger()` will be highlighted.
 - Fixed Outline to handle Begin/End blocks within Methods.
 - Fixed Outline to handle multi-line comment blocks. 
 <img src="https://ridertradingtools.com/images/easylanguage/1.1.0__highlights.png">  