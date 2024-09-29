const fs = require('fs');
const { exec } = require("child_process");
const replaces = [
    [0x3fc7c2, 0xc73f53], // feathers 
    [0x7c5353, 0x53667c], //skinMedium
    [0x866262, 0x627386], //skinLight
    [0x603232, 0x324860], //skinDark
    [0x838d9f, 0x802230] //loin cloth
].map(([from,to]) => {
    return [(componentToHex(from)), (componentToHex(to))]
});
console.log('jtest', replaces);
function componentToHex(c) {
    var hex = c.toString(16);
    return '#' + (hex.length == 1 ? "0" + hex : hex);
  }
  
  
fs.readdirSync('.').forEach(async file => {
    if(file.endsWith('.png')){

        // Modify
        for(let [from, to] of replaces){
            console.log('jtest', from, to)
            const magickCommand = `magick convert ${file} -fuzz 5% -fill ${to} -opaque ${from} ${file}`;
            await new Promise((resolve) => {
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
                    resolve();
                });
            })
        }
    }
});