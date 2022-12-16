const http = require('https');
const fs = require('fs');
const path = require('path');
const { version } = require('./package.json');
function downloadFile(downloadPath, savePath) {
    console.log('Downloading', downloadPath);
    return new Promise((resolve, reject) => {
        try {
            const newDir = path.parse(savePath).dir;
            // Make the directory to save the downloaded file in
            fs.mkdirSync(newDir, { recursive: true });
            // Download and write the file
            const file = fs.createWriteStream(savePath);
            http.get(downloadPath, function (response) {
                let body = '';
                response.on("data", (data) => {
                    body += data;
                });
                response.pipe(file);
                file.on("finish", () => {
                    console.log(downloadPath, "Download Completed");
                    file.close(() => resolve(body));
                });
            });
        } catch (e) {
            console.error('Err downloading', savePath, e);
            reject(e);
        }
    })
}
async function run() {
    const performanceMeasureLabel = 'downloadUpdate ran in';
    console.time(performanceMeasureLabel);
    const updateDir = 'update';
    // Clean the current update directory if it exissts
    await new Promise((resolve, reject) => {
        if (fs.existsSync(updateDir)) {
            fs.rmdir(updateDir, { recursive: true }, err => {
                if (err) {
                    reject(err);
                }
                console.log(`${updateDir} is deleted!`)
                resolve();
            })
        } else {
            resolve();
        }
    });
    fs.mkdirSync(updateDir);
    const downloadUrl = 'https://assets.spellmasons.com'
    const fileName = 'manifest.json';
    // Download the maifest which tells this script which files to download next
    const manifestContents = await downloadFile(`${downloadUrl}/${fileName}`, path.join(updateDir, fileName));
    if (!manifestContents) {
        throw new Error('Err: Unable to retrieve manifest');
    }
    const manifestJson = JSON.parse(manifestContents);
    console.log(`Comparing versions.  Current: ${version}, Update: ${manifestJson.version}`);
    if (manifestJson.version == version) {
        console.log('Versions are equal, do not update');
        return;
    }

    // Download all of the files in the manifest
    console.log(`Update to ${manifestJson.version}`)
    let countCompleteDownloadedFiles = 0;
    let downloadPromises = [];
    function* getFileNames() {
        for (let file of manifestJson.files) {
            yield file;
        }
    }
    const fileNameGenerator = getFileNames();
    function downloadNextFile() {
        const { value: fileName, done } = fileNameGenerator.next();
        if (done) {
            return Promise.resolve();
        } else {
            return downloadFile(`${downloadUrl}/${fileName}`, path.join(updateDir, fileName)).then(() => {
                console.log(`Update progress: ${++countCompleteDownloadedFiles}/${manifestJson.files.length}`);
            }).then(downloadNextFile);
        }

    }
    const NUMBER_OF_FILES_TO_DOWNLOAD_SIMULTANEOUSLY = 10;
    // Dev note: it took 31.409s with 2 channels
    // Dev note: it took 11.193s with 10 channels
    // Download up to NUMBER_OF_FILES_TO_DOWNLOAD_SIMULTANEOUSLY files at a time
    for (let channelNumber = 0; channelNumber < NUMBER_OF_FILES_TO_DOWNLOAD_SIMULTANEOUSLY; channelNumber++) {
        downloadPromises.push(downloadNextFile());
    }
    await Promise.all(downloadPromises);
    if (countCompleteDownloadedFiles == manifestJson.files.length) {
        console.log('Update fully downloaded');
        // TODO: Rename update to build/ in electron and then redirect to the game index.html to start
        // the game
    } else {
        console.log('Update failed.');
    }
    console.timeEnd(performanceMeasureLabel);
}
run().catch(e => {
    console.error('err top level:', e);
    // Intentionally throw unhandled so that it stops execution
    throw e;
});