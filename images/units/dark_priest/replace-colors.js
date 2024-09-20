const fs = require('fs');
const { exec } = require("child_process");
const replaces = [
            // [0xfcffc8, 0x705284], // light
            // [0xa6b671, 0x513b5f], // medium
            // [0xbfc280, 0x574067], // thigh
            // [0xe5e8b6, 0x6a4d7d], // face
            // [0x808344, 0x3a2b45], // dark
            [0x83905a, 0x3a2b45] // rear arm
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
            const magickCommand = `magick convert ${file} -fuzz 0% -fill ${to} -opaque ${from} ${file}`;
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
