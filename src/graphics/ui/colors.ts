export const targetBlue = 0x00a5df;
export const stamina = 0xd5b356;
export const healthHurtRed = 0x632828;
export const healthRed = 0xd55656;
export const manaBlue = 0x5656d5;
export const healthAllyGreen = 0x40a058;
export const targetingSpellGreen = 0x57ed61;
export const outOfRangeGrey = 0xaaaaaa;
export const abyss = {
    'blood': 0x2d6265,
    'lava': 0x4b465c,
    'water': 0xf7f7e3
}
export const forceMoveColor = 0xffffff;
export const bloodColorDefault = 0xc70000;
export const bloodLobber = 0x67c3d7;
export const bloodDecoy = 0x7b531f;
export const bloodVampire = 0xf1fa68;
export const bloodPoisoner = 0x86eb83;
export const bloodDragger = 0x83d7eb;

export const playerCoatPrimary = 0x417F81;
export const playerCoatSecondary = 0x70A5A7;
export const playerCastAnimationColor = 0xFFa1d3;
export const attackRangeAlly = targetBlue;
export const attackRangeEnemy = 0xd55656;


// Color names from coolors.co
export const robeColors = [
    0x17bebb, // Tiffany Blue,
    0x4b1d3f, // dark purple,
    0xd4f4dd, // aero blue
    0xf24236, // cinnabar
    0xf5f749, // maximum yellow
    0x2e86ab, // blue ncs
    0x000000, // black
    0x2a1a1f, // black coffee
    0x764134, // bole
    0x9a48d0, // dark orchid
    0xe4b7e5, // pink lavender
    0x7e5a9b, // royal purple
    0x63458a, // cyber grape
    0xe03616, // vermilion
    0xcfffb0, // tea green
    0xfff689, // canary
    0x8da9c4, // pewter blue
    0x134074, // indigo dye
    0x0cce6b, // emerald
    0x363537, // jet
    0xed7d31, // mango tango
    0xfcb0b3, // light pink
    0x445e93, // bdazzled blue
    0xfcecc9, // blanched almond
    0x404e4e, // charcoal
    0x912f40, // red violet color wheel


]

// // From https://stackoverflow.com/a/13348458/4418836
// export function desaturateColor(color: string, saturation: number): string {
//     var col = hexToRgb(color);
//     debugger
//     if (col) {
//         var gray = col.r * 0.3086 + col.g * 0.6094 + col.b * 0.0820;

//         console.log('before', col)
//         col.r = Math.round(col.r * saturation + gray * (1 - saturation));
//         col.g = Math.round(col.g * saturation + gray * (1 - saturation));
//         col.b = Math.round(col.b * saturation + gray * (1 - saturation));
//         console.log('after', col)

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