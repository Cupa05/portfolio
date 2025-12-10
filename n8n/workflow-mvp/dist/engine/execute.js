import { getExecutor } from '../nodes/index.js';
function buildGraph(connections) {
    const out = new Map();
    for (const c of connections) {
        const port = c.from.port || 'main';
        const m = out.get(c.from.id) || {};
        m[port] = m[port] || [];
        m[port].push(c.to.id);
        out.set(c.from.id, m);
    }
    return out;
}
async function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
export async function runWorkflowOnce(workflow, startFromIds, context) {
    const graph = buildGraph(workflow.connections);
    const nodeById = new Map();
    for (const n of workflow.nodes)
        nodeById.set(n.id, n);
    const queue = startFromIds.map((id) => ({ id }));
    const visited = new Set();
    while (queue.length) {
        const { id, port } = queue.shift();
        const node = nodeById.get(id);
        if (!node)
            continue;
        const retry = workflow.settings?.retry || {};
        const maxAttempts = Math.max(1, retry.maxAttempts ?? 1);
        const backoffMs = Math.max(0, retry.backoffMs ?? 0);
        let success = false;
        let lastErr;
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                console.log(`[run:${context.runId}] node:${id} attempt:${attempt}/${maxAttempts}`);
                const exec = getExecutor(node);
                const res = await exec(node, context);
                context.result = res.output;
                const nextPort = res.nextPort || 'main';
                const fanout = graph.get(id)?.[nextPort] || [];
                for (const nextId of fanout)
                    queue.push({ id: nextId });
                console.log(`[run:${context.runId}] node:${id} success -> next:${fanout.join(',') || '(end)'}`);
                success = true;
                break;
            }
            catch (err) {
                lastErr = err;
                const willRetry = attempt < maxAttempts;
                console.warn(`[run:${context.runId}] node:${id} error on attempt ${attempt}: ${err?.message || err}${willRetry ? `, retrying in ${backoffMs * attempt}ms` : ''}`);
                if (willRetry && backoffMs > 0)
                    await sleep(backoffMs * attempt);
            }
        }
        if (!success) {
            if (workflow.settings?.onError === 'continue') {
                console.warn(`[run:${context.runId}] node:${id} failed after ${maxAttempts} attempts, continuing`);
                continue;
            }
            throw new Error(`Node ${id} failed after ${maxAttempts} attempts: ${lastErr?.message || lastErr}`);
        }
        visited.add(id + ':' + (port || 'main'));
    }
    return context;
}
