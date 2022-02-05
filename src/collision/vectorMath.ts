import type { Vec2 } from "../commonTypes";

export function multiply(scalar: number, p2: Vec2): Vec2 {
    return {
        x: scalar * p2.x,
        y: scalar * p2.y
    }
}
export function add(p1: Vec2, p2: Vec2): Vec2 {
    return {
        x: p1.x + p2.x,
        y: p1.y + p2.y
    }
}
export function subtract(p1: Vec2, p2: Vec2): Vec2 {
    return {
        x: p1.x - p2.x,
        y: p1.y - p2.y
    }
}
// Returns a scalar
export function crossproduct(p1: Vec2, p2: Vec2): number {
    return p1.x * p2.y - p1.y * p2.x;
}