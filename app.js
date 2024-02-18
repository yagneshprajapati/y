const crypto = require('crypto');
const fs = require('fs');
const colors = require('colors');
const { execSync } = require('child_process');
const readlineSync = require('readline-sync');
const keypress = require('keypress');

const logFilePath = 'log';
const encryptionKey = 'github'; 

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

            process.exit();
        } else if (key && key.ctrl && key.name === 'a') {
            // Fetch operation
            try {
                execSync(`git -C ${localRepoPath} fetch origin`, { stdio: 'inherit' });
                console.log('Fetch successful.'.green);
            } catch (error) {
                console.error(`Error during fetch: ${error.message}`.red);
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
                console.log(`\nLog:\n${logContent}`);
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
