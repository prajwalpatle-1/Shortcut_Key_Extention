chrome.runtime.connect({ name: "popup_lifetime" });
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('container');
    const errorBox = document.getElementById('error-box');
    const liveRegion = document.getElementById('live-region');
    const langSelect = document.getElementById('langSelect');
    chrome.storage.local.get(null, (items) => {
        console.log("📂 CURRENT STORAGE DATABASE:", items);
    });

    let keyConfig = [];
    let currentDomain = '';
    let currentLang = 'en';

    // Helper for translations
    function t(key) {
        if (typeof TRANSLATIONS === 'undefined') return key;
        let text = TRANSLATIONS[currentLang] ? TRANSLATIONS[currentLang][key] : null;
        if (!text && TRANSLATIONS['en']) {
            text = TRANSLATIONS['en'][key];
        }
        return text || key;
    }
    setTimeout(() => {
        chrome.storage.local.get(['appLanguage'], (result) => {
            let lang = result.appLanguage || navigator.language.split('-')[0] || 'en';
            if (!TRANSLATIONS[lang]) lang = 'en';
            const msg = TRANSLATIONS[lang].welcomeMessage || "Nayan Deep Open";
            let announcer = document.getElementById('live-region');
            if (!announcer) {
                announcer = document.createElement('div');
                announcer.id = 'live-region';
                announcer.setAttribute('aria-live', 'assertive');
                announcer.style.cssText = 'position:absolute; left:-9999px; width:1px; height:1px; overflow:hidden;';
                document.body.appendChild(announcer);
            }
            announcer.textContent = "";
            setTimeout(() => {
                announcer.textContent = msg;
            }, 100);
        });
    }, 100);
    // 1. Load Data & AUTO-DETECT Language
    // chrome.storage.local.get(['keyConfig', 'appLanguage'], (result) => {
    //     keyConfig = result.keyConfig || [];

    //     // --- AUTO DETECT LOGIC ---
    //     if (result.appLanguage) {
    //         // User has already saved a preference, use it
    //         currentLang = result.appLanguage;
    //     } 
    //     else {
    //         const browserLang = navigator.language.split('-')[0]; 
    //         // Check if we have translations for this language
    //         if (TRANSLATIONS[browserLang]) {
    //             currentLang = browserLang;
    //         } else {
    //             currentLang = 'en'; // Fallback to English if not supported
    //         }

    //         // Save this detected language so we remember it
    //         chrome.storage.local.set({ appLanguage: currentLang });
    //     }
    //     // -------------------------

    //     // Set Dropdown Value
    //     if(langSelect) langSelect.value = currentLang;

    //     updateUIText();
    //     renderRows();
    // });
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs || tabs.length === 0) return;

        const activeTab = tabs[0];
        if (activeTab.url.startsWith('chrome://') || !activeTab.url.startsWith('http')) {
            container.innerHTML = `<div class="empty-msg" style="color:red; padding:15px;">
                Please navigate to a real website (e.g., Google, YouTube) to use shortcuts.
            </div>`;
            return;
        }

        // Extract Domain
        const url = new URL(activeTab.url);
        currentDomain = url.hostname;

        // Load Data SPECIFIC to this domain
        chrome.storage.local.get([currentDomain, 'appLanguage'], (result) => {
            keyConfig = result[currentDomain] || [];

            // Auto detect language
            // 1. Check if user has a SAVED preference first
            if (result.appLanguage) {
                currentLang = result.appLanguage;
                console.log("Loaded saved preference:", currentLang);
            }
            else {
                const browserLang = navigator.language.split('-')[0]; 
                if (typeof TRANSLATIONS !== 'undefined' && TRANSLATIONS[browserLang]) {
                    currentLang = browserLang;
                } 
                else {
                    currentLang = 'en';
                }
            }

            if (langSelect) {
                langSelect.value = currentLang;
            }
            if (TRANSLATIONS[currentLang] && TRANSLATIONS[currentLang].langCode) {
                document.documentElement.lang = TRANSLATIONS[currentLang].langCode;
            }
            const subtitle = document.querySelector('.subtitle');
            if (subtitle) {
                subtitle.innerText = `${currentDomain.replace('www.', '')}`;
            }

            updateUIText();
            renderRows();
        });
    });

    // 2. Handle Language Change (Manual Override)
    if (langSelect) {
        langSelect.addEventListener('change', (e) => {
            const selectedLang = e.target.value;
            currentLang = selectedLang; 
            if (TRANSLATIONS[selectedLang] && TRANSLATIONS[selectedLang].langCode) {
                document.documentElement.lang = TRANSLATIONS[selectedLang].langCode;
            }
            
            chrome.storage.local.set({ appLanguage: selectedLang });
            updateUIText();
            renderRows();
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs[0]) {
                    chrome.tabs.sendMessage(tabs[0].id, { 
                        action: "changeLanguage", 
                        language: selectedLang 
                    });
                }
            });
        });
    }

    function updateUIText() {
        const titleEl =document.getElementById('app-title');
        const subtitleEl = document.getElementById('subtitlepara');
        if (titleEl) titleEl.textContent = t('title');
        if (subtitleEl) subtitleEl.innerText = t('subtitle');

        const pickBtn = document.getElementById('pickerBtn');
        const resetBtn = document.getElementById('resetBtn');
        const addBtn = document.getElementById('addBtn');
        if (pickBtn) pickBtn.innerHTML = t('pickBtn');
        if (resetBtn) resetBtn.innerText = t('resetBtn');
        if (addBtn) addBtn.innerText = t('addBtn');

        const col1 = document.querySelector('.col-1');
        const col2 = document.querySelector('.col-2');
        const col3 = document.querySelector('.col-3');
        if (col1) col1.innerText = t('shortcutsHeader');
        if (col2) col2.innerText = t('colId');
        if (col3) col3.innerText = t('colKey');

        const domainHeader = document.querySelector('.header h3');
        const header = document.querySelector('.header');
        if (header && currentDomain) {
             const h3 = document.getElementsByTagName('h3')[1];
             if(h3) h3.innerText = `${t('shortcutsPrefix')} ${currentDomain.replace('www.', '')}`;
        }

        // 5. Input Placeholders (Update existing rows)
        const allIdInputs = document.querySelectorAll('.id-input');
        const allKeyInputs = document.querySelectorAll('.key-input');
        allIdInputs.forEach(input => input.placeholder = t('phId'));
        allKeyInputs.forEach(input => input.placeholder = t('phKey'));
        
        // 6. Empty Message
        const emptyMsg = document.querySelector('.empty-msg');
        if (emptyMsg) emptyMsg.innerText = t('emptyMsg');

        // --- NEW: UPDATE TABLE HEADERS ---
        const thFeature = document.getElementById('th-feature');
        const thShortcut = document.getElementById('th-shortcut');
        if (thFeature) thFeature.innerText = t('thFeature');
        if (thShortcut) thShortcut.innerText = t('thShortcut');

        // --- NEW: UPDATE TABLE DESCRIPTIONS ---
        const descPopup = document.getElementById('desc-popup');
        const descPicker = document.getElementById('desc-picker');
        const descReadAll = document.getElementById('desc-readall');

        if (descPopup) descPopup.innerText = t('descPopup');
        if (descPicker) descPicker.innerText = t('descPicker');
        if (descReadAll) descReadAll.innerText = t('descReadAll');

        // --- NEW: UPDATE READ ALL BUTTON ---
        const readAllBtn = document.getElementById('readAllBtn');
        if (readAllBtn) {
            readAllBtn.innerText = t('btnReadAll');
        }
    }
    // Render rows (Builds the list based on current data)
    function renderRows() {
        container.innerHTML = '';

        if (keyConfig.length === 0) {
            container.innerHTML = '<div class="empty-msg">No shortcuts yet. Click "Pick Button" to select one.</div>';
            return;
        }

        keyConfig.forEach((item, index) => {
            const row = document.createElement('div');
            row.className = 'row';

            // Col 1: Index Number
            const col1 = document.createElement('div');
            col1.className = 'col-1';
            col1.innerText = `Shortcut ${index + 1}`;

            // Col 2: ID Input + Domain Badge
            const col2 = document.createElement('div');
            col2.className = 'col-2';
            // The Input Field
            const idInput = document.createElement('input');
            idInput.type = 'text';
            idInput.className = 'id-input';
            idInput.placeholder = `Enter id for Shortcut ${index + 1}`;
            idInput.value = item.id;
            col2.appendChild(idInput);

            // Col 3: Key Input
            const col3 = document.createElement('div');
            col3.className = 'col-3';
            const keyInput = document.createElement('input');
            keyInput.type = 'text';
            keyInput.className = 'key-input';
            keyInput.placeholder = t('placeholderKey');
            keyInput.value = item.key;
            col3.appendChild(keyInput);

            // Col 4: Delete Button
            const col4 = document.createElement('div');
            col4.className = 'col-4';
            const delBtn = document.createElement('button');
            delBtn.className = 'del-btn';
            delBtn.innerHTML = '&#10005;';
            delBtn.title = "Delete this shortcut";

            // DELETE LOGIC: Removes row completely
            delBtn.addEventListener('click', () => {
                if (confirm(t('deleteRow'))) {
                    keyConfig.splice(index, 1); // Remove item from array
                    saveAndRender();
                    announce(t('delshort'));
                }
            });
            col4.appendChild(delBtn);

            // Add columns to row
            row.appendChild(col1);
            row.appendChild(col2);
            row.appendChild(col3);
            row.appendChild(col4);
            container.appendChild(row);

            // --- LISTENERS FOR INPUTS ---

            // A. ID Input Logic
            idInput.addEventListener('input', (e) => {
                keyConfig[index].id = e.target.value;
            });

            idInput.addEventListener('blur', () => saveConfig());

            idInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    if (idInput.value.trim() === '') {
                        announce("Enter ID first", true);
                        idInput.classList.add('error');
                    } else {
                        idInput.classList.remove('error');
                        keyInput.focus();
                    }
                }
            });

            // B. Key Recording Logic
            keyInput.addEventListener('keydown', (e) => {
                if (e.key === 'Tab' || e.key === 'Enter') return; // Let Tab work normally
                e.preventDefault();

                // Clear key on Backspace
                if (e.key === 'Backspace' || e.key === 'Delete') {
                    keyConfig[index].key = '';
                    keyInput.value = '';
                    saveConfig();
                    announce("Key Cleared");
                    return;
                }

                if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) return;

                const isAlphanumeric = /^[a-zA-Z0-9]$/.test(e.key);

                if (!isAlphanumeric) {
                    // Visual Error: Red Border
                    keyInput.classList.add('error');
                    announce("Use Letters/Numbers only", true);
                    
                    // Remove error after 1 second
                    setTimeout(() => keyInput.classList.remove('error'), 1000);
                    return; 
                }
                // Build Combo String
                let combo = [];
                if (e.ctrlKey) combo.push('Ctrl');
                if (e.altKey) combo.push('Alt');
                if (e.shiftKey) combo.push('Shift');
                if (e.metaKey) combo.push('Meta');

                let char = e.key.length === 1 ? e.key.toUpperCase() : e.key;
                combo.push(char);
                const finalKeyString = combo.join('+');

                // --- IMPROVED DUPLICATE CHECK ---
                // Only error if Key matches AND Domain matches (or both are global)
                const duplicateIndex = keyConfig.findIndex((row, i) => {
                    if (i === index) return false; // Don't check self

                    const keysMatch = row.key === finalKeyString;
                    const domainsMatch = (row.domain || "") === (item.domain || "");

                    return keysMatch && domainsMatch;
                });

                if (duplicateIndex !== -1) {
                    announce(t(`Key already used for this site!`), true);
                    keyInput.classList.add('error');
                    setTimeout(() => keyInput.classList.remove('error'), 1000);
                    return;
                }

                // Save Key
                keyConfig[index].key = finalKeyString;
                keyInput.value = finalKeyString;
                saveConfig();
                announce(t('saved'));

                // Auto-Focus Next Row ID (if it exists)
                const nextRow = container.children[index + 1];
                if (nextRow) {
                    const nextId = nextRow.querySelector('.id-input');
                    if (nextId) nextId.focus();
                }
            });
        });
    }

    // 3. Helper Functions
    function saveConfig() {
        if (currentDomain) {
            chrome.storage.local.set({ [currentDomain]: keyConfig });
        }
    }

    function saveAndRender() {
        saveConfig();
        renderRows();
    }

    function announce(msg, isError = false) {
        errorBox.innerText = msg;
        errorBox.style.display = 'block';
        errorBox.style.backgroundColor = isError ? '#cc0000' : '#333';
        liveRegion.innerText = msg;
        setTimeout(() => { errorBox.style.display = 'none'; }, 2000);
    }
    // --- MISSING HELPER FUNCTION ---
    function sendMessageToContent(message) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, message);
            } else {
                console.error("No active tab found.");
            }
        });
    }
    // 4. Button Event Listeners

    // Add New Row Button
    const addBtn = document.getElementById('addBtn');
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            keyConfig.push({ id: '', key: '' });
            saveAndRender();
        });
    }

    // Reset All Button
    document.getElementById('resetBtn').addEventListener('click', () => {
        if (confirm(t('deleteAll'))) {
            keyConfig = [];
            saveAndRender();
        }
    });

    // Picker Button
    const pickerBtn = document.getElementById('pickerBtn');
    if (pickerBtn) {
        pickerBtn.addEventListener('click', () => {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs[0]) {
                    chrome.tabs.sendMessage(tabs[0].id, { action: "togglePicker" });
                    window.close(); // Close popup so user can click on page
                }
            });
        });
    }

    const readLastBtn = document.getElementById('readLastBtn');
    if (readLastBtn) {
        readLastBtn.addEventListener('click', () => {
            console.log("Re-read clicked"); 
            sendMessageToContent({ action: "RE_READ_TOAST" });
        });
    }

    // B. "Read All Shortcuts" Button
    const readAllBtn = document.getElementById('readAllBtn');
    if (readAllBtn) {
        readAllBtn.addEventListener('click', () => {
            console.log("Read All clicked"); // Debug check
            sendMessageToContent({ action: "READ_ALL_SAVED" });
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key.toLowerCase() === 'x' && e.target.tagName !== 'INPUT') {
            window.close();
        }
    });
});
