const vscode = require('vscode');
const fs = require('fs');

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

// VS Code extension activate function
async function activate(context) {
    const trie = new Trie();
    const file1Path = context.asAbsolutePath('file1.txt'); // Path to the first file
    const file2Path = context.asAbsolutePath('file2.txt'); // Path to the second file

    // Register hover provider
    registerHoverProvider();

    // Load attribute-keyword pairs from file1.txt
    const attributesMap = await loadAttributeKeywordsFromFile(file1Path);
    const reserved_keywords = Array.from(attributesMap.keys()); // Extract only keywords for highlighting

    // Load keywords from file2.txt
    const user_func_keywords = await loadKeywordsFromFile(file2Path);

    // Insert all keywords into the Trie
    reserved_keywords.forEach((keyword) => trie.insert(keyword));
    user_func_keywords.forEach((keyword) => trie.insert(keyword));
    console.log('Trie initialized with keywords from both files.');

    // Decoration types for highlighting
    // const esl_lang_decorationType = vscode.window.createTextEditorDecorationType({
    //   light: {    // used in light color themes

    //   },
    //   dark: {   // used in dark color themes
    //     backgroundColor: 'rgba(135, 206, 250, 0.08)' // Light Blue
    //   }
    // });

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
function registerHoverProvider() {
  vscode.languages.registerHoverProvider('easylanguage', {
      provideHover(document, position, token) {
          const wordRange = document.getWordRangeAtPosition(position);
          if (!wordRange) {
              return; // No word under the cursor
          }
          const word = document.getText(wordRange);
          
          // List of easylanguage keywords (defined in tmlanguage.json)
          const customKeywords = {
            'ab_addcell':'AB_AddCell  :  reserved word',
            'ab_getcellchar':'AB_GetCellChar  :  reserved word',
            'ab_getcellcolor':'AB_GetCellColor  :  reserved word',
            'ab_getcelldate':'AB_GetCellDate  :  reserved word',
            'ab_getcelltime':'AB_GetCellTime  :  reserved word',
            'ab_getcellvalue':'AB_GetCellValue  :  reserved word',
            'ab_getnumcells':'AB_GetNumCells  :  reserved word',
            'ab_getzonehigh':'AB_GetZoneHigh  :  reserved word',
            'ab_getzonelow':'AB_GetZoneLow  :  reserved word',
            'ab_high':'AB_High  :  reserved word',
            'ab_low':'AB_Low  :  reserved word',
            'ab_removecell':'AB_RemoveCell  :  reserved word',
            'ab_rowheight':'AB_RowHeight  :  reserved word',
            'ab_setactivecell':'AB_SetActiveCell  :  reserved word',
            'ab_setrowheight':'AB_SetRowHeight  :  reserved word',
            'ab_setzone':'AB_SetZone  :  reserved word',
            'abort':'Abort  :  reserved word',
            'above':'Above  :  reserved word',
            'absvalue':'AbsValue  :  reserved word',
            'activitydata':'ActivityData  :  reserved word',
            'addtomoviechain':'AddToMovieChain  :  reserved word',
            'ago':'Ago  :  reserved word',
            'alert':'Alert  :  reserved word',
            'alertenabled':'AlertEnabled  :  reserved word',
            'all':'All  :  reserved word',
            'arctangent':'Arctangent  :  reserved word',
            'argb':'ARGB  :  reserved word',
            'array':'Array  :  reserved word',
            'array_compare':'Array_Compare  :  reserved word',
            'array_copy':'Array_Copy  :  reserved word',
            'array_getmaxindex':'Array_GetMaxIndex  :  reserved word',
            'array_gettype':'Array_GetType  :  reserved word',
            'array_setmaxindex':'Array_SetMaxIndex  :  reserved word',
            'array_setvalrange':'Array_SetValRange  :  reserved word',
            'array_sort':'Array_Sort  :  reserved word',
            'array_sum':'Array_Sum  :  reserved word',
            'arraysize':'ARRAYSIZE  :  reserved word',
            'arraystartaddr':'ARRAYSTARTADDR  :  reserved word',
            'ask':'ASK  :  reserved word',
            'askdate':'AskDate  :  reserved word',
            'askdateex':'AskDateEX  :  reserved word',
            'askexch':'AskExch  :  reserved word',
            'asksize':'AskSize  :  reserved word',
            'asktime':'AskTime  :  reserved word',
            'asktimeex':'AskTimeEX  :  reserved word',
            'asset':'ASSET  :  reserved word',
            'assettype':'ASSETTYPE  :  reserved word',
            'assetvolatility':'ASSETVOLATILITY  :  reserved word',
            'astype':'AsType  :  reserved word',
            'at$':'At$  :  reserved word',
            'atcommentarybar':'AtCommentaryBar  :  reserved word',
            'autosession':'AUTOSESSION  :  reserved word',
            'avgbarseventrade':'AvgBarsEvenTrade  :  reserved word',
            'avgbarslostrade':'AvgBarsLosTrade  :  reserved word',
            'avgbarswintrade':'AvgBarsWinTrade  :  reserved word',
            'avgentryprice':'AvgEntryPrice  :  reserved word',
            'avglist':'AvgList  :  reserved word',
            'bar':'Bar  :  reserved word',
            'bardatetime':'BarDateTime  :  reserved word',
            'barinterval':'BarInterval  :  reserved word',
            'bars':'Bars  :  reserved word',
            'barssinceentry':'BarsSinceEntry  :  reserved word',
            'barssinceexit':'BarsSinceExit  :  reserved word',
            'barstatus':'BarStatus  :  reserved word',
            'bartype':'BarType  :  reserved word',
            'basecurrency':'BaseCurrency  :  reserved word',
            'below':'Below  :  reserved word',
            'beta':'Beta  :  reserved word',
            'beta_down':'Beta_Down  :  reserved word',
            'beta_up':'Beta_Up  :  reserved word',
            'bid':'BID  :  reserved word',
            'biddate':'BidDate  :  reserved word',
            'biddateex':'BidDateEX  :  reserved word',
            'biddirectionnnm':'BidDirectionNNM  :  reserved word',
            'bidexch':'BidExch  :  reserved word',
            'bidsize':'BidSize  :  reserved word',
            'bidtime':'BidTime  :  reserved word',
            'bidtimeex':'BidTimeEX  :  reserved word',
            'bigpointvalue':'BigPointValue  :  reserved word',
            'black':'Black  :  reserved word',
            'blocknumber':'BlockNumber  :  reserved word',
            'blue':'Blue  :  reserved word',
            'book_val_per_share':'Book_Val_Per_Share  :  reserved word',
            'bool':'BOOL  :  reserved word',
            'boxsize':'BoxSize  :  reserved word',
            'break':'Break  :  reserved word',
            'breakevenstopfloor':'BreakEvenStopFloor  :  reserved word',
            'breakpoint':'BreakPoint  :  reserved word',
            'buy':'Buy  :  reserved word',
            'buytocover':'BuyToCover  :  reserved word',
            'byte':'BYTE  :  reserved word',
            'c':'C  :  reserved word',
            'call':'CALL  :  reserved word',
            'callcount':'CALLCOUNT  :  reserved word',
            'callitmcount':'CALLITMCOUNT  :  reserved word',
            'callopenint':'CallOpenInt  :  reserved word',
            'callotmcount':'CALLOTMCOUNT  :  reserved word',
            'callseriescount':'CALLSERIESCOUNT  :  reserved word',
            'callstrikecount':'CALLSTRIKECOUNT  :  reserved word',
            'callvolume':'CallVolume  :  reserved word',
            'cancel':'Cancel  :  reserved word',
            'catch':'Catch  :  reserved word',
            'category':'Category  :  reserved word',
            'ceiling':'Ceiling  :  reserved word',
            'char':'CHAR  :  reserved word',
            'checkalert':'CheckAlert  :  reserved word',
            'checkcommentary':'CheckCommentary  :  reserved word',
            'cleardebug':'ClearDebug  :  reserved word',
            'clearprintlog':'CLEARPRINTLOG  :  reserved word',
            'close':'Close  :  reserved word',
            'coarse':'COARSE  :  reserved word',
            'commentary':'Commentary  :  reserved word',
            'commentarycl':'CommentaryCL  :  reserved word',
            'commentaryenabled':'CommentaryEnabled  :  reserved word',
            'commission':'Commission  :  reserved word',
            'commoditynumber':'CommodityNumber  :  reserved word',
            'computerdatetime':'ComputerDateTime  :  reserved word',
            'const':'Const  :  reserved word',
            'continue':'Continue  :  reserved word',
            'contract':'Contract  :  reserved word',
            'contractmonth':'ContractMonth  :  reserved word',
            'contractprofit':'ContractProfit  :  reserved word',
            'contracts':'Contracts  :  reserved word',
            'contractsize':'ContractSize  :  reserved word',
            'contractyear':'ContractYear  :  reserved word',
            'cosine':'Cosine  :  reserved word',
            'cost':'COST  :  reserved word',
            'cotangent':'Cotangent  :  reserved word',
            'createleg':'CreateLeg  :  reserved word',
            'cross':'Cross  :  reserved word',
            'current':'Current  :  reserved word',
            'current_ratio':'Current_Ratio  :  reserved word',
            'currentbar':'CurrentBar  :  reserved word',
            'currentcontracts':'CurrentContracts  :  reserved word',
            'currentdate':'CurrentDate  :  reserved word',
            'currententries':'CurrentEntries  :  reserved word',
            'currentopenint':'CurrentOpenInt  :  reserved word',
            'currentshares':'CurrentShares  :  reserved word',
            'currenttime':'CurrentTime  :  reserved word',
            'customerid':'CustomerID  :  reserved word',
            'cyan':'Cyan  :  reserved word',
            'd':'D  :  reserved word',
            'dailyclose':'DailyClose  :  reserved word',
            'dailyhigh':'DailyHigh  :  reserved word',
            'dailylimit':'DailyLimit  :  reserved word',
            'dailylow':'DailyLow  :  reserved word',
            'dailyopen':'DailyOpen  :  reserved word',
            'dailytrades':'DailyTrades  :  reserved word',
            'dailytradesdn':'DailyTradesDN  :  reserved word',
            'dailytradesuc':'DailyTradesUC  :  reserved word',
            'dailytradesup':'DailyTradesUP  :  reserved word',
            'dailyvolume':'DailyVolume  :  reserved word',
            'dailyvolumedn':'DailyVolumeDN  :  reserved word',
            'dailyvolumeuc':'DailyVolumeUC  :  reserved word',
            'dailyvolumeup':'DailyVolumeUp  :  reserved word',
            'darkblue':'DarkBlue  :  reserved word',
            'darkbrown':'DarkBrown  :  reserved word',
            'darkcyan':'DarkCyan  :  reserved word',
            'darkgray':'DarkGray  :  reserved word',
            'darkgreen':'DarkGreen  :  reserved word',
            'darkmagenta':'DarkMagenta  :  reserved word',
            'darkred':'DarkRed  :  reserved word',
            'data':'Data  :  reserved word',
            'datacompression':'DataCompression  :  reserved word',
            'datainunion':'DataInUnion  :  reserved word',
            'date':'Date  :  reserved word',
            'datetimetostring':'DateTimeToString  :  reserved word',
            'datetojulian':'DateToJulian  :  reserved word',
            'datetostring':'DateToString  :  reserved word',
            'day':'Day  :  reserved word',
            'dayfromdatetime':'DayFromDateTime  :  reserved word',
            'dayofmonth':'DayOfMonth  :  reserved word',
            'dayofweek':'DayOfWeek  :  reserved word',
            'dayofweekfromdatetime':'DayOfWeekFromDateTime  :  reserved word',
            'days':'Days  :  reserved word',
            'default':'Default  :  reserved word',
            'definecustfield':'DefineCustField  :  reserved word',
            'definedllfunc':'DEFINEDLLFUNC  :  reserved word',
            'deliverymonth':'DeliveryMonth  :  reserved word',
            'deliveryyear':'DeliveryYear  :  reserved word',
            'delta':'DELTA  :  reserved word',
            'description':'Description  :  reserved word',
            'dividend':'Dividend  :  reserved word',
            'dividend_yield':'Dividend_Yield  :  reserved word',
            'dividendcount':'DividendCount  :  reserved word',
            'dividenddate':'DividendDate  :  reserved word',
            'dividendfreq':'DividendFreq  :  reserved word',
            'dividendtime':'DividendTime  :  reserved word',
            'divyield':'DivYield  :  reserved word',
            'double':'DOUBLE  :  reserved word',
            'doublequote':'DoubleQuote  :  reserved word',
            'downticks':'DownTicks  :  reserved word',
            'downto':'DownTo  :  reserved word',
            'dword':'DWORD  :  reserved word',
            'easylanguageversion':'EasyLanguageVersion  :  reserved word',
            'el_datestr':'EL_DateStr  :  reserved word',
            'eldatetodatetime':'ELDateToDateTime  :  reserved word',
            'eltimetodatetime':'ELTimeToDateTime  :  reserved word',
            'encodedate':'EncodeDate  :  reserved word',
            'encodetime':'EncodeTime  :  reserved word',
            'entry':'Entry  :  reserved word',
            'entrydate':'EntryDate  :  reserved word',
            'entrydatetime':'EntryDateTime  :  reserved word',
            'entryprice':'EntryPrice  :  reserved word',
            'entrytime':'EntryTime  :  reserved word',
            'eps':'EPS  :  reserved word',
            'eps_pchng_y_ago':'EPS_PChng_Y_Ago  :  reserved word',
            'eps_pchng_ytd':'EPS_PChng_YTD  :  reserved word',
            'epscount':'EPSCount  :  reserved word',
            'epsdate':'EPSDate  :  reserved word',
            'epsestimate':'EPSEstimate  :  reserved word',
            'epstime':'EPSTime  :  reserved word',
            'exchlisted':'ExchListed  :  reserved word',
            'execoffset':'ExecOffset  :  reserved word',
            'exitdate':'ExitDate  :  reserved word',
            'exitdatetime':'ExitDateTime  :  reserved word',
            'exitprice':'ExitPrice  :  reserved word',
            'exittime':'ExitTime  :  reserved word',
            'expdate':'ExpDate  :  reserved word',
            'expdateex':'ExpDateEX  :  reserved word',
            'expirationdate':'ExpirationDate  :  reserved word',
            'expirationstyle':'EXPIRATIONSTYLE  :  reserved word',
            'expstyle':'ExpStyle  :  reserved word',
            'expvalue':'ExpValue  :  reserved word',
            'external':'EXTERNAL  :  reserved word',
            'file':'File  :  reserved word',
            'fileappend':'FileAppend  :  reserved word',
            'filedelete':'FileDelete  :  reserved word',
            'finally':'Finally  :  reserved word',
            'fine':'FINE  :  reserved word',
            'firstnoticedate':'FirstNoticeDate  :  reserved word',
            'firstnoticedateex':'FirstNoticeDateEX  :  reserved word',
            'firstoption':'FIRSTOPTION  :  reserved word',
            'float':'FLOAT  :  reserved word',
            'floor':'Floor  :  reserved word',
            'fnd':'FND  :  reserved word',
            'fndex':'FNDEX  :  reserved word',
            'formatdate':'FormatDate  :  reserved word',
            'formattime':'FormatTime  :  reserved word',
            'fracportion':'FracPortion  :  reserved word',
            'freecshflwpershare':'FreeCshFlwPerShare  :  reserved word',
            'friday':'Friday  :  reserved word',
            'future':'FUTURE  :  reserved word',
            'futuretype':'FUTURETYPE  :  reserved word',
            'g_rate_eps_ny':'G_Rate_EPS_NY  :  reserved word',
            'g_rate_nt_in_ny':'G_Rate_Nt_In_NY  :  reserved word',
            'g_rate_p_net_inc':'G_Rate_P_Net_Inc  :  reserved word',
            'gamma':'GAMMA  :  reserved word',
            'getaccount':'GetAccount  :  reserved word',
            'getaccountid':'GetAccountID  :  reserved word',
            'getaccountlotsize':'GetAccountLotSize  :  reserved word',
            'getaccountstatus':'GetAccountStatus  :  reserved word',
            'getaccounttype':'GetAccountType  :  reserved word',
            'getallornone':'GetAllOrNone  :  reserved word',
            'getappinfo':'GetAppInfo  :  reserved word',
            'getbackgroundcolor':'GetBackgroundColor  :  reserved word',
            'getbdaccountequity':'GetBDAccountEquity  :  reserved word',
            'getbdaccountnetworth':'GetBDAccountNetWorth  :  reserved word',
            'getbdcashbalance':'GetBDCashBalance  :  reserved word',
            'getbddaytradingbuyingpower':'GetBDDayTradingBuyingPower  :  reserved word',
            'getbdmarginrequirement':'GetBDMarginRequirement  :  reserved word',
            'getbdovernightbuyingpower':'GetBDOvernightBuyingPower  :  reserved word',
            'getbdtradeequity':'GetBDTradeEquity  :  reserved word',
            'getbuyminussellplus':'GetBuyMinusSellPlus  :  reserved word',
            'getbvalue':'GetBValue  :  reserved word',
            'getcdromdrive':'GetCDRomDrive  :  reserved word',
            'getcountry':'GetCountry  :  reserved word',
            'getcurrency':'GetCurrency  :  reserved word',
            'getdiscretion':'GetDiscretion  :  reserved word',
            'getexchangename':'GetExchangeName  :  reserved word',
            'getfunddata':'GetFundData  :  reserved word',
            'getfunddataasboolean':'GetFundDataAsBoolean  :  reserved word',
            'getfunddataasstring':'GetFundDataAsString  :  reserved word',
            'getfundperiodenddate':'GetFundPeriodEndDate  :  reserved word',
            'getfundpostdate':'GetFundPostDate  :  reserved word',
            'getgvalue':'GetGValue  :  reserved word',
            'getlastfunddataerror':'GetLastFundDataError  :  reserved word',
            'getnondisplay':'GetNonDisplay  :  reserved word',
            'getnow':'GetNOW  :  reserved word',
            'getnumaccounts':'GetNumAccounts  :  reserved word',
            'getnumpositions':'GetNumPositions  :  reserved word',
            'getopenorderinitialmargin':'GetOpenOrderInitialMargin  :  reserved word',
            'getpeg':'GetPeg  :  reserved word',
            'getplotbgcolor':'GetPlotBGColor  :  reserved word',
            'getplotcolor':'GetPlotColor  :  reserved word',
            'getplotwidth':'GetPlotWidth  :  reserved word',
            'getpositionaverageprice':'GetPositionAveragePrice  :  reserved word',
            'getpositionmarketvalue':'GetPositionMarketValue  :  reserved word',
            'getpositionopenpl':'GetPositionOpenPL  :  reserved word',
            'getpositionquantity':'GetPositionQuantity  :  reserved word',
            'getpositionsymbol':'GetPositionSymbol  :  reserved word',
            'getpositiontotalcost':'GetPositionTotalCost  :  reserved word',
            'getrtaccountequity':'GetRTAccountEquity  :  reserved word',
            'getrtaccountnetworth':'GetRTAccountNetWorth  :  reserved word',
            'getrtcashbalance':'GetRTCashBalance  :  reserved word',
            'getrtcostofpositions':'GetRTCostOfPositions  :  reserved word',
            'getrtdaytradingbuyingpower':'GetRTDaytradingBuyingPower  :  reserved word',
            'getrtinitialmargin':'GetRTInitialMargin  :  reserved word',
            'getrtmaintmargin':'GetRTMaintMargin  :  reserved word',
            'getrtmarginrequirement':'GetRTMarginRequirement  :  reserved word',
            'getrtovernightbuyingpower':'GetRTOvernightBuyingPower  :  reserved word',
            'getrtpurchasingpower':'GetRTPurchasingPower  :  reserved word',
            'getrtrealizedpl':'GetRTRealizedPL  :  reserved word',
            'getrttradeequity':'GetRTTradeEquity  :  reserved word',
            'getrtunrealizedpl':'GetRTUnrealizedPL  :  reserved word',
            'getrvalue':'GetRValue  :  reserved word',
            'getscreenname':'GetScreenName  :  reserved word',
            'getshaveimprove':'GetShaveImprove  :  reserved word',
            'getshowonly':'GetShowOnly  :  reserved word',
            'getstrategyname':'GetStrategyName  :  reserved word',
            'getsubscriberonly':'GetSubscriberOnly  :  reserved word',
            'getsymbolname':'GetSymbolName  :  reserved word',
            'getsystemname':'GetSystemName  :  reserved word',
            'gettodaysrttradeequity':'GetTodaysRTTradeEquity  :  reserved word',
            'getuncleareddeposits':'GetUnclearedDeposits  :  reserved word',
            'gr_rate_p_eps':'Gr_Rate_P_EPS  :  reserved word',
            'gradientcolor':'GradientColor  :  reserved word',
            'green':'Green  :  reserved word',
            'grossloss':'GrossLoss  :  reserved word',
            'grossprofit':'GrossProfit  :  reserved word',
            'h':'H  :  reserved word',
            'high':'High  :  reserved word',
            'high52wk':'High52Wk  :  reserved word',
            'higher':'Higher  :  reserved word',
            'histfundexists':'HistFundExists  :  reserved word',
            'hoursfromdatetime':'HoursFromDateTime  :  reserved word',
            'i':'I  :  reserved word',
            'i_avgentryprice':'I_AvgEntryPrice  :  reserved word',
            'i_closedequity':'I_ClosedEquity  :  reserved word',
            'i_currentcontracts':'I_CurrentContracts  :  reserved word',
            'i_currentshares':'I_CurrentShares  :  reserved word',
            'i_marketposition':'I_MarketPosition  :  reserved word',
            'i_openequity':'I_OpenEquity  :  reserved word',
            'ieasylanguageobject':'IEasyLanguageObject  :  reserved word',
            'in':'In  :  reserved word',
            'includesignal':'IncludeSignal  :  reserved word',
            'includesystem':'IncludeSystem  :  reserved word',
            'incmonth':'IncMonth  :  reserved word',
            'infiniteloopdetect':'InfiniteLoopDetect  :  reserved word',
            'initialmargin':'INITIALMARGIN  :  reserved word',
            'input':'Input  :  reserved word',
            'inputs':'Inputs  :  reserved word',
            'insideask':'InsideAsk  :  reserved word',
            'insidebid':'InsideBid  :  reserved word',
            'inst_percent_held':'Inst_Percent_Held  :  reserved word',
            'instr':'InStr  :  reserved word',
            'int':'INT  :  reserved word',
            'intervaltype':'IntervalType  :  reserved word',
            'intportion':'IntPortion  :  reserved word',
            'intrabarordergeneration':'IntraBarOrderGeneration  :  reserved word',
            'intrabarpersist':'IntrabarPersist  :  reserved word',
            'isfunddataavailable':'IsFundDataAvailable  :  reserved word',
            'isvalidfundfield':'IsValidFundField  :  reserved word',
            'ivolatility':'IVolatility  :  reserved word',
            'juliantodate':'JulianToDate  :  reserved word',
            'l':'L  :  reserved word',
            'largestlostrade':'LargestLosTrade  :  reserved word',
            'largestwintrade':'LargestWinTrade  :  reserved word',
            'last':'Last  :  reserved word',
            'last_split_date':'Last_Split_Date  :  reserved word',
            'last_split_fact':'Last_Split_Fact  :  reserved word',
            'lastcalcdatetime':'LastCalcDateTime  :  reserved word',
            'lastcalcjdate':'LastCalcJDate  :  reserved word',
            'lastcalcmmtime':'LastCalcMMTime  :  reserved word',
            'lasttradingdate':'LastTradingDate  :  reserved word',
            'leapyear':'LEAPYear  :  reserved word',
            'leftside':'LeftSide  :  reserved word',
            'leftstr':'LeftStr  :  reserved word',
            'leg':'LEG  :  reserved word',
            'legacycolortorgb':'LegacyColorToRGB  :  reserved word',
            'legacycolorvalue':'LegacyColorValue  :  reserved word',
            'legtype':'LEGTYPE  :  reserved word',
            'lightgray':'LightGray  :  reserved word',
            'limit':'Limit  :  reserved word',
            'livedate':'LiveDate  :  reserved word',
            'livetime':'LiveTime  :  reserved word',
            'log':'Log  :  reserved word',
            'long':'LONG  :  reserved word',
            'longrolladj':'LongRollAdj  :  reserved word',
            'losscf':'LossCF  :  reserved word',
            'low':'Low  :  reserved word',
            'low52wk':'Low52Wk  :  reserved word',
            'lower':'Lower  :  reserved word',
            'lowerstr':'LowerStr  :  reserved word',
            'lpbool':'LPBOOL  :  reserved word',
            'lpbyte':'LPBYTE  :  reserved word',
            'lpdouble':'LPDOUBLE  :  reserved word',
            'lpdword':'LPDWORD  :  reserved word',
            'lpfloat':'LPFLOAT  :  reserved word',
            'lpint':'LPINT  :  reserved word',
            'lplong':'LPLONG  :  reserved word',
            'lpstr':'LPSTR  :  reserved word',
            'lpword':'LPWORD  :  reserved word',
            'ltd':'LTD  :  reserved word',
            'ltdex':'LTDEX  :  reserved word',
            'magenta':'Magenta  :  reserved word',
            'makenewmovieref':'MakeNewMovieRef  :  reserved word',
            'margin':'Margin  :  reserved word',
            'market':'Market  :  reserved word',
            'marketposition':'MarketPosition  :  reserved word',
            'maxbarsback':'MaxBarsBack  :  reserved word',
            'maxbarsforward':'MaxBarsForward  :  reserved word',
            'maxconseclosers':'MaxConsecLosers  :  reserved word',
            'maxconsecwinners':'MaxConsecWinners  :  reserved word',
            'maxcontractprofit':'MaxContractProfit  :  reserved word',
            'maxcontracts':'MaxContracts  :  reserved word',
            'maxcontractsheld':'MaxContractsHeld  :  reserved word',
            'maxentries':'MaxEntries  :  reserved word',
            'maxgain':'MAXGAIN  :  reserved word',
            'maxiddrawdown':'MaxIDDrawDown  :  reserved word',
            'maxlist':'MaxList  :  reserved word',
            'maxlist2':'MaxList2  :  reserved word',
            'maxloss':'MAXLOSS  :  reserved word',
            'maxpositionloss':'MaxPositionLoss  :  reserved word',
            'maxpositionprofit':'MaxPositionProfit  :  reserved word',
            'maxshares':'MaxShares  :  reserved word',
            'maxsharesheld':'MaxSharesHeld  :  reserved word',
            'medium':'MEDIUM  :  reserved word',
            'messagelog':'MessageLog  :  reserved word',
            'midstr':'MidStr  :  reserved word',
            'millisecondsfromdatetime':'MillisecondsFromDateTime  :  reserved word',
            'minlist':'MinList  :  reserved word',
            'minlist2':'MinList2  :  reserved word',
            'minmove':'MinMove  :  reserved word',
            'minutesfromdatetime':'MinutesFromDateTime  :  reserved word',
            'miviterationcount':'MIVIterationCount  :  reserved word',
            'mivonask':'MIVONASK  :  reserved word',
            'mivonbid':'MIVONBID  :  reserved word',
            'mivonclose':'MIVONCLOSE  :  reserved word',
            'mivonrawask':'MIVONRAWASK  :  reserved word',
            'mivonrawbid':'MIVONRAWBID  :  reserved word',
            'mivonrawmid':'MIVonRawMid  :  reserved word',
            'moc':'Moc  :  reserved word',
            'mod':'Mod  :  reserved word',
            'modelposition':'MODELPOSITION  :  reserved word',
            'modelprice':'MODELPRICE  :  reserved word',
            'modelrate':'MODELRATE  :  reserved word',
            'modelrate2':'MODELRATE2  :  reserved word',
            'modelvolatility':'MODELVOLATILITY  :  reserved word',
            'monday':'Monday  :  reserved word',
            'moneymgtstopamt':'MoneyMgtStopAmt  :  reserved word',
            'month':'Month  :  reserved word',
            'monthfromdatetime':'MonthFromDateTime  :  reserved word',
            'multiple':'MULTIPLE  :  reserved word',
            'myself':'MYSELF  :  reserved word',
            'neg':'Neg  :  reserved word',
            'net_profit_margin':'Net_Profit_Margin  :  reserved word',
            'netprofit':'NetProfit  :  reserved word',
            'newline':'NewLine  :  reserved word',
            'newscount':'NewsCount  :  reserved word',
            'next':'Next  :  reserved word',
            'noplot':'NoPlot  :  reserved word',
            'not':'Not  :  reserved word',
            'nthmaxlist':'NthMaxList  :  reserved word',
            'nthminlist':'NthMinList  :  reserved word',
            'null':'Null  :  reserved word',
            'numeric':'Numeric  :  reserved word',
            'numericarray':'NumericArray  :  reserved word',
            'numericarrayref':'NumericArrayRef  :  reserved word',
            'numericref':'NumericRef  :  reserved word',
            'numericseries':'NumericSeries  :  reserved word',
            'numericsimple':'NumericSimple  :  reserved word',
            'numeventrades':'NumEvenTrades  :  reserved word',
            'numfutures':'NUMFUTURES  :  reserved word',
            'numlegs':'NUMLEGS  :  reserved word',
            'numlostrades':'NumLosTrades  :  reserved word',
            'numoptions':'NUMOPTIONS  :  reserved word',
            'numtostr':'NumToStr  :  reserved word',
            'numwintrades':'NumWinTrades  :  reserved word',
            'o':'O  :  reserved word',
            'objectref':'ObjectRef  :  reserved word',
            'objectsimple':'ObjectSimple  :  reserved word',
            'once':'Once  :  reserved word',
            'open':'Open  :  reserved word',
            'openint':'OpenInt  :  reserved word',
            'openpositionprofit':'OpenPositionProfit  :  reserved word',
            'option':'OPTION  :  reserved word',
            'optiontype':'OPTIONTYPE  :  reserved word',
            'out':'Out  :  reserved word',
            'over':'Over  :  reserved word',
            'override':'Override  :  reserved word',
            'pager_defaultname':'Pager_DefaultName  :  reserved word',
            'pager_send':'Pager_Send  :  reserved word',
            'peratio':'PERatio  :  reserved word',
            'percentprofit':'PercentProfit  :  reserved word',
            'playmoviechain':'PlayMovieChain  :  reserved word',
            'playsound':'PlaySound  :  reserved word',
            'plot':'Plot  :  reserved word',
            'plotpaintbar':'PlotPaintBar  :  reserved word',
            'plotpb':'PlotPB  :  reserved word',
            'pm_getcellvalue':'PM_GetCellValue  :  reserved word',
            'pm_getnumcolumns':'PM_GetNumColumns  :  reserved word',
            'pm_getrowheight':'PM_GetRowHeight  :  reserved word',
            'pm_high':'PM_High  :  reserved word',
            'pm_low':'PM_Low  :  reserved word',
            'pm_setcellvalue':'PM_SetCellValue  :  reserved word',
            'pm_sethigh':'PM_SetHigh  :  reserved word',
            'pm_setlow':'PM_SetLow  :  reserved word',
            'pm_setnumcolumns':'PM_SetNumColumns  :  reserved word',
            'pm_setrowheight':'PM_SetRowHeight  :  reserved word',
            'pob':'Pob  :  reserved word',
            'point':'Point  :  reserved word',
            'pointer':'POINTER  :  reserved word',
            'pointvalue':'PointValue  :  reserved word',
            'pos':'Pos  :  reserved word',
            'position':'POSITION  :  reserved word',
            'positionid':'POSITIONID  :  reserved word',
            'positionprofit':'PositionProfit  :  reserved word',
            'positionstatus':'POSITIONSTATUS  :  reserved word',
            'power':'Power  :  reserved word',
            'prevclose':'PrevClose  :  reserved word',
            'prevopenint':'PrevOpenInt  :  reserved word',
            'prevvolume':'PrevVolume  :  reserved word',
            'price_to_book':'Price_To_Book  :  reserved word',
            'pricescale':'PriceScale  :  reserved word',
            'print':'Print  :  reserved word',
            'printer':'Printer  :  reserved word',
            'product':'Product  :  reserved word',
            'profit':'PROFIT  :  reserved word',
            'profitcf':'ProfitCF  :  reserved word',
            'profittargetstop':'ProfitTargetStop  :  reserved word',
            'protective':'PROTECTIVE  :  reserved word',
            'put':'PUT  :  reserved word',
            'putcount':'PUTCOUNT  :  reserved word',
            'putitmcount':'PUTITMCOUNT  :  reserved word',
            'putopenint':'PutOpenInt  :  reserved word',
            'putotmcount':'PUTOTMCOUNT  :  reserved word',
            'putseriescount':'PUTSERIESCOUNT  :  reserved word',
            'putstrikecount':'PUTSTRIKECOUNT  :  reserved word',
            'putvolume':'PutVolume  :  reserved word',
            'q_ask':'q_Ask  :  reserved word',
            'q_askexchange':'q_AskExchange  :  reserved word',
            'q_asksize':'q_AskSize  :  reserved word',
            'q_bid':'q_Bid  :  reserved word',
            'q_bidexchange':'q_BidExchange  :  reserved word',
            'q_bidsize':'q_BidSize  :  reserved word',
            'q_bigpointvalue':'q_BigPointValue  :  reserved word',
            'q_callopenint':'q_CallOpenInt  :  reserved word',
            'q_callvolume':'q_CallVolume  :  reserved word',
            'q_category':'q_Category  :  reserved word',
            'q_close':'q_Close  :  reserved word',
            'q_dailylimit':'q_DailyLimit  :  reserved word',
            'q_date':'q_Date  :  reserved word',
            'q_dateex':'q_DateEX  :  reserved word',
            'q_datelastask':'q_DateLastAsk  :  reserved word',
            'q_datelastaskex':'q_DateLastAskEX  :  reserved word',
            'q_datelastbid':'q_DateLastBid  :  reserved word',
            'q_datelastbidex':'q_DateLastBidEX  :  reserved word',
            'q_datelasttrade':'q_DateLastTrade  :  reserved word',
            'q_downvolume':'q_DownVolume  :  reserved word',
            'q_exchangelisted':'q_ExchangeListed  :  reserved word',
            'q_expirationdate':'q_ExpirationDate  :  reserved word',
            'q_expirationdateex':'q_ExpirationDateEX  :  reserved word',
            'q_high':'q_High  :  reserved word',
            'q_ivolatility':'q_IVolatility  :  reserved word',
            'q_last':'q_Last  :  reserved word',
            'q_lasttradingdate':'q_LastTradingDate  :  reserved word',
            'q_lasttradingdateex':'q_LastTradingDateEX  :  reserved word',
            'q_low':'q_Low  :  reserved word',
            'q_margin':'q_Margin  :  reserved word',
            'q_minmove':'q_MinMove  :  reserved word',
            'q_minutesdelayed':'q_MinutesDelayed  :  reserved word',
            'q_newscount':'q_NewsCount  :  reserved word',
            'q_numoptions':'q_NumOptions  :  reserved word',
            'q_offer':'q_Offer  :  reserved word',
            'q_open':'q_Open  :  reserved word',
            'q_openinterest':'q_OpenInterest  :  reserved word',
            'q_optiontype':'q_OptionType  :  reserved word',
            'q_previousclose':'q_PreviousClose  :  reserved word',
            'q_previousdate':'q_PreviousDate  :  reserved word',
            'q_previousopeninterest':'q_PreviousOpenInterest  :  reserved word',
            'q_previoustime':'q_PreviousTime  :  reserved word',
            'q_previousvolume':'q_PreviousVolume  :  reserved word',
            'q_prevtotalvolume':'q_PrevTotalVolume  :  reserved word',
            'q_putopenint':'q_PutOpenInt  :  reserved word',
            'q_putvolume':'q_PutVolume  :  reserved word',
            'q_strikeprice':'q_StrikePrice  :  reserved word',
            'q_time':'q_Time  :  reserved word',
            'q_timeex':'q_TimeEX  :  reserved word',
            'q_timelastask':'q_TimeLastAsk  :  reserved word',
            'q_timelastaskex':'q_TimeLastAskEX  :  reserved word',
            'q_timelastbid':'q_TimeLastBid  :  reserved word',
            'q_timelastbidex':'q_TimeLastBidEX  :  reserved word',
            'q_timelasttrade':'q_TimeLastTrade  :  reserved word',
            'q_timelasttradeex':'q_TimeLastTradeEX  :  reserved word',
            'q_totalvolume':'q_TotalVolume  :  reserved word',
            'q_tradevolume':'q_TradeVolume  :  reserved word',
            'q_unchangedvolume':'q_UnchangedVolume  :  reserved word',
            'q_upvolume':'q_UpVolume  :  reserved word',
            'q_yield':'q_Yield  :  reserved word',
            'quick_ratio':'Quick_Ratio  :  reserved word',
            'raiseruntimeerror':'RaiseRunTimeError  :  reserved word',
            'random':'Random  :  reserved word',
            'rawask':'RAWASK  :  reserved word',
            'rawbid':'RAWBID  :  reserved word',
            'reciprocal':'Reciprocal  :  reserved word',
            'red':'Red  :  reserved word',
            'regularsession':'REGULARSESSION  :  reserved word',
            'repeat':'Repeat  :  reserved word',
            'ret_on_avg_equity':'Ret_On_Avg_Equity  :  reserved word',
            'return':'Return  :  reserved word',
            'revsize':'RevSize  :  reserved word',
            'rgb':'RGB  :  reserved word',
            'rgbtolegacycolor':'RGBToLegacyColor  :  reserved word',
            'rho':'RHO  :  reserved word',
            'rightside':'RightSide  :  reserved word',
            'rightstr':'RightStr  :  reserved word',
            'round':'Round  :  reserved word',
            'runcommand':'RunCommand  :  reserved word',
            'sametickopt':'SameTickOpt  :  reserved word',
            'saturday':'Saturday  :  reserved word',
            'screen':'Screen  :  reserved word',
            'secondsfromdatetime':'SecondsFromDateTime  :  reserved word',
            'self':'Self  :  reserved word',
            'sell':'Sell  :  reserved word',
            'sellshort':'SellShort  :  reserved word',
            'seriescount':'SERIESCOUNT  :  reserved word',
            'sess1endtime':'Sess1EndTime  :  reserved word',
            'sess1firstbartime':'Sess1FirstBarTime  :  reserved word',
            'sess1starttime':'Sess1StartTime  :  reserved word',
            'sess2endtime':'Sess2EndTime  :  reserved word',
            'sess2firstbartime':'Sess2FirstBarTime  :  reserved word',
            'sess2starttime':'Sess2StartTime  :  reserved word',
            'sessioncount':'SessionCount  :  reserved word',
            'sessioncountms':'SessionCountMS  :  reserved word',
            'sessionendday':'SessionEndDay  :  reserved word',
            'sessionenddayms':'SessionEndDayMS  :  reserved word',
            'sessionendtime':'SessionEndTime  :  reserved word',
            'sessionendtimems':'SessionEndTimeMS  :  reserved word',
            'sessionstartday':'SessionStartDay  :  reserved word',
            'sessionstartdayms':'SessionStartDayMS  :  reserved word',
            'sessionstarttime':'SessionStartTime  :  reserved word',
            'sessionstarttimems':'SessionStartTimeMS  :  reserved word',
            'setallornone':'SetAllOrNone  :  reserved word',
            'setbreakeven':'SetBreakEven  :  reserved word',
            'setbuyminussellplus':'SetBuyMinusSellPlus  :  reserved word',
            'setdiscretion':'SetDiscretion  :  reserved word',
            'setdollartrailing':'SetDollarTrailing  :  reserved word',
            'setexitonclose':'SetExitOnClose  :  reserved word',
            'setfpcompareaccuracy':'SetFPCompareAccuracy  :  reserved word',
            'setnondisplay':'SetNonDisplay  :  reserved word',
            'setnow':'SetNOW  :  reserved word',
            'setpeg':'SetPeg  :  reserved word',
            'setpercenttrailing':'SetPercentTrailing  :  reserved word',
            'setplotbgcolor':'SetPlotBGColor  :  reserved word',
            'setplotcolor':'SetPlotColor  :  reserved word',
            'setplottype':'SetPlotType  :  reserved word',
            'setplotwidth':'SetPlotWidth  :  reserved word',
            'setprofittarget':'SetProfitTarget  :  reserved word',
            'setroutename':'SetRouteName  :  reserved word',
            'setshaveimprove':'SetShaveImprove  :  reserved word',
            'setshowonly':'SetShowOnly  :  reserved word',
            'setstopcontract':'SetStopContract  :  reserved word',
            'setstoploss':'SetStopLoss  :  reserved word',
            'setstopposition':'SetStopPosition  :  reserved word',
            'setstopshare':'SetStopShare  :  reserved word',
            'setsubscriberonly':'SetSubscriberOnly  :  reserved word',
            'settlement':'Settlement  :  reserved word',
            'sga_exp_by_netsales':'SGA_Exp_By_NetSales  :  reserved word',
            'share':'Share  :  reserved word',
            'shares':'Shares  :  reserved word',
            'sharesout':'SharesOut  :  reserved word',
            'short':'Short  :  reserved word',
            'shortrolladj':'ShortRollAdj  :  reserved word',
            'siccode':'SICCode  :  reserved word',
            'sign':'Sign  :  reserved word',
            'sine':'Sine  :  reserved word',
            'skip':'Skip  :  reserved word',
            'slippage':'Slippage  :  reserved word',
            'snapfundexists':'SnapFundExists  :  reserved word',
            'spaces':'Spaces  :  reserved word',
            'square':'Square  :  reserved word',
            'squareroot':'SquareRoot  :  reserved word',
            'startdate':'StartDate  :  reserved word',
            'stateless':'Stateless  :  reserved word',
            'stautosession':'stAutoSession  :  reserved word',
            'stocksplit':'StockSplit  :  reserved word',
            'stocksplitcount':'StockSplitCount  :  reserved word',
            'stocksplitdate':'StockSplitDate  :  reserved word',
            'stocksplittime':'StockSplitTime  :  reserved word',
            'stop':'Stop  :  reserved word',
            'stregularsession':'stRegularSession  :  reserved word',
            'strike':'STRIKE  :  reserved word',
            'strikecount':'STRIKECOUNT  :  reserved word',
            'strikeitmcount':'STRIKEITMCOUNT  :  reserved word',
            'strikeotcount':'STRIKEOTCOUNT  :  reserved word',
            'string':'String  :  reserved word',
            'stringarray':'StringArray  :  reserved word',
            'stringarrayref':'StringArrayRef  :  reserved word',
            'stringref':'StringRef  :  reserved word',
            'stringseries':'StringSeries  :  reserved word',
            'stringsimple':'StringSimple  :  reserved word',
            'stringtodate':'StringToDate  :  reserved word',
            'stringtodatetime':'StringToDateTime  :  reserved word',
            'stringtotime':'StringToTime  :  reserved word',
            'strlen':'StrLen  :  reserved word',
            'strtonum':'StrToNum  :  reserved word',
            'sumlist':'SumList  :  reserved word',
            'sunday':'Sunday  :  reserved word',
            'switch':'Switch  :  reserved word',
            'symbol':'Symbol  :  reserved word',
            'symbolname':'SymbolName  :  reserved word',
            'symbolroot':'SymbolRoot  :  reserved word',
            't':'T  :  reserved word',
            'tangent':'Tangent  :  reserved word',
            'target':'TARGET  :  reserved word',
            'targettype':'TARGETTYPE  :  reserved word',
            'text':'Text  :  reserved word',
            'text_delete':'Text_Delete  :  reserved word',
            'text_getactive':'Text_GetActive  :  reserved word',
            'text_getcolor':'Text_GetColor  :  reserved word',
            'text_getdate':'Text_GetDate  :  reserved word',
            'text_getfirst':'Text_GetFirst  :  reserved word',
            'text_gethstyle':'Text_GetHStyle  :  reserved word',
            'text_getnext':'Text_GetNext  :  reserved word',
            'text_getstring':'Text_GetString  :  reserved word',
            'text_gettime':'Text_GetTime  :  reserved word',
            'text_getvalue':'Text_GetValue  :  reserved word',
            'text_getvstyle':'Text_GetVStyle  :  reserved word',
            'text_new':'Text_New  :  reserved word',
            'text_setcolor':'Text_SetColor  :  reserved word',
            'text_setlocation':'Text_SetLocation  :  reserved word',
            'text_setstring':'Text_SetString  :  reserved word',
            'text_setstyle':'Text_SetStyle  :  reserved word',
            'theoreticalgrossin':'THEORETICALGROSSIN  :  reserved word',
            'theoreticalgrossout':'THEORETICALGROSSOUT  :  reserved word',
            'theoreticalvalue':'THEORETICALVALUE  :  reserved word',
            'theta':'THETA  :  reserved word',
            'this':'This  :  reserved word',
            'throw':'Throw  :  reserved word',
            'thursday':'Thursday  :  reserved word',
            'ticks':'Ticks  :  reserved word',
            'ticktype':'TICKTYPE  :  reserved word',
            'time':'Time  :  reserved word',
            'timetostring':'TimeToString  :  reserved word',
            'tl_delete':'TL_Delete  :  reserved word',
            'tl_getactive':'TL_GetActive  :  reserved word',
            'tl_getalert':'TL_GetAlert  :  reserved word',
            'tl_getbegindate':'TL_GetBeginDate  :  reserved word',
            'tl_getbegintime':'TL_GetBeginTime  :  reserved word',
            'tl_getbeginval':'TL_GetBeginVal  :  reserved word',
            'tl_getcolor':'TL_GetColor  :  reserved word',
            'tl_getenddate':'TL_GetEndDate  :  reserved word',
            'tl_getendtime':'TL_GetEndTime  :  reserved word',
            'tl_getendval':'TL_GetEndVal  :  reserved word',
            'tl_getextleft':'TL_GetExtLeft  :  reserved word',
            'tl_getextright':'TL_GetExtRight  :  reserved word',
            'tl_getfirst':'TL_GetFirst  :  reserved word',
            'tl_getnext':'TL_GetNext  :  reserved word',
            'tl_getsize':'TL_GetSize  :  reserved word',
            'tl_getstyle':'TL_GetStyle  :  reserved word',
            'tl_getvalue':'TL_GetValue  :  reserved word',
            'tl_new':'TL_New  :  reserved word',
            'tl_setalert':'TL_SetAlert  :  reserved word',
            'tl_setbegin':'TL_SetBegin  :  reserved word',
            'tl_setcolor':'TL_SetColor  :  reserved word',
            'tl_setend':'TL_SetEnd  :  reserved word',
            'tl_setextleft':'TL_SetExtLeft  :  reserved word',
            'tl_setextright':'TL_SetExtRight  :  reserved word',
            'tl_setsize':'TL_SetSize  :  reserved word',
            'tl_setstyle':'TL_SetStyle  :  reserved word',
            'to':'To  :  reserved word',
            'today':'Today  :  reserved word',
            'tomorrow':'Tomorrow  :  reserved word',
            'tool_black':'Tool_Black  :  reserved word',
            'tool_blue':'Tool_Blue  :  reserved word',
            'tool_cyan':'Tool_Cyan  :  reserved word',
            'tool_darkblue':'Tool_DarkBlue  :  reserved word',
            'tool_darkbrown':'Tool_DarkBrown  :  reserved word',
            'tool_darkcyan':'Tool_DarkCyan  :  reserved word',
            'tool_darkgray':'Tool_DarkGray  :  reserved word',
            'tool_darkgreen':'Tool_DarkGreen  :  reserved word',
            'tool_darkmagenta':'Tool_DarkMagenta  :  reserved word',
            'tool_darkred':'Tool_DarkRed  :  reserved word',
            'tool_darkyellow':'Tool_DarkYellow  :  reserved word',
            'tool_dashed':'Tool_Dashed  :  reserved word',
            'tool_dashed2':'Tool_Dashed2  :  reserved word',
            'tool_dashed3':'Tool_Dashed3  :  reserved word',
            'tool_dotted':'Tool_Dotted  :  reserved word',
            'tool_green':'Tool_Green  :  reserved word',
            'tool_lightgray':'Tool_LightGray  :  reserved word',
            'tool_magenta':'Tool_Magenta  :  reserved word',
            'tool_red':'Tool_Red  :  reserved word',
            'tool_solid':'Tool_Solid  :  reserved word',
            'tool_white':'Tool_White  :  reserved word',
            'tool_yellow':'Tool_Yellow  :  reserved word',
            'total':'Total  :  reserved word',
            'totalbarseventrades':'TotalBarsEvenTrades  :  reserved word',
            'totalbarslostrades':'TotalBarsLosTrades  :  reserved word',
            'totalbarswintrades':'TotalBarsWinTrades  :  reserved word',
            'totaltrades':'TotalTrades  :  reserved word',
            'tradedate':'TradeDate  :  reserved word',
            'tradedateex':'TradeDateEX  :  reserved word',
            'tradedirectionseries':'TradeDirectionSeries  :  reserved word',
            'tradeexch':'TradeExch  :  reserved word',
            'tradetime':'TradeTime  :  reserved word',
            'tradetimeex':'TradeTimeEX  :  reserved word',
            'tradevolume':'TradeVolume  :  reserved word',
            'tradingdaysleft':'TradingDaysLeft  :  reserved word',
            'trailingstopamt':'TrailingStopAmt  :  reserved word',
            'trailingstopfloor':'TrailingStopFloor  :  reserved word',
            'trailingstoppct':'TrailingStopPct  :  reserved word',
            'truefalse':'TrueFalse  :  reserved word',
            'truefalsearray':'TrueFalseArray  :  reserved word',
            'truefalsearrayref':'TrueFalseArrayRef  :  reserved word',
            'truefalseref':'TrueFalseRef  :  reserved word',
            'truefalseseries':'TrueFalseSeries  :  reserved word',
            'truefalsesimple':'TrueFalseSimple  :  reserved word',
            'try':'Try  :  reserved word',
            'try-catch-finally':'Try-Catch-Finally  :  reserved word',
            'ttldbt_by_netassts':'TtlDbt_By_NetAssts  :  reserved word',
            'tuesday':'Tuesday  :  reserved word',
            'under':'Under  :  reserved word',
            'underlying':'Underlying  :  reserved word',
            'unionsess1endtime':'UnionSess1EndTime  :  reserved word',
            'unionsess1firstbar':'UnionSess1FirstBar  :  reserved word',
            'unionsess1starttime':'UnionSess1StartTime  :  reserved word',
            'unionsess2endtime':'UnionSess2EndTime  :  reserved word',
            'unionsess2firstbar':'UnionSess2FirstBar  :  reserved word',
            'unionsess2starttime':'UnionSess2StartTime  :  reserved word',
            'units':'Units  :  reserved word',
            'unsigned':'UNSIGNED  :  reserved word',
            'until':'Until  :  reserved word',
            'upperstr':'UpperStr  :  reserved word',
            'upticks':'UpTicks  :  reserved word',
            'using':'Using  :  reserved word',
            'v':'V  :  reserved word',
            'variable':'Variable  :  reserved word',
            'varsize':'VARSIZE  :  reserved word',
            'varstartaddr':'VARSTARTADDR  :  reserved word',
            'vega':'VEGA  :  reserved word',
            'volume':'Volume  :  reserved word',
            'vsbcommentary':'VSBCOMMENTARY  :  reserved word',
            'vwap':'VWAP  :  reserved word',
            'wednesday':'Wednesday  :  reserved word',
            'white':'White  :  reserved word',
            'word':'WORD  :  reserved word',
            'xor':'Xor  :  reserved word',
            'year':'Year  :  reserved word',
            'yearfromdatetime':'YearFromDateTime  :  reserved word',
            'yellow':'Yellow  :  reserved word',
            'yesterday':'Yesterday  :  reserved word'
          };

          const keywordKey = word.toLowerCase();

          if (customKeywords[keywordKey]) {
              return new vscode.Hover(customKeywords[keywordKey]);
          }
      }
  });
}
