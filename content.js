// content.js - Key Listener, Element Picker & Domain Locking

// --- GLOBAL VARIABLES ---
let cachedConfig = [];
let pickingMode = false;
let lastHighlighted = null;

// --- PART 1: NVDA ANNOUNCER (For Accessibility) ---
const announcer = document.createElement('div');
announcer.setAttribute('aria-live', 'assertive');
announcer.style.cssText = 'position:absolute; width:1px; height:1px; overflow:hidden; clip:rect(0,0,0,0);';
document.body.appendChild(announcer);

function speak(msg) {
    announcer.textContent = '';
    setTimeout(() => { announcer.textContent = msg; }, 50);
}

// --- PART 2: LOAD DATA ---
function loadConfig() {
    chrome.storage.local.get(['keyConfig'], (result) => {
        cachedConfig = result.keyConfig || [];
    });
}
loadConfig();
chrome.storage.onChanged.addListener((changes) => {
    if (changes.keyConfig) {
        cachedConfig = changes.keyConfig.newValue || [];
    }
});

// --- PART 3: KEY SHORTCUT LISTENER ---
document.addEventListener('keydown', (e) => {
    if (pickingMode) return; // Don't trigger shortcuts while picking!
    if (e.target.matches('input, textarea, [contenteditable]')) return;
    if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) return;

    // 1. Build the Key String
    let combo = [];
    if (e.ctrlKey) combo.push('Ctrl');
    if (e.altKey) combo.push('Alt');
    if (e.shiftKey) combo.push('Shift');
    if (e.metaKey) combo.push('Meta');
    let char = e.key.length === 1 ? e.key.toUpperCase() : e.key;
    combo.push(char);
    
    const pressedString = combo.join('+');
    const currentDomain = window.location.hostname;
    const match = cachedConfig.find(item => {
        if (item.key !== pressedString) return false;
        if (item.domain && item.domain !== currentDomain) return false;
        
        return true;
    });

    if (match && match.id) {
        e.preventDefault();
        e.stopPropagation();

        const btn = document.querySelector(match.id);
        if (btn) {
            btn.click();
            btn.focus();
            speak("Clicked");
            const originalOutline = btn.style.outline;
            btn.style.outline = "3px solid yellow";
            setTimeout(() => btn.style.outline = originalOutline, 200);
        } 
        else {
            console.log("Button not found:", match.id);
            speak("Button not found on this page");
        }
    }
});

// --- PART 4: PICKER MODE ---
chrome.runtime.onMessage.addListener((msg) => {
    if (msg.action === "togglePicker") {
        enablePicker();
    }
});

function enablePicker() {
    pickingMode = true;
    document.body.style.cursor = 'crosshair';
    speak("Picker Mode On. Click a button.");
    
    document.addEventListener('mouseover', highlightElement, true);
    document.addEventListener('click', selectElement, true);
    document.addEventListener('keydown', exitPickerOnEsc, true);
}

function disablePicker() {
    pickingMode = false;
    document.body.style.cursor = 'default';
    if (lastHighlighted) lastHighlighted.style.outline = '';
    
    document.removeEventListener('mouseover', highlightElement, true);
    document.removeEventListener('click', selectElement, true);
    document.removeEventListener('keydown', exitPickerOnEsc, true);
}

function exitPickerOnEsc(e) {
    if (e.key === 'Escape') {
        disablePicker();
        speak("Picker Mode Cancelled");
    }
}

function highlightElement(e) {
    if (!pickingMode) return;
    if (lastHighlighted) lastHighlighted.style.outline = '';
    
    e.target.style.outline = '3px solid #ff7b00';
    lastHighlighted = e.target;
}

function selectElement(e) {
    if (!pickingMode) return;
    e.preventDefault();
    e.stopPropagation();
    const target = e.target;
    
    const selector = generateSelector(target);
    const currentDomain = window.location.hostname;
    target.style.outline = '4px solid #00E5FF';
    speak("Button selected. Now press your desired shortcut keys.");
    disablePicker(); 
    recordShortcutForElement(selector, currentDomain, target);
}

function generateSelector(el) {
    if (el.id) return '#' + el.id;
    if (el.getAttribute('aria-label')) return `[aria-label="${el.getAttribute('aria-label')}"]`;
    if (el.classList.length > 0) {
        for (let cls of el.classList) {
            if (cls.length < 25 && !/\d/.test(cls)) return '.' + cls; 
        }
    }
    return el.tagName.toLowerCase();
}

function saveToStorage(selector, keyString, domain) {
    chrome.storage.local.get(['keyConfig'], (data) => {
        let config = data.keyConfig || [];
        const conflictIndex = config.findIndex(item => item.key === keyString && item.domain === domain);
        const newItem = {
            id: selector,
            key: keyString,
            domain: domain
        };
        if (conflictIndex !== -1) {
            config[conflictIndex] = newItem;
        } else {
            config.push(newItem);
        }
        chrome.storage.local.set({ keyConfig: config }, () => {
            cachedConfig = config; 
            console.log("New configuration saved:", newItem);
        });
    });
}

function recordShortcutForElement(selector, domain, visualElement) {
    const keyListener = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) return;
        let combo = [];
        if (e.ctrlKey) combo.push('Ctrl');
        if (e.altKey) combo.push('Alt');
        if (e.shiftKey) combo.push('Shift');
        if (e.metaKey) combo.push('Meta');
        let char = e.key.length === 1 ? e.key.toUpperCase() : e.key;
        combo.push(char);

        const finalKey = combo.join('+');

        saveToStorage(selector, finalKey, domain);

        document.removeEventListener('keydown', keyListener, true);
        
        if (visualElement) visualElement.style.outline = '';
        speak(`Shortcut saved: ${finalKey}`);
        alert(`Success!\nShortcut: ${finalKey}`);
    };
    document.addEventListener('keydown', keyListener, true);
}