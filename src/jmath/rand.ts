import type seedrandom from 'seedrandom';

// from @types/seedrandom
export interface prng {
  (): number;
  double(): number;
  int32(): number;
  quick(): number;
  state(): seedrandom.State;
}
export interface SeedrandomState {
  i: number,
  j: number,
  S: number[]
}

export function randInt(seedrandomInstance: prng, minInclusive: number, maxInclusive: number) {
  const x: number = seedrandomInstance.quick();
  return Math.round(x * (maxInclusive - minInclusive) + minInclusive);
}
export function randFloat(seedrandomInstance: prng, minInclusive: number, maxInclusive: number) {
  const x: number = seedrandomInstance.quick();
  return x * (maxInclusive - minInclusive) + minInclusive;
}

interface objectWithProbability {
  probability: number;
}
export function _chooseObjectWithProbability<T extends objectWithProbability>(roll: number, source: T[]): T | undefined {
  let rollingLowerBound = 0;
  // Iterate each object and check if the roll is between the lower bound and the upper bound
  // which means that the current object would have been rolled
  for (let x of source) {
    if (
      roll > rollingLowerBound &&
      roll <= x.probability + rollingLowerBound
    ) {
      return x;
    } else {
      rollingLowerBound += x.probability;
    }
  }
  return undefined;

}
export function chooseOneOf(arr?: any[]): any {
  if (!arr) {
    return undefined;
  }
  const index = Math.floor(Math.random() * arr.length);
  return arr[index];
}
export function chooseObjectWithProbability<T extends objectWithProbability>(
  source: T[],
  seedRandomInstance: prng
): T | undefined {
  if (source.length == 0) {
    return undefined;
  }
  // Chooses a random object in the source list based on its probability
  const maxProbability = source.reduce(
    (maxProbability, current) => current.probability + maxProbability,
    0,
  );
  // Choose random integer within the sum of all the probabilities
  const roll = randInt(seedRandomInstance, 1, maxProbability);
  return _chooseObjectWithProbability(roll, source);
}