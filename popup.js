chrome.tabs.captureVisibleTab(null, { format: 'png' }, function (dataUrl) {
    // Open the screenshot in a new tab with the selection script
    chrome.tabs.create({ url: `screenshot.html#${encodeURIComponent(dataUrl)}` });
});