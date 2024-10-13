chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action === 'refreshWithRect') {
        const rect = request.rect;

        // Capture the selected area
        html2canvas(document.body, {
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height
        }).then(canvas => {
            // Refresh the page with the captured area
            document.body.innerHTML = ''; // Clear existing content
            document.body.style.margin = '0'; // Remove margins
            const img = document.createElement('img');
            img.src = canvas.toDataURL();
            document.body.appendChild(img);
        });
    }
});