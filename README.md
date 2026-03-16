# BWLabSP: Professional Silkscreen RIP Engine

**BWLabSP** is a high-performance, browser-based Screen-Printing Raster Image Processor (RIP) designed to convert RGB images into physically accurate, production-ready halftone separation layers (Gray Base and White Highlight). 

Unlike classical image-editing software (like Photoshop) which rely on display-referred blending, BWLabSP integrates industrial print-engine models directly into the browser. It leverages WebGL2 and Float32 typed-array pipelines for GPU-accelerated operations, resulting in sub-200ms processing times for high-resolution graphics.

## ✨ Features

- **OKLab Perceptual Color Space:** Full luminance extraction in linear space via OKLab to preserve perceptual uniformity.
- **Kubelka-Munk Ink Simulation:** Predicts physical properties like ink scattering, absorption, and substrate reflectance to prevent overlapping muddiness.
- **Advanced Tone Curve Engine:** Mathematical log/filmic highlight controls instead of destructive thresholding.
- **Parametric Screen Functions:** True mathematical Amplitude Modulation (AM clustered dot) and Frequency Modulation (FM stochastic noise) engines. 
- **GPU Accelerated:** Everything runs inside WebGL2 Fragment Shaders natively.
- **Exporting Options:** 1-to-1 pixel-mapped transparent PNG extractions ready for direct silkscreen exposure output.

## 🎛️ Settings & Options Overview

The interface features an intuitive real-time configuration panel split into 3 segments:

### 1. Tone Mapping & Separation
Control how the source photograph's luminance translates into ink densities before halftoning is applied.
- **Gray Gamma:** Adjusts the overall distribution curve of the black ink.
- **Highlight Threshold (Low/High):** Determines the exact luminance cutoff spread for when the White highlight layer kicks in.
- **Curve Contrast & Midtone:** Functions similarly to an S-Curve to punch up midtone separation, essential for preventing muddy skin tones in photographic prints.

### 2. Kubelka-Munk Setup
Control the real-world physically simulated properties of the ink mapping.
- **Gray & White Density:** Modulates the absorption (K) of the respective ink layers.
- **Substrate Reflectance:** Calibrates the engine based on how bright or dark the destination shirt/material is.
- **Ink Gain (Dot Area):** Simulates the physical expansion of a dot as ink sinks into the fabric. Allows you to compensate for press dot-gain.

### 3. Halftone Screening
The mathematical engine creating your exposure stencils.
- **Screen Type:** 
  - **AM Clustered Dot:** Traditional ellipses aligned on a rotating grid. Best for standard screens.
  - **FM Stochastic Noise:** Uses randomized noise clusters. Prevents Moiré and is great for high-mesh screens.
- **Output DPI & Grid LPI:** Defines your destination printed resolution and how many lines of dots occur per inch.
- **Gray / White Angles:** Modulate the screen rotation. By default, Gray is 45° and White is 22.5° to mitigate overlapping Moiré interference.
- **Dot Ellipticity:** Determines whether your dots render as perfect circles (1.0) or sweeping ellipses (> 1.0) for smoother tonal connections.

## 🚀 Getting Started

This project runs entirely on vanilla Vite and WebGL2.
```bash
# Install dependencies
npm install

# Run the dev server
npm run dev
```
## 🔍 Preview 

![image alt](https://github.com/souheyell/bwLabSP/blob/dec35e588579d5812817d2a9edfe3ec9da256764/preview.png)


## ⚖️ Copyright & License
Free for everyone to use,edit or entirely change it.
&copy; 2026 BWLabSP. 
Created by [@souheyell](https://github.com/souheyell).
