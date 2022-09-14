import { getLoopableIndex } from "./jmath/Polygon2";
import * as storage from "./storage";
import throttle from 'lodash.throttle';

export const sfx: { [key: string]: string } = {
    whoosh: './sound/sfx/whoosh.m4a',
    archerAttack: './sound/sfx-from-val/archer-attack.wav',
    archerDeath: './sound/sfx-from-val/archer-death.wav',
    bloatExplosion: './sound/sfx-from-val/bloat.wav',
    clone: './sound/sfx-from-val/clone.wav',
    contageousSplat: './sound/sfx-from-val/contageous.wav',
    decoyDeath: './sound/sfx/decoyDeath.wav',
    endTurn: './sound/sfx-from-val/end-turn.wav',
    "fallIntoLiquid-blood": './sound/sfx-from-val/fall-into-liquid-blood.wav',
    "fallIntoLiquid-ghost": './sound/sfx-from-val/fall-into-liquid-blood.wav',
    "fallIntoLiquid-lava": './sound/sfx-from-val/fall-into-liquid-lava.wav',
    "fallIntoLiquid-water": './sound/sfx-from-val/fall-into-liquid-water.wav',
    // freeze: './sound/sfx/freeze.wav',
    freeze: './sound/sfx-from-val/freeze.wav',
    golemAttack: './sound/sfx-from-val/golem-attack.wav',
    golemDeath: './sound/sfx-from-val/golem-death.wav',
    heal: './sound/sfx-from-val/heal.wav',
    hurt: './sound/sfx-from-val/hurt.wav',
    lobberAttack: './sound/sfx-from-val/lobber-attack.wav',
    lobberDeath: './sound/sfx-from-val/lobber-death.wav',
    manaBurn: './sound/sfx-from-val/mana-burn.wav',
    manaSteal: './sound/sfx-from-val/mana-steal.wav',
    playerUnitDamage: './sound/sfx-from-val/player-damage.wav',
    playerUnitDeath: './sound/sfx-from-val/player-character-death.wav',
    playerCharacterLargeCast2: './sound/sfx/playerAttackEpic.wav',
    playerCharacterLargeCast: './sound/sfx-from-val/player-character-large-cast.wav',
    playerCharacterMediumCast2: './sound/sfx/playerAttackMedium.mp3',
    playerCharacterMediumCast: './sound/sfx-from-val/player-character-medium-cast.wav',
    playerCharacterSmallCast: './sound/sfx/playerAttackSmall.mp3',
    poison: './sound/sfx-from-val/poison.wav',
    poisonerAttack: './sound/sfx-from-val/poisoner-attack.wav',
    poisonerDeath: './sound/sfx-from-val/poisoner-death.wav',
    potionPickupHealth: './sound/sfx-from-val/potion-pickup-health.wav',
    potionPickupMana: './sound/sfx-from-val/potion-pickup-mana.wav',
    priestAttack: './sound/sfx-from-val/priest-attack.wav',
    priestDeath: './sound/sfx-from-val/priest-death.wav',
    push: './sound/sfx/push.wav',
    pull: './sound/sfx/pull.wav',
    resurrect: './sound/sfx-from-val/resurrect.wav',
    shield: './sound/sfx-from-val/shield.wav',
    summonDecoy: './sound/sfx-from-val/summon-decoy.wav',
    summonerDeath: './sound/sfx-from-val/summoner-death.wav',
    swap: './sound/sfx-from-val/swap.wav',
    vampireAttack: './sound/sfx-from-val/vampire-attack.wav',
    vampireDeath: './sound/sfx-from-val/vampire-death.wav',
    yourTurn: './sound/sfx-from-val/your-turn.wav',
    spawnFromSky: './sound/sfx/spawn-from-sky.wav'

};
export const sfxPageTurn = [
    // './sound/sfx/page-turn-1.flac',
    './sound/sfx/page-turn-2.flac',
];
const music = [
    './sound/music/ChainingSpells.m4a',
    './sound/music/FirstSteps.mp3',
    './sound/music/DeepWandering.mp3',
    './sound/music/ItShallNotFindMe.mp3',
]

