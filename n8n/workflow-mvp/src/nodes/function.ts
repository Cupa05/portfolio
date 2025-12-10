import { NodeDef, NodeExecutor } from '../types.js';

export const functionExecutor: NodeExecutor = async (node: NodeDef, context) => {
  const code: string = node.config?.code || 'return context;';
  const fn = new Function('context', code) as (ctx: any) => any;
  const ret = await fn(context);
  const output = (ret === context || typeof ret === 'undefined') ? context.result : ret;
  return { output, nextPort: 'main' };
};
