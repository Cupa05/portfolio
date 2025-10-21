function getByPath(obj: any, path: string) {
  return path.split('.').reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
}

export function interpolate(input: any, scope: Record<string, any>) {
  if (typeof input === 'string') {
    return input.replace(/\{\{\s*([^}]+)\s*\}\}/g, (_, expr) => {
      const value = getByPath(scope, expr.trim());
      return value == null ? '' : String(value);
    });
  } else if (Array.isArray(input)) {
    return input.map((v) => interpolate(v, scope));
  } else if (input && typeof input === 'object') {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(input)) out[k] = interpolate(v, scope);
    return out;
  }
  return input;
}
