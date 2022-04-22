import { getLoopableIndex } from "./Polygon";

const sfx = {
    whoosh: './sound/sfx/whoosh.m4a',
};
export const sfxPageTurn = [
    // './sound/sfx/page-turn-1.flac',
    './sound/sfx/page-turn-2.flac',
];
const music = [
    './sound/music/ChainingSpells.m4a',
    './sound/music/FirstSteps.mp3',
    './sound/music/DeepWandering.mp3',
]

// Preload all sounds
Object.values(sfx).forEach(path => {
    new Audio(path);
});

let songIndex = Math.round(Math.random() * music.length - 1);
let musicInstance: HTMLAudioElement;
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
    musicInstance.addEventListener("ended", function () {
        playNextSong();
    });
    // Temp; TODO: Base music volume is too loud, (remove "* 0.5" when fixed)
    // task: Master all audio and sfx
    // task: Make independent volume sliders for audio and music
    musicInstance.volume = window.volume * window.volumeMusic * 0.5;
    musicInstance.play();
}

export function playSFX(path: string) {
    // In order to allow sounds to overlap, they must be 
    // fully instantiated each time they are played
    const audioInstance = new Audio(path);
    audioInstance.volume = window.volume * window.volumeGame;
    audioInstance.play();

}

export function setupAudio() {
    window.playMusic = playNextSong;
    window.changeVolume = (volume) => {
        window.volume = volume / 100;
        if (musicInstance) {
            musicInstance.volume = window.volume * window.volumeMusic;
        }
    };
    window.changeVolumeMusic = (volume) => {
        window.volumeMusic = volume / 100;
        if (musicInstance) {
            musicInstance.volume = window.volume * window.volumeMusic;
        }
    };
    window.changeVolumeGame = (volume) => {
        window.volumeGame = volume / 100;
    };
}