# 🌌 HEIC/HEIF Converter

A client-side web application that converts Apple and Samsung High-Efficiency Image files (`.heic` / `.heif`) into universally compatible `JPEG` or `PNG` formats. 

Built entirely with HTML, CSS, and Vanilla JavaScript, this tool processes everything directly inside your web browser. **No images are ever uploaded to a server**, ensuring 100% data privacy.

## ✨ Features

*   **Universal Support:** Natively decodes `.heic` and `.heif` files from iPhones and Samsung Galaxy devices.
*   **100% Private & Offline:** All conversion math is done locally on your device's CPU. Your photos never leave your computer.
*   **Batch Processing:** Convert multiple files at once. The app uses a smart concurrency queue to process images in high-speed batches without freezing your browser.
*   **Drag & Drop UI:** Easily drag and drop massive batches of photos directly onto the page.
*   **Zip File Export:** Automatically bundles multiple converted images into a single `.zip` file with a "Download All" button.
*   **File Size Comparison:** View real-time file size changes (e.g., `HEIC: 3.2 MB` → `New: 1.1 MB`) before downloading.
*   **Modern Glass UI:** Features a sleek, dark-mode glassmorphism aesthetic with ambient background glows and frosted glass panels.

## 🛠️ Technologies Used

*   **HTML5 & CSS3** (CSS Grid, Flexbox, Backdrop-Filter)
*   **Vanilla JavaScript** (ES6+, Async/Await, Promises)
*   [**heic2any**](https://github.com/alexcorvi/heic2any) - The core library used to decode and convert the High-Efficiency video codec into standard image blobs.
*   [**JSZip**](https://stuk.github.io/jszip/) - Used to package multiple converted blobs into a single downloadable zip archive.

## 🚀 How to Use

Because this app does not rely on a backend server or a build pipeline, setup is instant.

1. Clone or download this repository.
2. Ensure all three files (`index.html`, `style.css`, and `script.js`) are in the same folder.
3. Double-click `index.html` to open it in any modern web browser.
4. Drag and drop your `.heic` files, select your output format, and click **Convert**.


