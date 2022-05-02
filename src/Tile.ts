import type { Polygon } from "pixi.js";
import type { Vec2 } from "./Vec";

export interface ITile {
    pos: Vec2;
    // indexInSource
    index: string;
}
export interface ITileSource {
    // wall bounds prevent walking and line of sight
    wallBounds: Polygon;
    // bounds prevent walking
    bounds: Polygon;
}

const TileSource = [

]