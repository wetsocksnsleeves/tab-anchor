// Adds a tab to storage
async function trackPinnedTabs() {
    const pinnedTabs = await browser.tabs.query({ pinned: true });
    const storedData = Object.fromEntries(pinnedTabs.map((tab) => ([tab.id, {title: tab.title, url: tab.url }])));

    await browser.storage.local.set(storedData)
    console.log(storedData);
}

// Grabs a id, check in storage, remove if it's there
async function removeClosedPinnedTab(tabId) {
    const key = String(tabId)
    const {[key] : tab} = await browser.storage.local.get(key);

    if (!tab) return;
    console.log("Pinned tab closed", key);

    await browser.storage.local.remove(key);
}

// Listen to tab update, store it if it's pinned
browser.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if ("pinned" in changeInfo) {
        trackPinnedTabs();
    }
});

// Remove from storage if it's there
browser.tabs.onRemoved.addListener(
    removeClosedPinnedTab
);

// On mount
trackPinnedTabs();
