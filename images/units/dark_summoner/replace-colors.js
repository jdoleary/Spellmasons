const fs = require('fs');
const { exec } = require("child_process");
let replaces = [
            [0x5b3357, 0x222222], // dark robes
            [0x774772, 0x2c2c2c], // light robes
            [0xff00e4, 0x852124], //eyes
            [0x90768e, 0xaeaeae], // arm shade
]
replaces = replaces.map(([from,to]) => {
    return [(componentToHex(from)), (componentToHex(to))]
});
console.log('jtest', replaces);
function componentToHex(c) {
    var hex = c.toString(16);
    while(hex.length < 6){
        hex = '0' + hex;
    }
    return '#' + hex;
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
