import axios from 'axios';
import { interpolate } from '../utils/interpolate.js';
export const httpRequestExecutor = async (node, context) => {
    const cfg = node.config || {};
    const method = (cfg.method || 'GET').toUpperCase();
    const url = interpolate(cfg.url, { context });
    const headers = interpolate(cfg.headers || {}, { context });
    const body = interpolate(cfg.body || undefined, { context });
    const timeout = cfg.timeoutMs || 15000;
    const res = await axios.request({ method, url, headers, data: body, timeout });
    return { output: res.data, nextPort: 'main' };
};
