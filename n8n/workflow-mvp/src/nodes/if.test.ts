import { describe, it, expect } from 'vitest';
import { runWorkflowOnce } from '../engine/execute.js';
import { Workflow } from '../types.js';

describe('if node branching', () => {
  it('routes to true branch', async () => {
    const wf: Workflow = {
      name: 'iftrue',
      triggers: [{ id: 't1', type: 'webhook' }],
      nodes: [
        { id: 'f', type: 'function', config: { code: 'context.temp = 0.7; return context;' } },
        { id: 'cond', type: 'if', config: { expression: 'context.temp > 0.5' } },
        { id: 'high', type: 'set', config: { fields: { message: 'High' } } },
        { id: 'low', type: 'set', config: { fields: { message: 'Low' } } }
      ],
      connections: [
        { from: { id: 't1', port: 'main' }, to: { id: 'f', port: 'in' } },
        { from: { id: 'f', port: 'main' }, to: { id: 'cond', port: 'in' } },
        { from: { id: 'cond', port: 'true' }, to: { id: 'high', port: 'in' } },
        { from: { id: 'cond', port: 'false' }, to: { id: 'low', port: 'in' } }
      ],
      settings: { onError: 'stop' }
    };
    const ctx: any = { runId: 'r-if-1', triggerId: 't1', now: new Date().toISOString(), result: {} };
    const out = await runWorkflowOnce(wf, ['f'], ctx);
    expect(out.result).toEqual({ message: 'High' });
  });

  it('routes to false branch', async () => {
    const wf: Workflow = {
      name: 'iffalse',
      triggers: [{ id: 't1', type: 'webhook' }],
      nodes: [
        { id: 'f', type: 'function', config: { code: 'context.temp = 0.3; return context;' } },
        { id: 'cond', type: 'if', config: { expression: 'context.temp > 0.5' } },
        { id: 'high', type: 'set', config: { fields: { message: 'High' } } },
        { id: 'low', type: 'set', config: { fields: { message: 'Low' } } }
      ],
      connections: [
        { from: { id: 't1', port: 'main' }, to: { id: 'f', port: 'in' } },
        { from: { id: 'f', port: 'main' }, to: { id: 'cond', port: 'in' } },
        { from: { id: 'cond', port: 'true' }, to: { id: 'high', port: 'in' } },
        { from: { id: 'cond', port: 'false' }, to: { id: 'low', port: 'in' } }
      ],
      settings: { onError: 'stop' }
    };
    const ctx: any = { runId: 'r-if-2', triggerId: 't1', now: new Date().toISOString(), result: {} };
    const out = await runWorkflowOnce(wf, ['f'], ctx);
    expect(out.result).toEqual({ message: 'Low' });
  });
});
