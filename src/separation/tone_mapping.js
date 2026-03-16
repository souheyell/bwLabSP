export const TONE_MAPPING_GLSL = `
// Logistic Contrast Curve
float curveLogistic(float x, float a, float b) {
    return 1.0 / (1.0 + exp(-a * (x - b)));
}

// Filmic S-Curve
float curveFilmic(float x) {
    float A = 0.22;
    float B = 0.30;
    float C = 0.10;
    float D = 0.20;
    float E = 0.01;
    float F = 0.30;
    // Uncharted 2 tone mapping curve
    return ((x*(A*x+C*B)+D*E)/(x*(A*x+B)+D*F)) - E/F;
}

// White Highlight Channel Mapping
float computeWhiteHighlight(float L, float t_low, float t_high) {
    return smoothstep(t_low, t_high, 1.0 - L);
}

// Gray Base Logic
float computeGrayBase(float L, float gamma_gray) {
    return pow(max(1.0 - L, 0.0), gamma_gray);
}
`;
