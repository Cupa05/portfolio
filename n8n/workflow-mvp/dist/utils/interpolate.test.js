import { describe, it, expect } from 'vitest';
import { interpolate } from './interpolate.js';
describe('interpolate', () => {
    it('replaces string placeholders', () => {
        const out = interpolate('Hello {{ context.name }}!', { context: { name: 'World' } });
        expect(out).toBe('Hello World!');
    });
    it('replaces inside objects and arrays', () => {
        const input = {
            a: '{{context.x}}',
            b: ['{{context.y}}', 2],
            c: { d: '{{ context.z.nested }}' }
        };
        const out = interpolate(input, { context: { x: 1, y: 'ok', z: { nested: 3 } } });
        expect(out).toEqual({ a: '1', b: ['ok', 2], c: { d: '3' } });
    });
});
