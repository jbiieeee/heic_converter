// import heic2any inside worker
self.importScripts('https://cdn.jsdelivr.net/npm/heic2any@0.0.4/dist/heic2any.min.js');

self.onmessage = async (e) => {
    const { file, format, quality } = e.data;

    try {
        const converted = await heic2any({
            blob: file,
            toType: format,
            quality: quality
        });

        const blobToUse = Array.isArray(converted) ? converted[0] : converted;

        self.postMessage({
            success: true,
            blob: blobToUse,
            name: file.name
        });
    } catch (err) {
        self.postMessage({
            success: false,
            error: err.message,
            name: file.name
        });
    }
};