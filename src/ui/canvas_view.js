export class CanvasView {
    constructor() {
        this.original = document.getElementById("canvas-original");
        this.ctxOrg = this.original.getContext("2d");
        
        this.gray = document.getElementById("canvas-gray");
        this.ctxGray = this.gray.getContext("2d");
        
        this.white = document.getElementById("canvas-white");
        this.ctxWhite = this.white.getContext("2d");
    }
    
    updateSeparations(grayData, whiteData, width, height) {
        this.gray.width = width;
        this.gray.height = height;
        this.white.width = width;
        this.white.height = height;
        
        // Put image data
        this.ctxGray.putImageData(grayData, 0, 0);
        this.ctxWhite.putImageData(whiteData, 0, 0);
    }
    
    loadImage(file, onLoaded) {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
            this.original.width = img.width;
            this.original.height = img.height;
            this.ctxOrg.drawImage(img, 0, 0);
            URL.revokeObjectURL(url);
            onLoaded(img, img.width, img.height);
        };
        img.src = url;
    }
}
