//
export const trueWhite = 0xffffff;
export const trueGrey = 0x808080;
export const trueBlack = 0x000000;
export const trueRed = 0xff0000;
export const trueGreen = 0x00ff00;
export const trueBlue = 0x0000ff;
//
export const targetBlue = 0x00a5df;
export const stamina = 0xd5b356;
export const healthAllyBrightGreen = 0x23ff30;
export const healthAllyGreen = 0x40a058;
export const healthAllyDarkGreen = 0x235730;
export const healthBrightRed = 0xff4d4d;
export const healthRed = 0xd55656;
export const healthDarkRed = 0x632828;
export const manaBrightBlue = 0x6699ff;
export const manaBlue = 0x5656d5;
export const manaDarkBlue = 0x282863;
export const targetingSpellGreen = 0x57ed61;
export const outOfRangeGrey = 0xaaaaaa;
export const errorRed = 0xF93943;
export const abyss = {
  'blood': 0x2d6265,
  'lava': 0x4b465c,
  'water': 0xf7f7e3,
  'ghost': 0x278b77
}
export const abyssEasyEyes = {
  'blood': 0x163031,
  'lava': 0x332f3e,
  'water': 0x88887b,
  'ghost': 0x12453b
}
export const forceMoveColor = 0xffffff;
export const bloodColorDefault = 0xc70000;
export const bloodLobber = 0x67c3d7;
export const bloodDecoy = 0x7b531f;
export const bloodVampire = 0xf1fa68;
export const bloodPoisoner = 0x86eb83;
export const bloodGripthulu = 0x83d7eb;

export const playerCoatPrimary = 0x417F81;
export const playerCoatSecondary = 0x70A5A7;
export const playerCastAnimationGlow = 0xff5eb3;
export const playerCastAnimationColor = 0xFFa1d3;
// A special reserver color to signify that the player has not chosen a color
export const playerNoColor = 0xFFFFAA;
export const playerCastAnimationColorMedium = 0xffc8e5;
export const playerCastAnimationColorLighter = 0xffe4f2;
export const playerCastAnimationColorLighter2 = 0xf6d9e8;
export const attackRangeAlly = targetBlue;
export const attackRangeEnemy = 0xd55656;

export const textSoftBlack = 0x262324;


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
];

export const bloatExplodeStart = 0xd66437;
export const bloatExplodeEnd = 0xf5e8b6;

export function convertToHashColor(color: number): string {
  // Convert the number to a hexadecimal string and remove the '0x' prefix
  let hexString = color.toString(16).toUpperCase();

  // 0 padding to ensure valid color
  while (hexString.length < 6) {
    hexString = `0${hexString}`
  }

  //console.log(`Color: ${color} to Hex: ${hexString}`);
  // Prepend '#' to the hexadecimal string
  return `#${hexString}`;
}

// // From https://stackoverflow.com/a/13348458/4418836
// export function desaturateColor(color: string, saturation: number): string {
//     var col = hexToRgb(color);
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
