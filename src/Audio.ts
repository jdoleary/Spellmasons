import { getLoopableIndex } from "./jmath/Polygon2";
import * as storage from "./storage";
import throttle from 'lodash.throttle';
import { chooseOneOf } from "./jmath/rand";
import { lerp } from "./jmath/math";

export const sfx: { [key: string]: string[] } = {
  arrow: ['./sound/sfx/arrow.mp3'],
  "fallIntoLiquid-blood": ['./sound/sfx/fall-into-liquid-blood.mp3'],
  "fallIntoLiquid-ghost": ['./sound/sfx/fall-into-liquid-blood.mp3'],
  "fallIntoLiquid-lava": ['./sound/sfx/fall-into-liquid-lava.mp3'],
  "fallIntoLiquid-water": ['./sound/sfx/fall-into-liquid-water.mp3'],
  archerAttack: [
    './sound/sfx/archer-attack.mp3',
    './sound/sfx/archer-attack-001.mp3',
    './sound/sfx/archer-attack-002.mp3',
  ],
  archerDeath: [
    './sound/sfx/archer-death.mp3',
    './sound/sfx/archer-death-001.mp3',
    './sound/sfx/archer-death-002.mp3',
  ],
  archerHurt: [
    './sound/sfx/archer-hurt.mp3',
    './sound/sfx/archer-hurt-001.mp3',
    './sound/sfx/archer-hurt-002.mp3',
  ],
  ancientDeath: ['./sound/sfx/Crumbling Rock Slide_RBDII 06.mp3'],
  ancientHit: ['./sound/sfx/Hit Rock into Gravel_RBDII 01.mp3'],
  bleedLarge: ['./sound/sfx/BleedHigh.mp3'],
  bleedMedium: ['./sound/sfx/BleedMed.mp3'],
  bleedSmall: ['./sound/sfx/BleedLow.mp3'],
  bloatExplosion: ['./sound/sfx/bloat.mp3'],
  bolt: ['./sound/sfx/RPG3_ElectricMagic_LightningZap01.mp3'],
  burst: ['./sound/sfx/Burst_v2.mp3'],
  captureSoul: ['./sound/sfx/capture_soul.mp3'],
  drown: ['./sound/sfx/Drown_v2.mp3'],
  suffocate: ['./sound/sfx/Suffocate_v2.mp3'],
  click: ['./sound/sfx/click.mp3'],
  clone: ['./sound/sfx/clone.mp3'],
  contageousSplat: ['./sound/sfx/contageous.mp3'],
  dash: ['./sound/sfx/RPG3_WindMagic_Cast02v3_P2_Shoot.mp3'],
  debilitate: ['./sound/sfx/debilitate.mp3'],
  decoyDeath: ['./sound/sfx/decoyDeath.mp3'],
  deny_range: ['./sound/sfx/deny_range.mp3'],
  deny_stamina: ['./sound/sfx/deny_stamina.mp3'],
  deny_target: ['./sound/sfx/deny_target.mp3'],
  deny: ['./sound/sfx/deny.mp3'],
  endTurn: ['./sound/sfx/end-turn.mp3'],
  freeze: ['./sound/sfx/freeze.mp3'],
  game_over: ['./sound/sfx/game_over.mp3'],
  golemAttack: ['./sound/sfx/golem-attack.mp3'],
  golemDeath: ['./sound/sfx/golem-death.mp3'],
  heal: ['./sound/sfx/heal.mp3'],
  hurt: ['./sound/sfx/hurt.mp3'],
  hurt2: ['./sound/sfx/hurt2.mp3'],
  hurt3: ['./sound/sfx/hurt3.mp3'],
  inventory_close: ['./sound/sfx/inventory_close.mp3'],
  inventory_open: ['./sound/sfx/inventory_open.mp3'],
  levelUp: ['./sound/sfx/LvlUp.mp3'],
  lobberAttack: [
    './sound/sfx/lobber-attack.mp3',
    './sound/sfx/lobber-attack-001.mp3',
    './sound/sfx/lobber-attack-002.mp3',
  ],
  lobberDeath: [
    './sound/sfx/lobber-death.mp3',
    './sound/sfx/lobber-death-001.mp3',
    './sound/sfx/lobber-death-002.mp3',
  ],
  lobberHurt: [
    './sound/sfx/glop-hurt.mp3',
    './sound/sfx/glop-hurt-001.mp3',
    './sound/sfx/glop-hurt-002.mp3',
  ],
  manaBurn: ['./sound/sfx/mana-burn.mp3'],
  manaSteal: ['./sound/sfx/mana-steal.mp3'],
  playerCharacterLargeCast: ['./sound/sfx/player-character-large-cast.mp3'],
  playerCharacterLargeCast2: ['./sound/sfx/playerAttackEpic.mp3'],
  playerCharacterMediumCast: ['./sound/sfx/player-character-medium-cast.mp3'],
  playerCharacterMediumCast2: ['./sound/sfx/playerAttackMedium.mp3'],
  playerCharacterSmallCast: ['./sound/sfx/playerAttackSmall.mp3'],
  playerUnitDeath: ['./sound/sfx/player-character-death.mp3'],
  phantomArrow: ['./sound/sfx/phantom_arrow.mp3'],
  poison: ['./sound/sfx/poison.mp3'],
  poisonerAttack: [
    './sound/sfx/poisoner-attack.mp3',
    './sound/sfx/poisoner-attack-001.mp3',
    './sound/sfx/poisoner-attack-002.mp3',
  ],
  poisonerDeath: [
    './sound/sfx/poisoner-death.mp3',
    './sound/sfx/poisoner-death-001.mp3',
    './sound/sfx/poisoner-death-002.mp3',
  ],
  poisonerHurt: [
    './sound/sfx/poisoner-hurt.mp3',
    './sound/sfx/poisoner-hurt-001.mp3',
    './sound/sfx/poisoner-hurt-002.mp3',
  ],
  potionPickupHealth: ['./sound/sfx/potion-pickup-health.mp3'],
  potionPickupMana: ['./sound/sfx/potion-pickup-mana.mp3'],
  priestAttack: [
    './sound/sfx/priest-attack.mp3',
    './sound/sfx/priest-attack-001.mp3',
    './sound/sfx/priest-attack-002.mp3',
  ],
  priestDeath: [
    './sound/sfx/priest-death.mp3',
    './sound/sfx/priest-death-001.mp3',
    './sound/sfx/priest-death-002.mp3',
  ],
  priestHurt: [
    './sound/sfx/priest-hurt.mp3',
    './sound/sfx/priest-hurt-001.mp3',
    './sound/sfx/priest-hurt-002.mp3',
  ],
  pull: ['./sound/sfx/pull.mp3'],
  purify: ['./sound/sfx/purify.mp3'],
  push: ['./sound/sfx/push.mp3'],
  rend: ['./sound/sfx/rend.mp3'],
  reroll: ['./sound/sfx/Reroll_v2-001.wav', './sound/sfx/Reroll_v2-002.wav', './sound/sfx/Reroll_v2-003.wav'],
  resurrect: ['./sound/sfx/resurrect.mp3'],
  sacrifice: ['./sound/sfx/sacrifice.mp3'],
  scroll_disappear: ['./sound/sfx/RPG3_FireMagicFlameThrower_P3_End01.mp3'],
  shield: ['./sound/sfx/shield.mp3'],
  shove: ['./sound/sfx/RPG3_GenericPunch_Impact04Crit.mp3'],
  spawnPotion: ['./sound/sfx/Glug.mp3'],
  summonDecoy: ['./sound/sfx/summon-decoy.mp3'],
  summonerDeath: [
    './sound/sfx/summoner-death.mp3',
    './sound/sfx/summoner-death-001.mp3',
    './sound/sfx/summoner-death-002.mp3',
  ],
  summonerHurt: [
    './sound/sfx/summoner-hurt.mp3',
    './sound/sfx/summoner-hurt-001.mp3',
    './sound/sfx/summoner-hurt-002.mp3',
  ],
  summonerSummon: [
    './sound/sfx/summoner-summon.mp3',
  ],
  swap: ['./sound/sfx/swap.mp3'],
  targetAquired: ['./sound/sfx/Target_variation-001.mp3',
    './sound/sfx/Target_variation-002.mp3',
    './sound/sfx/Target_variation-003.mp3',
    './sound/sfx/Target_variation-004.mp3'],
  targeting: ['./sound/sfx/Targeting_v3.mp3'],
  unitDamage: ['./sound/sfx/player-damage.mp3'],
  vampireAttack: [
    './sound/sfx/vampire-attack.mp3',
    './sound/sfx/vampire-attack-001.mp3',
    './sound/sfx/vampire-attack-002.mp3',
  ],
  vampireDeath: [
    './sound/sfx/vampire-death.mp3',
    './sound/sfx/vampire-death-001.mp3',
    './sound/sfx/vampire-death-002.mp3',
  ],
  vampireHurt: [
    './sound/sfx/vampire-hurt.mp3',
    './sound/sfx/vampire-hurt-001.mp3',
    './sound/sfx/vampire-hurt-002.mp3',
  ],
  yourTurn: ['./sound/sfx/your-turn.mp3'],
  deathmasonReveal: ['./sound/sfx/deathmason_reveal.wav'],
  goruReveal: ['./sound/sfx/goru_reveal.wav'],
  oof: ['./sound/sfx/oof.wav']
};
const music = [
  // config.IS_ANNIVERSARY_UPDATE_OUT
  // './sound/music/TheDangerIsYou.mp3',
  // config.IS_ANNIVERSARY_UPDATE_OUT
  // './sound/music/NeverendingTale.mp3',
  './sound/music/ChainingSpells.mp3',
  './sound/music/FirstSteps2.mp3',
  './sound/music/DeepWandering.mp3',
  './sound/music/ItShallNotFindMe.mp3',
  './sound/music/BleedingSynth.mp3',
  './sound/music/YouAreNoir.mp3',
  './sound/music/MistakenIdentity.mp3',
  './sound/music/BrokenTrust.mp3',
]
export const playThrottledEndTurnSFX = throttle(() => {
  playSFXKey('endTurn');
}, 1000);

