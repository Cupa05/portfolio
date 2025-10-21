import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { runWorkflowOnce } from './engine/execute.js';
import { getNextNodeIdsFromTrigger, scheduleWorkflow } from './scheduler.js';
dotenv.config();
const app = express();
app.use(express.json());
function loadWorkflowByName(name) {
    const p = path.resolve(process.cwd(), 'examples', `${name}.json`);
    const raw = fs.readFileSync(p, 'utf-8');
    return JSON.parse(raw);
}
app.get('/health', (_req, res) => res.json({ ok: true }));
// List available workflows from examples directory
app.get('/workflows', (_req, res) => {
    const examplesDir = path.resolve(process.cwd(), 'examples');
    if (!fs.existsSync(examplesDir))
        return res.json([]);
    const files = fs.readdirSync(examplesDir).filter((f) => f.endsWith('.json'));
    return res.json(files.map((f) => f.replace(/\.json$/i, '')));
});
// Get workflow JSON by name
app.get('/workflows/:name', (req, res) => {
    try {
        const wf = loadWorkflowByName(req.params.name);
        res.json(wf);
    }
    catch (e) {
        res.status(404).json({ error: e?.message || 'Not found' });
    }
});
// Save/overwrite workflow JSON by name
app.put('/workflows/:name', (req, res) => {
    try {
        const name = req.params.name;
        const data = req.body;
        const examplesDir = path.resolve(process.cwd(), 'examples');
        if (!fs.existsSync(examplesDir))
            fs.mkdirSync(examplesDir, { recursive: true });
        const p = path.join(examplesDir, `${name}.json`);
        fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf-8');
        res.json({ ok: true });
    }
    catch (e) {
        res.status(400).json({ error: e?.message || 'Failed to save' });
    }
});
app.post('/webhook/:workflow/:triggerId', async (req, res) => {
    try {
        const { workflow: wfName, triggerId } = req.params;
        const wf = loadWorkflowByName(wfName);
        const runId = crypto.randomUUID();
        const ctx = {
            runId,
            triggerId,
            now: new Date().toISOString(),
            headers: req.headers,
            query: req.query,
            body: req.body,
            result: {}
        };
        const startIds = getNextNodeIdsFromTrigger(wf, triggerId, 'main');
        if (!startIds.length)
            return res.status(400).json({ error: 'No connections from trigger' });
        const out = await runWorkflowOnce(wf, startIds, ctx);
        res.json({ runId, result: out.result });
    }
    catch (e) {
        res.status(500).json({ error: e?.message || String(e) });
    }
});
// Local echo endpoint for testing HTTP requests without external network
app.all('/echo', (req, res) => {
    res.json({
        method: req.method,
        headers: req.headers,
        query: req.query,
        body: req.body
    });
});
function startCron() {
    // Load all example workflows and schedule cron triggers if any
    const examplesDir = path.resolve(process.cwd(), 'examples');
    if (!fs.existsSync(examplesDir))
        return;
    const files = fs.readdirSync(examplesDir).filter((f) => f.endsWith('.json'));
    for (const f of files) {
        const wf = JSON.parse(fs.readFileSync(path.join(examplesDir, f), 'utf-8'));
        scheduleWorkflow(wf);
    }
}
// Serve minimal UI from public/
const publicDir = path.resolve(process.cwd(), 'public');
if (fs.existsSync(publicDir)) {
    app.use(express.static(publicDir));
}
const port = Number(process.env.PORT || 3001);
app.listen(port, () => {
    startCron();
    console.log(`Workflow server listening on http://localhost:${port}`);
    if (fs.existsSync(publicDir)) {
        console.log(`UI available at http://localhost:${port}/`);
    }
});
