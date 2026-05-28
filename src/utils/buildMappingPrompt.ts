import type { JsonSchema } from '../JsonSchema.ts';
import type { RootMapping } from '../mappingTypes.ts';

export function buildMappingPrompt(
	sourceSchema: JsonSchema,
	destinationSchema: JsonSchema,
	instructions?: string,
	mappingTemplate?: RootMapping
): string {
	const parts = [
		'Source schema:',
		JSON.stringify(sourceSchema),
		'',
		'Destination schema:',
		JSON.stringify(destinationSchema)
	];

	if (mappingTemplate)
		parts.push('', 'Mapping template:', JSON.stringify(mappingTemplate));

	if (instructions?.trim())
		parts.push('', 'Additional instructions:', instructions.trim());

	return parts.join('\n');
}