// Preload all sounds
Object.values(sfx).forEach(path => {
    new Audio(path);
});

let songIndex = Math.round(Math.random() * music.length - 1);
let musicInstance: HTMLAudioElement;
// Used to ensure music is playing when adjusting audio volume
function playMusicIfNotAlreadyPlaying() {
    if (musicInstance) {
        musicInstance.play();
    } else {
        playNextSong();
    }
}
export function playNextSong() {
    console.log('playNextSong', musicInstance);
    // If there is currently a song playing, stop it
    if (musicInstance) {
        musicInstance.pause();
        musicInstance.remove();
    }
    // Loops through songs
    const index = getLoopableIndex(songIndex++, music)
    musicInstance = new Audio(music[index]);
    musicInstance.loop = true;

    // task: Master all audio and sfx
    // task: Make independent volume sliders for audio and music
    musicInstance.volume = (globalThis.volume === undefined ? 1 : globalThis.volume) * (globalThis.volumeMusic === undefined ? 1 : globalThis.volumeMusic);
    musicInstance.play();
}

export function playSFXKey(key?: string) {
    if (!key) {
        return
    }
    const path = sfx[key];
    if (path) {
        playSFX(path);
    } else {
        console.error('Missing sfx key', key);
    }
}
const lastPlayed: { [key: string]: number } = {};
export function playSFX(path?: string) {
    if (!path) {
        return;
    }
    console.log('sfx:', path);
    const lastTimeThisPathWasPlayed = lastPlayed[path];
    if (lastTimeThisPathWasPlayed && Date.now() - lastTimeThisPathWasPlayed <= 100) {
        console.log('Cancel playing sound', path, 'it was played too recently')
        return;
    }
    lastPlayed[path] = Date.now();
    // In order to allow sounds to overlap, they must be 
    // fully instantiated each time they are played
    const audioInstance = new Audio(path);
    audioInstance.volume = (globalThis.volume === undefined ? 1 : globalThis.volume) * (globalThis.volumeGame === undefined ? 1 : globalThis.volumeGame);
    audioInstance.play();

}
const demoSoundWhenChangingVolume = throttle(() => {
    globalThis.playSFXKey('playerUnitDamage');
}, 150, { trailing: true })
const STORAGE_OPTIONS = 'OPTIONS';
export function setupAudio() {
    console.log('Setup: Audio');
    globalThis.changeVolume = (volume: number) => {
        globalThis.volume = volume;
        storage.assign(STORAGE_OPTIONS, { volume: globalThis.volume });
        if (musicInstance) {
            musicInstance.volume = globalThis.volume * (globalThis.volumeMusic === undefined ? 1 : globalThis.volumeMusic);
        }
        // Play a sound so it'll show the user how loud it is
        demoSoundWhenChangingVolume()
    };
    globalThis.changeVolumeMusic = (volume: number) => {
        globalThis.volumeMusic = volume;
        storage.assign(STORAGE_OPTIONS, { volumeMusic: globalThis.volumeMusic });
        if (musicInstance) {
            musicInstance.volume = (globalThis.volume === undefined ? 1 : globalThis.volume) * globalThis.volumeMusic;
        }
        playMusicIfNotAlreadyPlaying();
    };
    globalThis.changeVolumeGame = (volume: number) => {
        globalThis.volumeGame = volume;
        // Play a sound so it'll show the user how loud it is
        demoSoundWhenChangingVolume();
        storage.assign(STORAGE_OPTIONS, { volumeGame: globalThis.volumeGame });
    };
    // Retrieve audio settings from storage
    const storedOptions = storage.get(STORAGE_OPTIONS);
    if (storedOptions !== null) {
        const options = JSON.parse(storedOptions);
        if (options.volume !== undefined) {
            globalThis.changeVolume(options.volume);
        }
        if (options.volumeMusic !== undefined) {
            globalThis.changeVolumeMusic(options.volumeMusic);
        }
        if (options.volumeGame !== undefined) {
            globalThis.changeVolumeGame(options.volumeGame);
        }
    }
}