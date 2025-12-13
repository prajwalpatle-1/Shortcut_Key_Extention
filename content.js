// content.js - Key Listener, Element Picker & Domain Locking

// --- GLOBAL VARIABLES ---
let siteConfig = [];
let pickingMode = false;
let lastHighlighted = null;
let currentLang = 'en';


// --- PART 1: NVDA ANNOUNCER (For Accessibility) ---
const announcer = document.createElement('div');
announcer.setAttribute('aria-live', 'assertive');
announcer.style.cssText = 'position:absolute; width:1px; height:1px; overflow:hidden; clip:rect(0,0,0,0);';
document.body.appendChild(announcer);

function speak(msg) {
    const langCode = TRANSLATIONS[currentLang]?.langCode || 'en-US';
    announcer.setAttribute('lang', langCode);
    announcer.textContent = '';
    setTimeout(() => { announcer.textContent = msg; }, 50);
}

// Translate Helper 
function t(key) {
    return TRANSLATIONS[currentLang][key] || TRANSLATIONS['en'][key];
}

// --- LOAD DATA & DETECT LANG ---
function loadConfig() {
    if (!chrome.runtime?.id) return; 
    const currentDomain = window.location.hostname;

    chrome.storage.local.get([currentDomain, 'appLanguage'], (result) => {
        siteConfig = result[currentDomain] || [];

        if (result.appLanguage) {
            currentLang = result.appLanguage;
            console.log("Content Script: Loaded saved language:", currentLang);
        } 
        else {
            const browserLang = navigator.language.split('-')[0];
            if (typeof TRANSLATIONS !== 'undefined'&& TRANSLATIONS[browserLang]) {
                currentLang = browserLang;
            }
            else {
                currentLang = 'en';
            }
            console.log("Content Script: Auto-detected language:", currentLang);
        }
    });
}
loadConfig();
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "changeLanguage") {
        currentLang = request.language;
        console.log("Language manually changed to:", currentLang);
        const msgText=t('langChanged')
        speak(msgText);
        showToast(msgText);
        sendResponse({ status: "success" });
    }
    if (request.action === "togglePicker") {
        enablePicker();
        sendResponse({ status: "ok" });
    }
    // pick button shortcut
    else if (request.action === "CLICK_PICK_BUTTON") {

        if (typeof enablePicker === "function") {
             enablePicker();
             speak("Picker Enabled"); // Optional feedback
        } 
        // Fallback: Try to find the button and click it
        else {
            const pickBtn = document.querySelector('#picker-btn') || 
                            document.querySelector('.pickerBtn'); 
            if (pickBtn) {
                pickBtn.click();
                pickBtn.focus();

                const btnName = pickBtn.getAttribute('aria-label') || pickBtn.innerText || "Pick Tool";
                if (typeof speak === "function") {
                    speak(`${btnName} ${t("clicked")}`); 
                }
                const originalOutline = pickBtn.style.outline;
                pickBtn.style.outline = "4px solid yellow";
                setTimeout(() => pickBtn.style.outline = originalOutline, 300);
            } 
            else {
                console.log("Pick button not found.");
            }
        }
        sendResponse({ status: "done" });
    }
    return true;
});
chrome.storage.onChanged.addListener((changes) => {
    const currentDomain = window.location.hostname;
    if (changes[currentDomain]) siteConfig= changes[currentDomain].newValue || [];

    if (changes.appLanguage) currentLang = changes.appLanguage.newValue || 'en';
});

// --- PART 2: KEY SHORTCUT LISTENER ---
document.addEventListener('keydown', (e) => {
    
    if (pickingMode) return; // Don't trigger shortcuts while picking!
    if (e.target.matches('input, textarea, [contenteditable]')) return;
    if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) return;

    let combo = [];
    if (e.ctrlKey) combo.push('Ctrl');
    if (e.altKey) combo.push('Alt');
    if (e.shiftKey) combo.push('Shift');
    if (e.metaKey) combo.push('Meta');
    let char = e.key.length === 1 ? e.key.toUpperCase() : e.key;
    combo.push(char);
    
    const pressedString = combo.join('+');
    
    const match = siteConfig.find(item => item.key === pressedString);

    if (match && match.id) {
        e.preventDefault();
        e.stopPropagation();

        const btn = document.querySelector(match.id);
        if (btn) {
            btn.click();
            btn.focus();const btnName = btn.getAttribute('aria-label') || btn.innerText || "Button";
            speak(btnName + " " + t("clicked"));
            const originalOutline = btn.style.outline;
            btn.style.outline = "3px solid yellow";
            setTimeout(() => btn.style.outline = originalOutline, 200);
        } 
        else {
            console.log("Button not found:", match.id);
            speak(t("notFound"));
        }
    }
});

