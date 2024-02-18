const { execSync } = require('child_process');
const keypress = require('keypress');
const readlineSync = require('readline-sync');
const fs = require('fs');
const path = require('path');

const configFilePath = path.join(__dirname, 'config.json');

function readConfig() {
    try {
        const configData = fs.readFileSync(configFilePath, 'utf8');
        return JSON.parse(configData);
    } catch (error) {
        return {};
    }
}

function writeConfig(config) {
    fs.writeFileSync(configFilePath, JSON.stringify(config, null, 2), 'utf8');
}

async function getRepoPath() {
    const config = readConfig();
    const defaultPath = config.repoPath || '.';

    const selectedPath = readlineSync.question(`Enter the path for the Git repository (default: ${defaultPath}): `, {
        defaultInput: defaultPath,
    });

    config.repoPath = selectedPath;
    writeConfig(config);

    return selectedPath;
}

async function displayHeader() {
    console.clear();
    console.log('==============================');
    console.log('   Git Sync and Monitoring');
    console.log('==============================\n');
}

async function displayMenu() {
    console.log('Menu:');
    console.log('[Ctrl+C] Exit');
    console.log('[Ctrl+A] Pull from Remote');
    console.log('[Ctrl+S] Push to Remote');
    console.log('==============================\n');
}

async function setupAutomaticSync() {
    const config = readConfig();
    const repoPath = config.repoPath || (await getRepoPath());

    await displayHeader();
    await displayMenu();

    // Auto pull at the first run
    try {
        execSync(`git -C ${repoPath} pull origin main`, { stdio: 'inherit' });
        console.log('\nAuto-pull successful.');
    } catch (error) {
        console.error(`Error during auto-pull: ${error.message}`);
    }

    console.log('\nAutomatic sync initiated. Press Ctrl+C to exit.');

    keypress(process.stdin);
    process.stdin.on('keypress', async (ch, key) => {
        await displayHeader();
        await displayMenu();

        if (key && key.ctrl && key.name === 'c') {
            // Exit
            console.log('Exiting...');
            process.exit();
        } else if (key && key.ctrl && key.name === 'a') {
            // Pull operation
            try {
                execSync(`git -C ${repoPath} pull origin main`, { stdio: 'pipe' });
                console.log('\nPull successful.');
            } catch (error) {
                console.error(`Error during pull: ${error.message}`);
            }
        } else if (key && key.ctrl && key.name === 's') {
            // Push operation
            try {
                execSync(`git -C ${repoPath} push origin main`, { stdio: 'pipe' });
                console.log('\nPush successful.');
            } catch (error) {
                console.error(`Error during push: ${error.message}`);
            }
        }
    });

    process.stdin.setRawMode(true);
    process.stdin.resume();

    setInterval(() => {}, 2000); // Keep the script running
}

async function main() {
    try {
        await setupAutomaticSync();
    } catch (error) {
        console.error(`Error: ${error.message}`);
    }
}

main();
