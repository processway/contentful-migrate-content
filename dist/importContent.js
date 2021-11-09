"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const fs = tslib_1.__importStar(require("fs"));
const colors_1 = tslib_1.__importDefault(require("colors"));
const lodash_1 = tslib_1.__importDefault(require("lodash"));
const path = tslib_1.__importStar(require("path"));
const readline_1 = tslib_1.__importDefault(require("readline"));
const child_process_1 = require("child_process");
const deleteEnvAndCopyForMaster_1 = tslib_1.__importDefault(require("./deleteEnvAndCopyForMaster"));
const compareTwoObjects_1 = tslib_1.__importDefault(require("./utils/compareTwoObjects"));
const common_1 = require("./utils/common");
const { runMigration } = require('contentful-migration');
const contentfulImport = require('contentful-import');
const NODENEV = process.env.NODE_ENV;
const rl = NODENEV === 'test' ? null : readline_1.default.createInterface({
    input: process.stdin,
    output: process.stdout
});
class importContentfulToMaster {
    constructor(options) {
        this.runMigration = false;
        this.validTypes = [];
        this.validIds = [];
        this.contentTypeIds = [];
        this.entriesIds = [];
        this.ignoreEntries = false;
        this.mergeOnlyDiff = false;
        this.skipQuestions = false;
        this.useCurrentDifferenceContent = false;
        this.newMigrationFile = {};
        this.totalEntitites = {};
        this.differenceContentFolderName = 'differenceContent';
        this.migrationActions = [];
        this.forceUpdateContentTypesAndEntries = false;
        this.cmaToken = options.cmaToken;
        this.spaceId = options.spaceId;
        this.contentTypeIds = options.contentTypeIds ? common_1.parseOptionsList(options.contentTypeIds) : [];
        this.entriesIds = options.entriesIds ? common_1.parseOptionsList(options.entriesIds) : [];
        this.ignoreEntries = !!options.ignoreEntries;
        this.mergeOnlyDiff = !!options.onlyDiff;
        this.skipQuestions = !!options.skipQuestions;
        this.useCurrentDifferenceContent = !!options.useCurrentDifferenceContent;
        this.envBase = options.envBase;
        this.envCompare = options.envCompare;
        this.differenceContentPath = path.join(__dirname, '../', this.differenceContentFolderName);
        this.forceUpdateContentTypesAndEntries = !!options.forceUpdateContentTypesAndEntries;
        if (this.contentTypeIds.length > 0) {
            this.validTypes.push('contentTypes');
            !this.ignoreEntries && this.validTypes.push('entries');
            this.validIds = this.validIds.concat(this.contentTypeIds);
        }
        if (this.entriesIds.length > 0) {
            !this.contentTypeIds.length && this.validTypes.push('entries');
            this.validIds = this.validIds.concat(this.entriesIds);
        }
    }
    importFilesFromContentful(base, filename) {
        console.info("Importing content from the '" + base + "' branch... ");
        if (!fs.existsSync(this.differenceContentPath)) {
            fs.mkdirSync(this.differenceContentPath);
        }
        if (!fs.existsSync(path.join(this.differenceContentPath, filename))) {
            common_1.WriteJsonFile(path.join(this.differenceContentPath, filename), {});
        }
        const ls = child_process_1.spawnSync('npx', ['contentful', 'space', 'export', '--space-id', this.spaceId, '--management-Token', this.cmaToken, '--environment-id', base, '--content-file', path.join(this.differenceContentPath, filename)], {
            encoding: 'utf8',
            cwd: path.resolve(__dirname, '../')
        });
        if (ls.stderr) {
            console.error(ls.stderr);
            throw new Error(ls.stderr);
        }
        console.info(`Number of files ${ls.stdout}`);
    }
    continueMergeToBase(answer) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (/y|Y/.test(answer)) {
                const deleteEnvOptions = {
                    cmaToken: this.cmaToken,
                    spaceId: this.spaceId,
                    enviornmentBase: this.envCompare
                };
                const deacfm = new deleteEnvAndCopyForMaster_1.default(deleteEnvOptions);
                return yield deacfm.start();
            }
            else {
                console.info(colors_1.default.green("DONE!!"));
                if (rl)
                    rl.close();
                return true;
            }
        });
    }
    mergeToBase() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                const optionsImportToMaster = {
                    contentFile: path.join(this.differenceContentPath, 'diffcontent.json'),
                    spaceId: this.spaceId,
                    managementToken: this.cmaToken,
                    environmentId: this.envBase
                };
                console.info(`
                Options to Import 
                contentFile : ${optionsImportToMaster.contentFile}
                enviornmentId: ${this.envBase},
            `);
                console.info(`Merging from "${this.envCompare}" to "${this.envBase}"`);
                contentfulImport(optionsImportToMaster)
                    .then(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
                    console.info('Data imported successfully');
                    console.info("Starting to create '" + this.envCompare + "' branch from Master ...");
                    if (this.envCompare === "master") {
                        return resolve(true);
                    }
                    if (rl) {
                        const answer = yield common_1.RlCommand(rl, `Do you want to update "${this.envCompare} from Master." (y/n)? `);
                        return yield this.continueMergeToBase(answer);
                    }
                    else {
                        return yield this.continueMergeToBase('Y');
                    }
                }))
                    .catch((err) => {
                    console.error(err);
                    reject(false);
                });
            });
        });
    }
    startMigration(next) {
        return new Promise((resolve, reject) => {
            const options = {
                filePath: path.join(__dirname, './migration.js'),
                spaceId: this.spaceId,
                accessToken: this.cmaToken,
                environmentId: this.envBase,
                yes: true
            };
            runMigration(options)
                .then(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
                yield next();
                resolve(true);
            }))
                .catch((e) => {
                console.error(e);
                reject(e);
            });
        });
    }
    continueMergeContentDifference(answer) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (/y|Y/.test(answer)) {
                if (this.runMigration) {
                    console.info(colors_1.default.yellow("Migration is going to run first!\n"));
                    return yield this.startMigration(yield this.mergeToBase);
                }
                return yield this.mergeToBase();
            }
            else {
                return true;
            }
        });
    }
    mergeContentDifference(thereAreChanges) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const diffContPathFile = path.join(this.differenceContentPath, 'diffcontent.json');
            common_1.WriteJsonFile(diffContPathFile, this.newMigrationFile);
            console.info(colors_1.default.green(" -> " + diffContPathFile + " file updated \n"));
            if (!thereAreChanges) {
                console.info(" * THERE ARE NO CHANGES * ");
                if (rl)
                    rl.close();
                return true;
            }
            if (this.mergeOnlyDiff) {
                console.info("Diff completed!");
                if (rl)
                    rl.close();
                return true;
            }
            if (this.skipQuestions || !rl) {
                return yield this.continueMergeContentDifference('Y');
            }
            else {
                const answer = yield common_1.RlCommand(rl, `Do you want to do merge from "${this.envCompare}" to "${this.envBase}" (y/n)? `);
                return yield this.continueMergeContentDifference(answer);
            }
        });
    }
    verifyIsModelHasDifferenceStructure(model, compareModel) {
        if (model.fields && model.fields.length && compareModel.fields && compareModel.fields.length) {
            lodash_1.default.forEach(compareModel.fields, (field, pos) => {
                const posField = model.fields.findIndex((compareField) => compareField.id === field.id);
                if (posField > -1) {
                    const oldObj = compareModel.fields[posField];
                    const newObj = compareTwoObjects_1.default(field, oldObj);
                    const fieldMoved = posField !== pos;
                    if (fieldMoved) {
                        console.info(`  - Field position changed | ${field.id} | Pos ${pos} to ${posField}`);
                    }
                    if (oldObj && newObj.type && oldObj.type && newObj.id !== oldObj.id) {
                        throw new Error(colors_1.default.red(`  - Field Type are different: "${oldObj.type}" -> "${field.type}" \n >> Path > Content Model [name: '${compareModel.name}'] > Field [name: '${oldObj.name}'] `));
                    }
                }
                else {
                    console.info(colors_1.default.yellow(`  - WARN: Field deleted | "${field.id}" will be deleted in env:"${this.envBase}" from 'ContentType' -> ${compareModel.name} `));
                    this.migrationActions.push({
                        contentTypeAction: "edit",
                        contentTypeName: model.sys.id,
                        fieldId: field.id,
                        fieldAction: "delete",
                        fieldName: field.name
                    });
                }
            });
        }
    }
    showEntriesDiff(fields, oldfields, options = {}) {
        const entries = [];
        const oldfieldsArray = Object.keys(oldfields);
        Object.keys(fields).forEach((key, pos) => {
            if (oldfields[key] && !lodash_1.default.isEqual(fields[key], oldfields[key])) {
                const posOldField = oldfieldsArray.findIndex((oldKey) => key === oldKey);
                const fieldMoved = posOldField !== pos;
                entries.push({
                    key,
                    status: fieldMoved ? 'changed and position moved' : 'changed'
                });
            }
            else if (!oldfields[key]) {
                entries.push({
                    key,
                    status: 'new'
                });
            }
        });
        oldfieldsArray.forEach(key => {
            if (!fields[key]) {
                entries.push({
                    key,
                    status: 'deleted'
                });
            }
        });
        if (entries.length) {
            entries.forEach(({ key, status }) => {
                if (options.warn || status === 'deleted')
                    console.info(colors_1.default.yellow(`  - WARN: Field ${status} | id: ${key}`));
                else {
                    let log = `  - Field ${status}: | id: ${key}`;
                    console.info(log);
                }
            });
        }
    }
    parseContentfulFiles() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            let thereAreChanges = false;
            const oldFile = common_1.ParseJsonFiles(path.join(this.differenceContentPath, this.envBase + '.json'));
            const newFile = common_1.ParseJsonFiles(path.join(this.differenceContentPath, this.envCompare + '.json'));
            lodash_1.default.forEach(newFile, (value, type) => {
                if ((type !== "webhooks" && type !== "roles") && (this.validTypes.length === 0 || this.validTypes.includes(type))) {
                    console.info(`
------------------------------
    Verifying  ${type}
------------------------------
            `);
                    this.newMigrationFile[type] = [];
                    this.totalEntitites[type] = 0;
                    lodash_1.default.forEach(newFile[type], (newModel) => {
                        var _a, _b;
                        if (((_a = newModel.sys) === null || _a === void 0 ? void 0 : _a.id) && (!this.validIds.length || ((!this.entriesIds.length && !this.ignoreEntries) || this.validIds.includes(newModel.sys.id)))) {
                            console.info((_b = newModel.sys) === null || _b === void 0 ? void 0 : _b.id);
                            let result = type === "editorInterfaces"
                                ? oldFile[type].findIndex((o) => { var _a, _b, _c, _d, _e; return ((_b = (_a = o.sys.contentType) === null || _a === void 0 ? void 0 : _a.sys) === null || _b === void 0 ? void 0 : _b.id) === ((_e = (_d = (_c = newModel.sys) === null || _c === void 0 ? void 0 : _c.contentType) === null || _d === void 0 ? void 0 : _d.sys) === null || _e === void 0 ? void 0 : _e.id); })
                                : oldFile[type].findIndex((o) => { var _a; return o.sys.id == ((_a = newModel.sys) === null || _a === void 0 ? void 0 : _a.id); });
                            if (result > -1) {
                                const oldModel = oldFile[type][result];
                                if (type === "editorInterfaces") {
                                    if (newModel.sys.updatedAt && newModel.sys.updatedAt > oldModel.sys.updatedAt) {
                                        console.info(`⦿ Old version updated at ${oldModel.sys.updatedAt} - New Version updated at ${newModel.sys.updatedAt} | Content-type: ${newModel.sys.contentType.sys.id}`);
                                        thereAreChanges = true;
                                        this.totalEntitites[type]++;
                                        this.newMigrationFile[type].push(newModel);
                                    }
                                    else if (newModel.sys.updatedAt < oldModel.sys.updatedAt)
                                        console.info(colors_1.default.yellow(`* "${this.envBase}" version is ${oldModel.sys.updatedAt} - "${this.envCompare}" version is ${newModel.sys.updatedAt} | Content-type id: ${newModel.sys.contentType.sys.id}`));
                                }
                                else {
                                    if (newModel.sys.publishedVersion && newModel.sys.publishedVersion > oldModel.sys.publishedVersion) {
                                        if (newModel.sys.id) {
                                            if (type === 'entries') {
                                                console.info(`⦿ Entry Updated | Content-type: ${newModel.sys.contentType.sys.id} | id: ${newModel.sys.id}  | Versions: (old ${oldModel.sys.publishedVersion || oldModel.sys.updatedAt} - new ${newModel.sys.publishedVersion || newModel.sys.updatedAt})`);
                                                this.showEntriesDiff(newModel.fields, oldModel.fields);
                                            }
                                            else {
                                                console.info(`⦿ Updated | id: ${newModel.sys.id} | Versions: (old ${oldModel.sys.publishedVersion || oldModel.sys.updatedAt} - new ${newModel.sys.publishedVersion || newModel.sys.updatedAt})`);
                                            }
                                        }
                                        else {
                                            console.info(`Name: ${newModel.name} | displayField: ${newModel.displayField} | Fields: ${newModel.fields ? newModel.fields.length : 0} | Versions: (old ${oldModel.sys.publishedVersion || oldModel.sys.updatedAt} - new ${newModel.sys.publishedVersion || newModel.sys.updatedAt})`);
                                        }
                                        thereAreChanges = true;
                                        this.totalEntitites[type]++;
                                        if (type === "contentTypes") {
                                            this.verifyIsModelHasDifferenceStructure(newModel, oldModel);
                                        }
                                        this.newMigrationFile[type].push(newModel);
                                    }
                                    else if (newModel.sys.publishedVersion < oldModel.sys.publishedVersion) {
                                        if (type === 'entries') {
                                            console.info(colors_1.default.yellow(`⦿ ${newModel.sys.type} up | Content-type: ${newModel.sys.contentType.sys.id} | id: ${newModel.sys.id} | "${this.envBase}" v: ${oldModel.sys.publishedVersion} > "${this.envCompare}" v: ${newModel.sys.publishedVersion}`));
                                            this.showEntriesDiff(oldModel.fields, newModel.fields, { warn: true });
                                        }
                                        else {
                                            console.info(colors_1.default.yellow(`⦿ ${newModel.sys.type} up | id: ${newModel.sys.id} | "${this.envBase}" v: ${oldModel.sys.publishedVersion} > "${this.envCompare}" v: ${newModel.sys.publishedVersion}`));
                                        }
                                    }
                                }
                            }
                            else {
                                if (type === "entries") {
                                    console.info(`⦿ New ${type} schema | Content-type: ${newModel.sys.contentType.sys.id} | id: ${newModel.sys.id}`);
                                }
                                else {
                                    console.info(`⦿ New ${newModel.sys.type} schema | id: ${newModel.sys.id}`);
                                }
                                thereAreChanges = true;
                                this.totalEntitites[type]++;
                                this.newMigrationFile[type].push(newModel);
                            }
                        }
                    });
                    if (this.totalEntitites[type] == 0) {
                        console.info("No changes");
                    }
                }
            });
            if (this.forceUpdateContentTypesAndEntries) {
                const contentTypesToDelete = [];
                const entriesToDelete = [];
                lodash_1.default.forEach(oldFile["contentTypes"], (oldModel, pos) => {
                    const contentTypeNotExists = newFile["contentTypes"].findIndex((o) => o.sys.id == oldModel.sys.id) === -1;
                    if (contentTypeNotExists) {
                        const contentTypeId = oldModel.sys.id;
                        thereAreChanges = true;
                        contentTypesToDelete.push(contentTypeId);
                        this.migrationActions.push({
                            contentTypeAction: "delete",
                            contentTypeName: contentTypeId
                        });
                    }
                });
                console.info(`
------------------------------
    Content Modules to delete 
------------------------------
total: ${contentTypesToDelete.length}
list:
- ${contentTypesToDelete.join("\n - ")}
            `);
                lodash_1.default.forEach(oldFile["entries"], (oldModel, pos) => {
                    var _a, _b, _c;
                    const contentTypeNotExists = contentTypesToDelete.findIndex((coid) => coid === oldModel.sys.contentType.sys.id) === -1;
                    if (contentTypeNotExists) {
                        const entryNotExists = newFile["entries"].findIndex((o) => o.sys.id == oldModel.sys.id) === -1;
                        if (entryNotExists) {
                            thereAreChanges = true;
                            entriesToDelete.push(`id: ${oldModel.sys.id} | contentType: ${(_c = (_b = (_a = oldModel.sys) === null || _a === void 0 ? void 0 : _a.contentType) === null || _b === void 0 ? void 0 : _b.sys) === null || _c === void 0 ? void 0 : _c.id}`);
                            this.migrationActions.push({
                                contentTypeAction: "delete",
                                contentTypeName: oldModel.sys.id,
                                entryAction: 'delete',
                                entryId: oldModel.sys.id
                            });
                        }
                    }
                });
                console.info(`
------------------------------
    Entries to delete 
------------------------------
total: ${entriesToDelete.length}
list:
- ${entriesToDelete.join("\n - ")}
            `);
            }
            if (!thereAreChanges) {
                return true;
            }
            else {
                if (this.migrationActions.length > 0) {
                    common_1.WriteJsonFile(path.resolve(__dirname, '../differenceContent', 'migrationContent.json'), { migrationActions: this.migrationActions });
                    if (!this.runMigration)
                        this.runMigration = true;
                }
                yield this.mergeContentDifference(thereAreChanges);
                return true;
            }
        });
    }
    importFiles() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (!fs.existsSync(this.differenceContentPath)) {
                fs.mkdirSync(this.differenceContentPath);
            }
            if (!this.useCurrentDifferenceContent) {
                this.importFilesFromContentful(this.envCompare, this.envCompare + '.json');
                this.importFilesFromContentful(this.envBase, this.envBase + '.json');
            }
            yield this.parseContentfulFiles();
        });
    }
    start() {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            if (this.mergeOnlyDiff) {
                console.info(colors_1.default.green("Show only diff"));
            }
            try {
                yield this.importFiles();
                return true;
            }
            catch (e) {
                console.error(e);
                return false;
            }
        });
    }
}
exports.default = importContentfulToMaster;
