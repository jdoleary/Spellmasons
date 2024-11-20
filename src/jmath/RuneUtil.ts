import { getElementAtIndexLooped } from "./ArrayUtil";
import { getLoopableIndex } from "./Polygon2";

type WithKey = { key: string };
export function presentRunes(allRunes: WithKey[], numOfRunesNeeded: number, startIndex: number, lockedRunes: { key: string, index: number }[]): string[] {
    let skippedLockedRunes = 0;
    const chosenRunes: string[] = []
    for (let i = 0; i < numOfRunesNeeded - lockedRunes.length + skippedLockedRunes; i++) {
        let chosen: string | undefined = getElementAtIndexLooped(allRunes, i + (startIndex || 0))?.key;
        // If a rune has been locked in this index, choose it; otherwise choose a seeded random rune
        if (chosen !== undefined) {
            const lockedRune = lockedRunes.find(lr => lr.key == chosen);
            if (lockedRune) {
                skippedLockedRunes++;
                continue;
            }
            // Found a unique rune
            chosenRunes.push(chosen);
        }
    }
    // Add locked runes in the indices that they belong in:
    // .sort ensures they are added in the proper order so they
    // land at the correct indices
    for (let lr of lockedRunes.sort((a, b) => a.index - b.index)) {
        chosenRunes.splice(lr.index, 0, lr.key);
    }
    return chosenRunes;

}
export function incrementPresentedRunesIndex(startIndex: number, incrementBy: number, allRunes: WithKey[], lockedRunes: { key: string, index: number }[]): number {
    const unnaturallyPresentingLockedRunes = lockedRunes.filter(lr => {
        const naturalIndex = allRunes.findIndex(ar => ar.key == lr.key);
        for (let i = startIndex; i < startIndex + incrementBy; i++) {
            const indexThatWillPresentNaturally = getLoopableIndex(i, allRunes);
            if (indexThatWillPresentNaturally == naturalIndex) {
                return false;
            }
        }
        return true;
    });
    return startIndex + incrementBy - unnaturallyPresentingLockedRunes.length;
}