// Preload all sounds
Object.values(sfx).forEach(paths => {
  if (globalThis.headless) {
    return;
  }
  for (let path of paths) {
    new Audio(path);
  }
});

let songIndex = Math.round(Math.random() * music.length - 1);
let musicInstance: HTMLAudioElement;
// Used to ensure music is playing when adjusting audio volume
export function playMusicIfNotAlreadyPlaying() {
  if (musicInstance) {
    musicInstance.play();
  } else {
    playNextSong();
  }
}
// Expose to global so storage.ts can call it without importing Audio.ts
// because headless server cannot import Audio.ts
globalThis.playMusicIfNotAlreadyPlaying = playMusicIfNotAlreadyPlaying;

let fadeOutSongPromiseResolver: () => void;
let fadeOutSongInterval: NodeJS.Timeout;
export async function playNextSong() {
  if (globalThis.headless) {
    return;
  }
  console.log('playNextSong', musicInstance);
  // Loops through songs
  const index = getLoopableIndex(songIndex++, music)
  const nextSong = music[index];
  if (!nextSong) {
    console.error('No next song at index', index);
    return;
  }
  // If there is currently a song playing, stop it
  if (musicInstance) {
    const MILLIS_TO_FADE_OUT_SONG = 1_500;
    await Promise.race([new Promise(resolve => setTimeout(resolve, MILLIS_TO_FADE_OUT_SONG + 100)), new Promise<void>(resolve => {
      if (fadeOutSongPromiseResolver) {
        // If another song is fading out, resolve it immediately
        // so that it finishes removing that song
        fadeOutSongPromiseResolver();
      }
      fadeOutSongPromiseResolver = resolve;
      const startVolume = musicInstance.volume;
      let i = 0;
      const INTERVAL_MILLIS = 10;
      // Clear previous interval before starting a new interval
      clearInterval(fadeOutSongInterval);
      fadeOutSongInterval = setInterval(() => {
        i += INTERVAL_MILLIS;
        const lerpValue = i / MILLIS_TO_FADE_OUT_SONG
        musicInstance.volume = lerp(startVolume, 0, lerpValue);
        if (lerpValue >= 1) {
          resolve();
        }

      }, INTERVAL_MILLIS);
    })]);
  } else {
    console.log('Audio: Create music instance for the first time', nextSong);
    musicInstance = new Audio(nextSong);
  }

  // Clear any previously running intervals to ensure it won't overwrite the volume
  // for the new song which should start at set volume
  clearInterval(fadeOutSongInterval);
  console.log('Audio: change song to', nextSong);
  // Reassign the src of the music instance, this ensures we only have
  // one song playing at a time
  musicInstance.setAttribute('src', nextSong);
  musicInstance.loop = true;

  // task: Master all audio and sfx
  // task: Make independent volume sliders for audio and music
  musicInstance.volume = (globalThis.volume === undefined ? 1 : globalThis.volume) * (globalThis.volumeMusic === undefined ? 1 : globalThis.volumeMusic);
  try {
    musicInstance.play();
  } catch (e) {
    console.log('Could not play music.  Caught: ', e);
  }
}

