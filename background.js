// Adds a tab to storage
async function storePinnedTab(tabId) {
    const tab = await browser.tabs.get(tabId);
    const storedData = {title: tab.title, url: tab.url}

    await browser.storage.local.set({[String(tabId)]: storedData});
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

async function storeAllPinnedTabs() {
    const pinnedTabs = await browser.tabs.query({ pinned: true })
    for (const tab of pinnedTabs) {
        await storePinnedTab(tab.id);
  }
}

async function updatePinnedTab(tabId) {
  const key = String(tabId);
  const { [key] : tab } = await browser.storage.local.get(key);

  if (!tab) return;
  
  storePinnedTab(tabId);
}

// Listen to tab update, store it if it's pinned
browser.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if ("pinned" in changeInfo) {
      if (changeInfo.pinned === false) {
        removeClosedPinnedTab(tabId);
      }
        storePinnedTab(tabId);
    }
    updatePinnedTab(tabId);
});

// Remove from storage if it's there
browser.tabs.onRemoved.addListener(
    removeClosedPinnedTab
);

// On install, reload, and startup
browser.runtime.onInstalled.addListener(storeAllPinnedTabs());
browser.runTime.onStartup.addListener(storeAllPinnedTabs());
