import { IUpgrade, filterUpgrades, omitRerolledUpgrades } from "./Upgrade";
describe('Upgrade', () => {
    let i = 0;
    function upgradeFactory(u: Partial<IUpgrade>): IUpgrade {
        return Object.assign({
            title: `upgrade_${(i++).toString}`,
            requires: [],
            type: 'card',
            description: () => '',
            thumbnail: '',
            effect: () => { },
            probability: 20, // arbitrary number above the minimum probability 
            cost: { manaCost: 1, healthCost: 1 }
        }, u)
    }
    describe('filterUpgrades', () => {
        it('should only allow upgrade where player has all upgrades that upgrade requires', () => {
            const u = upgradeFactory({ requires: ["req1", "req2"] })
            const actual = filterUpgrades(u, { upgrades: ["req1", "req2"], inventory: ["req1", "req2"] }, { activeMods: [] });
            expect(actual).toEqual(true);
        });
        it('should omit upgrades if player does not meet requirements', () => {
            const u = upgradeFactory({ requires: ["req1", "req2"] })
            const actual = filterUpgrades(u, { upgrades: ["req2"], inventory: ["req2"] }, { activeMods: [] });
            expect(actual).toEqual(false);
        });
        it('should omit upgrades that player already has', () => {
            const title = 'subject'
            const u = upgradeFactory({ title })
            const actual = filterUpgrades(u, { upgrades: [title], inventory: [title] }, { activeMods: [] });
            expect(actual).toEqual(false);
        });
        it('should omit upgrades that do not meet the minimumProbability', () => {
            const title = 'subject';
            const u = upgradeFactory({ title, probability: 1 })
            const actual = filterUpgrades(u, { upgrades: [], inventory: [] }, { activeMods: [] });
            expect(actual).toEqual(false);
        });
        it('should omit upgrades with a probability of 0', () => {
            const title = 'subject';
            const u = upgradeFactory({ title, probability: 0 })
            const actual = filterUpgrades(u, { upgrades: [], inventory: [] }, { activeMods: [] });
            expect(actual).toEqual(false);
        });
        it('should omit modded upgrades if mod is not active', () => {
            const title = 'subject';
            const modName = 'myMod';
            const u = upgradeFactory({ title, modName, })
            const actual = filterUpgrades(u, { upgrades: [], inventory: [] }, { activeMods: [] });
            expect(actual).toEqual(false);
        });
        it('should allow modded upgrades if mod is active', () => {
            const title = 'subject';
            const modName = 'myMod';
            const u = upgradeFactory({ title, modName, })
            const actual = filterUpgrades(u, { upgrades: [], inventory: [] }, { activeMods: [modName] });
            expect(actual).toEqual(true);
        });
    });

    describe('omitRerolledUpgrades', () => {
        beforeEach(() => {
            globalThis.rerollOmit = [];
        });
        afterAll(() => {
            globalThis.rerollOmit = [];
        })
        it('should omit in globalThis.rerollOmit', () => {
            const keep = upgradeFactory({ title: 'keep1' })
            const upgrades = [
                upgradeFactory({ title: 'omit1' }),
                upgradeFactory({ title: 'omit2' }),
                keep
            ]
            globalThis.rerollOmit = ['omit1', 'omit2'];
            const actual = omitRerolledUpgrades(upgrades);
            expect(actual).toEqual([keep]);
        });
        it('should keep upgrades in globalThis.rerollOmit if there are no non-omitted upgrades to pick from', () => {
            const upgrades = [
                upgradeFactory({ title: 'omit1' }),
                upgradeFactory({ title: 'omit2' }),
            ]
            globalThis.rerollOmit = ['omit1', 'omit2'];
            const actual = omitRerolledUpgrades(upgrades);
            expect(actual).toEqual(upgrades);
        });


    });

});
