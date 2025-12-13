// languages.js

const TRANSLATIONS = {
    // --- ENGLISH ---
    en: {
        langCode: "en-US",
        // Popup UI
        title: "Nayan Deep",
        subtitle: "Press Ctrl+Shift+E to close",
        pickBtn: "⌖ Pick Button",
        addBtn: "+ Add Row",
        resetBtn: "Reset / Clear All",
        shortcutsHeader: "Shortcuts",
        colId: "Button ID / Selector",
        colKey: "Key Combo",
        emptyMsg: "No shortcuts yet. Click 'Pick Button' to select one.",
        placeholderId: "Enter ID or click Pick",
        placeholderKey: "Press Key..",
        alshort: "Please use letters or numbers only",
        delshort: "Shortcut Deleted",
        
        // Alerts
        deleteRow: "Delete this shortcut?",
        deleteAll: "Are you sure you want to delete ALL shortcuts?",
        
        // NVDA / Voice Announcements
        pickerOn: "Picker Mode On. Click any button on the page.",
        pickerOff: "Picker Mode Cancelled",
        selected: "Button selected. Now press your desired shortcut keys.",
        saved: "Key Saved: ",
        conflict: "Key already used for this site!",
        clicked: "Clicked",
        notFound: "Button not found on this page",
        langChanged: "Language changed to English"
    },

    // --- HINDI (हिंदी) ---
    hi: {
        langCode: "hi-IN",
        // Popup UI
        title: "नयन दीप",
        subtitle: "बंद करने के लिए Ctrl+Shift+E दबाएं",
        pickBtn: "⌖ बटन चुनें",
        addBtn: "+ नया जोड़ें",
        resetBtn: "रीसेट / सभी हटाएं",
        shortcutsHeader: "शॉर्टकट्स",
        colId: "बटन आईडी",
        colKey: "की (Key) कॉम्बो",
        emptyMsg: "कोई शॉर्टकट नहीं है। 'बटन चुनें' पर क्लिक करें।",
        placeholderId: "आईडी दर्ज करें",
        placeholderKey: "की (Key) दबाएं..",
        alshort: "कृपया केवल अक्षरों या अंकों का उपयोग करें।",
        delshort: "शॉर्टकट हटायागया",

        // Alerts
        deleteRow: "क्या आप इस शॉर्टकट को हटाना चाहते हैं?",
        deleteAll: "क्या आप सभी शॉर्टकट हटाना चाहते हैं?",
        
        // NVDA / Voice Announcements
        pickerOn: "पिकर मोड चालू। पेज पर किसी भी बटन पर क्लिक करें।",
        pickerOff: "पिकर मोड रद्द किया गया",
        selected: "बटन चुना गया। अब अपनी पसंद की शॉर्टकट की (Key) दबाएं।",
        saved: "शॉर्टकट सहेजा गया: ",
        conflict: "यह की (Key) पहले से उपयोग में है!",
        clicked: "क्लिक किया",
        notFound: "इस पेज पर बटन नहीं मिला",
        langChanged: "भाषा हिंदी में बदल दी गई"
    },

    // --- MARATHI (मराठी) ---
    mr: {
        langCode: "mr-IN",
        // Popup UI
        title: "नयन दीप",
        subtitle: "बंद करण्यासाठी Ctrl+Shift+E दाबा",
        pickBtn: "⌖ बटन निवडा",
        addBtn: "+ नवीन जोडा",
        resetBtn: "रीसेट / सर्व हटवा",
        shortcutsHeader: "शॉर्टकट्स",
        colId: "बटन आयडी",
        colKey: "की (Key) कॉम्बो",
        emptyMsg: "अद्याप शॉर्टकट नाहीत. 'बटन निवडा' क्लिक करा.",
        placeholderId: "आयडी टाका",
        placeholderKey: "की (Key) दाबा..",
        alshort:"कृपया फक्त अक्षरे किंवा अंक वापरा.",
        // Alerts
        deleteRow: "हा शॉर्टकट हटवायचा का?",
        deleteAll: "तुम्हाला सर्व शॉर्टकट हटवायचे आहेत का?",
        
        // NVDA / Voice Announcements
        pickerOn: "पिकर मोड चालू. पेजवरील कोणत्याही बटणावर क्लिक करा.",
        pickerOff: "पिकर मोड रद्द केला",
        selected: "बटन निवडले. आता तुमची शॉर्टकट की (Key) दाबा.",
        saved: "शॉर्टकट जतन झाला: ",
        conflict: "ही की (Key) आधीच वापरली आहे!",
        clicked: "क्लिक केले",
        notFound: "या पेजवर बटन सापडले नाही",
        langChanged: "भाषा मराठीत बदलली"
    }
};