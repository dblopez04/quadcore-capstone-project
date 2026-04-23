#!/usr/bin/env node

const db = require("../app/models");
const { sendWeeklyCategoryDigests } = require("../app/services/eventDigest.service");

async function main() {
    const dryRun = process.argv.includes("--dry-run");
    const summary = await sendWeeklyCategoryDigests({ dryRun });
    console.log(JSON.stringify(summary, null, 2));
}

main()
    .catch((err) => {
        console.error(err);
        process.exitCode = 1;
    })
    .finally(async () => {
        await db.sequelize.close();
    });
