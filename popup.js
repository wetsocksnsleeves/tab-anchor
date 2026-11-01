import { SETTINGS_KEY } from "./constants.js";
import {getStorageRow, writeStorageRow, getTabRow, writeTabRow} from "./utils.js";

async function getTab() {
    const [tab] = await browser.tabs.query({active: true, currentWindow: true});
    return tab;
}

async function getSettings() {
    return await getStorageRow(SETTINGS_KEY);
}

async function changeDefault(value) {
    const [key, settings] = await getSettings();

    if (!settings) return;

    const data = {...settings, default: value};
    await writeStorageRow(key, data);
    document.getElementById("default-selector").value = value;
}

async function syncPanelConfig() {
    const tab = await getTab();

    const options = document.getElementById("tab-option");
    const disable_label = document.getElementById("disable-label");

    options.disabled = !tab.pinned;
    disable_label.style.display = tab.pinned ? "none" : "block";

    const [_, settings] = await getSettings();

    if (settings) {
        document.getElementById(settings.default).checked = true;
        document.getElementById('default-selector').value = settings.default;
    }

    const [tabId, tabData]= await getTabRow(tab.id);

    if (tabData?.mode !== "none") {
        await setCurrentMode();
    }
}

async function setCurrentMode(value) {
    const tab = await getTab();
    const [tabId, tabData] = await getTabRow(tab.id);

    if (!tabData) return;

    if (value) {
        console.log("update tab: ", tabId, "'s mode to: ", value);
        await writeTabRow(tabId, {...tabData, mode: value});
        document.getElementById(value).checked = true;
        return;
    }

    document.getElementById(tabData.mode).checked = true;
}

document.addEventListener('DOMContentLoaded', async () => {
    syncPanelConfig();

    const defaultSelector = document.getElementById('default-selector');
    const tabOptions = document.getElementById("tab-option");

    tabOptions.addEventListener('change', (e) => {
        setCurrentMode(e.target.value);
    });

    defaultSelector.addEventListener('change', async (e) => {
        await changeDefault(e.target.value);
        await syncPanelConfig();
    });
});
