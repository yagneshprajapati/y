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

async function pullFromRemote(repoPath, isManualPull = false) {
    try {
        execSync(`git -C ${repoPath} pull origin main`, { stdio: 'ignore' });
        if (isManualPull) {
            console.log('Pull successful.');
        }
    } catch (error) {
        console.error(`Error during pull: ${error.message}`);
    }
}

async function setupAutomaticSync() {
    await checkGitInstallation();
    await checkGitConfig();

    const config = readConfig();
    const repoPath = config.repoPath || (await getRepoPath());

    console.clear();
    console.log('GITHUB TOOL (TY PROJECT) - 2024, YAGNESH LLC\n');

    // Auto pull at the first run
    try {
        await pullFromRemote(repoPath);
        console.log('Auto-pull successful. Repository up to date.');
    } catch (error) {
        console.error(`Error during auto-pull: ${error.message}`);
    }

    console.log('Automatic sync initiated. Press Ctrl+C to exit.');

    // Periodically pull from remote every 2 seconds
    setInterval(async () => {
        await pullFromRemote(repoPath);
    }, 2000);

    // Periodically push to remote every 10 seconds
    setInterval(async () => {
        try {
            const status = execSync(`git -C ${repoPath} status -s`);
            if (status.toString().trim() !== '') {
                execSync(`git -C ${repoPath} add -A && git -C ${repoPath} commit -m "Auto commit" && git -C ${repoPath} push origin main`, { stdio: 'ignore' });
                console.log('Push successful. Changes are on GitHub.');
            } else {
                console.log('No changes to push. Repository is up to date.');
            }
        } catch (error) {
            console.error(`Error during push: ${error.message}`);
        }
    }, 10000); // 10000 milliseconds = 10 seconds

    keypress(process.stdin);
    process.stdin.on('keypress', async (ch, key) => {
        if (key && key.ctrl && key.name === 'c') {
            console.log('Exiting... Thank you for using the GitHub Tool.');
            process.exit();
        } else if (key && key.ctrl && key.name === 'a') {
            try {
                await pullFromRemote(repoPath, true);
                console.log('Repository is up to date.');
            } catch (error) {
                console.error(`Error during pull: ${error.message}`);
            }
        } else if (key && key.ctrl && key.name === 's') {
            try {
                const status = execSync(`git -C ${repoPath} status -s`);
                if (status.toString().trim() !== '') {
                    execSync(`git -C ${repoPath} add -A && git -C ${repoPath} commit -m "Auto commit" && git -C ${repoPath} push origin main`, { stdio: 'ignore' });
                    console.log('Push successful. Changes are on GitHub.');
                } else {
                    console.log('No changes to push. Repository is up to date.');
                }
            } catch (error) {
                console.error(`Error during push: ${error.message}`);
            }
        }
    });

    process.stdin.setRawMode(true);
    process.stdin.resume();

    setInterval(() => {}, 2000);
}



async function main() {
    try {
        await setupAutomaticSync();
    } catch (error) {
        console.error(`Error: ${error.message}`);
    }
}

main();
