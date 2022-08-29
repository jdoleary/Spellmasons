const fs = require('fs');
const { exec } = require("child_process");

const onlyList = ['summoner']
const greenList = ['Attack', 'Death', 'Idle', 'Hit', 'Walk'];
const redList = ['Magic', "lobber", "decoy", "player", "priest", "vampire"];
fs.readdirSync('.').forEach(file => {
    if (onlyList.every(ol => file.includes(ol)) && greenList.some(gl => file.includes(gl)) && !redList.some(rl => file.includes(rl))) {
        console.log(file);
        // Modify
        const magickCommand = `magick composite -gravity center ${file} ../shadow-summoner.png ${file}`;
        exec(magickCommand, (error, stdout, stderr) => {
            if (error) {
                console.log(`error: ${error.message}`);
                return;
            }
            if (stderr) {
                console.log(`stderr: ${stderr}`);
                return;
            }
            if (stdout) {
                console.log(`stdout: ${stdout}`);
            }
        });
    }
});
