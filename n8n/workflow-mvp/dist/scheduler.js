import cron from 'node-cron';
import { runWorkflowOnce } from './engine/execute.js';
import crypto from 'crypto';
export function scheduleWorkflow(workflow, onRun) {
    for (const t of workflow.triggers) {
        if (t.type !== 'cron' || !t.cron)
            continue;
        cron.schedule(t.cron, async () => {
            const runId = crypto.randomUUID();
            const ctx = {
                runId,
                triggerId: t.id,
                now: new Date().toISOString(),
                result: {}
            };
            await runWorkflowOnce(workflow, getNextNodeIdsFromTrigger(workflow, t.id, 'main'), ctx);
            onRun?.(ctx);
        });
    }
}
export function getNextNodeIdsFromTrigger(workflow, triggerId, port) {
    return workflow.connections
        .filter((c) => c.from.id === triggerId && (c.from.port || 'main') === port)
        .map((c) => c.to.id);
}
