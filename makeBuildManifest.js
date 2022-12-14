const { resolve, relative, join } = require('path');
const { readdir, writeFile } = require('fs').promises;
const { version } = require('./package.json');

// from: https://stackoverflow.com/a/45130990/4418836
async function* getFiles(dir) {
    const dirents = await readdir(dir, { withFileTypes: true });
    for (const dirent of dirents) {
        const res = resolve(dir, dirent.name);
        if (dirent.isDirectory()) {
            yield* getFiles(res);
        } else {
            yield res;
        }
    }
}
; (async () => {
    const fileNames = [];
    for await (const f of getFiles('./build')) {
        fileNames.push(relative(__dirname, f));
    }
    writeFile(join('build', 'manifest.json'), JSON.stringify(
        {
            version,
            files: fileNames
        }
    ))
})();