
export function parseHslString(hsl: string): { h: number, s: number, l: number } {
    const parts = hsl.trim().replace(/%/g, '').split(' ').map(Number);
    if (parts.length === 3) {
        return { h: parts[0], s: parts[1], l: parts[2] };
    }
    return { h: 0, s: 0, l: 0 }; // Fallback
}

export function hslValuesToCss(h: number, s: number, l: number): string {
    return `${h} ${s}% ${l}%`;
}


export function hslToRgb(h: number, s: number, l: number): { r: number, g: number, b: number } {
    s /= 100;
    l /= 100;
    let c = (1 - Math.abs(2 * l - 1)) * s;
    let x = c * (1 - Math.abs((h / 60) % 2 - 1));
    let m = l - c / 2;
    let r = 0, g = 0, b = 0;
    if (0 <= h && h < 60) { [r, g, b] = [c, x, 0]; } 
    else if (60 <= h && h < 120) { [r, g, b] = [x, c, 0]; } 
    else if (120 <= h && h < 180) { [r, g, b] = [0, c, x]; } 
    else if (180 <= h && h < 240) { [r, g, b] = [0, x, c]; } 
    else if (240 <= h && h < 300) { [r, g, b] = [x, 0, c]; } 
    else if (300 <= h && h <= 360) { [r, g, b] = [c, 0, x]; }
    r = Math.round((r + m) * 255);
    g = Math.round((g + m) * 255);
    b = Math.round((b + m) * 255);
    return { r, g, b };
}

export function hexToRgb(hex: string): { r: number, g: number, b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

export function componentToHex(c: number): string {
    const hex = c.toString(16);
    return hex.length === 1 ? "0" + hex : hex;
}

export function rgbToHex({ r, g, b }: { r: number, g: number, b: number }): string {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}

export function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s, l = (max + min) / 2;
    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

export const hexToHsl = (hex: string): [number, number, number] => {
    const rgb = hexToRgb(hex);
    if (!rgb) return [0, 0, 0];
    return rgbToHsl(rgb.r, rgb.g, rgb.b);
};

export function getLuminance({ r, g, b }: { r: number, g: number, b: number }): number {
    const a = [r, g, b].map(v => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

export function getContrast(color1HslStr: string, color2HslStr: string): number {
    try {
        const rgb1 = hslToRgb(parseHslString(color1HslStr).h, parseHslString(color1HslStr).s, parseHslString(color1HslStr).l);
        const rgb2 = hslToRgb(parseHslString(color2HslStr).h, parseHslString(color2HslStr).s, parseHslString(color2HslStr).l);

        const lum1 = getLuminance(rgb1);
        const lum2 = getLuminance(rgb2);

        const brightest = Math.max(lum1, lum2);
        const darkest = Math.min(lum1, lum2);

        return (brightest + 0.05) / (darkest + 0.05);
    } catch {
        return 1;
    }
}

export function getWcagRating(ratio: number): 'AAA' | 'AA' | 'Fail' {
    if (ratio >= 7) return 'AAA';
    if (ratio >= 4.5) return 'AA';
    return 'Fail';
}