// --- PART 4: PICKER MODE ---
let pickerOverlay;
chrome.runtime.onMessage.addListener((msg,sender,sendResponse) => {
    if (msg.action === "togglePicker") {
        enablePicker();
        speak(t("pickerOn"));
        sendResponse({status: "ok" });
    }
    return true;
});


function enablePicker() {
    pickingMode = true;
    document.body.style.cursor = 'crosshair';
    
    document.addEventListener('mouseover', handleMouseHover, true);
    document.addEventListener('click', handleSelection, true);

    // 2. KEYBOARD Listeners (Tab navigation support)
    document.addEventListener('focus', handleFocusHover, true);
    document.addEventListener('keydown', handleKeySelection, true);

    document.addEventListener('keydown', exitPickerOnEsc, true);
}

function disablePicker() {
    pickingMode = false;
    document.body.style.cursor = 'default';
    if (lastHighlighted) {
        lastHighlighted.style.outline = '';
        lastHighlighted.classList.remove('nayan-highlight');
    }
    
    // Remove MOUSE Listeners
    document.removeEventListener('mouseover', handleMouseHover, true);
    document.removeEventListener('click', handleSelection, true);

    // Remove KEYBOARD Listeners
    document.removeEventListener('focus', handleFocusHover, true);
    document.removeEventListener('keydown', handleKeySelection, true);
    document.removeEventListener('keydown', exitPickerOnEsc, true);
}

function highlightTarget(target) {
    if (!pickingMode || !target) return;

    if (lastHighlighted && lastHighlighted !== target) {
        lastHighlighted.style.outline = '';
    }
    const validElement = target.closest('button, a, input, select, textarea, [role="button"], [tabindex]');
    
    if (validElement) {
        lastHighlighted = validElement;
        validElement.style.outline = '3px solid #ff7b00';
        validElement.focus({ preventScroll: true }); 
    }
}
// --- HANDLERS ---

// 1. Mouse Hover
function handleMouseHover(e) {
    if (!pickingMode) return;
    highlightTarget(e.target);
}

// 2. Keyboard Focus (Tab Key)
function handleFocusHover(e) {
    if (!pickingMode) return;
    highlightTarget(e.target);
}

// 3. Mouse Click Selection
function handleSelection(e) {
    if (!pickingMode) return;
    e.preventDefault();
    e.stopPropagation();

    if (lastHighlighted) {
        finalizeSelection(lastHighlighted);
    }
}

// 4. Keyboard Selection (Enter Key)
function handleKeySelection(e) {
    if (!pickingMode) return;

    if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        if (lastHighlighted) {
            finalizeSelection(lastHighlighted);
        }
    }
}

function exitPickerOnEsc(e) {
    if (e.key === 'Esc') {
        disablePicker();
        speak(t('pickerOff'));
    }
}
// Finalization
function finalizeSelection(element) {
    if (!element) return;
    const selector = generateSelector(element);

    element.style.outline = '4px solid #00E5ff';
    element.style.boxShadow = '0 0 10px #00E5FF';
    element.style.transition = 'all 0.1s ease';
    speak(t('selected'));
    disablePicker(); 
    recordShortcutForElement(selector, element);
}

function generateSelector(el) {
    const ariaLabel = el.getAttribute('aria-label');
    if (ariaLabel) {
        return `[aria-label="${ariaLabel}"]`;
    }

    // 2. Look for aria-label on parent (Fixes the SVG click issue)
    const parent = el.parentElement;
    if (parent && parent.getAttribute('aria-label')) {
        return `[aria-label="${parent.getAttribute('aria-label')}"]`;
    }

    // 3. Fallback to Tooltip/Title
    if (el.title) return `[title="${el.title}"]`;
    if (el.alt) return `[alt="${el.alt}"]`;

    // 4. Stable IDs (Ignore weird generated ones)
    // Only use ID if it looks human-readable, not random like "yDmH0d"
    if (el.id && !el.id.match(/[A-Z0-9]{5,}/)) {
        return '#' + el.id;
    }

    // 5. Last Resort: CSS Path (nth-child)
    let tagName = el.tagName.toLowerCase();
    if (parent) {
        let siblings = parent.children;
        let index = 1;
        for (let sibling of siblings) {
            if (sibling === el) return `${tagName}:nth-child(${index})`;
            index++;
        }
    }
    return tagName;
}

