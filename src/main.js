import { GPUEngine } from './gpu/gpu_compute.js';
import { CanvasView } from './ui/canvas_view.js';
import { bindControls } from './ui/controls.js';
import { downloadCanvas } from './export/export_utils.js';

const SLIDERS = [
    'dpi', 'lpi', 'kmDensityGray', 'kmDensityWhite', 'substrate', 'inkGain',
    'gammaGray', 'tLow', 'tHigh', 'angleGray', 'angleWhite', 'dotEllipticity',
    'contrast', 'midtone', 'screenType'
];

document.addEventListener("DOMContentLoaded", () => {
    const view = new CanvasView();
    let engine = null;
    let currentImage = null;
    let renderTimer = null;
    
    // Bind UI Controls
    const params = bindControls(SLIDERS, (newParams) => {
        Object.assign(activeParams, newParams);
        scheduleRender();
    });
    
    // Default initial params based on DOM elements
    const activeParams = { ...params };
    
    document.getElementById("upload-btn").addEventListener("change", (e) => {
        const file = e.target.files[0];
        if(!file) return;
        
        view.loadImage(file, (img, w, h) => {
            currentImage = img;
            if(!engine) {
                engine = new GPUEngine(w, h);
            } else {
                engine.resize(w, h);
            }
            engine.setupTexture(img);
            scheduleRender();
        });
    });
    
    document.getElementById("btn-export-gray").addEventListener("click", () => {
        downloadCanvas("canvas-gray", "gray_separation.png");
    });
    document.getElementById("btn-export-white").addEventListener("click", () => {
        downloadCanvas("canvas-white", "white_separation.png");
    });
    
    function scheduleRender() {
        if(!engine || !currentImage) return;
        // Debounce to prevent blocking UI on slider drag
        if(renderTimer) clearTimeout(renderTimer);
        renderTimer = setTimeout(() => {
            const t0 = performance.now();
            engine.render(activeParams);
            const seps = engine.readSeparations();
            view.updateSeparations(seps.gray, seps.white, currentImage.width, currentImage.height);
            console.log(`Render time: ${(performance.now() - t0).toFixed(2)}ms`);
        }, 16); // ~ 60fps
    }
});
