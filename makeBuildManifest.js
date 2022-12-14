const { resolve, relative, join } = require('path');
const { readdir, writeFile } = require('fs').promises;
const { version } = require('./package.json');
// TODO: Possibly hash the files and check to see if
// they have changed before pulling an update over the network: https://stackoverflow.com/a/18658613/4418836

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
        // Add file name relative to the domain
        // so, when I push to the `production` branch
        //(`git push -u production master`), all the file names
        // will be relative to where you can access them on the url
        // and since the url hosts the `build` directory statically,
        // this will list file names in the manifest as
        // `images/explain/cast.gif` instead of `build/images/explain.cast.gif`
        fileNames.push(relative((__dirname, 'build'), f));
    }
    writeFile(join('build', 'manifest.json'), JSON.stringify(
        {
            version,
            files: fileNames
        }
    ))
})();