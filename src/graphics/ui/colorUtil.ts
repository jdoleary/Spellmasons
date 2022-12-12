import { lerp } from "../../jmath/math";


export function lightenColor(color: number, lightenCoefficient: number) {
    const r = Math.floor(color / 0x10000);
    const g = Math.floor((color - r * 0x10000) / 0x100);
    const b = Math.floor((color - r * 0x10000 - g * 0x100));

    const r_secondary = Math.floor(lerp(r, 255, lightenCoefficient));
    const g_secondary = Math.floor(lerp(g, 255, lightenCoefficient));
    const b_secondary = Math.floor(lerp(b, 255, lightenCoefficient));

    return parseInt(`0x${r_secondary.toString(16)}${g_secondary.toString(16)}${b_secondary.toString(16)}`, 16);
}