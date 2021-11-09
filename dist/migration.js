"use strict";
const tslib_1 = require("tslib");
const fs_1 = tslib_1.__importDefault(require("fs"));
const path_1 = tslib_1.__importDefault(require("path"));
const jsonFile = fs_1.default.readFileSync(path_1.default.join(__dirname, '../differenceContent/migrationContent.json'), 'utf8');
const { migrationActions } = JSON.parse(jsonFile);
module.exports = function (migration, context) {
    return tslib_1.__awaiter(this, void 0, void 0, function* () {
        if (migrationActions && migrationActions.length) {
            for (let mat = 0; mat < migrationActions.length; mat++) {
                const contentType = migrationActions[mat];
                let ct;
                if (contentType.contentTypeAction === "delete") {
                    if (contentType.entryAction === "delete") {
                        console.info("Entry to delete -> ", contentType.entryId);
                        try {
                            yield context.makeRequest({
                                method: 'DELETE',
                                url: `entries/${contentType.entryId}/published`
                            });
                            console.info("Entry unpublished | ", contentType.entryId);
                        }
                        catch (e) {
                            console.info("Unable to unpblish");
                        }
                        try {
                            yield context.makeRequest({
                                method: 'DELETE',
                                url: `entries/${contentType.entryId}`
                            });
                            console.info("Entry deleted | ", contentType.entryId);
                        }
                        catch (e) {
                            console.info("Unable to delete");
                        }
                    }
                    else {
                        const resp = yield context.makeRequest({
                            method: 'GET',
                            url: `/entries?content_type=${contentType.contentTypeName}&limit=1000`
                        });
                        if (resp.items.length > 0) {
                            for (let i = 0; i < resp.items.length; i++) {
                                const entryId = resp.items[i].sys.id;
                                console.info("Entry to delete -> ", entryId);
                                try {
                                    yield context.makeRequest({
                                        method: 'DELETE',
                                        url: `entries/${entryId}/published`
                                    });
                                }
                                catch (e) {
                                    console.info("Unable to unpblish");
                                }
                                try {
                                    yield context.makeRequest({
                                        method: 'DELETE',
                                        url: `entries/${entryId}`
                                    });
                                }
                                catch (e) {
                                    console.info("Unable to delete");
                                }
                            }
                        }
                        migration.deleteContentType(contentType.contentTypeName);
                    }
                }
                else if (contentType.contentTypeAction === "edit") {
                    ct = migration.editContentType(contentType.contentTypeName);
                    if (contentType.fieldAction == "delete") {
                        ct.deleteField(contentType.fieldId);
                    }
                }
            }
        }
    });
};
