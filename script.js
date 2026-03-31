document.addEventListener('DOMContentLoaded', () => {
    const heicInput = document.getElementById('heic-input');
    const convertBtn = document.getElementById('convert-btn');
    const formatSelect = document.getElementById('format-select');
    const loadingDiv = document.getElementById('loading');
    const resultArea = document.getElementById('result-area');
    const previewImg = document.getElementById('preview-img');
    const downloadLink = document.getElementById('download-link');

    let selectedFile = null;

    // Listen for file selection
    heicInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            selectedFile = file;
            convertBtn.disabled = false; // Enable the convert button
            resultArea.classList.add('hidden'); // Hide previous results
        } else {
            selectedFile = null;
            convertBtn.disabled = true;
        }
    });

    // Listen for convert button click
    convertBtn.addEventListener('click', async () => {
        if (!selectedFile) return;

        const targetFormat = formatSelect.value;
        const extension = targetFormat === 'image/jpeg' ? 'jpg' : 'png';

        // Update UI to show loading state
        convertBtn.disabled = true;
        loadingDiv.classList.remove('hidden');
        resultArea.classList.add('hidden');

        try {
            // This is where the magic happens using heic2any
            const convertedBlob = await heic2any({
                blob: selectedFile,
                toType: targetFormat,
                quality: 0.8 // Optional: adjusts JPEG quality (0.0 to 1.0)
            });

            // heic2any might return an array if the HEIC has multiple images (like live photos). 
            // We just grab the first one.
            const blobToUse = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;

            // Create a temporary URL for the new image blob
            const objectUrl = URL.createObjectURL(blobToUse);

            // Update the UI with the result
            previewImg.src = objectUrl;
            
            // Set up the download link
            const originalName = selectedFile.name.split('.')[0];
            downloadLink.href = objectUrl;
            downloadLink.download = `${originalName}_converted.${extension}`;

            // Hide loader, show result
            loadingDiv.classList.add('hidden');
            resultArea.classList.remove('hidden');

        } catch (error) {
            console.error("Error converting file:", error);
            alert("There was an error converting your file. Please make sure it is a valid HEIC image.");
            loadingDiv.classList.add('hidden');
        } finally {
            convertBtn.disabled = false;
        }
    });
});