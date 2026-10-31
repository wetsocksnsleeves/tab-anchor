import { SETTINGS_KEY, MODES } from "./constants.js";

// Adds a tab to storage
async function storePinnedTab(tabId) {
    const key = String(tabId);
    const {[key]: tabData} = await browser.storage.local.get(key);

    const tab = await browser.tabs.get(tabId);
    const storedData = {title: tab.title, url: tab.url, mode: tabData?.mode ?? "none"};

    await browser.storage.local.set({[String(tabId)]: storedData});
    console.log(storedData);
}

async function setDefaultConfig() {
    const key = SETTINGS_KEY;
    const {[key] : data} = await browser.storage.local.get(key);

    if (!data) {
        await browser.storage.local.set({[key]: {default: 'strict'}});
    }
}

async function getSettings() {
    const key = SETTINGS_KEY
    const {[key] : settings} = await browser.storage.local.get(SETTINGS_KEY);

    if(settings) return settings;
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

async function guardPinnedTab(tabId, url) {
    const key = String(tabId);
    const {[key] : tabData} = await browser.storage.local.get(key);
    const defaultMode = await getSettings();
    if (!tabData) return;

    const mode = tabData?.mode === "none" ? defaultMode.default : tabData?.mode;

    if (!MODES.includes(mode)) return;

    // If not on the same host, don't allow
    if (mode === "loose" && !sameHost(tabData?.url, url)) {
        console.log("Navigation not allowed.");
        await navigateToStoredUrl(tabId, tabData?.url);
        return;
    };

    // Don't allow anything
    if (mode === "strict" && tabData?.url !== url) {
        console.log("Navigation not allowed.");
        await navigateToStoredUrl(tabId, tabData?.url);
        return;
    }

    await storePinnedTab(tabId);
}

async function navigateToStoredUrl(tabId, storedUrl) {
    await browser.tabs.update(tabId, { url: storedUrl });
}

function sameHost(a, b) {
  try {
    return new URL(a).hostname === new URL(b).hostname;
  } catch {
    return false;
  }
}

// Listen to tab update, store it if it's pinned
browser.tabs.onUpdated.addListener((tabId, changeInfo) => {
    // Storage operations
    if ("pinned" in changeInfo) {
      if (changeInfo.pinned === false) {
        removeClosedPinnedTab(tabId);
      }
        storePinnedTab(tabId);
    }

    // Navigation guard
    if (changeInfo.url) {
        guardPinnedTab(tabId, changeInfo.url);
    }
});

// Remove from storage if it's there
browser.tabs.onRemoved.addListener(removeClosedPinnedTab);

async function initialise() {
    await setDefaultConfig();
    await storeAllPinnedTabs();
}

// On install, reload, and startup
browser.runtime.onInstalled.addListener(initialise);
browser.runtime.onStartup.addListener(initialise);
