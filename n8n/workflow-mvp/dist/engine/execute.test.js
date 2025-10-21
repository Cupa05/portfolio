import { describe, it, expect } from 'vitest';
import { runWorkflowOnce } from './execute.js';
describe('engine runWorkflowOnce', () => {
    it('runs a simple set flow', async () => {
        const wf = {
            name: 'test',
            triggers: [{ id: 't1', type: 'webhook', path: '/x', method: 'POST' }],
            nodes: [
                { id: 'n1', type: 'set', config: { fields: { msg: 'hi {{context.body.name}}' } } }
            ],
            connections: [
                { from: { id: 't1', port: 'main' }, to: { id: 'n1', port: 'in' } }
            ],
            settings: { onError: 'stop' }
        };
        const ctx = { runId: 'r1', triggerId: 't1', now: new Date().toISOString(), body: { name: 'Ada' }, result: {} };
        const out = await runWorkflowOnce(wf, ['n1'], ctx);
        expect(out.result).toEqual({ msg: 'hi Ada' });
    });
});
