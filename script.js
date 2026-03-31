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

            // Max number of files to process at the exact same time
            // 3 or 4 is the sweet spot for maximum speed without crashing.
            const CONCURRENCY_LIMIT = 4; 

            // Function to process a single file directly on the main thread
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

                // Save data for the ZIP file later
                convertedFilesData.push({ name: fullFileName, blob: blobToUse });

                // Create the UI Card
                const card = document.createElement('div');
                card.className = 'image-card';

                const img = document.createElement('img');
                img.src = objectUrl;
                img.alt = originalName;

                const downloadLink = document.createElement('a');
                downloadLink.href = objectUrl;
                downloadLink.download = fullFileName;
                downloadLink.className = 'download-btn';
                downloadLink.textContent = 'Download';
                
                card.appendChild(img);
                card.appendChild(downloadLink);

                completedCount++;
                loadingText.textContent = `Converted ${completedCount} of ${selectedFiles.length}...`;

                // Add to UI immediately as it finishes
                previewContainer.appendChild(card); 
            };

            // Queue system to process in fast batches
            for (let i = 0; i < selectedFiles.length; i += CONCURRENCY_LIMIT) {
                // Grab a chunk of 4 files
                const chunk = selectedFiles.slice(i, i + CONCURRENCY_LIMIT);
                // Process those 4 at the exact same time and wait for them to finish
                await Promise.all(chunk.map(file => processFile(file)));
            }

            // Cleanup UI when totally done
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