// RECORDING & SAVING PER SITE 
function recordShortcutForElement(selector,visualElement) {
    const keyListener = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) return;
        // --- NEW: STRICT VALIDATION (Letters & Numbers Only) ---
        const isAlphanumeric = /^[a-zA-Z0-9]$/.test(e.key);

        if (!isAlphanumeric) {
            speak(t("alshort"));
            showToast(t("alshort"));
            if (visualElement) {
                visualElement.style.outline = '4px solid red'; 
                visualElement.style.boxShadow = '0 0 10px red';

                setTimeout(() => {
                    visualElement.style.outline = '4px solid #00E5FF'; 
                    visualElement.style.boxShadow = '0 0 10px #00E5FF';
                }, 500);
            }
            return; // Stop here! Do not save.
        }
        let combo = [];
        if (e.ctrlKey) combo.push('Ctrl');
        if (e.altKey) combo.push('Alt');
        if (e.shiftKey) combo.push('Shift');
        if (e.metaKey) combo.push('Meta');
        let char = e.key.length === 1 ? e.key.toUpperCase() : e.key;
        combo.push(char);

        const finalKey = combo.join('+');
        const currentDomain = window.location.hostname;
        // Fetch FRESH data for this domain
        chrome.storage.local.get([currentDomain], (data) => {
            let config = data[currentDomain] || [];

            const conflict = config.find(item => item.key === finalKey && item.id !== selector);
            if (conflict) {
                speak(t('conflict'));
                showToast(t('conflict'))
                if (visualElement) {
                    visualElement.style.outline = '4px solid red';
                    setTimeout(() => visualElement.style.outline = '4px solid #00E5FF', 500);
                }
                return; 
            }

            // Save Logic
            const existingIndex = config.findIndex(item => item.id === selector);
            if (existingIndex !== -1) {
                config[existingIndex].key = finalKey;
            } else {
                config.push({ id: selector, key: finalKey });
            }
            siteConfig = config; //instant reload

            // Save to specific domain key
            chrome.storage.local.set({ [currentDomain]: config }, () => {
                document.removeEventListener('keydown', keyListener, true);
                if (visualElement) {
                    visualElement.style.outline = '4px solid #FFD700'; 
                    visualElement.style.boxShadow = '0 0 15px #FFD700';
                    setTimeout(() => {
                        visualElement.style.outline = '';
                        visualElement.style.boxShadow = '';
                    }, 500);
                }
                speak(t('saved') + finalKey);
                showToast(t('saved') + finalKey);
            });
        });
    };
    document.addEventListener('keydown', keyListener, true);
}
// --- TOAST NOTIFICATION HELPER ---
function showToast(message) {
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.zIndex = '2147483647'; 
    container.style.bottom = '30px'; 
    container.style.left = '50%';
    container.style.transform = 'translateX(-50%)';
    // 2. Attach Shadow DOM (Isolates styles from the website)
    const shadow = container.attachShadow({ mode: 'open' });
    // 3. Create the toast inside the shadow
    const toast = document.createElement('div');
    toast.textContent = message;

    const style = document.createElement('style');
    style.textContent = `
        div {
            background-color: #333;
            color: #fff;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 14px;
            font-family: 'Segoe UI', sans-serif;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            opacity: 0;
            transition: opacity 0.3s ease;
        }
    `;
    shadow.appendChild(style);
    shadow.appendChild(toast);
    
    if (document.body) {
        document.body.appendChild(container);
    } else {
        console.error("Toast failed: document.body not ready");
        return;
    }

    // 6. Animate In
    requestAnimationFrame(() => {
        toast.style.opacity = '1';
    });

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => {
            container.remove();
        }, 300);
    }, 3000);
}