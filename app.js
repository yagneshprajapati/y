const { execSync } = require('child_process');
const readlineSync = require('readline-sync');

async function login() {
    const username = readlineSync.question('Enter your GitHub username: ');
    const password = readlineSync.question('Enter your GitHub password: ', { hideEchoBack: true });
    const credentials = `${username}:${password}`;
    return Buffer.from(credentials).toString('base64');
}

async function setupAutomaticSync() {
    const repoURL = readlineSync.question('Enter the GitHub repository URL: ');
    const localRepoPath = readlineSync.question('Enter the local repository path: ');

    console.log('Automatic sync initiated. Press Ctrl+C to exit.');

    setInterval(async () => {
        try {
            execSync(`git -C ${localRepoPath} fetch origin`, { stdio: 'inherit' });
            console.log('Fetch successful.');
        } catch (error) {
            console.error(`Error during fetch: ${error.message}`);
        }
    }, 2000); // Every 2 seconds for fetch

    setInterval(async () => {
        try {
            execSync(`git -C ${localRepoPath} add -A && git -C ${localRepoPath} commit -m "Automatic commit" && git -C ${localRepoPath} push origin main`, { stdio: 'inherit' });
            console.log('Push successful.');
        } catch (error) {
            console.error(`Error during push: ${error.message}`);
        }
    }, 2000); // Every 2 seconds for push
}

async function main() {
    try {
        await setupAutomaticSync();
    } catch (error) {
        console.error(`Error: ${error.message}`);
    }
}

main();
