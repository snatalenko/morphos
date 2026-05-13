import type { FieldOption, MappingSchema } from '../types.ts';

const ENUM_MAX = 50;

function enumValueToExpr(v: unknown): string {
	if (typeof v === 'string')
		return `'${v.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
	if (v === null)
		return 'null';

	return String(v);
}

export function enumOptionsForSchema(schema: MappingSchema | undefined): FieldOption[] {
	if (!schema?.enum || schema.enum.length > ENUM_MAX)
		return [];

	return schema.enum.map(v => ({ value: enumValueToExpr(v) }));
}
