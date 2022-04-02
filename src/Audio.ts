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

let songIndex = Math.round(Math.random() * music.length - 1);
let musicInstance: HTMLAudioElement;
export function playNextSong() {
    // If there is currently a song playing, stop it
    if (musicInstance) {
        musicInstance.remove();
    }
    // Loops through songs
    const index = getLoopableIndex(songIndex++, music)
    musicInstance = new Audio(music[index]);
    musicInstance.addEventListener("ended", function () {
        playNextSong();
    });
    playAudio(musicInstance);
}

export function playSFX(name: keyof typeof sfx) {
    // In order to allow sounds to overlap, they must be 
    // fully instantiated each time they are played
    playAudio(new Audio(sfx[name]));

}
function playAudio(audioInstance: HTMLAudioElement) {
    audioInstance.volume = window.volume;
    audioInstance.play();
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