import { getLoopableIndex } from "./Polygon";

const sfx = {
    whoosh: './sound/sfx/whoosh.m4a'
};
const music = [
    './sound/music/ChainingSpells.m4a',
]

// Preload all sounds
Object.values(sfx).forEach(path => {
    new Audio(path);
});

let songIndex = 0;
function playNextSong() {
    // Loops through songs
    const musicInstance = new Audio(music[getLoopableIndex(songIndex++, music)]);
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