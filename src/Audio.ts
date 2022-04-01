import { getLoopableIndex } from "./Polygon";

const sfx = {
    whoosh: './sound/sfx/whoosh.m4a'
};
const music = [
    './sound/music/ChainingSpells.m4a',
    './sound/music/FirstSteps.mp3',
    './sound/music/DeepWandering.mp3',
]

// Preload all sounds
Object.values(sfx).forEach(path => {
    new Audio(path);
});

let songIndex = 0;
let musicInstance: HTMLAudioElement;
export function playNextSong() {
    if (musicInstance) {
        musicInstance.remove();
    }
    // Loops through songs
    const index = getLoopableIndex(songIndex++, music)
    console.log('Play song', index);
    musicInstance = new Audio(music[index]);
    musicInstance.play();
    musicInstance.addEventListener("ended", function () {
        playNextSong();
    });
}

export function playSFX(name: keyof typeof sfx) {
    // In order to allow sounds to overlap, they must be 
    // fully instantiated each time they are played
    const sfxInstance = new Audio(sfx[name]);
    sfxInstance.volume = window.volume;
    sfxInstance.play();

}

export function setupAudio() {
    window.playMusic = playNextSong;
    window.changeVolume = (volume) => {
        window.volume = volume / 100;
        if (musicInstance) {
            musicInstance.volume = window.volume;
        }
    };
}