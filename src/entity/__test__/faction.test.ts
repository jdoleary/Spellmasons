import { Faction } from "../../types/commonTypes";
import { getFactionsOf } from "../Player";
import { livingUnitsInSameFaction, livingUnitsInDifferentFaction } from "../Unit";

describe('getFactionsOf', () => {
  it('should return an array of factions', () => {
    const players = [
      { clientConnected: true, unit: { faction: Faction.ALLY } },
      { clientConnected: true, unit: { faction: Faction.ENEMY } }]
    const actual = getFactionsOf(players);
    const expected = [Faction.ALLY, Faction.ENEMY];
    expect(expected).toEqual(actual);
  });
  it('should return a deduplicated array', () => {
    const players = [
      { clientConnected: true, unit: { faction: Faction.ALLY } },
      { clientConnected: true, unit: { faction: Faction.ALLY } },
      { clientConnected: true, unit: { faction: Faction.ALLY } },]
    const actual = getFactionsOf(players);
    const expected = [Faction.ALLY];
    expect(expected).toEqual(actual);
  });
  it('should return NOT include disconnected players', () => {
    const players = [
      { clientConnected: true, unit: { faction: Faction.ALLY } },
      { clientConnected: true, unit: { faction: Faction.ALLY } },
      { clientConnected: false, unit: { faction: Faction.ENEMY } },
      { clientConnected: false, unit: { faction: Faction.ALLY } },]
    const actual = getFactionsOf(players);
    const expected = [Faction.ALLY];
    expect(expected).toEqual(actual);
  });
});

// TODO - Implement Unit Tests for livingUnitsInSameFaction, livingUnitsInDifferentFaction,
// and other similar functions