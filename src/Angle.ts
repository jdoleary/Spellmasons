
// Find the angle between two angles going counter-clockwise around the angle circle
// So 135deg to -135deg is 45deg because -135deg == 225deg
export function counterClockwiseAngle(rad1: number, rad2: number): number {
    const shouldInvert = rad1 > rad2;
    // Convert rad2 into an identical angle that is larger than rad1
    const adjustedRad2 = shouldInvert ? rad2 + Math.PI * 2 : rad2;
    const result = adjustedRad2 - rad1;
    // Normalize between 0 and Math.PI*2
    const normalizedResult = result > Math.PI * 2 ? result % (Math.PI * 2) : result;
    return normalizedResult;
}
export function clockwiseAngle(rad1: number, rad2: number): number {
    return counterClockwiseAngle(rad2, rad1);
}
// returns the angle between (-Math.PI, Math.PI]
export function normalizeAngle(radians: number): number {
    const n1 = radians % (Math.PI * 2);
    if (n1 <= -Math.PI) {
        return n1 + Math.PI * 2;
    } else {
        return n1;

    }
}

// Returns true if angle1 is between angle 2 and 3
export function isAngleBetweenAngles(angle1: number, angle2: number, angle3: number): boolean {
    const from2To1 = counterClockwiseAngle(angle2, angle1);
    const from2To3 = counterClockwiseAngle(angle2, angle3);
    return from2To1 < from2To3;
}