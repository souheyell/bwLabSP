import { OKLAB_GLSL } from "../engine/oklab.js";
import { KUBELKA_MUNK_GLSL } from "../engine/kubelka_munk.js";
import { TONE_MAPPING_GLSL } from "../separation/tone_mapping.js";
import { SCREEN_AM_GLSL } from "../halftone/screen_am.js";
import { SCREEN_FM_GLSL } from "../halftone/screen_fm.js";

const VERTEX_SHADER_SRC = `#version 300 es
in vec2 a_position;
out vec2 v_texCoord;
void main() {
    v_texCoord = a_position * 0.5 + 0.5;
    v_texCoord.y = 1.0 - v_texCoord.y; // flip Y
    gl_Position = vec4(a_position, 0.0, 1.0);
}`;

const FRAGMENT_SHADER_HEADER = `#version 300 es
precision highp float;

uniform sampler2D u_image;
uniform vec2 u_resolution; // Canvas size
uniform float u_dpi;       // Output resolution (300, 600, etc)
uniform float u_lpi;       // Halftone lines per inch

uniform float u_km_density_gray;
uniform float u_km_density_white;
uniform float u_substrate;
uniform float u_ink_gain;

uniform float u_gamma_gray;
uniform float u_white_tLow;
uniform float u_white_tHigh;

uniform float u_angle_gray; // radians
uniform float u_angle_white;

uniform int u_screen_type; // 0=AM, 1=FM
uniform float u_dot_ellipticity; // 1.0=circle, >1.0=ellipse

// Tone curve
uniform float u_curve_contrast;
uniform float u_curve_midtone;

in vec2 v_texCoord;
out vec4 fragColor;
`;

const MAIN_SHADER = `
void main() {
    vec2 uv = v_texCoord;
    vec3 color = texture(u_image, uv).rgb;
    
    // 1. Color Management & Perceptual Luminance Extraction
    float L = getOklabLuminance(color);
    
    // 2. Intelligent Channel Separation (Tone Mapping)
    // Gray Channel
    float gray_level = computeGrayBase(L, u_gamma_gray);
    // Apply optional Log/Filmic Curve
    gray_level = curveLogistic(gray_level, u_curve_contrast, u_curve_midtone);
    
    // White Highlight Channel
    float white_level = computeWhiteHighlight(L, u_white_tLow, u_white_tHigh);
    
    // 3. Kubelka-Munk Ink Simulation (Predictive Separation)
    // Modulate separated output levels based on physical parameters
    gray_level = applyKubelkaMunk(1.0 - gray_level, u_km_density_gray, u_substrate, u_ink_gain);
    // Reflectance models are inverted for white on black
    white_level = applyKubelkaMunk(white_level, u_km_density_white, u_substrate, u_ink_gain);
    
    // 4. Halftone Screening Engine
    float gray_screen = 0.0;
    float white_screen = 0.0;
    
    if (u_screen_type == 0) { // AM
        // Simple dot compensation via threshold offset
        float dot_comp = pow(1.0, 1.0 / u_ink_gain);
        
        float g_thresh = amScreenCos(uv, u_angle_gray, u_lpi, u_dpi, u_resolution);
        float w_thresh = amScreenCos(uv, u_angle_white, u_lpi, u_dpi, u_resolution);
        
        // Final Threshold
        gray_screen = gray_level > g_thresh ? 1.0 : 0.0;
        white_screen = white_level > w_thresh ? 1.0 : 0.0;
    } else { // FM Stochastic
        float fm = fmScreen(uv, u_resolution);
        gray_screen = gray_level > fm ? 1.0 : 0.0;
        white_screen = white_level > fm ? 1.0 : 0.0;
    }
    
    // Output:
    // Red = Gray Base
    // Green = White Highlight
    fragColor = vec4(gray_screen, white_screen, 0.0, 1.0);
}
`;

export class GPUEngine {
    constructor(canvasWidth, canvasHeight) {
        this.canvas = document.createElement("canvas");
        this.canvas.width = canvasWidth;
        this.canvas.height = canvasHeight;
        this.gl = this.canvas.getContext("webgl2", { 
            preserveDrawingBuffer: true,
            premultipliedAlpha: false
        });
        
        if (!this.gl) throw new Error("WebGL2 not supported");
        
        // Enable required extensions
        this.extFloat = this.gl.getExtension("EXT_color_buffer_float");
        
        this.initShaders();
        this.initBuffers();
    }
    
