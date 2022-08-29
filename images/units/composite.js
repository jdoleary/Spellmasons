const fs = require('fs');
const { exec } = require("child_process");

const onlyList = []
const greenList = ['lobberWalk'];
const redList = ['Magic', 'Death_1'];
fs.readdirSync('.').forEach(file => {
    if (onlyList.every(ol => file.includes(ol)) && greenList.some(gl => file.includes(gl)) && !redList.some(rl => file.includes(rl))) {
        // Modify
        const magickCommand = `magick composite -gravity center ${file} ../lobber-shadow-walk.png ${file}`;
        exec(magickCommand, (error, stdout, stderr) => {
            console.log(file);
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
