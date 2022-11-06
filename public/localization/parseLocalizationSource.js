const fs = require('node:fs');
const readline = require('node:readline');
const languages = [];

async function processLineByLine() {
    const fileStream = fs.createReadStream('localizationSource.csv');

    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });
    // Note: we use the crlfDelay option to recognize all instances of CR LF
    // ('\r\n') in input.txt as a single line break.
    let rowNumber = 0;
    for await (const line of rl) {
        rowNumber++;
        const columns = line.split(',');
        const key = columns[0];
        columns.slice(1).forEach((value, column) => {
            if (rowNumber == 1) {
                languages[column] = { [key]: value };
            } else {
                if (!languages[column]) {
                    console.error(`languages[${column}] does not exist but should have been initialized in row 1`);
                }
                languages[column][key] = value;
            }
        });
        // Each line in input.txt will be successively available here as `line`.
        console.log(`Line from file: ${line}`);
    }
    // Now output each in a file:
    console.log(languages);
    const outPath = './localization.json';
    fs.writeFileSync(outPath, JSON.stringify(languages));
    console.log('File written to ', outPath);
}

processLineByLine();