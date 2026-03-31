document.addEventListener('DOMContentLoaded', () => {
    const heicInput = document.getElementById('heic-input');
    const convertBtn = document.getElementById('convert-btn');
    const formatSelect = document.getElementById('format-select');
    const loadingDiv = document.getElementById('loading');
    const loadingText = loadingDiv.querySelector('p');
    const resultArea = document.getElementById('result-area');
    const previewContainer = document.getElementById('preview-container');
    const dropZone = document.getElementById('drop-zone');

    let selectedFiles = [];

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
        } else {
            convertBtn.disabled = true;
            convertBtn.textContent = 'Convert Image';
        }
    }

    // --- High-Speed Concurrent Conversion Logic ---

    convertBtn.addEventListener('click', async () => {
        if (selectedFiles.length === 0) return;

        const targetFormat = formatSelect.value;
        const extension = targetFormat === 'image/jpeg' ? 'jpg' : 'png';

        convertBtn.disabled = true;
        loadingDiv.classList.remove('hidden');
        resultArea.classList.add('hidden');
        previewContainer.innerHTML = ''; 

        try {
            let completedCount = 0;
            loadingText.textContent = `Converted 0 of ${selectedFiles.length}...`;

            // Instead of a traditional loop, we map all files to Promises so they run at the same time
            const conversionPromises = selectedFiles.map(async (file) => {
                const convertedBlob = await heic2any({
                    blob: file,
                    toType: targetFormat,
                    quality: 0.8 
                });

                const blobToUse = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
                const objectUrl = URL.createObjectURL(blobToUse);
                const originalName = file.name.split('.')[0];

                const card = document.createElement('div');
                card.className = 'image-card';

                const img = document.createElement('img');
                img.src = objectUrl;
                img.alt = originalName;

                const downloadLink = document.createElement('a');
                downloadLink.href = objectUrl;
                downloadLink.download = `${originalName}_converted.${extension}`;
                downloadLink.className = 'download-btn';
                downloadLink.textContent = 'Download';
                
                card.appendChild(img);
                card.appendChild(downloadLink);

                // As each individual file finishes, update the progress counter
                completedCount++;
                loadingText.textContent = `Converted ${completedCount} of ${selectedFiles.length}...`;

                return card;
            });

            // Wait for all the simultaneous processes to finish
            const completedCards = await Promise.all(conversionPromises);

            // Once all are done, append them to the container
            completedCards.forEach(card => previewContainer.appendChild(card));

            loadingDiv.classList.add('hidden');
            resultArea.classList.remove('hidden');
            convertBtn.textContent = `Convert ${selectedFiles.length} Image(s)`;

        } catch (error) {
            console.error("Error converting files:", error);
            alert("There was an error converting. This can happen if too many massive files are processed at once.");
            loadingDiv.classList.add('hidden');
        } finally {
            convertBtn.disabled = false;
            loadingText.textContent = "Converting... this might take a moment for multiple files.";
        }
    });
});
