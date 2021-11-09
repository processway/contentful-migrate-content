'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const importContent_1 = tslib_1.__importDefault(require("../importContent"));
const deleteEnvAndCopyForMaster_1 = tslib_1.__importDefault(require("../deleteEnvAndCopyForMaster"));
const common_1 = require("../utils/common");
test('Create new enviornment: testJest', () => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    const opts = {
        cmaToken: '',
        spaceId: '',
        enviornmentBase: 'testJest'
    };
    common_1.KeysNeeded(opts);
    const deleteEnvOptions = {
        enviornmentBase: opts['enviornmentBase'],
        spaceId: opts['spaceId'],
        cmaToken: opts['cmaToken'],
        skipQuestions: true
    };
    const deacfm = new deleteEnvAndCopyForMaster_1.default(deleteEnvOptions);
    yield deacfm.askBeforeCreateCopy();
}));
test('Create new enviornment: testJestTwo', () => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    const opts = {
        cmaToken: '',
        spaceId: '',
        enviornmentBase: 'testJestTwo'
    };
    common_1.KeysNeeded(opts);
    const deleteEnvOptions = {
        enviornmentBase: opts['enviornmentBase'],
        spaceId: opts['spaceId'],
        cmaToken: opts['cmaToken'],
        skipQuestions: true
    };
    const deacfm = new deleteEnvAndCopyForMaster_1.default(deleteEnvOptions);
    yield deacfm.askBeforeCreateCopy();
}));
test("Merge from testJestTwo to testJest", () => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    const opts = {
        cmaToken: '',
        spaceId: '',
        skipQuestions: true,
        forceUpdateContentTypesAndEntries: true,
        from: "testJestTwo",
        to: "testJest"
    };
    const compareEnv = {
        envBase: opts['to'],
        envCompare: opts['from'],
        spaceId: opts['spaceId'],
        cmaToken: opts['cmaToken'],
        skipQuestions: !!opts['skipQuestions'],
        useCurrentDifferenceContent: !!opts['useCurrentDifferenceContent'],
        forceUpdateContentTypesAndEntries: !!opts['forceUpdateContentTypesAndEntries']
    };
    const icft = new importContent_1.default(compareEnv);
    const icftResult = yield icft.start();
    if (icftResult) {
        console.info("Done!");
    }
    else {
        console.error("Something went wrong");
    }
}));
test('Delete enviornment: testJest', () => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    const opts = {
        cmaToken: '',
        spaceId: '',
        enviornmentBase: 'testJest',
        skipQuestions: true
    };
    common_1.KeysNeeded(opts);
    const deleteEnvOptions = {
        enviornmentBase: opts['enviornmentBase'],
        spaceId: opts['spaceId'],
        cmaToken: opts['cmaToken'],
    };
    const deacfm = new deleteEnvAndCopyForMaster_1.default(deleteEnvOptions);
    const result = yield deacfm.deleteEnv();
    expect(result).toEqual(true);
}));
test('Delete enviornment: testJestTwo', () => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    const opts = {
        cmaToken: '',
        spaceId: '',
        enviornmentBase: 'testJestTwo',
        skipQuestions: true
    };
    common_1.KeysNeeded(opts);
    const deleteEnvOptions = {
        enviornmentBase: opts['enviornmentBase'],
        spaceId: opts['spaceId'],
        cmaToken: opts['cmaToken'],
    };
    const deacfm = new deleteEnvAndCopyForMaster_1.default(deleteEnvOptions);
    const result = yield deacfm.deleteEnv();
    expect(result).toEqual(true);
}));
