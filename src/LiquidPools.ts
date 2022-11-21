// 0: non liquid,

import { Material } from "./Conway";

// 1: liquid
export default [
    toMaterials([
        0, 0, 0, 0,
        0, 1, 0, 0,
        0, 1, 0, 0,
        0, 1, 1, 0,
        0, 0, 0, 0,
    ], 4)
]
function toMaterials(tiles: number[], width: number): { width: number, materials: Material[] } {
    return { width, materials: tiles.map(x => x === 1 ? Material.LIQUID : Material.GROUND) };

}