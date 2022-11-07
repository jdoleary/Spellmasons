const fs = require('node:fs');
const path = require('node:path');
const readline = require('node:readline');
const languages = [];

async function processLineByLine() {
    const fileStream = fs.createReadStream(path.join(__dirname, 'localizationSource.tsv'));

    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });
    // Note: we use the crlfDelay option to recognize all instances of CR LF
    // ('\r\n') in input.txt as a single line break.
    let rowNumber = 0;
    for await (const line of rl) {
        rowNumber++;
        const columns = line.split('\t');
        const key = columns[0].toLowerCase();
        columns.slice(1).forEach((value, column) => {
            if (rowNumber == 1) {
                console.log('i18n: Process', key, value);
                languages[column] = { [key]: value };
            } else {
                if (languages[column]) {
                    languages[column][key] = value;
                } else {
                    console.error(`languages[${column}] ${key} ${value} does not exist but should have been initialized in row 1`);
                }
            }
        });
    }
    // Now output each in a file:
    // console.log(languages);
    const outPath = path.join(__dirname, './localization.json');
    fs.writeFileSync(outPath, JSON.stringify(languages));
    console.log('File written to ', outPath);
}

processLineByLine();