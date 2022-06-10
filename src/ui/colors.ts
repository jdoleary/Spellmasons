export const targetBlue = 0x00a5df;
export const stamina = 0xd5b356;
export const healthHurtRed = 0x632828;
export const healthRed = 0xd55656;
export const healthAllyGreen = 0x40a058;

export const playerCoatPrimary = 0x417F81;
export const playerCoatSecondary = 0x70A5A7;
export const playerCastAnimationColor = 0xFFa1d3;


export const playerColors = [
    0xef476f,
    0xffd166,
    0x06d6a0,
    0x118ab2,
    0x073b4c,
]

// // From https://stackoverflow.com/a/13348458/4418836
// export function desaturateColor(color: string, saturation: number): string {
//     var col = hexToRgb(color);
//     debugger
//     if (col) {
//         var gray = col.r * 0.3086 + col.g * 0.6094 + col.b * 0.0820;

//         console.log('jtest before', col)
//         col.r = Math.round(col.r * saturation + gray * (1 - saturation));
//         col.g = Math.round(col.g * saturation + gray * (1 - saturation));
//         col.b = Math.round(col.b * saturation + gray * (1 - saturation));
//         console.log('jtest', col)

//         return rgbToHex(col.r, col.g, col.b);
//     } else {
//         return color;
//     }
// }
// // From https://stackoverflow.com/a/13348458/4418836
// function componentToHex(c: number) {
//     var hex = c.toString(16);
//     return hex.length == 1 ? "0" + hex : hex;
// }

// // From https://stackoverflow.com/a/13348458/4418836
// function rgbToHex(r: number, g: number, b: number) {
//     return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
// }

// // From https://stackoverflow.com/a/13348458/4418836
// function hexToRgb(hex: number) {
//     const r = hex / 0x010000
//     const b = (hex - 0xff0000) / 0x000100
//     const g = (hex - 0xff0000 / 0x000001
//     var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
//     return result ? {
//         r: parseInt(result[1] || '', 16),
//         g: parseInt(result[2] || '', 16),
//         b: parseInt(result[3] || '', 16)
//     } : null;
// }