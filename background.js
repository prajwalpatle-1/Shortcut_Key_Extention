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
    if (command === "toggle_pick_mode") {
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            if (tabs.length > 0) {
                chrome.tabs.sendMessage(tabs[0].id, { action: "CLICK_PICK_BUTTON" })
                .catch(() => {}); // Ignore errors on restricted pages
            }
        });
    }
});