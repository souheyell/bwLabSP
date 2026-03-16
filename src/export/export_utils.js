export function downloadCanvas(canvasId, filename) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    // Quick method for PNG export
    canvas.toBlob(blob => {
        if (!blob) return;
        const link = document.createElement("a");
        link.download = filename;
        link.href = URL.createObjectURL(blob);
        link.click();
        URL.revokeObjectURL(link.href);
    }, "image/png");
}
