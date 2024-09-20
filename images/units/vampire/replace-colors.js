const fs = require('fs');
const { exec } = require("child_process");
let replaces = [
            [0x83905a, 0x3a2b45], // rear arm
            [0x6896d1, 0xb98553], // skin light
            [0x5280bc, 0xa37242], // skin medium
            [0x0c456f, 0x563d2a], // rear foot
            [0x3767a4, 0x815933], // skin dark / foot
            [0x0c456f, 0xff371f], // skin darkest
            [0xf1fa68, 0x293a1b], // bubbles
            [0x42d9d3, 0x513c20], // mouth
            [0x2280cf, 0x96683c], // foot
            [0x1969bd, 0x7c5631] // foot outline
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