    resize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
        this.gl.viewport(0, 0, width, height);
    }
    
    initShaders() {
        const gl = this.gl;
        
        const fragSrc = FRAGMENT_SHADER_HEADER + 
            OKLAB_GLSL + 
            KUBELKA_MUNK_GLSL + 
            TONE_MAPPING_GLSL + 
            SCREEN_AM_GLSL + 
            SCREEN_FM_GLSL + 
            MAIN_SHADER;
            
        const vShader = this.compileShader(gl.VERTEX_SHADER, VERTEX_SHADER_SRC);
        const fShader = this.compileShader(gl.FRAGMENT_SHADER, fragSrc);
        
        this.program = gl.createProgram();
        gl.attachShader(this.program, vShader);
        gl.attachShader(this.program, fShader);
        gl.linkProgram(this.program);
        
        if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
            console.error(gl.getProgramInfoLog(this.program));
        }
    }
    
    compileShader(type, source) {
        const gl = this.gl;
        const s = gl.createShader(type);
        gl.shaderSource(s, source);
        gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
            console.error("Shader Err: ", gl.getShaderInfoLog(s));
            console.error(source);
        }
        return s;
    }
    
    initBuffers() {
        const gl = this.gl;
        const verts = new Float32Array([
            -1, -1,  1, -1,  -1, 1,
            -1,  1,  1, -1,   1, 1
        ]);
        const vso = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vso);
        gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);
        
        const loc = gl.getAttribLocation(this.program, "a_position");
        gl.enableVertexAttribArray(loc);
        gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    }
    
    setupTexture(imageSource) {
        const gl = this.gl;
        if (this.texture) gl.deleteTexture(this.texture);
        
        this.texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        
        // High quality filtering for initial sampling
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        
        // Float or Uint8?
        // Uint8 initially
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imageSource);
    }
    
    render(params) {
        const gl = this.gl;
        gl.useProgram(this.program);
        
        // Uniforms
        const set1f = (name, val) => gl.uniform1f(gl.getUniformLocation(this.program, name), val);
        const set1i = (name, val) => gl.uniform1i(gl.getUniformLocation(this.program, name), val);
        
        gl.uniform2f(gl.getUniformLocation(this.program, "u_resolution"), gl.canvas.width, gl.canvas.height);
        set1f("u_dpi", params.dpi || 300);
        set1f("u_lpi", params.lpi || 45);
        
        set1f("u_km_density_gray", params.kmDensityGray ?? 1.2);
        set1f("u_km_density_white", params.kmDensityWhite ?? 1.5);
        set1f("u_substrate", params.substrate ?? 0.85);
        set1f("u_ink_gain", params.inkGain ?? 1.05);

        set1f("u_gamma_gray", params.gammaGray ?? 1.0);
        set1f("u_white_tLow", params.tLow ?? 0.6);
        set1f("u_white_tHigh", params.tHigh ?? 0.9);
        
        // angles to radians
        set1f("u_angle_gray", (params.angleGray || 45) * Math.PI / 180);
        set1f("u_angle_white", (params.angleWhite || 22.5) * Math.PI / 180);
        set1i("u_screen_type", params.screenType === "fm" ? 1 : 0);
        set1f("u_dot_ellipticity", params.dotEllipticity || 1.25);
        
        set1f("u_curve_contrast", params.contrast || 10.0);
        set1f("u_curve_midtone", params.midtone || 0.5);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        set1i("u_image", 0);
        
        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
    
    // Fast TypedArray read to split canvases
    readSeparations() {
        // Red channel = Gray, Green channel = White
        // Use standard readPixels into Uint8Array
        const gl = this.gl;
        const w = gl.canvas.width;
        const h = gl.canvas.height;
        const pixels = new Uint8Array(w * h * 4);
        gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
        
        // We output these to two ArrayBuffers for canvas writing
        // Since we are creating a transparent PNG overlay:
        // Gray uses 0,0,0, Alpha where red == 1
        // White uses 255,255,255, Alpha where green == 1
        
        const grayImgData = new ImageData(w, h);
        const whiteImgData = new ImageData(w, h);
        
        const gd = grayImgData.data;
        const wd = whiteImgData.data;
        
        for (let i = 0; i < pixels.length; i += 4) {
            let r = pixels[i];     // gray mask
            let g = pixels[i+1];   // white mask
            
            // Gray is black ink (RGB = 0,0,0) with varying alpha
            gd[i] = 0;
            gd[i+1] = 0;
            gd[i+2] = 0;
            gd[i+3] = r > 128 ? 255 : 0;
            
            // White is white ink (RGB = 255) with varying alpha
            wd[i] = 255;
            wd[i+1] = 255;
            wd[i+2] = 255;
            wd[i+3] = g > 128 ? 255 : 0;
        }
        
        return { gray: grayImgData, white: whiteImgData };
    }
}
