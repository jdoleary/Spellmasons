import { isBetween, Vec2 } from "./Vec";

export interface Rect {
    top: number;
    bottom: number;
    left: number;
    right: number;
}
export function addMarginToRect(rect: Rect, margin: number): Rect {
    return {
        top: rect.top - margin,
        bottom: rect.bottom + margin,
        left: rect.left - margin,
        right: rect.right + margin
    }
}
export function isWithinRect(point: Vec2, rect: Rect) {
    return isBetween(point, { x: rect.left, y: rect.top }, { x: rect.right, y: rect.bottom });
}