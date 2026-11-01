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

export async function getTabRow(tabId) {
    const key = String(tabId);
    const { [key] : row } = await browser.storage.session.get(key);

    return [key, row];
}

export async function writeTabRow(tabId, data) {
    await browser.storage.session.set({[String(tabId)]: data});
}

export async function removeTabRow(tabId) {
    await browser.storage.session.remove(String(tabId));
}

export function sameHost(a, b) {
    try {
        return new URL(a).hostname === new URL(b).hostname;
    } catch {
        return false;
    }
}
