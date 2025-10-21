export const functionExecutor = async (node, context) => {
    const code = node.config?.code || 'return context;';
    const fn = new Function('context', code);
    const result = await fn(context);
    return { output: result, nextPort: 'main' };
};
