chrome.runtime.onInstalled.addListener(() => {
    console.log("Nayan Deep Extension Installed");
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        if (!tab.url.startsWith('chrome://') && !tab.url.startsWith('edge://')) {
            chrome.tabs.sendMessage(tabId, {
                action: "TRIGGER_TOAST",
                message: "Nayan Deep Extension is active!" 
            })
            .catch((error) => {
                console.log("Content script not ready on this tab yet.");
            });
        }
    }
});
chrome.commands.onCommand.addListener((command) => {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        if (tabs.length === 0) return;
        const tabId = tabs[0].id;

        if (command === "toggle_pick_mode") {
            chrome.tabs.sendMessage(tabId, { action: "CLICK_PICK_BUTTON" })
            .catch(() => {}); 
        }
        
        if (command === "read_last_message") {
            // tabId is now defined because we are inside the query callback
            chrome.tabs.sendMessage(tabId, { action: "RE_READ_TOAST" })
            .catch(() => {});
        }

        if (command === "read_all_shortcuts") {
            chrome.tabs.sendMessage(tabId, { action: "READ_ALL_SAVED" })
            .catch(() => {
                console.log("Could not send message. Try reloading the page.");
            });
        }
    });
});
chrome.runtime.onConnect.addListener((port) => {
    if (port.name === "popup_lifetime") {
        port.onDisconnect.addListener(() => {
            console.log("Popup Closed detected!");
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs[0] && tabs[0].id) {
                    chrome.tabs.sendMessage(tabs[0].id, { 
                        action: "ANNOUNCE_CLOSE" 
                    }).catch(err => {
                        console.log("Could not speak close message", err);
                    });
                }
            });
        });
    }
});