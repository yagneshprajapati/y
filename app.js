const crypto = require('crypto');
const fs = require('fs');
const colors = require('colors');
const { execSync } = require('child_process');
const readlineSync = require('readline-sync');
const keypress = require('keypress');

const logFilePath = 'log';
const tokenFilePath = 'tokens';
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

function writeToken(token) {
    try {
        fs.appendFileSync(tokenFilePath, token + '\n');
    } catch (error) {
        console.error(`Error writing token: ${error.message}`.red);
    }
}

function readTokens() {
    try {
        const tokens = fs.readFileSync(tokenFilePath, 'utf8');
        return tokens.trim().split('\n');
    } catch (error) {
        console.error(`Error reading tokens: ${error.message}`.red);
        return [];
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
            const logoutTimeMatch = logoutMatches.find(match => new Date(match.replace('User logged out at: ', '')) > loginTime);

            if (logoutTimeMatch) {
                const user = loginMatches[i].replace(/User logged in at: (.+)/, '$1');
                activeUsers.add(user);
            }
        }

        return Array.from(activeUsers);
    }

    return [];
}

async function setupAutomaticSync() {
    const repoURL = 'https://github.com/yagneshprajapati/y.git';
    const localRepoPath = '.';

    // Log user login time
    const loginTime = new Date().toLocaleString();
    const loginLog = `User logged in at: ${loginTime}\n`;
    writeLog(loginLog);

    console.log('Automatic sync initiated. Press Ctrl+C to exit.');

    keypress(process.stdin);
    process.stdin.on('keypress', (ch, key) => {
        if (key && key.ctrl && key.name === 'c') {
            // Log user logout time
            const logoutTime = new Date().toLocaleString();
            const logoutLog = `User logged out at: ${logoutTime}\n`;
            writeLog(logoutLog);

            // Calculate and display total time worked
            const logContent = readLog();
            const totalTime = calculateTotalTime(logContent);
            console.log(`Total time worked: ${totalTime / (1000 * 60)} minutes`.cyan);

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

                    // Write a token for the push operation
                    const pushToken = `Push Token: ${new Date().toLocaleString()}`;
                    writeToken(pushToken);
                } else {
                    console.log('No changes to push.'.yellow);
                }
            } catch (error) {
                console.error(`Error during push: ${error.message}`.red);
            }
        } else if (key && key.ctrl && key.name === 't') {
            // Fetch or Undo operation triggered by Ctrl + t
            const passkey = readlineSync.question('Enter passkey: ', {
                hideEchoBack: true,
            });

            if (passkey === 'SHOWME') {
                // Display information about tokens and actions
                const tokens = readTokens();
                console.log('\nTokens and Actions:');
                tokens.forEach((token, index) => {
                    console.log(`${index + 1}. ${token}`);
                });
            } else {
                // Check if the passkey matches the last token
                const tokens = readTokens();
                const lastToken = tokens[tokens.length - 1];
                if (passkey === lastToken) {
                    // Perform Undo operation
                    try {
                        execSync(`git -C ${localRepoPath} reset --hard HEAD^`, { stdio: 'inherit' });
                        console.log('Undo successful.'.green);

                        // Write a token for the undo operation
                        const undoToken = `Undo Token: ${new Date().toLocaleString()}`;
                        writeToken(undoToken);
                    } catch (error) {
                        console.error(`Error during undo: ${error.message}`.red);
                    }
                } else {
                    console.log('Invalid passkey. Access denied.'.red);
                }
            }
        } else if (key && key.ctrl && key.name === 'o') {
            const passkey = readlineSync.question('Enter passkey: ', {
                hideEchoBack: true,
            });

            if (passkey === 'SHOWME') {
                const logContent = readLog();
                const activeUsers = getActiveUsers(logContent);
                console.log(`\nActive Users: ${activeUsers.join(', ')}`);
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
