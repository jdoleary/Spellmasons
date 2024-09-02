// Import the walk function from the Deno standard library
import { walk } from "https://deno.land/std@0.195.0/fs/walk.ts";

// Define the directory to search for .png files
const directory = "C:\\git\\Golems\\images\\units\\";

// Define the shell command to execute on each .png file
const shellCommand = "./imageMagick.sh"; // Replace with your command

// Function to execute the shell command on a file
const commands: string[] = []
async function executeCommand(filePath: string) {
    commands.push(`${shellCommand} ${filePath.split('\\').join('/')}`)
}

// Iterate through all .png files recursively
for await (const entry of walk(directory)) {
    if (entry.isFile && entry.name.endsWith(".png")) {
        await executeCommand(entry.path);
    }

    await Deno.writeTextFile("./commands.txt", commands.join('\n'));
}