export function playSFXKey(key?: string) {
  if (globalThis.headless) {
    return;
  }
  if (!key) {
    return
  }
  const paths = sfx[key];
  if (paths) {
    const path = chooseOneOf(paths);
    if (path) {
      console.debug('sfx:', path);
      playSFX(path);
    } else {
      console.error('Error choosing random sfx from ', key);
    }
  } else {
    console.error('Missing sfx key', key);
  }
}
const lastPlayed: { [key: string]: number } = {};
export function playSFX(path?: string) {
  if (globalThis.headless) {
    return;
  }
  if (!path) {
    return;
  }
  const lastTimeThisPathWasPlayed = lastPlayed[path];
  if (lastTimeThisPathWasPlayed && Date.now() - lastTimeThisPathWasPlayed <= 100) {
    console.debug('Cancel playing sound', path, 'it was played too recently')
    return;
  }
  lastPlayed[path] = Date.now();
  // In order to allow sounds to overlap, they must be 
  // fully instantiated each time they are played
  const audioInstance = new Audio(path);
  audioInstance.volume = (globalThis.volume === undefined ? 1 : globalThis.volume) * (globalThis.volumeGame === undefined ? 1 : globalThis.volumeGame);
  audioInstance.play();

}
const demoSoundThrottle = 150;
const demoSoundWhenChangingVolume = throttle(() => {
  globalThis.playSFXKey('click');
}, demoSoundThrottle, { trailing: true })

