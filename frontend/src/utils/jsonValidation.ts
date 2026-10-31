export interface ValidationResult {
  valid: boolean;
  error?: string;
  parsed?: unknown;
}

export function validateJSON(jsonString: string): ValidationResult {
  if (!jsonString.trim()) {
    return { valid: false, error: 'JSON cannot be empty' };
  }

  try {
    const parsed = JSON.parse(jsonString);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return { valid: false, error: 'JSON must be an object' };
    }
    return { valid: true, parsed };
  } catch (err) {
    return { valid: false, error: err instanceof Error ? err.message : 'Invalid JSON' };
  }
}

export function validateImports(jsonString: string): ValidationResult {
  const result = validateJSON(jsonString);
  if (!result.valid || !result.parsed) return result;

  const imports = result.parsed as Record<string, unknown>;
  for (const [key, value] of Object.entries(imports)) {
    if (typeof value !== 'string') {
      return { valid: false, error: `Import "${key}" must be a string`, parsed: null };
    }
  }

  return result;
}

export function validateScopes(jsonString: string): ValidationResult {
  if (!jsonString.trim()) {
    return { valid: true, parsed: {} };
  }

  const result = validateJSON(jsonString);
  if (!result.valid || !result.parsed) return result;

  const scopes = result.parsed as Record<string, unknown>;
  for (const [scopeKey, scopeValue] of Object.entries(scopes)) {
    if (typeof scopeValue !== 'object' || scopeValue === null || Array.isArray(scopeValue)) {
      return { valid: false, error: `Scope "${scopeKey}" must be an object`, parsed: null };
    }
    const scopeObj = scopeValue as Record<string, unknown>;
    for (const [subKey, subValue] of Object.entries(scopeObj)) {
      if (typeof subValue !== 'string') {
        return { valid: false, error: `Scope "${scopeKey}" value for "${subKey}" must be a string`, parsed: null };
      }
    }
  }

  return result;
}
