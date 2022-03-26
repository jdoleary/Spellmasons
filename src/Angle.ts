
// Find the angle between two angles going counter-clockwise around the angle circle
// So -135deg to 135deg is 45deg because -135deg == 225deg
export function clockwiseAngle(rad1: number, rad2: number): number {
    rad1 = normalizeAngle(rad1);
    rad2 = normalizeAngle(rad2);
    const shouldInvert = rad2 > rad1;
    // Convert rad1 into an identical angle that is larger than rad2
    const adjustedRad1 = shouldInvert ? rad1 + Math.PI * 2 : rad1;
    const result = adjustedRad1 - rad2;
    // Normalize between 0 and Math.PI*2
    const normalizedResult = result > Math.PI * 2 ? result % (Math.PI * 2) : result;
    return normalizedResult;
}
// returns the angle between [0, Math.PI * 2)
export function normalizeAngle(radians: number): number {
    const n1 = radians % (Math.PI * 2);
    if (n1 < 0) {
        return n1 + Math.PI * 2;
    } else {
        return n1;

    }
}

// Returns true if angle1 is between angle 2 and 3 when going clockwise from
// angle2 to angle3
export function isAngleBetweenAngles(angle1: number, angle2: number, angle3: number): boolean {
    const from2To1 = clockwiseAngle(angle2, angle1);
    const from2To3 = clockwiseAngle(angle2, angle3);
    return from2To1 < from2To3;
}