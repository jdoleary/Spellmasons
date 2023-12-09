
// Find the angle between two angles going clockwise around the angle circle
// Note: Remember the angle circle itself goes positive in the counter clockwise direction
// So up and to the right is 45 degrees and down and to the right is -45 degrees
// see unit tests for examples
export function clockwiseAngle(rad1: number, rad2: number): number {
    rad1 = normalizeAngle(rad1);
    rad2 = normalizeAngle(rad2);
    const shouldInvert = rad2 > rad1;
    // Convert rad1 into an identical angle that is larger than rad2
    const adjustedRad1 = shouldInvert ? rad1 + Math.PI * 2 : rad1;
    const result = adjustedRad1 - rad2;
    // Normalize between 0 and Math.PI*2
    return normalizeAngle(result);
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
// Note: Remember the angle circle itself goes positive in the counter clockwise direction
// So up and to the right is 45 degrees and down and to the right is -45 degrees
// see unit tests for examples
export function isAngleBetweenAngles(testAngle: number, startAngle: number, endAngle: number): boolean {
    const from2To1 = clockwiseAngle(startAngle, testAngle);
    const from2To3 = clockwiseAngle(startAngle, endAngle);
    return from2To1 < from2To3;
}