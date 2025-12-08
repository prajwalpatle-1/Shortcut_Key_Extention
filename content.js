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
// Load immediately on page load
loadConfig();

// Update automatically if you change settings in the popup
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

    // 2. Find a Match (Check Key AND Domain)
    const currentDomain = window.location.hostname; // e.g., "www.youtube.com"
    
    const match = cachedConfig.find(item => {
        // Must match the key
        if (item.key !== pressedString) return false;

        // logic: If item has a domain, it MUST match current site.
        // If item has NO domain (global), it works everywhere.
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
            
            // Visual Flash (Yellow Outline)
            const originalOutline = btn.style.outline;
            btn.style.outline = "3px solid yellow";
            setTimeout(() => btn.style.outline = originalOutline, 200);
        } else {
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
    
    // Add listeners to highlight and select
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
    
    // Orange highlight while hovering
    e.target.style.outline = '3px solid #ff7b00';
    lastHighlighted = e.target;
}

function selectElement(e) {
    if (!pickingMode) return;
    e.preventDefault();
    e.stopPropagation();

    const target = e.target;
    
    // 1. Generate Selector
    const selector = generateSelector(target);
    
    // 2. Capture Current Domain
    const currentDomain = window.location.hostname;

    // 3. Save Both
    saveSelectorToEmptySlot(selector, currentDomain);
    
    disablePicker();
}

function generateSelector(el) {
    if (el.id) return '#' + el.id;
    if (el.getAttribute('aria-label')) return `[aria-label="${el.getAttribute('aria-label')}"]`;
    if (el.classList.length > 0) {
        for (let cls of el.classList) {
            // Avoid complex generated classes
            if (cls.length < 25 && !/\d/.test(cls)) return '.' + cls; 
        }
    }
    return el.tagName.toLowerCase();
}

function saveSelectorToEmptySlot(selector, domain) {
    chrome.storage.local.get(['keyConfig'], (data) => {
        let config = data.keyConfig || [];
        
        // Find empty slot or create new one
        let emptyIndex = config.findIndex(item => !item.id || item.id === "");
        
        const newItem = {
            id: selector,
            key: '',
            domain: domain // Saving the website name here!
        };

        if (emptyIndex === -1) {
            config.push(newItem);
        } else {
            config[emptyIndex] = newItem;
        }

        chrome.storage.local.set({ keyConfig: config }, () => {
            const cleanName = domain.replace('www.', '');
            alert(`Selected Button!\n\nWebsite: ${cleanName}\nSelector: ${selector}\n\nOpen the extension popup to set the shortcut key.`);
            speak("Button Selected. Open extension to set key.");
        });
    });
}