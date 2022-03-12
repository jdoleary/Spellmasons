import { clockwiseAngle } from "../Pathfinding";
import { getAngleBetweenVec2s, Vec2 } from "../Vec";

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
// Returns a scalar
// Source: https://www.cuemath.com/algebra/product-of-vectors/
export function dotProduct(p1: Vec2, p2: Vec2): number {
    const origin = { x: 0, y: 0 };
    const angle = clockwiseAngle(getAngleBetweenVec2s(origin, p1), getAngleBetweenVec2s(origin, p2));
    return magnitude(p1) * magnitude(p2) * Math.cos(angle);
}
export function magnitude(p: Vec2): number {
    return Math.sqrt(p.y * p.y + p.x * p.x);
}

export function equal(p1: Vec2, p2: Vec2): boolean {
    return p1.x == p2.x && p1.y == p2.y;
}

export function clone(p: Vec2): Vec2 {
    return { x: p.x, y: p.y };
}

export function round(v: Vec2): Vec2 {
    return { x: Math.round(v.x), y: Math.round(v.y) };
}