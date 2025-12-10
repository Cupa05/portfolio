import { interpolate } from '../utils/interpolate.js';
export const setExecutor = async (node, context) => {
    const fields = node.config?.fields || {};
    const evaluated = interpolate(fields, { context });
    context.result = { ...(context.result || {}), ...evaluated };
    return { output: context.result, nextPort: 'main' };
};
