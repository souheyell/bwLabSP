export const SCREEN_FM_GLSL = `
// FM Halftone Screening (Stochastic / Blue Noise)

// Pseudo-random high-frequency noise for dither (white noise fallback)
float rand(vec2 co){
    return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
}

// Pseudo-blue noise approximation using multi-tap sampling
float fmScreen(vec2 uv, vec2 res) {
    vec2 p = uv * res;
    float n = rand(p);
    
    // Smooth out noise using nearby pixels
    float n1 = rand(p + vec2(-1.0, 0.0));
    float n2 = rand(p + vec2(1.0, 0.0));
    float n3 = rand(p + vec2(0.0, -1.0));
    float n4 = rand(p + vec2(0.0, 1.0));
    
    // A simplified high-pass variation suitable for dithering (Bayer-like structure)
    // Real implementation would look up a 64x64 blue noise texture
    return clamp(n * 0.5 + (n - (n1+n2+n3+n4)*0.25) * 0.5, 0.0, 1.0);
}
`;
