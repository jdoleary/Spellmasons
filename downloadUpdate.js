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
            console.error('Err downloading', savePath, err);
            reject(e);
        }
    })
}
async function run() {
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
    for (let file of manifestJson.files) {
        downloadPromises.push(downloadFile(`${downloadUrl}/${file}`, path.join(updateDir, file)).then(() => {
            console.log(`Update progress: ${++countCompleteDownloadedFiles}/${manifestJson.files.length}`);
        }));
    }
    await Promise.all(downloadPromises);
    console.log('Fully finished downloading update');
}
try {
    run();
} catch (e) {
    console.log('Err top level:', e);
}