export function setupAudio() {
  console.log('Setup: Audio');
  globalThis.changeVolume = (volume: number, saveSetting: boolean = true) => {
    globalThis.volume = volume;
    if (musicInstance) {
      musicInstance.volume = globalThis.volume * (globalThis.volumeMusic === undefined ? 1 : globalThis.volumeMusic);
    }
    if (saveSetting) {

      storage.assign(storage.STORAGE_OPTIONS, { volume: globalThis.volume });
      // Play a sound so it'll show the user how loud it is
      demoSoundWhenChangingVolume()
    }
  };
  globalThis.changeVolumeMusic = (volume: number, saveSetting: boolean = true) => {
    globalThis.volumeMusic = volume;
    if (saveSetting) {
      storage.assign(storage.STORAGE_OPTIONS, { volumeMusic: globalThis.volumeMusic });
    }
    if (musicInstance) {
      musicInstance.volume = (globalThis.volume === undefined ? 1 : globalThis.volume) * globalThis.volumeMusic;
    }
    playMusicIfNotAlreadyPlaying();
  };
  globalThis.changeVolumeGame = (volume: number, saveSetting: boolean = true) => {
    globalThis.volumeGame = volume;
    if (saveSetting) {
      // Play a sound so it'll show the user how loud it is
      demoSoundWhenChangingVolume();
      storage.assign(storage.STORAGE_OPTIONS, { volumeGame: globalThis.volumeGame });
    }
  };
}