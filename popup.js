import { SETTINGS_KEY } from "./constants.js";
import {getStorageRow, writeStorageRow} from "./utils.js";

async function getTab() {
    const [tab] = await browser.tabs.query({active: true, currentWindow: true});
    return tab;
}

async function getSettings() {
    const [key, settings] = await getStorageRow(SETTINGS_KEY);

    if(settings !== undefined) return [key, settings];
}

async function changeDefault(value) {
    const [key, settings] = await getSettings();

    if (!settings) return;

    const data = {...settings, default: value};
    await writeStorageRow(key, data);
    document.getElementById("default-selector").value = settings?.default;
} 

async function syncPanelConfig() {
    const tab = await getTab();

    const options = document.getElementById("tab-option");
    const disable_label = document.getElementById("disable-label");

    options.disabled = !tab.pinned;
    disable_label.style.display = tab.pinned ? "none" : "block";

    const [_, settings] = await getSettings();

    if (settings) {
        document.getElementById(settings?.default).checked = true;
    }
    document.getElementById('default-selector').value = settings?.default;

    const [tabId, tabData]= await getStorageRow(tab.id);

    if (tabData?.mode !== "none") {
        await setCurrentMode();
    }
}

async function setCurrentMode(value) {
    const tab = await getTab();
    const [tabId, tabData] = await getStorageRow(tab.id);

    if (!tabData) return;

    if (value) {
        console.log("update tab: ", tabId, "'s mode to: ", value);
        await browser.storage.local.set({ [tabId] : {...tabData, mode: value}})
        document.getElementById(value).checked = true;
        return;
    }

    document.getElementById(tabData?.mode).checked = true;
}

document.addEventListener('DOMContentLoaded', async () => {
    syncPanelConfig();

    const defaultSelector = document.getElementById('default-selector');
    const tabOptions = document.getElementById("tab-option");

    tabOptions.addEventListener('change', (e) => {
        setCurrentMode(e.target.value);
    });

    defaultSelector.addEventListener('change', (e) => {
        changeDefault(e.target.value);
        syncPanelConfig();
    });
});

