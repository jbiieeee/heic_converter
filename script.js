document.addEventListener('DOMContentLoaded', () => {
    const heicInput = document.getElementById('heic-input');
    const convertBtn = document.getElementById('convert-btn');
    const formatSelect = document.getElementById('format-select');
    const loadingDiv = document.getElementById('loading');
    const resultArea = document.getElementById('result-area');
    const previewContainer = document.getElementById('preview-container');
    const dropZone = document.getElementById('drop-zone');

    let selectedFiles = [];

    // --- Drag and Drop Logic ---
    
    // Prevent default browser behavior (opening the file in a new tab)
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
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

    // Handle dropped files
    dropZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        handleFiles(dt.files);
    });

    // Handle files selected via the click input
    heicInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });

    // Process the files into our array
    function handleFiles(files) {
        // Filter out non-HEIC/HEIF files to prevent errors
        selectedFiles = Array.from(files).filter(file => 
            file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif')
        );

        if (selectedFiles.length > 0) {
            convertBtn.disabled = false;
            convertBtn.textContent = `Convert ${selectedFiles.length} Image(s)`;
            resultArea.classList.add('hidden'); 
            previewContainer.innerHTML = ''; // Clear old previews
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
            // Loop through all selected files
            for (const file of selectedFiles) {
                const convertedBlob = await heic2any({
                    blob: file,
                    toType: targetFormat,
                    quality: 0.8 // Adjusts JPEG quality (0.0 to 1.0)
                });

                // heic2any might return an array for burst/live photos, grab the first frame
                const blobToUse = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
                const objectUrl = URL.createObjectURL(blobToUse);
                const originalName = file.name.split('.')[0];

                // Create a card for the grid
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
                
                // Append elements to the card, then to the grid container
                card.appendChild(img);
                card.appendChild(downloadLink);
                previewContainer.appendChild(card);
            }

            // Hide loader, show results
            loadingDiv.classList.add('hidden');
            resultArea.classList.remove('hidden');

        } catch (error) {
            console.error("Error converting files:", error);
            alert("There was an error converting one or more files. Ensure they are valid HEIC/HEIF images.");
            loadingDiv.classList.add('hidden');
        } finally {
            // Reset button state
            convertBtn.disabled = false;
        }
    });
});
