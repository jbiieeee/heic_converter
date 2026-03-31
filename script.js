document.addEventListener('DOMContentLoaded', () => {
    const heicInput = document.getElementById('heic-input');
    const convertBtn = document.getElementById('convert-btn');
    const formatSelect = document.getElementById('format-select');
    const loadingDiv = document.getElementById('loading');
    const loadingText = loadingDiv.querySelector('.loading-text');
    const resultArea = document.getElementById('result-area');
    const previewContainer = document.getElementById('preview-container');
    const dropZone = document.getElementById('drop-zone');
    const downloadAllBtn = document.getElementById('download-all-btn');

    let selectedFiles = [];
    let convertedFilesData = [];

    // The max number of background workers to run at exactly the same time.
    const CONCURRENCY_LIMIT = 2;

    // --- Drag & Drop ---
    ['dragenter','dragover','dragleave','drop'].forEach(e => {
        window.addEventListener(e, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter','dragover'].forEach(e => {
        dropZone.addEventListener(e, () => dropZone.classList.add('dragover'));
    });

    ['dragleave','drop'].forEach(e => {
        dropZone.addEventListener(e, () => dropZone.classList.remove('dragover'));
    });

    dropZone.addEventListener('drop', e => handleFiles(e.dataTransfer.files));
    heicInput.addEventListener('change', e => handleFiles(e.target.files));

    function handleFiles(files) {
        selectedFiles = Array.from(files).filter(f =>
            f.name.toLowerCase().endsWith('.heic') || f.name.toLowerCase().endsWith('.heif')
        );

        if (selectedFiles.length > 0) {
            convertBtn.disabled = false;
            convertBtn.textContent = `Convert ${selectedFiles.length} Image(s)`;
            resultArea.classList.add('hidden');
            previewContainer.innerHTML = '';
            downloadAllBtn.classList.add('hidden');
        } else {
            convertBtn.disabled = true;
            convertBtn.textContent = 'Select Images to Convert';
        }
    }

    // --- Convert using Web Workers ---
    convertBtn.addEventListener('click', async () => {
        if (selectedFiles.length === 0) return;

        const format = formatSelect.value;
        const extension = format === 'image/jpeg' ? 'jpg' : 'png';

        convertBtn.disabled = true;
        loadingDiv.classList.remove('hidden');
        previewContainer.innerHTML = '';
        convertedFilesData = [];

        let completed = 0;
        loadingText.textContent = `Converted 0 of ${selectedFiles.length}...`;

        const queue = [...selectedFiles];

        function startWorker(file) {
            return new Promise((resolve) => {
                // Point this to your new worker.js file
                const worker = new Worker('worker.js');

                worker.postMessage({
                    file: file,
                    format: format,
                    quality: 0.6
                });

                worker.onmessage = (e) => {
                    const data = e.data;

                    if (data.success) {
                        const blob = data.blob;
                        const url = URL.createObjectURL(blob);
                        const name = file.name.split('.')[0] + '_converted.' + extension;

                        convertedFilesData.push({ name, blob });

                        const card = document.createElement('div');
                        card.className = 'image-card';

                        const img = document.createElement('img');
                        img.src = url;

                        const link = document.createElement('a');
                        link.href = url;
                        link.download = name;
                        link.textContent = 'Download';
                        link.className = 'download-btn';

                        card.appendChild(img);
                        card.appendChild(link);
                        previewContainer.appendChild(card);
                    }

                    completed++;
                    loadingText.textContent = `Converted ${completed} of ${selectedFiles.length}...`;

                    // Kill the worker thread to free up memory
                    worker.terminate();
                    resolve();
                };
            });
        }

        // --- Fixed Concurrent Queue logic using a Set ---
        const running = new Set();

        for (const file of queue) {
            // Start the worker and tell it to delete itself from the Set when finished
            const p = startWorker(file).finally(() => running.delete(p));
            
            // Add the promise to our tracker
            running.add(p);

            // If we hit our concurrency limit, pause the loop until at least one finishes
            if (running.size >= CONCURRENCY_LIMIT) {
                await Promise.race(running);
            }
        }

        // Wait for the final trailing workers to finish up
        await Promise.all(running);

        // Reset UI state
        loadingDiv.classList.add('hidden');
        resultArea.classList.remove('hidden');
        convertBtn.disabled = false;

        // Show "Download All" button if multiple files were converted
        if (convertedFilesData.length > 1) {
            downloadAllBtn.classList.remove('hidden');
        }
    });

    // --- ZIP and Download All Logic ---
    downloadAllBtn.addEventListener('click', async () => {
        const zip = new JSZip();

        convertedFilesData.forEach(f => {
            zip.file(f.name, f.blob);
        });

        const originalText = downloadAllBtn.textContent;
        downloadAllBtn.textContent = "Zipping files...";
        downloadAllBtn.disabled = true;

        try {
            const blob = await zip.generateAsync({ type: "blob" });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = "Converted_Images.zip";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Error creating ZIP:", error);
            alert("Failed to zip the files.");
        } finally {
            downloadAllBtn.textContent = originalText;
            downloadAllBtn.disabled = false;
        }
    });
});
