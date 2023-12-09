
// from https://easings.net/
// input should be 0 - 1
export function easeOutCubic(x: number): number {
    return 1 - Math.pow(1 - x, 3);
}