import random, { Random } from 'random';
import seedrandom from 'seedrandom';
export default function makeSeededRandom(seed: string): Random {
  // change the underlying pseudo random number generator
  // by default, Math.random is used as the underlying PRNG
  random.use(seedrandom(seed));
  return random;
}
