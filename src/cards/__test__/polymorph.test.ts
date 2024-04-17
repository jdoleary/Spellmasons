import { allUnits, registerUnits } from '../../entity/units/index';
import { getPolymorphProbabilityFromBudget, getPossibleUnitPolymorphs } from '../polymorph';

describe("polymorph", () => {
    describe('getPolymorphProbabilityFromBudget', () => {
        it('should log possible outcomes for all registered units', () => {
            registerUnits();
            for (const u1 of Object.values(allUnits)) {
                //create and log polymorph probabilities
                const results: { id: string, p: number, realChance: number }[] = [];
                let totalWeights = 0;

                const possibleUnitTypes = getPossibleUnitPolymorphs(u1.id);
                for (const u2 of possibleUnitTypes) {
                    const probability = getPolymorphProbabilityFromBudget(u1.spawnParams?.budgetCost, u2.spawnParams?.budgetCost);
                    results.push({ id: u2.id, p: probability, realChance: 0 });
                    totalWeights += probability;
                }

                for (const result of results) {
                    // Real chance is in 00.00% format
                    result.realChance = Math.round((result.p / totalWeights) * 10000) / 100;
                }

                results.sort((a, b) => b.p - a.p)
                console.log("\n-----\n[" + u1.id + "] - [" + u1.spawnParams?.budgetCost + "]\n", results)
            }
        });
        it('should handle positive/negative numbers', () => {
            const budgets1 = [5, -5];
            const budgets2 = [10, -10];
            for (const b1 of budgets1) {
                for (const b2 of budgets2) {
                    const result = getPolymorphProbabilityFromBudget(b1, b2);
                    expect(result).toBeGreaterThan(0);
                    expect(result).toEqual(Math.floor(result));
                }
            }
        });
        it('should handle one or more 0\'s or undefined numbers', () => {
            const budgets1 = [0, undefined];
            const budgets2 = [0, undefined, 300];
            for (const b1 of budgets1) {
                for (const b2 of budgets2) {
                    const result = getPolymorphProbabilityFromBudget(b1, b2);
                    expect(result).toBeGreaterThan(0);
                    expect(result).toEqual(Math.floor(result));
                }
            }
        });
        it('should handle really big numbers', () => {
            const budgets1 = [1, 9000, -15000];
            const budgets2 = [1, -2000, 3000];
            for (const b1 of budgets1) {
                for (const b2 of budgets2) {
                    const result = getPolymorphProbabilityFromBudget(b1, b2);
                    expect(result).toBeGreaterThan(0);
                }
            }
        });
    });
});