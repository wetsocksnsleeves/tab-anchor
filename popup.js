async function disableOptionsIfNotPinned() {
  const [tab] = await browser.tabs.query({active: true, currentWindow: true});

  const options = document.getElementById("tab-option");
  const disable_label = document.getElementById("disable-label");

  options.disabled = !tab.pinned;
  disable_label.style.display = tab.pinned ? "none" : "block";
}

disableOptionsIfNotPinned();
