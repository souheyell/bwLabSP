export const SCREEN_AM_GLSL = `
// AM Halftone Screening System
// Calculate elliptical dot screen threshold
float amScreen(vec2 uv, float angle, float lpi, float e, float dpi, vec2 res) {
    // Convert to physical inches
    vec2 physical = uv * (res / dpi); 
    
    // Scale to LPI grid
    physical *= lpi;

    // Apply rotation
    float c = cos(angle);
    float s = sin(angle);
    vec2 rotated = vec2(
        physical.x * c - physical.y * s,
        physical.x * s + physical.y * c
    );

    // Compute cell phase [-1, 1]
    vec2 phase = fract(rotated) * 2.0 - 1.0;
    
    // Elliptical shape function:
    // f(x,y) = x^2 / a^2 + y^2 / b^2
    float a2 = e * e;     // Width squish
    float b2 = 1.0;       // height normal
    
    float dot_val = (phase.x * phase.x) / a2 + (phase.y * phase.y) / b2;
    // Normalize to keep within 0..1 range approximately for thresholding
    // A fully covering dot is scaled:
    return dot_val * 0.5; // Scale dot range for threshold testing
}

// Another standard screen function using cosine:
// 1.0 - (cos(x * pi) * cos(y * pi))
float amScreenCos(vec2 uv, float angle, float lpi, float dpi, vec2 res) {
    vec2 physical = uv * (res / dpi) * lpi;
    float c = cos(angle);
    float s = sin(angle);
    vec2 rotated = vec2(
        physical.x * c - physical.y * s,
        physical.x * s + physical.y * c
    );
    // mapped to 0..1
    float val = (sin(rotated.x * 3.14159) * sin(rotated.y * 3.14159)) * 0.5 + 0.5;
    return val;
}
`;
