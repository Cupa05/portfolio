export const ifExecutor = async (node, context) => {
    const expr = node.config?.expression || 'true';
    const fn = new Function('context', `return (${expr});`);
    const ok = !!fn(context);
    return { output: ok, nextPort: ok ? 'true' : 'false' };
};
