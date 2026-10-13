// ===== Translations (Hebrew / English) =====
var onLang = null;
const APP_NAME = () => window.G360_CLIENT ? 'Gambit360 Viewer' : 'Gambit360 Studio';   // the file generated for a client says Viewer
const I18N = {
  he: {
    title: () => APP_NAME(),
    loadE57Btn: 'טעינת ענן נקודות E57', loadObjBtn: 'טעינת תיקיית MatterPak', startIntro: 'לפתיחת פרויקט חדש בחר מה לטעון. טעינה מהמסך הזה פותחת פרויקט חדש, ונתונים שמורים של פרויקט באותו שם יימחקו. להחלפת מודל בפרויקט קיים השתמש בכפתור ההחלפה. הכול נטען מהמחשב, בלי אינטרנט. קובץ E57 נקרא בחלקים, ולכן אפשר לפתוח גם קבצים גדולים. איכות הענן נקבעת למטה.',
    /*@STUDIO*/startObj: 'בחר את התיקייה שמכילה את קובץ ה-OBJ, קובץ ה-MTL וקבצי הטקסטורה של הסיור. הכול נטען מהמחשב, בלי אינטרנט.',
    startE57: 'או בחר קובץ E57 (ענן נקודות). הקובץ נקרא מהמחשב בחלקים, ולכן אפשר לפתוח גם קבצים גדולים.',/*@/STUDIO*/
    quality: 'איכות ענן הנקודות (E57)',
    qFast: 'מהירה (2 מיליון נקודות)', qNormal: 'רגילה (4 מיליון)', qHigh: 'גבוהה (8 מיליון)',
    helpBtn: 'עזרה', colorBtn: 'צבע', langBtn: 'English', homeBtn: 'פרויקט חדש', enhanceBtn: 'שיפור תמונה', helpTip: 'הנחיות שימוש (H)', colorTip: 'שינוי צבע המערכת', langTip: 'החלפת שפה', homeTip: 'פרויקט חדש: טעינת קובץ סריקה חדש (המדידות והשטחים מתאפסים)', measureTip: 'מדידת מרחק (M)', areaTip: 'מדידת שטח (P)', mUndoBtn: 'בטל אחרון', mUndoTip: 'ביטול הנקודה או המדידה האחרונה (Backspace)', mClearBtn: 'נקה הכל', mClearTip: 'מחיקת כל המדידות והשטחים (X)', mDoneBtn: 'סיום', mDoneTip: 'סגירת השטח (Enter)', enhanceTip: 'שיפור ניגודיות וצבע', overTip: 'מבט על (O)', b3dTip: 'מבט תלת-ממד (O)', confirmNew: 'לטעון את הקובץ החדש? המדידות הנוכחיות יימחקו.', cancel: 'ביטול', mpBtn: 'סיור Matterport', mpTip: 'קישור לסיור Matterport המקורי של המודל', mpHint: 'הדבק קישור לסיור ה-Matterport המקורי של המודל הזה. הוא יישמר במחשב וייפתח בלשונית חדשה.', mpPh: 'https://my.matterport.com/show/?m=...', /*@STUDIO*/pkgMpLinkPh: 'קישור לסיור Matterport (לא חובה)',/*@/STUDIO*/ mpSave: 'שמירה', mpOpen: 'פתיחת הסיור', mpRemove: 'הסרה', mpBad: 'הקישור חייב להתחיל ב-https://', mpSaved: 'הקישור נשמר', mpRemoved: 'הקישור הוסר',
    miniToggle: 'מיני מפה', miniToggleTip: 'הצגה או הסתרה של מיני המפה', /*@STUDIO*/miniHideTip: 'הסתרת מיני המפה (אפשר להחזיר מתפריט האפשרויות)',/*@/STUDIO*/
    miniSmall: 'הקטנת המפה', miniBig: 'הגדלת המפה', miniReset: 'חזרה לגודל ברירת המחדל', promoRec: n => 'מצלם סרטון… ' + n + '% · השאר את החלון פתוח וגלוי · Esc לביטול', promoDone: x => 'הסרטון נשמר (' + x + ') בתיקיית ההורדות', promoCancel: 'צילום הסרטון בוטל', promoNoRec: 'הדפדפן הזה לא תומך בצילום וידאו. השתמש ב-Chrome או Edge.', promoOptTitle: 'יצירת סרטון פרומו', promoOptTitleLbl: 'כותרת פתיחה (שם הפרויקט)', promoOptLogoLbl: 'לוגו וכרטיס סיום', promoOptGo: 'התחלת הקלטה', promoOptX: 'ביטול', startGoBtn: 'נקודת פתיחה', promoLiveBtn: 'סיור אוטומטי', promoLiveTip: 'סיור הליכה אוטומטי בבניין, כמו בסרטון הפרומו', promoGenBtn: 'יצירת סרטון', promoGenTip: 'יצירת סרטון פרומו של הסיור והורדה שלו למחשב', startGoTip: 'חזרה לנקודת הפתיחה של הסיור', miniZin: 'הגדלת התצוגה במפה (זום)', miniZout: 'הקטנת התצוגה במפה (זום)',
    /*@STUDIO*/pdfH: 'גובה', pdfRoomsNote: 'מידות פנים וגובה רצפה-תקרה (משוער) לכל חלל',/*@/STUDIO*/
    pdfBtn: 'ייצוא תכניות קומה', pdfTip: 'ייצוא תכנית לכל קומה: PDF או DXF ל-AutoCAD', /*@STUDIO*/planHead: 'בחר פורמט לייצוא:', planPdfLbl: 'PDF (A3, וקטורי, להדפסה)', planDxfLbl: 'DXF ל-AutoCAD (1:1 במטרים, בשכבות)', planGo: 'ייצא', planNone: 'סמן לפחות פורמט אחד', pdfBusy: n => 'מכין תכניות PDF… ' + n + '%', pdfDone: 'קובץ ה-PDF נוצר', pdfFail: 'יצירת ה-PDF נכשלה: ', pdfNeedObj: 'ייצוא תכניות זמין רק לקובץ OBJ',  dxfDone: 'קובץ ה-DXF נוצר', dxfFail: 'יצירת ה-DXF נכשלה: ',/*@/STUDIO*/
    optBtn: 'אפשרויות', optTip: 'טעינה, חבילה, עזרה, צבע ושפה',
    pkgTop: 'חבילה ללקוח', pkgTopTip: 'יצירת חבילה ללקוח',
    viewsNoneToExport: 'אין עדיין נקודות משלכם לייצוא', tourNew: 'פתיחה בלשונית חדשה', tourShare: 'שיתוף', tourCopy: 'העתקת כתובת', tourCopied: 'הועתק ✓', tourCopyFail: 'ההעתקה נכשלה', tourClose: 'סגירה',
    contactMsg: 'במידה והסיור לא נפתח, (הוא הוסר או במצב פרטי), יש ליצור קשר עם Gambit360 לחידוש האחסון.<br>טלפון: <a href="tel:0515583008" dir="ltr">051-558-3008</a><br>מייל: <a href="mailto:contact@gambit360.co.il">contact@gambit360.co.il</a>',
 /*@STUDIO*/logoLbl: 'לוגו ללקוח:', logoPick: 'בחירת לוגו…', logoReset: 'ברירת מחדל',/*@/STUDIO*/ logoDefault: 'ברירת מחדל (Gambit360)', logoCustom: 'לוגו מותאם', logoBad: 'לא הצלחתי לקרוא את קובץ התמונה.',
    projSave: 'שמירת פרויקט', projOpenExisting: 'פתיחת פרויקט קיים', welcome: '🎉 ברוכים הבאים 👋✨', pkgSwapBtn: 'החלפת ענן נקודות E57', /*@STUDIO*/pkgSwapObj: 'החלפת תיקיית MatterPak', pkgSwapTip: 'טעינת קובץ E57 חדש לאותו פרויקט: התגיות, המיקומים, שמות הקומות, המדידות וההגדרות נשארים', pkgSwapTipObj: 'טעינת תיקיית MatterPak חדשה לאותו פרויקט: התגיות, המיקומים, שמות הקומות, המדידות וההגדרות נשארים', pkgSwapDone: n => 'המודל הוחלף ב-' + n + '. שאר נתוני הפרויקט נשמרו.', pkgSwapNo: 'אין פרויקט טעון.',/*@/STUDIO*/ projOpen: 'פתיחת פרויקט', /*@STUDIO*/projSaved: n => 'הפרויקט נשמר: ' + n, projSaveFail: 'שמירת הפרויקט נכשלה: ', projBad: 'זה לא קובץ פרויקט של Gambit360.', projPick: n => 'כדי לסיים לפתוח את "' + n + '" בחר את קובץ ה-E57 (או תיקיית ה-OBJ) שלו בכפתור למעלה. אחר כך שמור את הפרויקט, ובפעם הבאה הוא ייפתח ישירות.', projPickBtn: n => 'בחירת קובץ הסריקה של "' + n + '"',/*@/STUDIO*/ projMismatch: (a, b) => 'המודל שנטען (' + a + ') שונה מהמודל בפרויקט (' + b + '), ולכן לא הוחלו נתוני הפרויקט.', /*@STUDIO*/projOpened: n => 'הפרויקט נפתח: ' + n,
    pkgClientUpdLbl: 'לאפשר ללקוח לטעון עדכונים', updLoadBtn: 'טעינת עדכונים',/*@/STUDIO*/ mineSaveBtn: 'שמירת השינויים שלי', mineLoadBtn: 'טעינת השינויים שלי', /*@STUDIO*/pkgMpLbl: 'סיור Matterport', pkgMiniLbl: 'מיני-מפה סגורה בכניסה ראשונה', pkgClientTagsLbl: 'לאפשר ללקוח לערוך שמות ותגיות', pkgCloudLbl: 'לאפשר ללקוח לראות את ענן הנקודות',
    promoOptTitle: 'הקלטת סרטון פרומו', promoOptTitleLbl: 'כותרת פתיחה (שם הפרויקט)', promoOptLogoLbl: 'לוגו וכרטיס סיום', promoOptGo: 'התחלת הקלטה', promoOptX: 'ביטול',/*@/STUDIO*/
    marksShowLbl: 'להציג נקודות עניין ושמות על המסך', tabTags: 'תגיות', tagAdd: 'הוספת תגית', tagEmpty: 'עדיין אין תגיות. לחצו על "הוספת תגית", בחרו נקודה על המודל ומלאו כותרת, תיאור ואייקון.', tagTitlePh: 'כותרת', tagDescPh: 'תיאור (אופציונלי)', tagLinkPh: 'קישור (אופציונלי), למשל https://…', tagImgPick: 'בחירת תמונה', tagImgDel: 'הסרת תמונה', tagColor: 'צבע:', tagNew: 'תגית חדשה', tagEdit: 'עריכת תגית', /*@STUDIO*/tagNext: 'המשך – בחירת מקום על המודל',/*@/STUDIO*/ tagSave: 'שמירה', tagPlace: 'לחצו על הנקודה במודל שבה תופיע התגית (Esc לביטול)', tagEdt: 'עריכה', tagOpenLink: 'פתיחת הקישור', tagGo: 'מעבר לתגית',
    /*@STUDIO*/clTitle: 'חוויית הלקוח', startSetTip: 'קובע לפי המיקום והכיוון הנוכחיים',/*@/STUDIO*/ startSet: 'קביעת נקודת פתיחה', startClear: 'ביטול', /*@STUDIO*/startOpenLbl: 'פתיחת הסיור בנקודה שנקבעה',/*@/STUDIO*/ startNone: 'לא נקבעה נקודת פתיחה', startOk: 'נקודת הפתיחה נקבעה', startNeed3D: 'יש לעמוד בתוך המודל (לא במבט-על) כדי לקבוע נקודת פתיחה', /*@STUDIO*/hideLbl: 'מה להציג ללקוח:',/*@/STUDIO*/ hMeasure: 'מדידה', hArea: 'שטח', hShot: 'צילום', hFloors: 'בורר קומות', hModes: 'מבט-על ותלת-ממד', hPoints: 'מיקומים ושמות', hMini: 'מיני-מפה',
    /*@STUDIO*/pkgNoPromo: 'שים לב: לא נכלל סרטון, ולכן ללקוח לא יופיע כפתור סרטון.', pkgPromoLbl: 'סרטון פרומו:', pkgPickSrc: 'בחר עכשיו את התיקייה שבה נמצא הקובץ Gambit360 Studio.html (פעם אחת בלבד, היא נשמרת).', pkgPromoModeLbl: 'כפתור הפרומו אצל הלקוח:', pkgPromoModeVideo: 'מנגן את הסרטון שצורף', pkgPromoModeLive: 'מסלול הליכה חי בבניין (ברירת מחדל, בלי קובץ)', pkgPromoModeGen: 'הלקוח מייצר סרטון ומוריד אותו',/*@/STUDIO*/ pkgPromoPick: 'בחירת קובץ סרטון…', pkgPromoNone: 'אין סרטון. הקלט עם "סרטון פרומו" או בחר קובץ.', pkgPromoReady: mb => 'מוכן (' + mb + ' MB)', promoPlay: 'סרטון', promoPlayTip: 'צפייה בסרטון הפרומו של הנכס', promoDl: 'הורדת הסרטון', promoBtn: 'סרטון פרומו', promoTip: 'יצירה אוטומטית של סרטון פרומו של 30 שניות: סיבוב סביב המבנה, הליכה בתוכו ויציאה', /*@STUDIO*/promoRec: n => 'מצלם סרטון פרומו… ' + n + '% · השאר את החלון פתוח וגלוי · Esc לביטול', promoDone: x => 'סרטון הפרומו נשמר (' + x + ') בתיקיית ההורדות', promoCancel: 'צילום הסרטון בוטל', promoNoRec: 'הדפדפן הזה לא תומך בצילום וידאו. השתמש ב-Chrome או Edge.',/*@/STUDIO*/ shotBtn: 'צילום', shotTip: 'שמירת תמונה של התצוגה עם הלוגו',
    /*@STUDIO*/pkgNamePh: 'שם הפרויקט (יוצג ללקוח)',
    pkgMgrPh: 'שם מנהל הפרויקט (יוצג ללקוח)',
    pkgStartLbl: 'תחילת האחסון', pkgDurLbl: 'משך האחסון', unitM: 'חודשים', unitD: 'ימים',/*@/STUDIO*/
    expiredTitle: 'פג תוקף הסיור', expiredMsg: 'לחידוש האחסון יש ליצור קשר.', expiredContact: 'טלפון: <a href="tel:0515583008" dir="ltr">051-558-3008</a><br>מייל: <a href="mailto:contact@gambit360.co.il">contact@gambit360.co.il</a>',
    expLeft: n => n === 0 ? 'היום היום האחרון לאחסון' : n === 1 ? 'נותר יום אחד לאחסון' : 'נותרו ' + n + ' ימים לאחסון', expEnded: 'תקופת האחסון הסתיימה',
    /*@STUDIO*/updBtn: 'עדכונים', updTitle: 'עדכוני הצפיין ללקוחות', updUrlPh: 'כתובת התיקייה באתר, למשל https://gambit360.co.il/viewer/', updSave: 'שמירת הכתובת', updPublish: 'פרסום עדכון',
    updHint: 'לקוחות שיש להם חבילה חדשה יקבלו את העדכון כשהם מחוברים לאינטרנט. הכתובת נשמרת בחבילות שייווצרו מעכשיו. אחרי הפרסום מעלים את התיקייה viewer-update לתיקייה באתר.',
    updNeedUrl: 'יש להזין קודם את כתובת התיקייה באתר.', updNeedSrc: 'בחרו קודם את תיקיית ה-Studio (בחלונית "חבילה ללקוח").', updDone: (v, f) => 'פורסם עדכון ' + v + '. התיקייה viewer-update נוצרה בתוך "' + f + '". יש להעלות את שני הקבצים שבה לתיקייה באתר.',
    updAvail: 'יש גרסה חדשה של הצפיין', updNow: 'עדכון', updDownload: 'הורדת הקובץ המעודכן',/*@/STUDIO*/
    tabPoints: 'מיקומים', tabRooms: 'שמות', roomEmpty: 'עדיין אין שמות. לחצו על "הוספת שם" ובחרו מקום על המפה.',
    roomPlace: 'לחצו על המפה במקום שבו תרצו את התגית (Esc לביטול). אפשר לגרור תגית כדי להזיז אותה.',
    roomAdd: 'הוספת שם', roomNamePh: 'שם (למשל סלון)', roomDefault: n => 'חדר ' + n,
    a11yBtn: 'נגישות', a11yTitle: 'נגישות', a11yText: 'גודל טקסט', a11yNormal: 'רגיל', a11yLarge: 'גדול', a11yXL: 'גדול מאוד', a11yContrast: 'ניגודיות גבוהה', a11yMotion: 'הפחתת תנועה (ללא אנימציות)', a11yOn: 'פועל', a11yOff: 'כבוי', a11yReset: 'איפוס',
    termsBtn: 'תנאי שימוש', termsTitle: 'תנאי שימוש', termsSave: 'שמירה', termsReset: 'שחזור נוסח ברירת מחדל', termsHint: 'הנוסח נשמר בסטודיו וייכנס לכל חבילה חדשה.',
    termsText: '1. בעלות וזכויות יוצרים - המודל, הצילומים והקבצים הנלווים נוצרו על ידי Gambit360, והזכויות בהם שמורות לה. הלקוח מקבל רישיון שימוש בלתי בלעדי לצורכי הפרויקט שלשמו הוזמנו. Gambit360 רשאית להשתמש בחומר גם לצרכים אחרים, כגון הצגה בתיק עבודות.\n\n2. שימוש מותר - התיעוד מיועד לשימוש הלקוח, מנהל הפרויקט והגורמים המקצועיים המעורבים בפרויקט, לצורך תכנון, פיקוח, אחזקה ותיעוד.\n\n3. העברה לצד שלישי - אין להפיץ, למכור או להעביר את הקבצים לגורם מחוץ לפרויקט ללא אישור בכתב מ-Gambit360.\n\n4. אופי התיעוד ודיוק - המודל נועד לתיעוד חזותי. המידות והמיקומים בו הם הערכה ואינם מחליפים מדידה הנדסית או תכניות עדות (as-made). אין להסתמך עליו כתחליף לבדיקה בשטח.\n\n5. ללא אחסון שנתי - מסירת החבילה אינה כוללת אחסון או תחזוקה של סיור Matterport. הסיור המקוון עשוי להיות פרטי או להימחק, ובמקרה כזה יש ליצור קשר לחידוש האחסון.\n\n6. אחריות - Gambit360 לא תישא באחריות לנזק ישיר או עקיף שנגרם משימוש בתיעוד או מהסתמכות עליו, מעבר לסכום ששולם עבור ההזמנה.\n\n7. פרטיות - התיעוד עשוי לכלול פרטים מזהים של הנכס. באחריות הלקוח לשמור עליהם ולהימנע מהפצתם.\n\nטלפון: 051-558-3008 · מייל: contact@gambit360.co.il',
    /*@STUDIO*/pmLabel: 'מנהל הפרויקט',
    pkgSrcSaved: 'תיקיית ה-Studio נשמרה. עכשיו לחצו על "יצירת חבילה ללקוח".',
    srcBtn: 'בחירת תיקיית ה-Studio', srcBtnChange: 'החלפת תיקיית ה-Studio',
    pkgNeedSrc: 'קודם לחצו על "בחירת תיקיית ה-Studio" ובחרו את התיקייה שבה נמצא הקובץ Gambit360 Studio.html (עם תיקיית lib).',
    pkgBadSrc: (n, h, l) => 'בתיקייה "' + n + '": קובץ הצפיין ' + (h ? 'נמצא' : 'לא נמצא') + ', תיקיית lib ' + (l ? 'נמצאה (' + l + ' קבצים)' : 'לא נמצאה או ריקה') + '. זו תיקיית ה-Studio : בחרו את התיקייה שמכילה ישירות את קובץ Gambit360 Studio.html ואת התיקייה lib.',
    pkgAgain: 'יש ללחוץ שוב על "יצירת חבילה ללקוח" (נדרש אישור נוסף מהדפדפן).', pkgCopying: 'מעתיק את הצפיין…',
    pkgHint: 'יצירת חבילה ללקוח: קודם בוחרים פעם אחת את תיקיית ה-Studio. אחר כך כל לחיצה יוצרת את החבילה (ואם תרצו גם ZIP) בתיקייה Export\\Client Packages שבתוכה, ומציגה כפתורי העתקת נתיב ופתיחה.',
    pkgObfLbl: 'ערפול קוד (הגנה מהעתקה)', freshConfirm: n => 'קיימים נתונים שמורים של פרויקט בשם "' + n + '" (נקודות, שמות, הגדרות, לוגו). טעינת מודל חדש פותחת פרויקט חדש, והנתונים האלה יימחקו.\n\nכדי להחליף מודל בפרויקט קיים השתמש בכפתור ההחלפה בחלונית יצירת החבילה.\n\nלהמשיך ולמחוק?', obfWarn: '⚠ שים לב: ללא ערפול הקוד של הצפיין, הוא יהיה גלוי וכל מי שיקבל את הקובץ יכול לקרוא אותו ולהעתיק אותו.', obfBusy: 'מערפל את קוד הצפיין, זה יכול לקחת כמה שניות…', obfMissing: 'כלי הערפול לא נמצא. שמור את הקובץ index.browser.js של javascript-obfuscator בשם javascript-obfuscator.js בתיקייה tools שבתיקיית ה-Studio, או בטל את הסימון "ערפול קוד".',
    pkgBtn: 'יצירת חבילה ללקוח', pkgHead: 'יצירת חבילה ללקוח:', pkgSyncBtn: 'סנכרון שינויים לחבילה', pkgPartModelLbl: 'מודל (נקודות ותמונות)', pkgPartUiLbl: 'ממשק (קובץ HTML)', pkgPartSetLbl: 'הגדרות (תגיות, שמות, הרשאות, תוקף)', pkgPartNone: 'סמנו לפחות אחד: מודל, ממשק או הגדרות.', pkgUiDone: (n, f) => 'הקובץ ' + n + ' עודכן בתיקייה "' + f + '" עם ממשק חדש. ההגדרות לא שונות: הן נשארות כפי שהן בקובץ model\\manifest.js של הלקוח.', pkgBothDone: (n, f) => 'הקובץ ' + n + ' והגדרות החבילה עודכנו בתיקייה "' + f + '". מספיק לשלוח ללקוח את קובץ ה-HTML בלבד (באותו שם).', pkgHtmlBtn: 'יצירת קובץ HTML חדש ללקוח', pkgHtmlTip: 'קובץ אחד שמחליף את הקובץ של הלקוח: ממשק חדש והגדרות עדכניות, בלי קבצי המודל', htmlFileDone: (n, f) => 'הקובץ ' + n + ' עודכן בתיקייה "' + f + '" (הקובץ הקודם הוחלף). הלקוח מחליף בו את הקובץ שלו (באותו שם).', pkgUpdFileBtn: 'יצירת קובץ עדכון הגדרות', pkgUpdFileTip: 'קובץ קטן שהלקוח טוען ב"טעינת עדכונים": תוקף, קישור, כותרות, מיקומים ותגיות. הממשק עצמו לא משתנה', pkgMineBtn: 'טעינת שינויים מלקוח', pkgMineTip: 'מוסיף לפרויקט את התגיות והשמות שהלקוח שמר לקובץ', updFileDone: (n, f) => 'קובץ העדכון נוצר: ' + n + ' (בתיקייה "' + f + '"). שלחו אותו ללקוח.', updFileNone: 'קודם בחרו את תיקיית ה-Studio .', updBad: 'זה לא קובץ עדכון תקין.', updOther: 'קובץ העדכון הזה שייך לפרויקט אחר.', updLoaded: 'העדכון נטען. הדף נטען מחדש…', updFail: 'טעינת העדכון נכשלה: ',/*@/STUDIO*/ mineSavedMsg: 'השינויים נשמרו בקובץ.', mineBad: 'זה לא קובץ שינויים תקין.', mineOther: 'הקובץ שייך לפרויקט אחר.', mineLoaded: n => 'נטענו ' + n + ' פריטים.', /*@STUDIO*/pkgSyncTip: 'מעדכן את ההגדרות בחבילה קיימת (לא את הממשק), בלי לכתוב מחדש את המודל', pkgSyncNone: n => 'לא נמצאה חבילה בשם "' + n + '". צרו חבילה פעם אחת לפני סנכרון.', pkgSyncOk: n => 'החבילה "' + n + '" עודכנה: מיקומים, שמות, תגיות, נקודת פתיחה והגדרות. השינויים נשמרו בקובץ Export\\Client Packages\\' + n + '\\model\\manifest.js (שלחו ללקוח את הקובץ הזה). הממשק לא עודכן (לשם כך צרו קובץ HTML חדש), וקובץ ה-ZIP (אם קיים) לא עודכן.', pkgSyncFail: 'הסנכרון נכשל: ', srcDiff: d => 'שונה מהתיקייה שממנה הסטודיו רץ: ' + d, srcMismatch: d => 'תיקיית ה-Studio ששמורה אינה התיקייה שממנה הסטודיו רץ. בחרו עכשיו את: ' + d,/*@/STUDIO*/ pkgCancelBtn: 'עצירת יצירת החבילה', /*@STUDIO*/pkgCancelling: 'עוצר…', pkgCancelledMsg: 'היצירה נעצרה. החבילה לא שלמה: לחצו שוב על "סנכרון שינויים לחבילה" או "יצירת חבילה ללקוח" כדי להשלים אותה.', pkgSyncMissing: n => 'החבילה "' + n + '" חסרה או לא שלמה (אין model\\manifest.js). יוצר אותה מחדש…', pkgNoFS: 'יצירת חבילה דורשת Chrome או Edge וטעינת תיקיית OBJ או קובץ E57.', pkgFail: 'יצירת החבילה נכשלה: ',
    pkgWriting: (i, n) => 'כותב קובץ ' + i + ' מתוך ' + n + '…', pkgDone: (n, p, z) => 'החבילה נוצרה בתיקייה "' + n + '", בתת-תיקייה "' + p + '"' + (z ? ', ובנוסף הקובץ ' + p + '.zip' : '') + '. אפשר לשלוח ללקוח את התיקייה או את ה-ZIP.',
    pkgCopy: 'העתקת נתיב התיקייה', pkgOpenBr: 'פתיחה בדפדפן', pkgCopied: 'הנתיב הועתק. הדביקו אותו בשורת הכתובת של סייר הקבצים.',
    pkgTipPath: 'כדי לראות את נתיב החבילה, פתחו את ה-Studio ישירות מהמחשב (קובץ מקומי).',
    pkgNeedRW: 'אין הרשאת כתיבה בתיקיית ה-Studio. לחצו על "החלפת תיקיית ה-Studio" ובחרו אותה שוב (לא את שולחן העבודה או ההורדות עצמם, אלא תיקייה בתוכם).',
    pkgZip: 'ליצור גם קובץ ZIP', pkgOpenDirLbl: 'לפתוח את התיקייה בסיום השמירה', pkgZipping: (i, n) => 'בונה ZIP: קובץ ' + i + ' מתוך ' + n + '…',/*@/STUDIO*/
    pkgLoading: 'טוען את הסיור מהחבילה…', pkgLoadingN: (i, n) => 'טוען את הסיור מהחבילה: קובץ ' + i + ' מתוך ' + n, resume: n => 'המשך מהמקום האחרון: ' + n, resumeDenied: 'לא ניתן אישור קריאה לקובץ. בחר אותו שוב.', resumeFail: 'לא הצלחתי לפתוח את הקובץ האחרון. ייתכן שהוא הועבר או נמחק, בחר אותו שוב.',
    copyright: '© 2026 Gambit360. כל הזכויות שמורות.',
    viewsExport: 'ייצוא', viewsImport: 'ייבוא', viewsImported: n => 'נוספו ' + n + ' נקודות', viewsOtherModel: '(הקובץ נוצר עבור מודל אחר, בדקו שהמיקומים מתאימים)', viewsBadFile: 'הקובץ אינו קובץ נקודות תקין',
    viewsBtn: 'נקודות עניין', viewsTip: 'רשימת נקודות מבט', viewsTitle: 'נקודות מבט', viewsAdd: 'הוספת מיקום', viewsNamePh: 'שם הנקודה (לא חובה)',
    viewsEmpty: 'אין עדיין נקודות במודל.', viewsNeed3D: 'עברו למצב תלת-ממד כדי לשמור נקודה', viewsDefault: n => 'נקודה ' + n, viewsDel: 'מחיקה',
    miniNone: 'אי אפשר לעבור לנקודה הזו (אין שם רצפה)',
    themeBtn: 'מעבר בין מצב כהה לבהיר', hintText: 'טיפ: לחצו על "תלת-ממד" ואז על נקודה ברצפה כדי להיכנס לסיור. גררו כדי להסתכל, לחצו על העיגול כדי לנוע, והגלגלת מקרבת ומרחיקה. (לחיצה כדי לסגור)',
    colorCustom: 'צבע מותאם', colorReset: 'איפוס לצבע ברירת המחדל',
    swCyan: 'ציאן (ברירת מחדל)', swBlue: 'כחול', swGreen: 'ירוק', swOrange: 'כתום', swPink: 'ורוד', swPurple: 'סגול', swYellow: 'צהוב', swRed: 'אדום',
    helpTitle: 'הנחיות שימוש', close: 'סגירה',
    click: 'לחץ כדי להתחיל לטייל',
    measureBtn: 'מדידה', areaBtn: 'שטח', bOver: 'מבט על', b3d: 'תלת-ממד',
    panoToPano: 'תצוגה מציאותית', panoToCloud: 'תצוגת ענן נקודות', panoTip: 'מעבר בין ענן הנקודות לתמונות הפנורמה של הסריקה', panoOnMsg: 'תצוגת פנורמה: בתוך המבנה מוצגות תמונות הסריקה', panoOffMsg: 'תצוגת ענן נקודות', /*@STUDIO*/panoLoading: 'טוען פנורמה…',/*@/STUDIO*/ panoFail: 'לא ניתן היה לטעון את הפנורמה.',
    /*@STUDIO*/pkgPanoLbl: 'פנורמות:',/*@/STUDIO*/ pkgPanoOff: 'ללא פנורמות', pkgPanoOpt: (n, mb) => n + ' (כ-' + mb + ' מ"ב)', /*@STUDIO*/pkgPanoN: (i, n) => 'כותב פנורמה ' + i + ' מתוך ' + n + '…', pkgPcN: (i, n) => 'כותב ענן נקודות ' + i + ' מתוך ' + n + '…', pkgPanoPrep: 'מכין את הפנורמות…',/*@/STUDIO*/
    pQLow: 'קל', pQMid: 'בינוני', pQHigh: 'איכות מקורית',
    floorAll: 'כל הקומות', floorN: n => 'קומה ' + n, floorRename: 'שינוי שם הקומה',
    modeFly: 'טיסה', modeWalk: 'הליכה',
    cm: ' ס"מ', m: " מ'", m2: ' מ"ר',
    measureHint: 'מצב מדידה: לחץ על הנקודה הראשונה (Esc ליציאה)',
    areaHint: 'שטח: לחץ על פינות השטח (Esc ליציאה)',
    secondPoint: 'לחץ על הנקודה השנייה',
    measured: v => 'נמדד: ' + v + ' | אפשר לגרור נקודה לדיוק',
    areaMore: 'לחץ על עוד פינות',
    areaFinish: 'לסיום: לחיצה על הנקודה הראשונה, "סיום" או Enter',
    areaDone: v => 'שטח: ' + v + ' | אפשר לגרור נקודה לדיוק',
    /*@STUDIO*/enter3d: 'לחץ על נקודה ברצפה כדי להיכנס לתלת-ממד',/*@/STUDIO*/ dollHint: 'גרור לסיבוב · גלגלת לזום · בחרו קומה בסרגל · לחצו על הרצפה כדי להיכנס',
    libMissing: 'חסרים קבצי הספרייה בתיקייה lib. הרץ פעם אחת את setup.py (נדרש אינטרנט רק לשלב הזה).',
    noObj: 'לא נמצא קובץ OBJ בתיקייה שנבחרה.',
    loading: 'טוען את המודל, זה יכול לקחת כמה רגעים...',
    loadFail: 'הטעינה נכשלה: ',
    /*@STUDIO*/e57Reading: (i, n, p) => 'קורא את קובץ ה-E57: סריקה ' + i + ' מתוך ' + n + ' (' + p + '%)',
    e57Grid: 'בונה מבנה עזר לבחירת נקודות ולמדידות...',
    e57NotE57: 'הקובץ אינו קובץ E57 תקין.',
    e57NoPoints: 'לא נמצאו נקודות בקובץ.',
    e57Unsupported: 'פורמט E57 לא נתמך: ',
    e57Truncated: 'הקובץ נקטע באמצע הקריאה.',
    e57BadPacket: 'נמצאה חבילת נתונים לא מוכרת בקובץ.',
    e57NoCoords: 'לא נמצאו שדות קואורדינטות בקובץ.',/*@/STUDIO*/
    help: `
    <h3>כניסה לסיור</h3>
    <ul>
      <li>בוחרים את תיקיית הסיור (קובץ OBJ, קובץ MTL וקבצי הטקסטורה) או קובץ E57 של ענן נקודות. המודל נפתח במבט-על.</li>
      <li>לוחצים על נקודה ברצפה כדי להיכנס אליה. העכבר תמיד חופשי: גוררים כדי להסתכל סביב, ולוחצים על העיגול ברצפה כדי ללכת אליו, כמו ב-Matterport.</li>
    </ul>
    <h3>ניווט</h3>
    <ul>
      <li><b>גרירה עם העכבר</b> מסובבת את המבט (התמונה זזה אחרי הסמן). אפשר גם <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> לתנועה, <kbd>Shift</kbd> מהר יותר, <kbd>E</kbd> / <kbd>Q</kbd> למעלה ולמטה (במצב טיסה).</li>
      <li><kbd>G</kbd> מחליף בין טיסה חופשית להליכה (עם התנגשות בקירות וצמידות לרצפה).</li>
      <li>קליק על העיגול ברצפה: קפיצה אליו. על קירות ותקרה מופיע אותו עיגול בלבן שקוף, וקליק עליו מקרב אותך לקיר.</li>
      <li><kbd>גלגלת</kbd> זום. במבט-על מתקרבים לנקודה שמתחת לסמן, ובתוך הסיור משנים את שדה הראייה.</li>
      <li><kbd>Esc</kbd> סוגר חלון פתוח או יוצא ממצב מדידה.</li>
    </ul>
    <h3>מצבי תצוגה וקומות</h3>
    <ul>
      <li>הלחצנים <b>מבט על</b> ו<b>תלת-ממד</b> בתחתית המסך (או <kbd>O</kbd>) מחליפים בין המבט מלמעלה לטיול בתוך המבנה.</li>
      <li>סרגל הקומות בתחתית, או <kbd>1</kbd>-<kbd>9</kbd> לקומה ו-<kbd>0</kbd> לכל הקומות. בחירת קומה מסתירה את מה שמעליה.</li>
      <li><kbd>B</kbd> מחליף בין תצוגה בשני צדדים לצד אחד, <kbd>R</kbd> מסובב את המודל ב-90° אם הוא נטען על הצד (בקבצי OBJ).</li>
      <li><b>מיני-מפה</b> בפינה (במצב תלת-ממד) מראה את תוכנית הקומה שבה אתם נמצאים, את מיקומכם ואת כיוון המבט. לחיצה על נקודה במפה מעבירה אתכם אליה.</li>
      <li>הלחצן <b>צילום</b> שומר תמונה של התצוגה עם הלוגו של Gambit360 ושם הפרויקט.</li>
      <li>הלחצן <b>נקודות</b> פותח רשימת נקודות מבט: לחיצה על נקודה מעבירה אליה. ב-Studio אפשר להוסיף את המיקום הנוכחי, לתת שם ולמחוק. בקובץ E57 הרשימה מתמלאת אוטומטית במיקומי הסריקה. הנקודות נשמרות בחבילה ללקוח, והלקוח יכול להוסיף נקודות משלו (הן נשמרות רק בדפדפן שלו, והנקודות שלכם נעולות אצלו). הלקוח יכול ללחוץ "ייצוא" ולשלוח לכם את הקובץ, ואתם מוסיפים אותו ב-Studio עם "ייבוא".</li>
    </ul>
    <h3>מדידת מרחק</h3>
    <ul>
      <li><kbd>M</kbd> או הכפתור <b>מדידה</b>. לוחצים על שתי נקודות על המודל, והמרחק מופיע על הקו.</li>
      <li>נקודה לבנה מראה בדיוק איפה הלחיצה תנחת.</li>
    </ul>
    <h3>מדידת שטח</h3>
    <ul>
      <li><kbd>P</kbd> או הכפתור <b>שטח</b>. לוחצים על פינות השטח לפי הסדר.</li>
      <li>לסיום: <kbd>Enter</kbd>, או לחיצה על הנקודה הראשונה (היא נצבעת בצהוב כשהסמן קרוב אליה). השטח מוצג במ"ר.</li>
      <li><kbd>Backspace</kbd> מבטל את הפינה האחרונה בזמן ציור.</li>
    </ul>
    <h3>דיוק ועריכה</h3>
    <ul>
      <li>אפשר לגרור כל נקודה של מדידה או שטח שהסתיימו, והמספר מתעדכן בזמן אמת.</li>
      <li><kbd>Backspace</kbd> מוחק את המדידה האחרונה, <kbd>X</kbd> מנקה את כולן.</li>
      <li>במצב מדידה או שטח אפשר לגרור עם העכבר כדי לסובב את המבט, וללכת עם <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd>.</li>
      <li><kbd>Esc</kbd> יוצא ממצב מדידה או שטח.</li>
    </ul>
    <h3>ענן נקודות (E57)</h3>
    <ul>
      <li>הקובץ נטען כענן נקודות, מדולל לפי האיכות שבחרת (2, 4 או 8 מיליון נקודות). הצבעים נלקחים מהסריקה אם הם קיימים בקובץ.</li>
      <li><kbd>[</kbd> ו-<kbd>]</kbd> מקטינים ומגדילים את גודל הנקודות.</li>
      <li>במבט-על בוחרים קומה בסרגל כדי לראות חתך פנימי של הקומה. בלי בחירת קומה רואים את המבנה מלמעלה, כולל תקרות.</li>
      <li>הקומות מזוהות לפי מיקומי הסריקה, ולכן הן מופיעות רק אם הקובץ כולל מיקום לכל סריקה.</li>
      <li>כשהקובץ כולל תמונות של Matterport, בתוך המבנה מוצגות תמונות הסריקה במקום הענן. הניווט זהה: לוחצים על הרצפה כדי להתקדם לסריקה הקרובה (או W A S D), וגוררים כדי להסתכל. מבט-על ותלת-ממד מציגים את הענן. את המעבר בין פנורמה לענן עושים בתפריט <b>אפשרויות</b>. בחבילה ללקוח בוחרים את איכות הפנורמות: ככל שהאיכות גבוהה יותר החבילה גדולה יותר.</li>
      <li>הקירות הם נקודות ולא משטחים, לכן ההליכה (G) והבחירה של נקודה ברצפה מדויקות פחות מאשר ב-OBJ. במקום ריק בענן (חור בסריקה) לחיצה לא תמצא נקודה.</li>
    </ul>
    <h3>קישור ל-Matterport וזכירת הקובץ</h3>
    <ul>
      <li>הלחצן <b>סיור Matterport</b> (למעלה מימין) שומר קישור לסיור המקורי של המודל הנוכחי ופותח אותו בלשונית חדשה. הקישור נשמר במחשב לפי שם הקובץ.</li>
      <li>ב-Chrome וב-Edge התוכנה זוכרת את הקובץ או התיקייה האחרונים. בפתיחה הבאה היא טוענת אותם אוטומטית, או מציגה לחצן המשך ומבקשת אישור קריאה אחד. אם הקובץ הועבר או נמחק, צריך לבחור אותו שוב.</li>
      <li>הקובץ עצמו לא מועתק. נשמר רק מצביע אליו.</li>
      <li><b>חבילה ללקוח:</b> אחרי טעינת תיקיית OBJ ושמירת הקישור, לחצו "יצירת חבילה ללקוח" ובחרו תיקיית יעד (אפשר ליצור תיקייה חדשה ללקוח). הצפיין, lib ותיקיית <b>model</b> מועתקים אליה, וכל התיקייה מוכנה לשליחה. בפעם הראשונה תתבקשו לבחור את התיקייה שבה נמצא הצפיין. כשהלקוח פותח את הצפיין, הסיור נטען מיד, ואם אין תיקיית model נפתח חלון הטעינה הרגיל.</li>
    </ul>
    <h3>הגדרות</h3>
    <ul>
      <li>הלחצן <b>צבע</b> משנה את צבע הממשק, המדידות והעיגול ברצפה. הבחירה נשמרת במחשב. ברירת המחדל היא ציאן.</li>
      <li>הלחצן <b>English</b> מחליף את שפת הממשק, והבחירה נשמרת.</li>
      <li>הלחצן <b>שיפור תמונה</b> (בקבצי OBJ) מגביר מעט ניגודיות וצבע, כי טקסטורות של סריקות נוטות להיראות חיוורות. אפשר לכבות אותו.</li>
      <li><kbd>H</kbd> פותח וסוגר את העזרה.</li>
    </ul>
    <h3>חשוב לדעת</h3>
    <ul>
      <li>במדידות ב-OBJ אני מניח שהמודל בנוי במטרים. כדאי לבדוק על מידה מוכרת, כמו רוחב דלת. קובצי E57 הם תמיד במטרים.</li>
      <li>הדיוק תלוי באיכות ה-mesh או בצפיפות הנקודות. מדידה אל פינה חדה יכולה לסטות בכמה סנטימטרים.</li>
    </ul>`
  },
  en: {
    title: () => APP_NAME(),
    loadE57Btn: 'Load E57 point cloud', loadObjBtn: 'Load MatterPak folder', startIntro: 'To open a new project, choose what to load. Loading from this screen starts a new project, and saved data of a project with the same name is deleted. To replace the model of an existing project, use the replace button. Everything loads from your computer, no internet needed. An E57 file is read in pieces, so large files work too. The cloud quality is set below.',
    /*@STUDIO*/startObj: 'Choose the folder that contains the tour\'s OBJ file, MTL file and textures. Everything loads from your computer, no internet needed.',
    startE57: 'Or choose an E57 file (point cloud). The file is read from your computer in pieces, so large files work too.',/*@/STUDIO*/
    quality: 'Point cloud quality (E57)',
    qFast: 'Fast (2 million points)', qNormal: 'Normal (4 million)', qHigh: 'High (8 million)',
    helpBtn: 'Help', colorBtn: 'Color', langBtn: 'עברית', homeBtn: 'New project', enhanceBtn: 'Enhance image', helpTip: 'How to use (H)', colorTip: 'Change the interface color', langTip: 'Switch language', homeTip: 'New project: load a new scan file (measurements and areas are cleared)', measureTip: 'Measure distance (M)', areaTip: 'Measure area (P)', mUndoBtn: 'Undo', mUndoTip: 'Undo the last point or measurement (Backspace)', mClearBtn: 'Clear all', mClearTip: 'Delete all measurements and areas (X)', mDoneBtn: 'Finish', mDoneTip: 'Close the area (Enter)', enhanceTip: 'Boost contrast and color', overTip: 'Plan view (O)', b3dTip: '3D view (O)', confirmNew: 'Load the new file? Current measurements will be lost.', cancel: 'Cancel', mpBtn: 'Matterport tour', mpTip: 'Link to the original Matterport tour of this model', mpHint: 'Paste a link to the original Matterport tour of this model. It is saved on this computer and opens in a new tab.', mpPh: 'https://my.matterport.com/show/?m=...', /*@STUDIO*/pkgMpLinkPh: 'Matterport tour link (optional)',/*@/STUDIO*/ mpSave: 'Save', mpOpen: 'Open tour', mpRemove: 'Remove', mpBad: 'The link must start with https://', mpSaved: 'Link saved', mpRemoved: 'Link removed',
    miniToggle: 'Mini map', miniToggleTip: 'Show or hide the mini map', /*@STUDIO*/miniHideTip: 'Hide the mini map (bring it back from the Options menu)',/*@/STUDIO*/
    miniSmall: 'Smaller map', miniBig: 'Larger map', miniReset: 'Back to the default size', promoRec: n => 'Recording video… ' + n + '% · keep this window open and visible · Esc to cancel', promoDone: x => 'Video saved (' + x + ') to your Downloads folder', promoCancel: 'Video recording cancelled', promoNoRec: 'This browser cannot record video. Use Chrome or Edge.', promoOptTitle: 'Record the promo video', promoOptTitleLbl: 'Opening title (project name)', promoOptLogoLbl: 'Logo and closing card', promoOptGo: 'Start recording', promoOptX: 'Cancel', startGoBtn: 'Start point', promoLiveBtn: 'Auto tour', promoLiveTip: 'An automatic walk through the building, like the promo video', promoGenBtn: 'Make a video', promoGenTip: 'Create a promo video of the tour and download it', startGoTip: 'Back to the starting point of the tour', miniZin: 'Zoom in on the map', miniZout: 'Zoom out of the map',
    /*@STUDIO*/pdfH: 'H', pdfRoomsNote: 'Internal size and floor-to-ceiling height (approx.) of each space',/*@/STUDIO*/
    pdfBtn: 'Export floor plans', pdfTip: 'Export a plan of every floor: PDF or DXF for AutoCAD', /*@STUDIO*/planHead: 'Choose the format:', planPdfLbl: 'PDF (A3, vector, for printing)', planDxfLbl: 'DXF for AutoCAD (1:1 in metres, layered)', planGo: 'Export', planNone: 'Tick at least one format', pdfBusy: n => 'Preparing PDF plans… ' + n + '%', pdfDone: 'The PDF was created', pdfFail: 'PDF export failed: ', pdfNeedObj: 'Plan export is only available for OBJ models',  dxfDone: 'The DXF was created', dxfFail: 'DXF export failed: ',/*@/STUDIO*/
    optBtn: 'Options', optTip: 'Load, package, help, color and language',
    pkgTop: 'Client package', pkgTopTip: 'Create a client package',
    viewsNoneToExport: 'You have no points of your own to export yet', tourNew: 'Open in a new tab', tourShare: 'Share', tourCopy: 'Copy link', tourCopied: 'Copied ✓', tourCopyFail: 'Copy failed', tourClose: 'Close',
    contactMsg: 'If the tour does not open (it was removed or is private), please contact Gambit360 to renew the hosting.<br>Phone: <a href="tel:0515583008" dir="ltr">051-558-3008</a><br>Email: <a href="mailto:contact@gambit360.co.il">contact@gambit360.co.il</a>',
 /*@STUDIO*/logoLbl: 'Client logo:', logoPick: 'Choose a logo…', logoReset: 'Default',/*@/STUDIO*/ logoDefault: 'Default (Gambit360)', logoCustom: 'Custom logo', logoBad: 'Could not read the image file.',
    projSave: 'Save project', projOpenExisting: 'Open an existing project', welcome: '🎉 Welcome 👋✨', pkgSwapBtn: 'Replace E57 point cloud', /*@STUDIO*/pkgSwapObj: 'Replace MatterPak folder', pkgSwapTipObj: 'Load a new MatterPak folder into the same project: tags, locations, floor names, measurements and settings are kept', pkgSwapTip: 'Load a new E57 into the same project: tags, locations, floor names, measurements and settings are kept', pkgSwapDone: n => 'Model replaced by ' + n + '. The rest of the project was kept.', pkgSwapNo: 'No project is loaded.',/*@/STUDIO*/ projOpen: 'Open project', /*@STUDIO*/projSaved: n => 'Project saved: ' + n, projSaveFail: 'Could not save the project: ', projBad: 'This is not a Gambit360 project file.', projPick: n => 'To finish opening "' + n + '", choose its E57 file (or OBJ folder) with the button above. Then save the project, and next time it opens directly.', projPickBtn: n => 'Choose the scan file of "' + n + '"',/*@/STUDIO*/ projMismatch: (a, b) => 'The loaded model (' + a + ') differs from the project model (' + b + '), so the project data was not applied.', /*@STUDIO*/projOpened: n => 'Project opened: ' + n,
    pkgClientUpdLbl: 'Let the client load updates', updLoadBtn: 'Load updates',/*@/STUDIO*/ mineSaveBtn: 'Save my changes', mineLoadBtn: 'Load my changes', /*@STUDIO*/pkgMpLbl: 'Matterport tour', pkgMiniLbl: 'Mini-map closed at first visit', pkgClientTagsLbl: 'Let the client edit names and tags', pkgCloudLbl: 'Let the client see the point cloud',
    promoOptTitle: 'Record the promo video', promoOptTitleLbl: 'Opening title (project name)', promoOptLogoLbl: 'Logo and closing card', promoOptGo: 'Start recording', promoOptX: 'Cancel',/*@/STUDIO*/
    marksShowLbl: 'Show tags and names on screen', tabTags: 'Tags', tagAdd: 'Add tag', tagEmpty: 'No tags yet. Press "Add tag", pick a spot on the model, then fill in a title, description and icon.', tagTitlePh: 'Title', tagDescPh: 'Description (optional)', tagLinkPh: 'Link (optional), e.g. https://…', tagImgPick: 'Choose image', tagImgDel: 'Remove image', tagColor: 'Colour:', tagNew: 'New tag', tagEdit: 'Edit tag', /*@STUDIO*/tagNext: 'Next – pick a spot on the model',/*@/STUDIO*/ tagSave: 'Save', tagPlace: 'Click the spot on the model where the tag should appear (Esc to cancel)', tagEdt: 'Edit', tagOpenLink: 'Open the link', tagGo: 'Go to tag',
    /*@STUDIO*/clTitle: 'Client experience', startSetTip: 'Uses the current position and view',/*@/STUDIO*/ startSet: 'Set start point', startClear: 'Clear', /*@STUDIO*/startOpenLbl: 'Open the tour at the start point',/*@/STUDIO*/ startNone: 'No start point set', startOk: 'Start point set', startNeed3D: 'Stand inside the model (not in bird\'s-eye view) to set the start point', /*@STUDIO*/hideLbl: 'What the client sees:',/*@/STUDIO*/ hMeasure: 'Measure', hArea: 'Area', hShot: 'Photo', hFloors: 'Floor selector', hModes: 'Bird\'s-eye and 3D', hPoints: 'Points and names', hMini: 'Mini-map',
    /*@STUDIO*/pkgNoPromo: 'Note: no video is included, so the client will not see a video button.', pkgPromoLbl: 'Promo video:', pkgPickSrc: 'Now choose the folder that holds Gambit360 Studio.html (only once, it is remembered).', pkgPromoModeLbl: 'Promo button for the client:', pkgPromoModeVideo: 'Plays the attached video', pkgPromoModeLive: 'A live walk through the building (default, no file)', pkgPromoModeGen: 'The client makes a video and downloads it',/*@/STUDIO*/ pkgPromoPick: 'Choose a video file…', pkgPromoNone: 'No video. Record one with "Promo video" or choose a file.', pkgPromoReady: mb => 'ready (' + mb + ' MB)', promoPlay: 'Video', promoPlayTip: 'Watch the promo video of this property', promoDl: 'Download the video', promoBtn: 'Promo video', promoTip: 'Create a 30-second promo video automatically: a turn around the building, a walk inside and back out', /*@STUDIO*/promoRec: n => 'Recording promo video… ' + n + '% · keep this window open and visible · Esc to cancel', promoDone: x => 'Promo video saved (' + x + ') to your Downloads folder', promoCancel: 'Video recording cancelled', promoNoRec: 'This browser cannot record video. Use Chrome or Edge.',/*@/STUDIO*/ shotBtn: 'Snapshot', shotTip: 'Save an image of the view with the logo',
    /*@STUDIO*/pkgNamePh: 'Project name (shown to the client)',
    pkgMgrPh: 'Project manager (shown to the client)',
    pkgStartLbl: 'Storage starts', pkgDurLbl: 'Storage period', unitM: 'months', unitD: 'days',/*@/STUDIO*/
    expiredTitle: 'This tour has expired', expiredMsg: 'To renew the storage, please get in touch.', expiredContact: 'Phone: <a href="tel:0515583008" dir="ltr">051-558-3008</a><br>Email: <a href="mailto:contact@gambit360.co.il">contact@gambit360.co.il</a>',
    expLeft: n => n === 0 ? 'Last day of storage today' : n === 1 ? '1 day of storage left' : n + ' days of storage left', expEnded: 'Storage period has ended',
    /*@STUDIO*/updBtn: 'Updates', updTitle: 'Viewer updates for clients', updUrlPh: 'Website folder address, e.g. https://gambit360.co.il/viewer/', updSave: 'Save address', updPublish: 'Publish update',
    updHint: 'Clients with a new package get the update when they are online. The address is saved in packages created from now on. After publishing, upload the viewer-update folder to the website folder.',
    updNeedUrl: 'Enter the website folder address first.', updNeedSrc: 'Choose the Studio folder first (Client package panel).', updDone: (v, f) => 'Update ' + v + ' published. The viewer-update folder was created inside "' + f + '". Upload the two files in it to the website folder.',
    updAvail: 'A new version of the viewer is available', updNow: 'Update', updDownload: 'Download updated file',/*@/STUDIO*/
    tabPoints: 'Points', tabRooms: 'Names', roomEmpty: 'No names yet. Press "Add name" and pick a spot on the map.',
    roomPlace: 'Click on the map where you want the tag (Esc to cancel). You can drag a tag to move it.',
    roomAdd: 'Add name', roomNamePh: 'Name (e.g. Living room)', roomDefault: n => 'Room ' + n,
    a11yBtn: 'Accessibility', a11yTitle: 'Accessibility', a11yText: 'Text size', a11yNormal: 'Normal', a11yLarge: 'Large', a11yXL: 'Extra large', a11yContrast: 'High contrast', a11yMotion: 'Reduce motion (no animations)', a11yOn: 'On', a11yOff: 'Off', a11yReset: 'Reset',
    termsBtn: 'Terms of use', termsTitle: 'Terms of use', termsSave: 'Save', termsReset: 'Restore default text', termsHint: 'The text is saved in the Studio and goes into every new package.',
    termsText: '1. Ownership and copyright - The model, photographs and related files were created by Gambit360, which retains all rights in them. The client receives a non-exclusive license to use them for the project they were ordered for. Gambit360 may also use the material for other purposes, such as its portfolio.\n\n2. Permitted use - The documentation is intended for the client, the project manager and the professionals involved in the project, for planning, supervision, maintenance and record keeping.\n\n3. Third parties - Do not distribute, sell or pass the files to anyone outside the project without written approval from Gambit360.\n\n4. Nature and accuracy - The model is a visual record. Dimensions and positions in it are estimates and do not replace an engineering survey or as-made drawings. Do not rely on it instead of checking on site.\n\n5. No annual storage - Delivery of this package does not include hosting or maintenance of the Matterport tour. The online tour may be private or deleted; in that case contact Gambit360 to renew storage.\n\n6. Liability - Gambit360 is not liable for direct or indirect damage arising from use of, or reliance on, the documentation, beyond the amount paid for the order.\n\n7. Privacy - The documentation may include identifying details of the property. The client is responsible for keeping them confidential and not distributing them.\n\nPhone: 051-558-3008 · Email: contact@gambit360.co.il',
    /*@STUDIO*/pmLabel: 'Project manager',
    pkgSrcSaved: 'The Studio folder was saved. Now press "Create client package".',
    srcBtn: 'Choose the Studio folder', srcBtnChange: 'Change the Studio folder',
    pkgNeedSrc: 'First press "Step 1: choose the Studio folder" and choose the folder that holds Gambit360 Studio.html (with its lib folder).',
    pkgBadSrc: (n, h, l) => 'In the folder "' + n + '": viewer file ' + (h ? 'found' : 'not found') + ', lib folder ' + (l ? 'found (' + l + ' files)' : 'not found or empty') + '. Choose the folder that directly contains the HTML file and the lib folder.',
    pkgAgain: 'Press "Create client package" again (the browser needed one more confirmation).', pkgCopying: 'Copying the viewer…',
    pkgHint: 'Create a client package: first choose the Studio folder once. After that each press creates the package (and, if you like, a ZIP) in its Export\\Client Packages folder, and shows copy-path and open buttons.',
    pkgObfLbl: 'Scramble the code (copy protection)', freshConfirm: n => 'Saved data exists for a project named "' + n + '" (points, names, settings, logo). Loading a new model starts a new project and this data will be deleted.\n\nTo replace the model of an existing project use the replace button in the package panel.\n\nContinue and delete?', obfWarn: '⚠ Note: without scrambling the viewer code is readable, and anyone who gets the file can read and copy it.', obfBusy: 'Scrambling the viewer code, this can take a few seconds…', obfMissing: 'The scrambling tool was not found. Save index.browser.js of javascript-obfuscator as javascript-obfuscator.js in a folder named tools inside the Studio folder, or untick "Scramble the code".',
    pkgBtn: 'Create client package', pkgHead: 'Create client package:', pkgSyncBtn: 'Sync changes to the package', pkgPartModelLbl: 'Model (points and images)', pkgPartUiLbl: 'Viewer (HTML file)', pkgPartSetLbl: 'Settings (tags, names, permissions, expiry)', pkgPartNone: 'Tick at least one: model, viewer or settings.', pkgUiDone: (n, f) => n + ' was updated in the "' + f + '" folder with the new viewer. Settings were not changed: they stay as they are in the client model\\manifest.js.', pkgBothDone: (n, f) => n + ' and the package settings were updated in the "' + f + '" folder. Sending the client the HTML file alone (same name) is enough.', pkgHtmlBtn: 'Create a new HTML file for the client', pkgHtmlTip: 'One file that replaces the client file: new viewer and current settings, without the model files', htmlFileDone: (n, f) => n + ' was updated in the "' + f + '" folder (the previous file was replaced). The client replaces his file with it (same name).', pkgUpdFileBtn: 'Create settings update file', pkgUpdFileTip: 'A small file the client loads with "Load updates": expiry, link, titles, points and tags. The viewer itself is not changed', pkgMineBtn: 'Load changes from a client', pkgMineTip: 'Adds the tags and names the client saved to a file to the project', updFileDone: (n, f) => 'Update file created: ' + n + ' (in the "' + f + '" folder). Send it to the client.', updFileNone: 'First choose the Studio folder.', updBad: 'This is not a valid update file.', updOther: 'This update file belongs to another project.', updLoaded: 'Update loaded. Reloading the page…', updFail: 'Loading the update failed: ',/*@/STUDIO*/ mineSavedMsg: 'Changes saved to a file.', mineBad: 'This is not a valid changes file.', mineOther: 'The file belongs to another project.', mineLoaded: n => n + ' items loaded.', /*@STUDIO*/pkgSyncTip: 'Updates the settings of an existing package (not the viewer) without rewriting the model', pkgSyncNone: n => 'No package named "' + n + '" was found. Create the package once before syncing.', pkgSyncOk: n => 'Package "' + n + '" updated: points, names, tags, start point and settings. Saved to Export\\Client Packages\\' + n + '\\model\\manifest.js (send this file to the client). The viewer was not updated (create a new HTML file for that) and neither was the ZIP file (if any).', pkgSyncFail: 'Sync failed: ', srcDiff: d => 'differs from the folder the Studio runs from: ' + d, srcMismatch: d => 'The saved Studio folder is not the folder the Studio runs from. Choose it now: ' + d,/*@/STUDIO*/ pkgCancelBtn: 'Stop creating the package', /*@STUDIO*/pkgCancelling: 'Stopping…', pkgCancelledMsg: 'Creation stopped. The package is incomplete: press "Sync changes to the package" or "Create client package" again to finish it.', pkgSyncMissing: n => 'The package "' + n + '" is missing or incomplete (no model\\manifest.js). Creating it again…', pkgNoFS: 'Creating a package needs Chrome or Edge and a loaded OBJ folder or E57 file.', pkgFail: 'Could not create the package: ',
    pkgWriting: (i, n) => 'Writing file ' + i + ' of ' + n + '…', pkgDone: (n, p, z) => 'Package created in "' + n + '", in the sub-folder "' + p + '"' + (z ? ', plus ' + p + '.zip' : '') + '. Send the client the folder or the ZIP.',
    pkgCopy: 'Copy folder path', pkgOpenBr: 'Open in the browser', pkgCopied: 'Path copied. Paste it into the address bar of File Explorer.',
    pkgTipPath: 'To see the package path, open the Studio directly from the computer (a local file).',
    pkgNeedRW: 'No write permission for the Studio folder. Press "Change the Studio folder" and choose it again (a folder inside Desktop or Downloads, not Desktop or Downloads themselves).',
    pkgZip: 'Also create a ZIP', pkgOpenDirLbl: 'Open the folder when saving is done', pkgZipping: (i, n) => 'Building the ZIP: file ' + i + ' of ' + n + '…',/*@/STUDIO*/
    pkgLoading: 'Loading the tour from the package…', pkgLoadingN: (i, n) => 'Loading the tour from the package: file ' + i + ' of ' + n, resume: n => 'Continue where you left off: ' + n, resumeDenied: 'Read permission for the file was not granted. Choose it again.', resumeFail: 'Could not open the last file. It may have been moved or deleted, choose it again.',
    copyright: '© 2026 Gambit360. All rights reserved.',
    viewsExport: 'Export', viewsImport: 'Import', viewsImported: n => n + ' points added', viewsOtherModel: '(the file was made for another model, check that the positions fit)', viewsBadFile: 'This is not a valid points file',
    viewsBtn: 'Points of interest', viewsTip: 'List of viewpoints', viewsTitle: 'Viewpoints', viewsAdd: 'Add position', viewsNamePh: 'Name (optional)',
    viewsEmpty: 'No points in this model yet.', viewsNeed3D: 'Switch to 3D mode to save a point', viewsDefault: n => 'Point ' + n, viewsDel: 'Delete',
    miniNone: 'Cannot move to that spot (no floor there)',
    themeBtn: 'Switch between dark and light mode', hintText: 'Tip: press "3D" and then a spot on the floor to enter the tour. Drag to look around, click the ring to move, and use the wheel to zoom. (click to close)',
    colorCustom: 'Custom color', colorReset: 'Reset to default color',
    swCyan: 'Cyan (default)', swBlue: 'Blue', swGreen: 'Green', swOrange: 'Orange', swPink: 'Pink', swPurple: 'Purple', swYellow: 'Yellow', swRed: 'Red',
    helpTitle: 'How to use', close: 'Close',
    click: 'Click to start exploring',
    measureBtn: 'Measure', areaBtn: 'Area', bOver: 'Plan', b3d: '3D',
    panoToPano: 'Real view', panoToCloud: 'Point cloud view', panoTip: 'Switch between the point cloud and the scan panorama pictures', panoOnMsg: 'Panorama view: the scan pictures are shown inside the building', panoOffMsg: 'Point cloud view', /*@STUDIO*/panoLoading: 'Loading panorama…',/*@/STUDIO*/ panoFail: 'Could not load the panorama.',
    /*@STUDIO*/pkgPanoLbl: 'Panoramas:',/*@/STUDIO*/ pkgPanoOff: 'No panoramas', pkgPanoOpt: (n, mb) => n + ' (about ' + mb + ' MB)', /*@STUDIO*/pkgPanoN: (i, n) => 'Writing panorama ' + i + ' of ' + n + '…', pkgPcN: (i, n) => 'Writing point cloud ' + i + ' of ' + n + '…', pkgPanoPrep: 'Preparing the panoramas…',/*@/STUDIO*/
    pQLow: 'Light', pQMid: 'Medium', pQHigh: 'Original quality',
    floorAll: 'All floors', floorN: n => 'Floor ' + n, floorRename: 'Rename floor',
    modeFly: 'Fly', modeWalk: 'Walk',
    cm: ' cm', m: ' m', m2: ' m²',
    measureHint: 'Measure: click the first point (Esc to exit)',
    areaHint: 'Area: click the corners of the area (Esc to exit)',
    secondPoint: 'Click the second point',
    measured: v => 'Measured: ' + v + ' | drag a point to adjust',
    areaMore: 'Click more corners',
    areaFinish: 'To finish: click the first point, "Finish" or Enter',
    areaDone: v => 'Area: ' + v + ' | drag a point to adjust',
    /*@STUDIO*/enter3d: 'Click a spot on the floor to enter 3D',/*@/STUDIO*/ dollHint: 'Drag to rotate · wheel to zoom · pick a floor in the bar · click the floor to step inside',
    libMissing: 'The library files are missing from the lib folder. Run setup.py once (internet is needed only for this step).',
    noObj: 'No OBJ file was found in the selected folder.',
    loading: 'Loading the model, this can take a moment...',
    loadFail: 'Loading failed: ',
    /*@STUDIO*/e57Reading: (i, n, p) => 'Reading the E57 file: scan ' + i + ' of ' + n + ' (' + p + '%)',
    e57Grid: 'Building the index used for picking points and measuring...',
    e57NotE57: 'This is not a valid E57 file.',
    e57NoPoints: 'No points were found in the file.',
    e57Unsupported: 'Unsupported E57 format: ',
    e57Truncated: 'The file ended in the middle of reading.',
    e57BadPacket: 'The file contains an unknown data packet.',
    e57NoCoords: 'No coordinate fields were found in the file.',/*@/STUDIO*/
    help: `
    <h3>Entering the tour</h3>
    <ul>
      <li>Choose the tour folder (OBJ, MTL and texture files) or an E57 point-cloud file. The model opens in plan view.</li>
      <li>Click a spot on the floor to enter it. The mouse is always free: drag to look around, and click the ring on the floor to walk there, like in Matterport.</li>
    </ul>
    <h3>Navigation</h3>
    <ul>
      <li><b>Dragging with the mouse</b> turns the view (the picture follows the cursor). You can also use <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> to move, <kbd>Shift</kbd> for faster, <kbd>E</kbd> / <kbd>Q</kbd> up and down (fly mode).</li>
      <li><kbd>G</kbd> switches between free flying and walking (wall collision, stays on the floor).</li>
      <li>Click the ring on the floor to jump there. On walls and ceilings the same ring appears in faint white, and clicking it takes you close to the wall.</li>
      <li><kbd>Wheel</kbd> zooms. In plan view it zooms toward the point under the cursor; inside the tour it changes the field of view.</li>
      <li><kbd>Esc</kbd> closes an open window or leaves measure mode.</li>
    </ul>
    <h3>View modes and floors</h3>
    <ul>
      <li>The <b>Plan</b> and <b>3D</b> buttons at the bottom (or <kbd>O</kbd>) switch between the plan (top) view and walking inside the building.</li>
      <li>The floor bar at the bottom, or <kbd>1</kbd>-<kbd>9</kbd> for a floor and <kbd>0</kbd> for all floors. Choosing a floor hides everything above it.</li>
      <li><kbd>B</kbd> switches between two-sided and one-sided display, <kbd>R</kbd> rotates the model 90° if it loaded on its side (OBJ files).</li>
      <li>The <b>mini-map</b> in the corner (in 3D mode) shows the plan of the floor you are on, your position and viewing direction. Click a spot on the map to go there.</li>
      <li>The <b>Snapshot</b> button saves an image of the view with the Gambit360 logo and the project name.</li>
      <li>The <b>Views</b> button opens a list of viewpoints: click one to go there. In the Studio you can add the current position, name it and delete it. For an E57 file the list is filled with the scan positions. The points are saved in the client package, and the client can add points of his own (kept only in his browser; yours are locked for him). He can press "Export" and send you the file, and you add it in the Studio with "Import".</li>
    </ul>
    <h3>Measuring distance</h3>
    <ul>
      <li><kbd>M</kbd> or the <b>Measure</b> button. Click two points on the model and the distance appears on the line.</li>
      <li>A white dot shows exactly where your click will land.</li>
    </ul>
    <h3>Measuring area</h3>
    <ul>
      <li><kbd>P</kbd> or the <b>Area</b> button. Click the corners of the area in order.</li>
      <li>To finish: <kbd>Enter</kbd>, or click the first point (it turns yellow when the cursor is close). The area is shown in m².</li>
      <li><kbd>Backspace</kbd> removes the last corner while drawing.</li>
    </ul>
    <h3>Precision and editing</h3>
    <ul>
      <li>You can drag any point of a finished measurement or area, and the number updates live.</li>
      <li><kbd>Backspace</kbd> deletes the last measurement, <kbd>X</kbd> clears them all.</li>
      <li>In measure or area mode you can drag with the mouse to rotate the view, and walk with <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd>.</li>
      <li><kbd>Esc</kbd> leaves measure or area mode.</li>
    </ul>
    <h3>Point clouds (E57)</h3>
    <ul>
      <li>The file loads as a point cloud, thinned to the quality you chose (2, 4 or 8 million points). Colors come from the scan when the file has them.</li>
      <li><kbd>[</kbd> and <kbd>]</kbd> make the points smaller and larger.</li>
      <li>In plan view choose a floor in the bar to see a cutaway of that floor. With no floor chosen you see the building from above, ceilings included.</li>
      <li>Floors are detected from the scanner positions, so they appear only if the file stores a position for each scan.</li>
      <li>When the file includes Matterport pictures, the scan pictures are shown inside the building instead of the cloud. Navigation is the same: click the floor to move to the nearest scan (or use W A S D), and drag to look around. The plan and dollhouse views show the cloud. Switch between panorama and cloud in the <b>Options</b> menu. In a client package you choose the panorama quality: the higher it is, the bigger the package.</li>
      <li>Walls are points, not surfaces, so walking (G) and picking a floor spot are less precise than with OBJ. Clicking on an empty spot in the cloud (a hole in the scan) finds nothing.</li>
    </ul>
    <h3>Matterport link and remembering the file</h3>
    <ul>
      <li>The <b>Matterport tour</b> button (top right) saves a link to the original tour of the current model and opens it in a new tab. The link is saved on this computer by file name.</li>
      <li>In Chrome and Edge the app remembers the last file or folder. Next time it loads it automatically, or shows a Continue button and asks for read permission once. If the file was moved or deleted, choose it again.</li>
      <li>The file itself is not copied. Only a pointer to it is saved.</li>
      <li><b>Client package:</b> after loading an OBJ folder and saving the link, press "Create client package" and choose a destination folder (you can create a new folder for the client). The viewer, lib and a <b>model</b> folder are copied into it, and the whole folder is ready to send. The first time you are asked to choose the folder that holds the viewer. When the client opens the viewer the tour loads at once; with no model folder the usual load window appears.</li>
    </ul>
    <h3>Settings</h3>
    <ul>
      <li>The <b>Color</b> button changes the color of the interface, the measurements and the floor ring. The choice is remembered on this computer. Cyan is the default.</li>
      <li>The <b>עברית</b> button switches the interface language, and the choice is remembered.</li>
      <li>The <b>Enhance image</b> button (OBJ files) adds a little contrast and color, since scan textures tend to look washed out. You can turn it off.</li>
      <li><kbd>H</kbd> opens and closes this help.</li>
    </ul>
    <h3>Good to know</h3>
    <ul>
      <li>For OBJ files I assume the model is built in meters, so check against a known size such as a door width. E57 files are always in meters.</li>
      <li>Accuracy depends on mesh quality or point density. Measuring to a sharp corner can be off by a few centimeters.</li>
    </ul>`
  }
};
let LANG = 'he';
try { LANG = localStorage.getItem('tourViewerLang') || 'he'; } catch (e) {}
if (!I18N[LANG]) LANG = 'he';
const TOUCH = !!(window.matchMedia && matchMedia('(pointer: coarse)').matches);   // a phone or tablet: the tips talk about fingers
const TOUCH_TXT = {
  he:{ hintText:'טיפ: לחצו על "תלת-ממד" ואז הקישו על נקודה ברצפה כדי להיכנס לסיור. גררו באצבע כדי להסתכל, הקישו על העיגול כדי לנוע, וצבטו כדי לקרב ולהרחיק. (הקשה כדי לסגור)', dollHint:'גרור באצבע לסיבוב · צביטה לזום · בחרו קומה בסרגל · הקישו על הרצפה כדי להיכנס', measureHint:'מדידה: לחיצה ארוכה על הנקודה הראשונה', secondPoint:'לחיצה ארוכה על הנקודה השנייה', areaHint:'שטח: לחיצה ארוכה על כל פינה', areaMore:'לחיצה ארוכה על עוד פינות', areaFinish:'לסיום: לחיצה ארוכה על הנקודה הראשונה או ✓' },
  en:{ hintText:'Tip: press "3D" and then tap a spot on the floor to enter the tour. Drag with a finger to look around, tap the ring to move, and pinch to zoom. (tap to close)', dollHint:'Drag with a finger to rotate · pinch to zoom · pick a floor in the bar · tap the floor to step inside', measureHint:'Measure: press and hold the first point', secondPoint:'Press and hold the second point', areaHint:'Area: press and hold each corner', areaMore:'Press and hold more corners', areaFinish:'To finish: press and hold the first point, or ✓' } };
