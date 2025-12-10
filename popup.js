document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('container');
    const errorBox = document.getElementById('error-box');
    const liveRegion = document.getElementById('live-region');
    const langSelect = document.getElementById('langSelect');
    
    let keyConfig = [];
    let currentLang = 'en'; 

    // 1. Load Data & AUTO-DETECT Language
    chrome.storage.local.get(['keyConfig', 'appLanguage'], (result) => {
        keyConfig = result.keyConfig || [];
        
        // --- AUTO DETECT LOGIC ---
        if (result.appLanguage) {
            // User has already saved a preference, use it
            currentLang = result.appLanguage;
        } 
        else {
            const browserLang = navigator.language.split('-')[0]; 
            // Check if we have translations for this language
            if (TRANSLATIONS[browserLang]) {
                currentLang = browserLang;
            } else {
                currentLang = 'en'; // Fallback to English if not supported
            }
            
            // Save this detected language so we remember it
            chrome.storage.local.set({ appLanguage: currentLang });
        }
        // -------------------------

        // Set Dropdown Value
        if(langSelect) langSelect.value = currentLang;
        
        updateUIText();
        renderRows();
    });

    // 2. Handle Language Change (Manual Override)
    if(langSelect) {
        langSelect.addEventListener('change', (e) => {
            currentLang = e.target.value;
            chrome.storage.local.set({ appLanguage: currentLang });
            updateUIText();
            renderRows(); 
        });
    }

    function updateUIText() {
        const t = TRANSLATIONS[currentLang];
        
        const pickBtn = document.getElementById('pickerBtn');
        const resetBtn = document.getElementById('resetBtn');
        const addBtn = document.getElementById('addBtn');

        if(pickBtn) pickBtn.innerText = t.pickBtn;
        if(resetBtn) resetBtn.innerText = t.resetBtn;
        if(addBtn) addBtn.innerText = t.addBtn;
    }

    // 1. Load Data on Startup
    chrome.storage.local.get(['keyConfig'], (result) => {
        keyConfig = result.keyConfig || [];
        renderRows();
    });

    // 2. Render Function (Builds the list based on current data)
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
            idInput.placeholder = `Enter id for Shortcut ${index+1}`;
            idInput.value = item.id;
            col2.appendChild(idInput);

            // Domain Badge Display
            if (item.domain) {
                const domainBadge = document.createElement('div');
                domainBadge.className = 'domain-badge'; // We added CSS for this earlier
                domainBadge.innerText = item.domain.replace('www.', ''); 
                col2.appendChild(domainBadge);
            }

            // Col 3: Key Input
            const col3 = document.createElement('div');
            col3.className = 'col-3';
            const keyInput = document.createElement('input');
            keyInput.type = 'text';
            keyInput.className = 'key-input';
            keyInput.placeholder = 'Press Key..';
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
                if(confirm("Delete this shortcut?")) {
                    keyConfig.splice(index, 1); // Remove item from array
                    saveAndRender();
                    announce("Shortcut Deleted");
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
                    announce(`Key already used for this site!`, true);
                    keyInput.classList.add('error');
                    setTimeout(() => keyInput.classList.remove('error'), 1000);
                    return;
                }

                // Save Key
                keyConfig[index].key = finalKeyString;
                keyInput.value = finalKeyString;
                saveConfig();
                announce("Key Saved");

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
        chrome.storage.local.set({ keyConfig: keyConfig });
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

    // 4. Button Event Listeners

    // Add New Row Button
    const addBtn = document.getElementById('addBtn');
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            // New rows are empty and global (no domain)
            keyConfig.push({ id: '', key: '', domain: '' });
            saveAndRender();
            // Scroll to bottom
            setTimeout(() => container.scrollTop = container.scrollHeight, 50);
        });
    }

    // Reset All Button
    document.getElementById('resetBtn').addEventListener('click', () => {
        if(confirm("Are you sure you want to delete ALL shortcuts?")) {
            keyConfig = [];
            saveAndRender();
        }
    });

    // Picker Button
    const pickerBtn = document.getElementById('pickerBtn');
    if (pickerBtn) {
        pickerBtn.addEventListener('click', () => {
            chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
                if (tabs[0]) {
                    chrome.tabs.sendMessage(tabs[0].id, { action: "togglePicker" });
                    window.close(); // Close popup so user can click on page
                }
            });
        });
    }
    
    document.addEventListener('keydown', (e) => {
        if (e.key.toLowerCase() === 'x' && e.target.tagName !== 'INPUT') {
            window.close();
        }
    });
}); 