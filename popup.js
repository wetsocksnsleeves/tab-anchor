import { SETTINGS_KEY } from "./constants.js";

async function getTab() {
    const [tab] = await browser.tabs.query({active: true, currentWindow: true});
    return tab;
}

async function getTabData(tab) {
    const key = String(tab.id)
    const {[key] : tabData} = await browser.storage.local.get(key);

    return {tabId: key, tabData};
}

async function getSettings() {
    const key = SETTINGS_KEY
    const {[key] : settings} = await browser.storage.local.get(SETTINGS_KEY);

    if(settings) return {key, settings};
}

async function changeDefault(value) {
    const {key, settings} = await getSettings();

    if (!settings) return;
    await browser.storage.local.set({ [key] : {...settings, default: value}})
    document.getElementById("default-selector").value = settings?.default;
} 

async function syncPanelConfig() {
    const tab = await getTab();

    const options = document.getElementById("tab-option");
    const disable_label = document.getElementById("disable-label");

    options.disabled = !tab.pinned;
    disable_label.style.display = tab.pinned ? "none" : "block";

    const {_, settings} = await getSettings();

    document.getElementById(settings?.default).checked = true;
    document.getElementById('default-selector').value = settings?.default;

    const {tabId, tabData} = await getTabData(tab);

    if (tabData?.mode !== "none") {
        await setCurrentMode();
    }
}

async function setCurrentMode(value) {
    const tab = await getTab();
    const {tabId, tabData} = await getTabData(tab);

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

