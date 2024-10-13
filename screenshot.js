var exceptionHappened;
function generateFnameBasedOnTime(prefix, suffix) {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.toLocaleString('en-us', { month: 'short' });
    const day = now.getDate();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    return `${prefix}-${year}-${month}-${day}-${hours}-${minutes}-${seconds}.${suffix}`;

}

function uploadToGoogleDrive(imageData) {
    chrome.identity.getAuthToken({ interactive: true }, function (token) {
        if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError);
            document.getElementById('error').innerHTML = `Error: ${chrome.runtime.lastError}`;
            return;
        }

        const xhr = new XMLHttpRequest();
        xhr.open('POST', 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id');
        xhr.setRequestHeader('Authorization', 'Bearer ' + token);
        xhr.onload = function () {
            if (xhr.status !== 200) {
                document.getElementById('error').innerHTML = `Error uploading file: ${xhr.status}, ${xhr.responseText}`;
                return;
            }
            const file = JSON.parse(xhr.responseText);
            const fileUrl = `https://drive.google.com/file/d/${file.id}/view`;
            document.getElementById('message').innerHTML = `Uploaded <a href="${fileUrl}">screenshot.</a> Will redirect there now.`;
            setTimeout(function () {
                location.href = fileUrl;
            }, 1000);
        };

        // Convert data URL to Blob
        const byteCharacters = atob(imageData.split(',')[1]);
        const byteArrays = [];
        for (let offset = 0; offset < byteCharacters.length; offset += 512) {
            const slice = byteCharacters.slice(offset, offset + 512);
            const byteNumbers = new Array(slice.length);
            for (let i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            byteArrays.push(byteArray);
        }
        const blob = new Blob(byteArrays, { type: 'image/png' });
        const fname = generateFnameBasedOnTime('Tabshot', 'png')
        const formData = new FormData();
        formData.append('metadata', new Blob([JSON.stringify({
            'name': `${fname} `,
            'mimeType': 'image/png'
        })], { type: 'application/json' }));
        formData.append('file', blob);

        xhr.onerror = function (e) {
            document.getElementById('error').innerHTML = `Error in upload. Likely network.`;
        }
        try {
            xhr.send(formData);
        } catch (e) {
            document.getElementById('error').innerHTML = `Error: send exception ${JSON.stringify(e)}`;
        }
    });
}

window.addEventListener('load', function () {
    const dataUrl = decodeURIComponent(window.location.hash.substring(1));
    const img = document.getElementById('screenshot');
    img.onload = function () {
        // By default message says we are waiting for data. Clear that.
        document.getElementById('message').innerHTML = '';
        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');

        canvas.width = img.width;
        canvas.height = img.height;

        let isDragging = false;
        let startX, startY, endX, endY;

        canvas.addEventListener('mousedown', (e) => {
            isDragging = true;
            startX = e.offsetX;
            startY = e.offsetY;
        });

        canvas.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            endX = e.offsetX;
            endY = e.offsetY;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.strokeStyle = 'red';
            ctx.lineWidth = 2;
            ctx.strokeRect(startX, startY, endX - startX, endY - startY);
        });

        canvas.addEventListener('mouseup', (e) => {
            isDragging = false;

            // Calculate the scaling factors
            const scaleX = img.naturalWidth / img.width;
            const scaleY = img.naturalHeight / img.height;

            // Apply scaling to the rectangle coordinates
            const rect = {
                x: Math.min(startX, endX) * scaleX,
                y: Math.min(startY, endY) * scaleY,
                width: Math.abs(endX - startX) * scaleX,
                height: Math.abs(endY - startY) * scaleY
            };

            // Capture the selected area from the original image
            const croppedCanvas = document.createElement('canvas');
            const croppedCtx = croppedCanvas.getContext('2d');
            croppedCanvas.width = rect.width;
            croppedCanvas.height = rect.height;
            croppedCtx.drawImage(img, rect.x, rect.y, rect.width, rect.height, 0, 0, rect.width, rect.height);
            uploadToGoogleDrive(croppedCanvas.toDataURL())
        });
    }
    img.src = dataUrl;
});
