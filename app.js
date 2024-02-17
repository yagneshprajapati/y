const { execSync } = require('child_process');
const simpleGit = require('simple-git');
const keypress = require('keypress');
const readlineSync = require('readline-sync');
const crypto = require('crypto');

const repoURL = 'git@github.com:yagubhai/shop.git';

function installNpmPackage(packageName) {
    try {
        execSync(`npm ls ${packageName} --silent`, { stdio: 'ignore' });
        console.log(`${packageName} is already installed.`);
    } catch (error) {
        console.log(`Installing ${packageName}...`);
        try {
            execSync(`npm install ${packageName}`, { stdio: 'inherit' });
        } catch (error) {
            console.error(`Error installing ${packageName}. Make sure npm is installed and try again.`);
            process.exit(1);
        }
        console.log(`${packageName} has been installed successfully.`);
    }
}

function installDependencies() {
    console.log('Checking and installing dependencies...');
    installNpmPackage('simple-git');
    installNpmPackage('keypress');
    console.log('Dependencies installed successfully.');
}

async function pullChanges(git) {
    try {
        const repoPath = process.cwd();
        process.chdir(repoPath);
        const isRepo = await git.checkIsRepo();
        if (isRepo) {
            await git.pull();
            console.log(`Pull successful for repo: ${repoURL}`);
        } else {
            console.log(`Not a git repository. Skipping pull process for repo: ${repoURL}`);
        }
    } catch (error) {
        console.error(`Error during pull: ${error.message}`);
    }
}

async function pushChanges(git) {
    try {
        const repoPath = process.cwd();
        process.chdir(repoPath);
        const isRepo = await git.checkIsRepo();
        if (isRepo) {
            await git.add('.').commit('Automatic commit').push();
            console.log(`Push successful for repo: ${repoURL}`);
        } else {
            console.log(`Not a git repository. Skipping push process for repo: ${repoURL}`);
        }
    } catch (error) {
        console.error(`Error during push: ${error.message}`);
    }
}

function hashCredentials(username, password) {
    const hash = crypto.createHash('sha256');
    hash.update(`${username}:${password}`);
    return hash.digest('hex');
}

async function login() {
    let config = {
        GIT_USERNAME: '',
        GIT_PASSWORD: ''
    };

    const storedUsername = readlineSync.question('Enter your GitHub username (press enter to use saved): ');
    const storedPassword = readlineSync.question('Enter your GitHub password (press enter to use saved): ', { hideEchoBack: true });

    config.GIT_USERNAME = storedUsername || config.GIT_USERNAME;
    config.GIT_PASSWORD = storedPassword || config.GIT_PASSWORD;

    if (!storedUsername || !storedPassword) {
        console.log(`Using login credentials: ${config.GIT_USERNAME}:${hashCredentials(config.GIT_USERNAME, config.GIT_PASSWORD)}`);
    }

    return simpleGit().env(config);
}

async function setupAutomaticSync(git) {
    console.log('Automatic sync initiated. Press Ctrl+C to exit.');

    keypress(process.stdin);
    process.stdin.on('keypress', (ch, key) => {
        if (key && key.ctrl && key.name === 'c') {
            process.exit();
        }
    });

    process.stdin.setRawMode(true);
    process.stdin.resume();

    setInterval(() => {
        pullChanges(git);
    }, 2000); // Every 2 seconds for pull

    setInterval(() => {
        pushChanges(git);
    }, 2000); // Every 2 seconds for push
}

async function main() {
    try {
        installDependencies();
        const git = await login();

        while (true) {
            console.log('\n1. Pull Changes');
            console.log('2. Push Changes');
            console.log('3. Exit');

            const choice = readlineSync.keyInSelect(['Pull Changes', 'Push Changes', 'Exit'], 'Choose an option: ');

            switch (choice) {
                case 0:
                    await pullChanges(git);
                    break;
                case 1:
                    await pushChanges(git);
                    break;
                case 2:
                    process.exit();
            }
        }
    } catch (error) {
        console.error(`Error: ${error.message}`);
    }
}

main();
