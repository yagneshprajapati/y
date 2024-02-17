const { execSync } = require('child_process');
const readlineSync = require('readline-sync');

async function setupAutomaticSync() {
    const repoURL = 'https://github.com/yagneshprajapati/y.git'; // Your GitHub repository URL
    const localRepoPath = '.'; // Always current directory

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
            execSync(`git -C ${localRepoPath} pull origin main`, { stdio: 'inherit' });
            const status = execSync(`git -C ${localRepoPath} status -s`);
            if (status.toString().trim() !== '') {
                // There are changes, so commit and push
                execSync(`git -C ${localRepoPath} add -A && git -C ${localRepoPath} commit -m "Automatic commit" && git -C ${localRepoPath} push ${repoURL} main`, { stdio: 'inherit' });
                console.log('Push successful.');
            } else {
                console.log('No changes to push.');
            }
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
