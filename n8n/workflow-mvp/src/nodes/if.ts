import { NodeDef, NodeExecutor } from '../types.js';

export const ifExecutor: NodeExecutor = async (node: NodeDef, context) => {
  const expr: string = node.config?.expression || 'true';
  const fn = new Function('context', `return (${expr});`) as (ctx: any) => boolean;
  const ok = !!fn(context);
  return { output: ok, nextPort: ok ? 'true' : 'false' };
};
