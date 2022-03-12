
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