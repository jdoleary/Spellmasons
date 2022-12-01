import { getLoopableIndex } from "./jmath/Polygon2";
import * as storage from "./storage";
import throttle from 'lodash.throttle';
import { chooseObjectWithProbability, chooseOneOf } from "./jmath/rand";

export const sfx: { [key: string]: string[] } = {
    "fallIntoLiquid-blood": ['./sound/sfx-from-val/fall-into-liquid-blood.wav'],
    "fallIntoLiquid-ghost": ['./sound/sfx-from-val/fall-into-liquid-blood.wav'],
    "fallIntoLiquid-lava": ['./sound/sfx-from-val/fall-into-liquid-lava.wav'],
    "fallIntoLiquid-water": ['./sound/sfx-from-val/fall-into-liquid-water.wav'],
    archerAttack: [
        './sound/sfx-from-val/archer-attack.wav',
        './sound/unit-variations/archer-attack-001.wav',
        './sound/unit-variations/archer-attack-002.wav',
    ],
    archerDeath: [
        './sound/sfx-from-val/archer-death.wav',
        './sound/unit-variations/archer-death-001.wav',
        './sound/unit-variations/archer-death-002.wav',
    ],
    archerHurt: [
        './sound/sfx-from-val/archer-hurt.wav',
        './sound/unit-variations/archer-hurt-001.wav',
        './sound/unit-variations/archer-hurt-002.wav',
    ],
    bleedLarge: ['./sound/sfx-3/BleedHigh.wav'],
    bleedMedium: ['./sound/sfx-3/BleedMed.wav'],
    bleedSmall: ['./sound/sfx-3/BleedLow.wav'],
    bloatExplosion: ['./sound/sfx-from-val/bloat.wav'],
    click: ['./sound/sfx-from-val/click.wav'],
    clone: ['./sound/sfx-from-val/clone.wav'],
    contageousSplat: ['./sound/sfx-from-val/contageous.wav'],
    dash: ['./sound/sfx/RPG3_WindMagic_Cast02v3_P2_Shoot.wav'],
    debilitate: ['./sound/sfx-from-val/debilitate.wav'],
    decoyDeath: ['./sound/sfx/decoyDeath.wav'],
    deny_range: ['./sound/sfx-from-val/deny_range.wav'],
    deny_stamina: ['./sound/sfx-from-val/deny_stamina.wav'],
    deny_target: ['./sound/sfx-from-val/deny_target.wav'],
    deny: ['./sound/sfx-from-val/deny.wav'],
    endTurn: ['./sound/sfx-from-val/end-turn.wav'],
    freeze: ['./sound/sfx-from-val/freeze.wav'],
    game_over: ['./sound/sfx-from-val/game_over.wav'],
    golemAttack: ['./sound/sfx-from-val/golem-attack.wav'],
    golemDeath: ['./sound/sfx-from-val/golem-death.wav'],
    heal: ['./sound/sfx-from-val/heal.wav'],
    hurt: ['./sound/sfx-from-val/hurt.wav'],
    inventory_close: ['./sound/sfx-from-val/inventory_close.wav'],
    inventory_open: ['./sound/sfx-from-val/inventory_open.wav'],
    levelUp: ['./sound/sfx-3/LvlUp.wav'],
    lobberAttack: [
        './sound/sfx-from-val/lobber-attack.wav',
        './sound/unit-variations/lobber-attack-001.wav',
        './sound/unit-variations/lobber-attack-002.wav',
    ],
    lobberDeath: [
        './sound/sfx-from-val/lobber-death.wav',
        './sound/unit-variations/lobber-death-001.wav',
        './sound/unit-variations/lobber-death-002.wav',
    ],
    lobberHurt: [
        './sound/sfx-from-val/glop-hurt.wav',
        './sound/unit-variations/glop-hurt-001.wav',
        './sound/unit-variations/glop-hurt-002.wav',
    ],
    manaBurn: ['./sound/sfx-from-val/mana-burn.wav'],
    manaSteal: ['./sound/sfx-from-val/mana-steal.wav'],
    playerCharacterLargeCast: ['./sound/sfx-from-val/player-character-large-cast.wav'],
    playerCharacterLargeCast2: ['./sound/sfx/playerAttackEpic.wav'],
    playerCharacterMediumCast: ['./sound/sfx-from-val/player-character-medium-cast.wav'],
    playerCharacterMediumCast2: ['./sound/sfx/playerAttackMedium.mp3'],
    playerCharacterSmallCast: ['./sound/sfx/playerAttackSmall.mp3'],
    playerUnitDeath: ['./sound/sfx-from-val/player-character-death.wav'],
    poison: ['./sound/sfx-from-val/poison.wav'],
    poisonerAttack: [
        './sound/sfx-from-val/poisoner-attack.wav',
        './sound/unit-variations/poisoner-attack-001.wav',
        './sound/unit-variations/poisoner-attack-002.wav',
    ],
    poisonerDeath: [
        './sound/sfx-from-val/poisoner-death.wav',
        './sound/unit-variations/poisoner-death-001.wav',
        './sound/unit-variations/poisoner-death-002.wav',
    ],
    poisonerHurt: [
        './sound/sfx-from-val/poisoner-hurt.wav',
        './sound/unit-variations/poisoner-hurt-001.wav',
        './sound/unit-variations/poisoner-hurt-002.wav',
    ],
    potionPickupHealth: ['./sound/sfx-from-val/potion-pickup-health.wav'],
    potionPickupMana: ['./sound/sfx-from-val/potion-pickup-mana.wav'],
    priestAttack: [
        './sound/sfx-from-val/priest-attack.wav',
        './sound/unit-variations/priest-attack-001.wav',
        './sound/unit-variations/priest-attack-002.wav',
    ],
    priestDeath: [
        './sound/sfx-from-val/priest-death.wav',
        './sound/unit-variations/priest-death-001.wav',
        './sound/unit-variations/priest-death-002.wav',
    ],
    priestHurt: [
        './sound/sfx-from-val/priest-hurt.wav',
        './sound/unit-variations/priest-hurt-001.wav',
        './sound/unit-variations/priest-hurt-002.wav',
    ],
    pull: ['./sound/sfx/pull.wav'],
    purify: ['./sound/sfx-from-val/purify.wav'],
    push: ['./sound/sfx/push.wav'],
    rend: ['./sound/sfx/rend.wav'],
    resurrect: ['./sound/sfx-from-val/resurrect.wav'],
    scroll_disappear: ['./sound/sfx/RPG3_FireMagicFlameThrower_P3_End01.wav'],
    shield: ['./sound/sfx-from-val/shield.wav'],
    shove: ['./sound/sfx/RPG3_GenericPunch_Impact04Crit.wav'],
    spawnPotion: ['./sound/sfx-3/Glug.wav'],
    summonDecoy: ['./sound/sfx-from-val/summon-decoy.wav'],
    summonerDeath: [
        './sound/sfx-from-val/summoner-death.wav',
        './sound/unit-variations/summoner-death-001.wav',
        './sound/unit-variations/summoner-death-002.wav',
    ],
    summonerHurt: [
        './sound/sfx-from-val/summoner-hurt.wav',
        './sound/unit-variations/summoner-hurt-001.wav',
        './sound/unit-variations/summoner-hurt-002.wav',
    ],
    summonerSummon: [
        './sound/sfx-from-val/summoner-summon.wav',
    ],
    swap: ['./sound/sfx-from-val/swap.wav'],
    targetAquired0: ['./sound/sfx-3/Target-001.wav'],
    targetAquired1: ['./sound/sfx-3/Target-002.wav'],
    targetAquired2: ['./sound/sfx-3/Target-003.wav'],
    targetAquired3: ['./sound/sfx-3/Target-004.wav'],
    targeting: ['./sound/sfx-3/Targeting.wav'],
    unitDamage: ['./sound/sfx-from-val/player-damage.wav'],
    vampireAttack: [
        './sound/sfx-from-val/vampire-attack.wav',
        './sound/unit-variations/vampire-attack-001.wav',
        './sound/unit-variations/vampire-attack-002.wav',
    ],
    vampireDeath: [
        './sound/sfx-from-val/vampire-death.wav',
        './sound/unit-variations/vampire-death-001.wav',
        './sound/unit-variations/vampire-death-002.wav',
    ],
    vampireHurt: [
        './sound/sfx-from-val/vampire-hurt.wav',
        './sound/unit-variations/vampire-hurt-001.wav',
        './sound/unit-variations/vampire-hurt-002.wav',
    ],
    yourTurn: ['./sound/sfx-from-val/your-turn.wav'],
};
const music = [
    './sound/music/ChainingSpells.m4a',
    './sound/music/FirstSteps2.mp3',
    './sound/music/DeepWandering.mp3',
    './sound/music/ItShallNotFindMe.mp3',
    './sound/music/BleedingSynth.mp3',
]

// Preload all sounds
Object.values(sfx).forEach(paths => {
    for (let path of paths) {
        new Audio(path);
    }
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
    try {
        musicInstance.play();
    } catch (e) {
        console.log('Could not play music.  Caught: ', e);
    }
}

export function playSFXKey(key?: string) {
    if (!key) {
        return
    }
    const paths = sfx[key];
    if (paths) {
        const path = chooseOneOf(paths);
        if (path) {
            console.log('jtest play audio', path);
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
    if (!path) {
        return;
    }
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
const demoSoundThrottle = 150;
const demoSoundWhenChangingVolume = throttle(() => {
    globalThis.playSFXKey('unitDamage');
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