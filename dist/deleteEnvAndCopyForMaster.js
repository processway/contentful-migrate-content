"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const readline_1 = tslib_1.__importDefault(require("readline"));
const colors_1 = tslib_1.__importDefault(require("colors"));
const common_1 = require("./utils/common");
const { createClient } = require('contentful-management');
const NODENEV = process.env.NODE_ENV;
const rl = NODENEV === 'test' ? null : readline_1.default.createInterface({
    input: process.stdin,
    output: process.stdout
});
class deleteEnvAndCopyFromMaster {
    constructor(options) {
        this.DELAY = 3000;
        this.MAX_NUMBER_OF_TRIES = 10;
        this.cmaToken = options.cmaToken;
        this.spaceId = options.spaceId;
        this.enviornmentBase = options.enviornmentBase;
        this.skipQuestions = !!options.skipQuestions;
    }
    runCopy(options) {
        var _a, _b, _c;
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            try {
                const client = yield createClient({
                    accessToken: this.cmaToken
                });
                const space = yield client.getSpace(this.spaceId);
                let environment;
                console.info('Running with the following configuration');
                console.info(`SPACE_ID: ${this.spaceId}`);
                console.info(`ENVIRONMENT_ID_TO_CREATE: ${this.enviornmentBase}`);
                console.info(`Checking for existing versions of environment: ${this.enviornmentBase}`);
                try {
                    environment = yield space.getEnvironment(this.enviornmentBase);
                    if (environment) {
                        yield environment.delete();
                        console.info('Environment deleted');
                        if (options && options.delete) {
                            return true;
                        }
                    }
                }
                catch (e) {
                    environment = null;
                    if (NODENEV !== 'test')
                        console.error(colors_1.default.yellow('Environment not found'));
                }
                if (environment || (options && options.forceCreateEnvironment))
                    console.info(`Creating environment ${this.enviornmentBase}`);
                environment = yield space.createEnvironmentWithId(this.enviornmentBase, { name: this.enviornmentBase });
                let count = 0;
                console.info('Waiting for environment processing...');
                while (count < this.MAX_NUMBER_OF_TRIES) {
                    const status = (_c = (_b = (yield space.getEnvironment((_a = environment.sys) === null || _a === void 0 ? void 0 : _a.id)).sys.status) === null || _b === void 0 ? void 0 : _b.sys) === null || _c === void 0 ? void 0 : _c.id;
                    if (status === 'ready' || status === 'failed') {
                        if (status === 'ready') {
                            console.info(`Successfully processed new environment (${this.enviornmentBase})`);
                        }
                        else {
                            console.info('Environment creation failed');
                        }
                        break;
                    }
                    console.info('Still waiting...');
                    yield new Promise(resolve => setTimeout(resolve, this.DELAY));
                    count++;
                }
                console.info(colors_1.default.green("Completed!"));
                if (NODENEV !== 'test') {
                    process.exit();
                }
                return true;
            }
            catch (e) {
                console.error(e);
                return false;
            }
        });
    }
    continueDeleteEnv(answer) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (/y|Y/.test(answer)) {
                try {
                    yield this.start({
                        forceCreateEnvironment: true
                    });
                    return true;
                }
                catch (e) {
                    console.error(e);
                    return false;
                }
            }
            if (rl)
                rl.close();
            return true;
        });
    }
    start(options = {}) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (!this.enviornmentBase)
                throw new Error(" No ENVIRONMENT_ID_TO_CREATE declared. Ej ENVIRONMENT_ID_TO_CREATE='dev'");
            console.info("Creating new Environment from Master");
            return yield this.runCopy(options);
        });
    }
    deleteEnv() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const r = yield this.runCopy({
                delete: true
            });
            return r;
        });
    }
    askBeforeCreateCopy() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (this.skipQuestions) {
                return yield this.continueDeleteEnv('Y');
            }
            else {
                if (rl) {
                    const answer = yield common_1.RlCommand(rl, `If you have changes in "${this.enviornmentBase}" environment will be deleted. Do you want to continue (y/n)? `);
                    return yield this.continueDeleteEnv(answer);
                }
                else {
                    return true;
                }
            }
        });
    }
}
exports.default = deleteEnvAndCopyFromMaster;
