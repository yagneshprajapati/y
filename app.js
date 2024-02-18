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
    console.log('');
    console.log('   GITHUB TOOL  ( TY PROJECT ) 2024 YAGNESH LLC  ');
    console.log('\n');
}

async function displayMenu() {
    console.log('Menu:');
    console.log('[Ctrl+C] Exit');
    console.log('[Ctrl+A] Pull from GitHub');
    console.log('[Ctrl+S] Push to GitHub');
    console.log('\n');
}

async function checkGitInstallation() {
    try {
        execSync('git --version', { stdio: 'ignore' });
    } catch (error) {
        console.error('Git is not installed. Install Git and try again.');
        process.exit(1);
    }
}

async function checkGitConfig() {
    try {
        execSync('git config --get user.name', { stdio: 'ignore' });
        execSync('git config --get user.email', { stdio: 'ignore' });
    } catch (error) {
        console.error('Git is not configured. Configure Git with your username and email.');
        process.exit(1);
    }
}

async function setupAutomaticSync() {
    await checkGitInstallation(); // Check if Git is installed
    await checkGitConfig(); // Check if Git is configured

    const config = readConfig();
    const repoPath = config.repoPath || (await getRepoPath());

    await displayHeader();
    await displayMenu();

    // Auto pull at the first run
    try {
        execSync(`git -C ${repoPath} pull origin main`, { stdio: 'inherit' });
        console.log('\nAuto-pull successful. Your repository is up to date.');
    } catch (error) {
        console.error(`Error during auto-pull: ${error.message}`);
    }

    console.log('\nAuto-sync on. Press Ctrl+C to exit.');

    keypress(process.stdin);
    process.stdin.on('keypress', async (ch, key) => {
        await displayHeader();
        await displayMenu();

        if (key && key.ctrl && key.name === 'c') {
            // Exit
            console.log('Exiting. Thank you!');
            process.exit();
        } else if (key && key.ctrl && key.name === 'a') {
            // Pull operation
            try {
                execSync(`git -C ${repoPath} pull origin main`, { stdio: 'inherit' });
                console.log('\nPull successful. Repository is up to date.');
            } catch (error) {
                console.error(`Error during pull: ${error.message}`);
            }
        } else if (key && key.ctrl && key.name === 's') {
            // Push operation
            try {
                execSync(`git -C ${repoPath} pull origin main`, { stdio: 'inherit' });
                const status = execSync(`git -C ${repoPath} status -s`);
                if (status.toString().trim() !== '') {
                    // Changes, so commit and push
                    execSync(`git -C ${repoPath} add -A && git -C ${repoPath} commit -m "Auto commit" && git -C ${repoPath} push origin main`, { stdio: 'inherit' });
                    console.log('\nPush successful. Changes on GitHub.');
                } else {
                    console.log('\nNo changes to push. Repository is up to date.');
                }
            } catch (error) {
                console.error(`Error during push: ${error.message}`);
            }
        }
    });

    process.stdin.setRawMode(true);
    process.stdin.resume();

    setInterval(() => {}, 2000); // Keep running
}

async function main() {
    try {
        await setupAutomaticSync();
    } catch (error) {
        console.error(`Error: ${error.message}`);
    }
}

main();
