const crypto = require('crypto');
const fs = require('fs');
const colors = require('colors');
const { execSync } = require('child_process');
const readlineSync = require('readline-sync');
const keypress = require('keypress');
const asciichart = require('asciichart');

const logFilePath = 'log';
const encryptionKey = 'your_encryption_key'; // Replace with a strong key

function encrypt(text) {
    const cipher = crypto.createCipher('aes-256-cbc', encryptionKey);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
}

function decrypt(encryptedText) {
    const decipher = crypto.createDecipher('aes-256-cbc', encryptionKey);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

function writeLog(log) {
    try {
        const encryptedLog = encrypt(log);
        fs.writeFileSync(logFilePath, encryptedLog);
    } catch (error) {
        console.error(`Error writing log: ${error.message}`.red);
    }
}

function readLog() {
    try {
        const encryptedLog = fs.readFileSync(logFilePath, 'utf8');
        const decryptedLog = decrypt(encryptedLog);
        return decryptedLog;
    } catch (error) {
        console.error(`Error reading log: ${error.message}`.red);
        return '';
    }
}

function calculateTotalTime(logContent) {
    const loginRegex = /User logged in at: (.+)/g;
    const logoutRegex = /User logged out at: (.+)/g;

    const loginMatches = logContent.match(loginRegex);
    const logoutMatches = logContent.match(logoutRegex);

    if (loginMatches && logoutMatches) {
        let totalTime = 0;
        for (let i = 0; i < loginMatches.length; i++) {
            const loginTime = new Date(loginMatches[i].replace('User logged in at: ', ''));
            const logoutTime = new Date(logoutMatches[i].replace('User logged out at: ', ''));
            const timeDiff = logoutTime - loginTime;
            totalTime += timeDiff;
        }
        return totalTime;
    }

    return 0;
}

function getActiveUsers(logContent) {
    const loginRegex = /User logged in at: (.+)/g;
    const logoutRegex = /User logged out at: (.+)/g;

    const loginMatches = logContent.match(loginRegex);
    const logoutMatches = logContent.match(logoutRegex);

    if (loginMatches && logoutMatches) {
        const activeUsers = new Set();

        for (let i = 0; i < loginMatches.length; i++) {
            const loginTime = new Date(loginMatches[i].replace('User logged in at: ', ''));
            const logoutTime = new Date(logoutMatches[i].replace('User logged out at: ', ''));

            if (loginTime < logoutTime) {
                const user = loginMatches[i].replace(/User logged in at: (.+)/, '$1');
                activeUsers.add(user);
            }
        }

        return Array.from(activeUsers);
    }

    return [];
}

function plotWorkGraph(logContent) {
    const loginRegex = /User logged in at: (.+)/g;
    const loginMatches = logContent.match(loginRegex);

    if (loginMatches) {
        const data = [];
        let currentDate = null;
        let userCount = 0;

        for (let i = 0; i < loginMatches.length; i++) {
            const loginTime = new Date(loginMatches[i].replace('User logged in at: ', ''));
            const loginDate = loginTime.toLocaleDateString();

            if (loginDate !== currentDate) {
                if (currentDate !== null) {
                    data.push(userCount);
                }

                currentDate = loginDate;
                userCount = 1;
            } else {
                userCount++;
            }
        }

        // Plot the graph
        console.log('\nWork Distribution Graph:');
        console.log(asciichart.plot(data, { height: 10 }));
    }
}

async function setupAutomaticSync() {
    const repoURL = 'https://github.com/yagneshprajapati/y.git';
    const localRepoPath = '.';
    const username = 'your_username'; // Replace with the user's GitHub username

    // Auto pull at the first run
    try {
        execSync(`git -C ${localRepoPath} pull origin main`, { stdio: 'inherit' });
        console.log('Auto-pull successful.'.green);
    } catch (error) {
        console.error(`Error during auto-pull: ${error.message}`.red);
    }

    // Log user login time
    const loginTime = new Date().toLocaleString();
    const loginLog = `User ${username} logged in at: ${loginTime}\n`;
    writeLog(loginLog);

    console.log('Automatic sync initiated. Press Ctrl+C to exit.');

    keypress(process.stdin);
    process.stdin.on('keypress', (ch, key) => {
        if (key && key.ctrl && key.name === 'c') {
            // Log user logout time
            const logoutTime = new Date().toLocaleString();
            const logoutLog = `User ${username} logged out at: ${logoutTime}\n`;
            writeLog(logoutLog);

            // Calculate and display total time worked
            const logContent = readLog();
            const totalTime = calculateTotalTime(logContent);
            console.log(`Total time worked: ${totalTime / (1000 * 60)} minutes`.cyan);

            // Plot work distribution graph
            plotWorkGraph(logContent);

            process.exit();
        } else if (key && key.ctrl && key.name === 'a') {
            // Pull operation
            try {
                execSync(`git -C ${localRepoPath} pull origin main`, { stdio: 'inherit' });
                console.log('Pull successful.'.green);
            } catch (error) {
                console.error(`Error during pull: ${error.message}`.red);
            }
        } else if (key && key.ctrl && key.name === 's') {
            // Push operation
            try {
                execSync(`git -C ${localRepoPath} pull origin main`, { stdio: 'inherit' });
                const status = execSync(`git -C ${localRepoPath} status -s`);
                if (status.toString().trim() !== '') {
                    // There are changes, so commit and push
                    execSync(`git -C ${localRepoPath} add -A && git -C ${localRepoPath} commit -m "Automatic commit" && git -C ${localRepoPath} push ${repoURL} main`, { stdio: 'inherit' });
                    console.log('Push successful.'.green);

                    // Display information about the last commit
                    const lastCommitInfo = execSync(`git -C ${localRepoPath} log -1 --pretty=format:"%h %an %ad %s" --date=local`);
                    console.log(`Last Commit: ${lastCommitInfo.toString().trim()}`.yellow);
                } else {
                    console.log('No changes to push.'.yellow);
                }
            } catch (error) {
                console.error(`Error during push: ${error.message}`.red);
            }
        } else if (key && key.ctrl && key.name === 't') {
            // Fetch operation triggered by Ctrl + t
            try {
                execSync(`git -C ${localRepoPath} fetch origin`, { stdio: 'inherit' });
                console.log('Fetch successful.'.green);
            } catch (error) {
                console.error(`Error during fetch: ${error.message}`.red);
            }
        } else if (key && key.ctrl && key.name === 'o') {
            const passkey = readlineSync.question('Enter passkey: ', {
                hideEchoBack: true,
            });

            if (passkey === 'SHOWME') {
                const logContent = readLog();
                const activeUsers = getActiveUsers(logContent);
                console.log(`\nActive Users: ${activeUsers.join(', ')}`);

                // Plot work distribution graph
                plotWorkGraph(logContent);
            } else {
                console.log('Invalid passkey. Access denied.'.red);
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
        console.error(`Error: ${error.message}`.red);
    }
}

main();
