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
    const CONCURRENCY_LIMIT = 2;

    // --- Drag & Drop ---
    ['dragenter','dragover','dragleave','drop'].forEach(e => {
        window.addEventListener(e, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter','dragover'].forEach(e => dropZone.addEventListener(e, () => dropZone.classList.add('dragover')));
    ['dragleave','drop'].forEach(e => dropZone.addEventListener(e, () => dropZone.classList.remove('dragover')));

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

    // --- Convert using Workers ---
    convertBtn.addEventListener('click', async () => {
        if (selectedFiles.length === 0) return;

        const format = formatSelect.value;
        const extension = format === 'image/jpeg' ? 'jpg' : 'png';

        convertBtn.disabled = true;
        loadingDiv.classList.remove('hidden');
        previewContainer.innerHTML = '';
        convertedFilesData = [];
        let completed = 0;

        // show immediate feedback
        loadingText.textContent = "Starting conversion...";

        const queue = [...selectedFiles];
        const running = [];

        function startWorker(file) {
            return new Promise((resolve) => {
                const worker = new Worker('worker.js');

                loadingText.textContent = `Processing ${file.name}...`;

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

                    worker.terminate();
                    resolve();
                };
            });
        }

        for (const file of queue) {
            const p = startWorker(file);
            running.push(p);

            if (running.length >= CONCURRENCY_LIMIT) {
                await Promise.race(running);
                running.splice(running.findIndex(r => r === p), 1);
            }
        }

        await Promise.all(running);

        loadingDiv.classList.add('hidden');
        resultArea.classList.remove('hidden');
        convertBtn.disabled = false;

        if (convertedFilesData.length > 1) {
            downloadAllBtn.classList.remove('hidden');
        }
    });

    // --- ZIP ---
    downloadAllBtn.addEventListener('click', async () => {
        if (convertedFilesData.length === 0) return;

        const zip = new JSZip();
        convertedFilesData.forEach(f => zip.file(f.name, f.blob));

        const blob = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = "Converted_Images.zip";
        a.click();

        URL.revokeObjectURL(url);
    });
});
