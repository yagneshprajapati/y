const NodeGit = require('nodegit');
const readlineSync = require('readline-sync');
const crypto = require('crypto');
const path = require('path');

async function login() {
    const username = readlineSync.question('Enter your GitHub username: ');
    const password = readlineSync.question('Enter your GitHub password: ', { hideEchoBack: true });

    return NodeGit.Cred.userpassPlaintextNew(username, password);
}

async function setupAutomaticSync() {
    const repoURL = readlineSync.question('Enter the GitHub repository URL: ');
    const repoName = path.basename(repoURL, '.git');
    
    const name = readlineSync.question('Enter your name: ');
    const email = readlineSync.question('Enter your email: ');

    const currentPath = process.cwd(); // Get the current working directory
    const localRepoPath = readlineSync.question(`Enter the local repository path (press enter to use current directory): `) || currentPath;

    const repoPath = path.join(localRepoPath, repoName); // Use the specified or current directory as the local repository path

    const repo = await NodeGit.Clone(repoURL, repoPath, {
        fetchOpts: {
            callbacks: {
                credentials: await login()
            }
        }
    });

    console.log('Automatic sync initiated. Press Ctrl+C to exit.');

    setInterval(async () => {
        try {
            await repo.fetchAll({ callbacks: { credentials: await login() } });
            console.log('Fetch successful.');
        } catch (error) {
            console.error(`Error during fetch: ${error.message}`);
        }
    }, 2000); // Every 2 seconds for fetch

    setInterval(async () => {
        try {
            const status = await repo.getStatus();
            const filesToCommit = status
                .filter(file => !file.path().startsWith('.'))
                .map(file => file.path());

            if (filesToCommit.length > 0) {
                const index = await repo.index();
                await index.addAll();
                await index.write();
                const oid = await index.writeTree();
                const head = await NodeGit.Reference.nameToId(repo, 'HEAD');
                const parent = await repo.getCommit(head);
                const signature = NodeGit.Signature.now(name, email);
                await repo.createCommit('HEAD', signature, signature, 'Automatic commit', oid, [parent]);
                await repo.createBranch('main', oid, false, signature, 'Automatic commit');
                await repo.checkoutBranch('main');
                await repo.getRemote('origin').push(['refs/heads/main:refs/heads/main'], { callbacks: { credentials: await login() } });
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
