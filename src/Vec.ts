
import { clockwiseAngle } from "./Angle";
export interface Vec2 {
    x: number;
    y: number;
}

// Get the angle away from the x-axis from origin to point in radians
export function getAngleBetweenVec2s(origin: Vec2, point: Vec2): number {
    const dy = point.y - origin.y;
    const dx = point.x - origin.x;
    return Math.atan2(dy, dx);
}

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

// Returns true if testPoint is within a bounding box drawn between the two bounding points
export function isBetween(testPoint: Vec2, boundingPoint: Vec2, boundingPoint2: Vec2): boolean {
    const minY = Math.min(boundingPoint.y, boundingPoint2.y);
    const minX = Math.min(boundingPoint.x, boundingPoint2.x);
    const maxY = Math.max(boundingPoint.y, boundingPoint2.y);
    const maxX = Math.max(boundingPoint.x, boundingPoint2.x);
    return minX <= testPoint.x && testPoint.x <= maxX &&
        minY <= testPoint.y && testPoint.y <= maxY;
}