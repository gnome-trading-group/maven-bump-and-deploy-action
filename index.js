const { Toolkit } = require('actions-toolkit')
const core = require('@actions/core')
const pomParser = require('pom-parser')
const semver = require('semver')

async function parsePom(pomFile) {
    return new Promise((resolve, reject) => {
        pomParser.parse({filePath: pomFile}, (err, pomResponse) => {
            if (err) {
                reject(err);
            }
            resolve(pomResponse);
        });
    });
}

function getUpgradeType(messages) {
    messages = messages.map(msg => msg.toLowerCase());
    if (messages.some(message => message.startsWith('major:'))) {
        return 'major';
    } else if (messages.some(message => message.startsWith('feat:'))) {
        return 'minor';
    }
    return 'patch';
}

Toolkit.run(async tools => {
    const event = tools.context.payload;
    
    const pusher = event.pusher.email;
    if (pusher === 'actions@github.com') {
        tools.exit.success('Ignoring CI commits');
        core.setOutput('bumped', false);
        return;
    }

    const messages = event.commits ? event.commits.map(commit => commit.message + '\n' + commit.body) : []
    const upgradeType = getUpgradeType(messages);

    try {

        if (!process.env['GITHUB_TOKEN'] || !process.env['GITHUB_ACTOR']) {
            throw new Error('GITHUB_TOKEN and GITHUB_ACTOR must be set in `env` field.');
        }

        const pomFile = core.getInput('pom-file');
        const settingsFile = core.getInput('settings-file');
        const versionPath = core.getInput('version-path');

        const pom = await parsePom(pomFile);
        const oldVersion = fetchPath(pom.pomObject, versionPath.split('/').filter(f => f.length > 0));
        if (oldVersion.includes('-SNAPSHOT')) {
            oldVersion = oldVersion.split('-', 1)[0];
        }
        const newVersion = semver.inc(oldVersion, upgradeType) + '-SNAPSHOT';

        tools.log.info(`Bumping version from ${oldVersion} to ${newVersion}.`);

        await tools.exec('git', ['config', 'user.email', '"actions@github.com"']);
        await tools.exec('git', ['config', 'user.name', '"GitHub Actions"']);

        await tools.exec('mvn', [
            'release:prepare',
            'release:perform',
            '-B',
            '-s',
            settingsFile,
            `-DreleaseVersion=${oldVersion}`
            `-DdevelopmentVersion=${newVersion}`
        ]);

        core.setOutput('tag', oldVersion);
        core.setOutput('bumped', true); 
    } catch (e) {
        tools.log.fatal(e)
        tools.exit.failure('Failed to bump version')
    }
    tools.exit.success('Version bumped and deployed successfully.');
});
