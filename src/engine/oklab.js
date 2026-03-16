export const OKLAB_GLSL = `
// Constants for sRGB to Linear
vec3 srgbToLinear(vec3 rgb) {
    vec3 higher = pow((rgb + 0.055) / 1.055, vec3(2.4));
    vec3 lower = rgb / 12.92;
    vec3 isHigher = step(vec3(0.04045), rgb);
    return mix(lower, higher, isHigher);
}

// Convert Linear RGB to OKLab
// Based on Björn Ottosson's OKLab
vec3 linearRgbToOklab(vec3 c) {
    float l = 0.4122214708 * c.r + 0.5363325363 * c.g + 0.0514459929 * c.b;
    float m = 0.2119034982 * c.r + 0.6806995451 * c.g + 0.1073969566 * c.b;
    float s = 0.0883024619 * c.r + 0.2817188376 * c.g + 0.6299787005 * c.b;

    float l_ = pow(max(l, 0.0), 1.0/3.0);
    float m_ = pow(max(m, 0.0), 1.0/3.0);
    float s_ = pow(max(s, 0.0), 1.0/3.0);

    return vec3(
        0.2104542553*l_ + 0.7936177850*m_ - 0.0040720468*s_,
        1.9779984951*l_ - 2.4285922050*m_ + 0.4505937099*s_,
        0.0259040371*l_ + 0.7827717662*m_ - 0.8086757660*s_
    );
}

float getOklabLuminance(vec3 rgb) {
    vec3 linear = srgbToLinear(rgb);
    vec3 lab = linearRgbToOklab(linear);
    return lab.x;
}
`;
