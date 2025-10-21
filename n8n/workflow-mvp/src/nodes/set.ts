import { NodeDef, NodeExecutor } from '../types.js';
import { interpolate } from '../utils/interpolate.js';

export const setExecutor: NodeExecutor = async (node: NodeDef, context) => {
  const fields = node.config?.fields || {};
  const evaluated = interpolate(fields, { context });
  context.result = { ...(context.result || {}), ...evaluated };
  return { output: context.result, nextPort: 'main' };
};
