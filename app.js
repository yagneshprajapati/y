const { execSync } = require('child_process');
const readlineSync = require('readline-sync');
const keypress = require('keypress');

async function setupAutomaticSync() {
    const repoURL = 'https://github.com/yagneshprajapati/y.git'; 
    const localRepoPath = '.'; 

    console.log('Automatic sync initiated. Press Ctrl+C to exit.');

    keypress(process.stdin);
    process.stdin.on('keypress', (ch, key) => {
        if (key && key.ctrl && key.name === 'c') {
            process.exit();
        } else if (key && key.ctrl && key.name === 'a') {
            // Fetch operation
            try {
                execSync(`git -C ${localRepoPath} fetch origin`, { stdio: 'inherit' });
                console.log('Fetch successful.');
            } catch (error) {
                console.error(`Error during fetch: ${error.message}`);
            }
        } else if (key && key.ctrl && key.name === 's') {
            // Push operation
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
