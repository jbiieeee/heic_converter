document.addEventListener('DOMContentLoaded', () => {
    const heicInput = document.getElementById('heic-input');
    const convertBtn = document.getElementById('convert-btn');
    const formatSelect = document.getElementById('format-select');
    const loadingDiv = document.getElementById('loading');
    const loadingText = loadingDiv.querySelector('p'); // To update progress text
    const resultArea = document.getElementById('result-area');
    const previewContainer = document.getElementById('preview-container');
    const dropZone = document.getElementById('drop-zone');

    let selectedFiles = [];

    // --- Drag and Drop Logic Fix ---
    
    // Bind to the ENTIRE window so the browser never tries to download/open the file
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        window.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    // Highlight drop zone when dragging over it
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => dropZone.classList.add('dragover'), false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => dropZone.classList.remove('dragover'), false);
    });

    // Handle dropped files specifically on the drop zone
    dropZone.addEventListener('drop', (e) => {
        handleFiles(e.dataTransfer.files);
    });

    // Handle files selected via the click button
    heicInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });

    // Process the files into our array
    function handleFiles(files) {
        // Filter out non-HEIC/HEIF files
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

    // --- Conversion Logic ---

    convertBtn.addEventListener('click', async () => {
        if (selectedFiles.length === 0) return;

        const targetFormat = formatSelect.value;
        const extension = targetFormat === 'image/jpeg' ? 'jpg' : 'png';

        // Set loading state
        convertBtn.disabled = true;
        loadingDiv.classList.remove('hidden');
        resultArea.classList.add('hidden');
        previewContainer.innerHTML = ''; 

        try {
            // Loop through all selected files one by one
            for (let i = 0; i < selectedFiles.length; i++) {
                const file = selectedFiles[i];
                
                // Update the text so you know it's not frozen
                loadingText.textContent = `Converting image ${i + 1} of ${selectedFiles.length}...`;

                const convertedBlob = await heic2any({
                    blob: file,
                    toType: targetFormat,
                    quality: 0.8 
                });

                const blobToUse = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
                const objectUrl = URL.createObjectURL(blobToUse);
                const originalName = file.name.split('.')[0];

                // Create the card for the image grid
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
                previewContainer.appendChild(card);
            }

            // Hide loader, show results
            loadingDiv.classList.add('hidden');
            resultArea.classList.remove('hidden');

            // Reset button text
            convertBtn.textContent = `Convert ${selectedFiles.length} Image(s)`;

        } catch (error) {
            console.error("Error converting files:", error);
            alert("There was an error converting one or more files. Ensure they are valid HEIC/HEIF images.");
            loadingDiv.classList.add('hidden');
        } finally {
            convertBtn.disabled = false;
            loadingText.textContent = "Converting... this might take a moment for multiple files.";
        }
    });
});
