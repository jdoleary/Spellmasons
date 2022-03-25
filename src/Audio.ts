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
function playNextSong() {
    // Loops through songs
    const index = getLoopableIndex(songIndex++, music)
    console.log('Play song', index);
    const musicInstance = new Audio(music[index]);
    musicInstance.play();
    musicInstance.addEventListener("ended", function () {
        playNextSong();
    });
}
playNextSong();

export function playSFX(name: keyof typeof sfx) {
    // In order to allow sounds to overlap, they must be 
    // fully instantiated each time they are played
    const sfxInstance = new Audio(sfx[name]);
    sfxInstance.play();

}