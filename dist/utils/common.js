"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseOptionsList = exports.RlCommand = exports.KeysNeeded = exports.ParseJsonFiles = exports.WriteJsonFile = void 0;
const tslib_1 = require("tslib");
const fs_1 = tslib_1.__importDefault(require("fs"));
function WriteJsonFile(filePath, jsonData) {
    fs_1.default.writeFileSync(filePath, JSON.stringify(jsonData, null, 2));
}
exports.WriteJsonFile = WriteJsonFile;
function ParseJsonFiles(filePath) {
    const jsonFile = fs_1.default.readFileSync(filePath, 'utf8');
    return JSON.parse(jsonFile);
}
exports.ParseJsonFiles = ParseJsonFiles;
function KeysNeeded(opts) {
    if (!opts['spaceId'] || !opts['cmaToken'])
        throw new Error("Credentials required | declare `Global CMS and Space ID` or use cont <Command(s)> --space-id=<SPACE_ID> --cma-token=<CMA_TOKEN>");
}
exports.KeysNeeded = KeysNeeded;
function RlCommand(rl, question) {
    return new Promise((resolve, reject) => {
        return rl.question(question, (answer) => resolve(answer));
    });
}
exports.RlCommand = RlCommand;
function parseOptionsList(ids) {
    try {
        return ids.split(',');
    }
    catch (e) {
        console.error(e);
        throw new Error("Invalid content type ids structure, expected  --content-type-ids=contentType1,contentType2");
    }
}
exports.parseOptionsList = parseOptionsList;
