#!/usr/bin/env node
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const commander_1 = require("commander");
const child_process_1 = require("child_process");
const importContent_1 = tslib_1.__importDefault(require("./importContent"));
const deleteEnvAndCopyForMaster_1 = tslib_1.__importDefault(require("./deleteEnvAndCopyForMaster"));
const common_1 = require("./utils/common");
!(() => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    let opts = {};
    commander_1.program
        .storeOptionsAsProperties(false)
        .passCommandToAction(false);
    commander_1.program
        .name("cont")
        .usage('[command] [options]')
        .option('-v, --version', 'Version')
        .action((options) => {
        if (options.version) {
            const ver = child_process_1.spawnSync('npm', ['info', '@a3labs/contentful', 'version'], {
                encoding: 'utf8',
            });
            console.log(ver.stdout);
        }
    });
    commander_1.program
        .command("merge")
        .usage("[--from, env] [--to, env] [--space-id] [--cma-token]")
        .description('Merge Contentful content from branch to another branch')
        .requiredOption('-f, --from <env>', 'Environemnt Ex. -f dev')
        .requiredOption('-t, --to <env>', 'Environemnt Ex. -t master')
        .option('--space-id <id>', 'Contentful Space Id')
        .option('--content-type-ids <ids>', 'Content Type Ids Ex. --content-type-ids contentType1,contentType2')
        .option('--entries-ids <ids>', 'Entries Ids Ex. --entry-ids entry1,entry2')
        .option('--ignore-entries', 'Skips processing of entries, use it to only update content type structure')
        .option('--cma-token <id>', 'Contentful CMA Token')
        .option('--skip-questions', 'Skip any question')
        .option('--use-current-difference-content', 'Use contents already imported from Contentful')
        .option('--force-update-content-types-and-entries', 'If you delete a content type or entry will be removed from --env-base branch')
        .action((options) => {
        opts = options;
    });
    commander_1.program
        .command("diff")
        .usage("[--from, branch] [--to, branch] [--space-id] [--cma-token]")
        .description('It deletes a branch if exists and creates a copy from master.')
        .requiredOption('-f, --from <env>', 'Environemnt Ex. -f dev')
        .requiredOption('-t, --to <env>', 'Environemnt Ex. -t master')
        .option('--space-id <id>', 'Contentful Space Id')
        .option('--content-type-ids <ids>', 'Content Type Ids Ex. --content-type-ids contentType1,contentType2')
        .option('--entries-ids <ids>', 'Entries Ids Ex. --entry-ids entry1,entry2')
        .option('--ignore-entries', 'Skips processing of entries, use it to only update content type structure')
        .option('--cma-token <id>', 'Contentful CMA Token')
        .option('--use-current-difference-content', 'Use contents already imported from Contentful')
        .option('--force-update-content-types-and-entries', 'If you delete a content type or entry will be removed from --env-base branch')
        .action((options) => {
        opts = options;
    });
    commander_1.program
        .command("newEnv")
        .alias("new")
        .alias("update")
        .usage("[--env] [--space-id] [--cma-token]")
        .description('It deletes an branch if exists and creates a copy from master.')
        .requiredOption('-e, --env <env>', 'Environemnt Ex. -f dev')
        .option('--space-id <id>', 'Contentful Space Id')
        .option('--cma-token <id>', 'Contentful CMA Token')
        .action((options) => {
        opts = options;
    });
    commander_1.program
        .command("delete")
        .usage("[--env, branch] [--space-id] [--cma-token]")
        .description('It deletes a branch if exists.')
        .requiredOption('-e, --env <env>', 'Environemnt Ex. -f test')
        .option('--space-id <id>', 'Contentful Space Id')
        .option('--cma-token <id>', 'Contentful CMA Token')
        .action((options) => {
        opts = options;
    });
    commander_1.program
        .command("info")
        .description('Info.')
        .action((options) => {
        opts = options;
    });
    commander_1.program.parse(process.argv);
    try {
        const { CONTENTFUL_CMS, CONTENTFUL_SPACE_ID } = process.env;
        opts['cmaToken'] = opts['cmaToken'] || CONTENTFUL_CMS || null;
        opts['spaceId'] = opts['spaceId'] || CONTENTFUL_SPACE_ID || null;
        if (commander_1.program.args[0] === "info") {
            console.info("CONTENTFUL_CMS: ", CONTENTFUL_CMS || '--');
            console.info("CONTENTFUL_SPACE_ID: ", CONTENTFUL_SPACE_ID || '--');
            process.exit();
        }
        else if (commander_1.program.args[0] === "merge") {
            common_1.KeysNeeded(opts);
            console.info(opts);
            const compareEnv = {
                envBase: opts['to'],
                envCompare: opts['from'],
                spaceId: opts['spaceId'],
                contentTypeIds: opts['contentTypeIds'],
                entriesIds: opts['entriesIds'],
                ignoreEntries: !!opts['ignoreEntries'],
                cmaToken: opts['cmaToken'],
                skipQuestions: !!opts['skipQuestions'],
                useCurrentDifferenceContent: !!opts['useCurrentDifferenceContent'],
                forceUpdateContentTypesAndEntries: !!opts['forceUpdateContentTypesAndEntries']
            };
            const icft = new importContent_1.default(compareEnv);
            const icftResult = yield icft.start();
            if (icftResult) {
                process.exit();
            }
            else {
                console.error("Something went wrong");
            }
        }
        else if (commander_1.program.args[0] === "diff") {
            common_1.KeysNeeded(opts);
            console.info(opts);
            const compareEnv = {
                envBase: opts['to'],
                envCompare: opts['from'],
                spaceId: opts['spaceId'],
                contentTypeIds: opts['contentTypeIds'],
                entriesIds: opts['entriesIds'],
                ignoreEntries: !!opts['ignoreEntries'],
                cmaToken: opts['cmaToken'],
                onlyDiff: true,
                useCurrentDifferenceContent: !!opts['useCurrentDifferenceContent'],
                forceUpdateContentTypesAndEntries: !!opts['forceUpdateContentTypesAndEntries']
            };
            const icft = new importContent_1.default(compareEnv);
            icft.start();
        }
        else if (commander_1.program.args[0] === "newEnv" || commander_1.program.args[0] === "new" || commander_1.program.args[0] === "update") {
            common_1.KeysNeeded(opts);
            console.info(opts);
            if (!opts['env'])
                throw new Error("[-e, --env] params needed!");
            const deleteEnvOptions = {
                enviornmentBase: opts['env'],
                spaceId: opts['spaceId'],
                cmaToken: opts['cmaToken'],
            };
            const deacfm = new deleteEnvAndCopyForMaster_1.default(deleteEnvOptions);
            const deacfmResult = deacfm.askBeforeCreateCopy();
            if (deacfmResult) {
                process.exit();
            }
            else {
                console.error("Something went wrong!");
            }
        }
        else if (commander_1.program.args[0] === "delete") {
            common_1.KeysNeeded(opts);
            console.info(opts);
            if (opts['env'].toLowerCase() === "master") {
                throw new Error('You cannot delete Master enviorment');
            }
            const deleteEnvOptions = {
                enviornmentBase: opts['env'],
                spaceId: opts['spaceId'],
                cmaToken: opts['cmaToken'],
            };
            const deacfm = new deleteEnvAndCopyForMaster_1.default(deleteEnvOptions);
            const result = yield deacfm.deleteEnv();
            if (result) {
                process.exit();
            }
            else {
                console.error("Something went wrong!");
            }
        }
        else {
            const h = child_process_1.spawnSync('cont', ['--help'], {
                encoding: 'utf8',
            });
            console.log(h.stdout);
            process.exit();
        }
    }
    catch (error) {
        console.error({ error });
        process.exit();
    }
}))();
