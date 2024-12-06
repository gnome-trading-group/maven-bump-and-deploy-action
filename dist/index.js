/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 984:
/***/ ((module) => {

module.exports = eval("require")("@actions/core");


/***/ }),

/***/ 425:
/***/ ((module) => {

module.exports = eval("require")("actions-toolkit");


/***/ }),

/***/ 639:
/***/ ((module) => {

module.exports = eval("require")("pom-parser");


/***/ }),

/***/ 379:
/***/ ((module) => {

module.exports = eval("require")("semver");


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __nccwpck_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		var threw = true;
/******/ 		try {
/******/ 			__webpack_modules__[moduleId](module, module.exports, __nccwpck_require__);
/******/ 			threw = false;
/******/ 		} finally {
/******/ 			if(threw) delete __webpack_module_cache__[moduleId];
/******/ 		}
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat */
/******/ 	
/******/ 	if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = __dirname + "/";
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
const { Toolkit } = __nccwpck_require__(425)
const core = __nccwpck_require__(984)
const pomParser = __nccwpck_require__(639)
const semver = __nccwpck_require__(379)

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

function getUpgradeType(message) {
    message = message.toLowerCase();
    if (message.startsWith('major:')) {
        return 'major';
    } else if (message.startsWith('feat:')) {
        return 'minor';
    }
    return 'patch';
}

function fetchPath(obj, path) {
    let trail = ''
    for (const p of path) {
        if (obj === undefined || !obj.hasOwnProperty(p)) {
            throw `Failed to find ${p} from ${trail} when looking for version`;
        }
        trail += `/${p}`;
        obj = obj[p];
    }
    return obj;
}

Toolkit.run(async tools => {
    const event = tools.context.payload;
    
    const commit = event.commits[0];
    if (commit.author.email === 'actions@github.com') {
        tools.exit.success('Ignoring CI commits');
        core.setOutput('bumped', false);
        return;
    }

    const message = commit.message + '\n' + commit.body;
    const upgradeType = getUpgradeType(message);

    try {

        if (!process.env['GITHUB_TOKEN'] || !process.env['GITHUB_ACTOR']) {
            throw new Error('GITHUB_TOKEN and GITHUB_ACTOR must be set in `env` field.');
        }

        const pomFile = core.getInput('pom-file');
        const settingsFile = core.getInput('settings-file');
        const versionPath = core.getInput('version-path');
        const pushChanges = core.getInput('push-changes');

        const pom = await parsePom(pomFile);
        let oldVersion = fetchPath(pom.pomObject, versionPath.split('/').filter(f => f.length > 0));
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
            `-DreleaseVersion=${oldVersion}`,
            `-DdevelopmentVersion=${newVersion}`,
            `-DpushChanges=${pushChanges}`,
        ]);

        core.setOutput('tag', oldVersion);
        core.setOutput('bumped', true); 
    } catch (e) {
        tools.log.fatal(e)
        tools.exit.failure('Failed to bump version')
    }
    tools.exit.success('Version bumped and deployed successfully.');
});

module.exports = __webpack_exports__;
/******/ })()
;