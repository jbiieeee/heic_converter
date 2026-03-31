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

    // Helper function to format bytes into KB, MB, etc.
    function formatBytes(bytes, decimals = 2) {
        if (!+bytes) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
    }

    // --- Drag and Drop Logic ---
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        window.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => dropZone.classList.add('dragover'), false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => dropZone.classList.remove('dragover'), false);
    });

    dropZone.addEventListener('drop', (e) => {
        handleFiles(e.dataTransfer.files);
    });

    heicInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });

    function handleFiles(files) {
        selectedFiles = Array.from(files).filter(file => {
            const name = file.name.toLowerCase();
            return name.endsWith('.heic') || name.endsWith('.heif');
        });

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

    // --- FAST BATCH PROCESSING LOGIC ---
    convertBtn.addEventListener('click', async () => {
        if (selectedFiles.length === 0) return;

        const targetFormat = formatSelect.value;
        const extension = targetFormat === 'image/jpeg' ? 'jpg' : 'png';

        convertBtn.disabled = true;
        loadingDiv.classList.remove('hidden');
        resultArea.classList.add('hidden');
        previewContainer.innerHTML = ''; 
        convertedFilesData = []; 

        try {
            let completedCount = 0;
            loadingText.textContent = `Converted 0 of ${selectedFiles.length}...`;

            const CONCURRENCY_LIMIT = 4; 

            const processFile = async (file) => {
                const convertedBlob = await heic2any({
                    blob: file,
                    toType: targetFormat,
                    quality: 0.8 
                });

                const blobToUse = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
                const objectUrl = URL.createObjectURL(blobToUse);
                const originalName = file.name.split('.')[0];
                const fullFileName = `${originalName}_converted.${extension}`;

                convertedFilesData.push({ name: fullFileName, blob: blobToUse });

                // Format the sizes
                const originalSizeText = formatBytes(file.size);
                const newSizeText = formatBytes(blobToUse.size);

                // Create the UI Card
                const card = document.createElement('div');
                card.className = 'image-card';

                const img = document.createElement('img');
                img.src = objectUrl;
                img.alt = originalName;

                // Create the size info text
                const sizeInfo = document.createElement('div');
                sizeInfo.className = 'file-size-info';
                sizeInfo.innerHTML = `HEIC: ${originalSizeText}<br><span class="size-highlight">New: ${newSizeText}</span>`;

                const downloadLink = document.createElement('a');
                downloadLink.href = objectUrl;
                downloadLink.download = fullFileName;
                downloadLink.className = 'download-btn';
                downloadLink.textContent = 'Download';
                
                card.appendChild(img);
                card.appendChild(sizeInfo); // Add the size info to the card
                card.appendChild(downloadLink);

                completedCount++;
                loadingText.textContent = `Converted ${completedCount} of ${selectedFiles.length}...`;

                previewContainer.appendChild(card); 
            };

            for (let i = 0; i < selectedFiles.length; i += CONCURRENCY_LIMIT) {
                const chunk = selectedFiles.slice(i, i + CONCURRENCY_LIMIT);
                await Promise.all(chunk.map(file => processFile(file)));
            }

            loadingDiv.classList.add('hidden');
            resultArea.classList.remove('hidden');
            convertBtn.textContent = `Convert ${selectedFiles.length} Image(s)`;

            if (convertedFilesData.length > 1) {
                downloadAllBtn.classList.remove('hidden');
            }

        } catch (error) {
            console.error("Error converting files:", error);
            alert("There was an error converting. If a file is corrupted or too massive, it may fail.");
            loadingDiv.classList.add('hidden');
        } finally {
            convertBtn.disabled = false;
            loadingText.textContent = "Processing...";
        }
    });

    // --- ZIP Logic ---
    downloadAllBtn.addEventListener('click', async () => {
        if (convertedFilesData.length === 0) return;

        const originalText = downloadAllBtn.textContent;
        downloadAllBtn.textContent = "Zipping files...";
        downloadAllBtn.disabled = true;

        try {
            const zip = new JSZip();

            convertedFilesData.forEach(fileData => {
                zip.file(fileData.name, fileData.blob);
            });

            const zipContent = await zip.generateAsync({ type: "blob" });
            const zipUrl = URL.createObjectURL(zipContent);
            
            const tempLink = document.createElement('a');
            tempLink.href = zipUrl;
            tempLink.download = "Converted_Images.zip";
            document.body.appendChild(tempLink);
            tempLink.click();
            document.body.removeChild(tempLink);
            
            URL.revokeObjectURL(zipUrl);
        } catch (error) {
            console.error("Error creating ZIP:", error);
            alert("Failed to zip the files.");
        } finally {
            downloadAllBtn.textContent = originalText;
            downloadAllBtn.disabled = false;
        }
    });
});