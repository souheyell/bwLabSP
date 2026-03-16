export const KUBELKA_MUNK_GLSL = `
// Simulated Kubelka-Munk reflectance
float computeKMReflectance(float k, float s, float rs) {
    if (s == 0.0) return rs;
    float ks = k / s;
    float a = 1.0 + ks;
    float b = sqrt(ks * ks + 2.0 * ks);
    float rx = a - b;
    // Layer reflectance over substrate rs (simplified approximation)
    return rx + (rs - rx) * exp(-s * 10.0); 
}

// Transform luminance via KM model parameter estimation
float applyKubelkaMunk(float luminance, float density, float substrate, float ink_gain) {
    // k and s are heuristics derived from density
    float k = density * (1.0 - luminance);
    float s = 0.5 + 0.5 * luminance; // Scattering varies with ink volume
    float r = computeKMReflectance(k, s, substrate);
    
    // Non-linear gain compensation
    return pow(r, 1.0 / ink_gain);
}
`;