function t(key, ...a) {
  let v = TOUCH && TOUCH_TXT[LANG] && TOUCH_TXT[LANG][key] || I18N[LANG][key];
  if (v === undefined) v = I18N.he[key];
  return typeof v === 'function' ? v(...a) : v;
}
function applyLang(lang, save) {
  LANG = lang;
  if (save) { try { localStorage.setItem('tourViewerLang', lang); } catch (e) {} }
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr';
  document.title = (window.PROJ_TITLE ? window.PROJ_TITLE + ' | ' : '') + t('title');
  document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-ph]').forEach(el => { el.placeholder = t(el.dataset.i18nPh); });
  if (window.G360_relang) window.G360_relang();   // texts made by script (logo and video status) follow the language
  document.querySelectorAll('[data-i18n-title]').forEach(el => { el.title = t(el.dataset.i18nTitle); });
  document.querySelectorAll('[data-i18n-html]').forEach(el => { el.innerHTML = t(el.dataset.i18nHtml); });
  document.getElementById('helpBody').innerHTML = t('help');
  document.querySelector('.help-box').setAttribute('aria-label', t('helpTitle'));
  if (onLang) onLang();
}
document.getElementById('langBtn').onclick = () => applyLang(LANG === 'he' ? 'en' : 'he', true);
applyLang(LANG);

