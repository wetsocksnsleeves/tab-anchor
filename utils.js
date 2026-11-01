export async function getStorageRow(_key) {
    const key = String(_key); 
    const { [key] : row } = await browser.storage.local.get(key);

    return [key, row];
}

export async function getTab(tabId) {
    return await browser.tabs.get(tabId);
}

export async function writeStorageRow(key, data) {
    await browser.storage.local.set({[key]: data});
}

export function sameHost(a, b) {
    try {
        return new URL(a).hostname === new URL(b).hostname;
    } catch {
        return false;
    }
}
