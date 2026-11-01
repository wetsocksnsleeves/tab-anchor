import { SETTINGS_KEY, MODES } from "./constants.js";
import { getStorageRow, getTab, writeStorageRow, sameHost } from "./utils.js";

// Writes a tab to storage, verbatim or updates existing one
async function storePinnedTab(tabId) {
    const [_, tabData] = await getStorageRow(tabId);

    const tab = await getTab(tabId);
    const storedData = {title: tab.title, url: tab.url, mode: tabData?.mode ?? "none"};

    await browser.storage.local.set({[String(tabId)]: storedData});
    console.log(storedData);
}

// Sets default extension configuration
async function setDefaultConfig() {
    const defaultConfig = {default: "strict"};

    if (!(await getSettings())) {
        console.log("No settings, initialising defaults");
        await writeStorageRow(SETTINGS_KEY, defaultConfig);
    }
}

async function getSettings() {
    const [key, data] = await getStorageRow(SETTINGS_KEY);

    if(data !== undefined) return data;
}

// Grabs a id, check in storage, remove if it's there
async function removeClosedPinnedTab(tabId) {
    const [key, tabData] = await getStorageRow(tabId);

    if (!tabData) return;
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
    const [key, tabData] = await getStorageRow(tabId);
    if (!tabData) return;

    const defaultMode = await getSettings();

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
