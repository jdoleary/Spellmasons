import type seedrandom from 'seedrandom';

// from @types/seedrandom
export interface prng {
    (): number;
    double(): number;
    int32(): number;
    quick(): number;
    state(): seedrandom.State;
}

export function randInt(seedrandomInstance: prng, minInclusive:number, maxInclusive:number){
  const x: number = seedrandomInstance.quick();
  return Math.round(x * (maxInclusive - minInclusive) + minInclusive);
}
