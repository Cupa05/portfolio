#!/usr/bin/env node
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { runWorkflowOnce } from './engine/execute.js';
import { getNextNodeIdsFromTrigger } from './scheduler.js';
yargs(hideBin(process.argv))
    .command('run <file> [triggerId]', 'Run a workflow JSON file one time', (y) => y
    .positional('file', { type: 'string', demandOption: true })
    .positional('triggerId', { type: 'string', default: 't1' })
    .option('body', { type: 'string', desc: 'JSON body for webhook-like runs' })
    .option('query', { type: 'string', desc: 'JSON query for webhook-like runs' }), async (argv) => {
    const filePath = path.resolve(process.cwd(), String(argv.file));
    const wf = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const triggerId = String(argv.triggerId);
    const runId = crypto.randomUUID();
    const body = argv.body ? JSON.parse(String(argv.body)) : undefined;
    const query = argv.query ? JSON.parse(String(argv.query)) : undefined;
    const ctx = { runId, triggerId, now: new Date().toISOString(), body, query, result: {} };
    const startIds = getNextNodeIdsFromTrigger(wf, triggerId, 'main');
    if (!startIds.length)
        throw new Error('No connections from trigger');
    const out = await runWorkflowOnce(wf, startIds, ctx);
    console.log(JSON.stringify({ runId, result: out.result }, null, 2));
})
    .demandCommand(1)
    .help()
    .strict()
    .parse();
