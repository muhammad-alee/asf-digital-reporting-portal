export interface ValidationResult { missingFields: string[]; contradictions: string[]; warnings: string[]; }
export function validateReport(input: { source: string; requiredFields: string[]; data: Record<string, unknown> }): ValidationResult {
  const missingFields = input.requiredFields.filter(key => !input.data[key]);
  const warnings: string[] = [];
  const contradictions: string[] = [];
  if (!input.source.trim()) warnings.push("Source material is required.");
  const quantities = [...input.source.matchAll(/\b(\d+)\s*(?:slabs|rounds?|vehicles?)\b/gi)].map(m => m[1]);
  if (new Set(quantities).size > 1) contradictions.push("Multiple quantities were found in the source; confirm the correct value.");
  if (/suspected/i.test(input.source) && /confirmed/i.test(input.source)) contradictions.push("Source contains both suspected and confirmed language; verify the finding status.");
  return { missingFields, contradictions, warnings };
}
