import { NodeExecutor, NodeDef } from '../types.js';
import { httpRequestExecutor } from './httpRequest.js';
import { functionExecutor } from './function.js';
import { setExecutor } from './set.js';
import { ifExecutor } from './if.js';

export const executors: Record<string, NodeExecutor> = {
  httpRequest: httpRequestExecutor,
  function: functionExecutor,
  set: setExecutor,
  if: ifExecutor,
};

export function getExecutor(node: NodeDef): NodeExecutor {
  const exec = executors[node.type];
  if (!exec) throw new Error(`No executor for node type ${node.type}`);
  return exec;
}
