import OpenAI from 'openai';
import type { RootMapping } from '../mappingTypes.ts';
import type { JsonSchema } from '../MappingSchema.ts';
import { SYSTEM_PROMPT } from './SYSTEM_PROMPT.ts';
import { generateRequiredMappings } from './utils/generateRequiredMappings.ts';

export interface GenerateMappingOptions {
	generateRequiredFields?: boolean;
	instructions?: string;
	model?: string;
	dangerouslyAllowBrowser?: boolean;
}

export interface GenerateMappingParams {
	sourceSchema: JsonSchema;
	destinationSchema: JsonSchema;
	apiKey: string;
	options?: GenerateMappingOptions;
}

export function buildUserMessage(
	sourceSchema: JsonSchema,
	destinationSchema: JsonSchema,
	instructions?: string
): string {
	const parts = [
		'Source schema:',
		JSON.stringify(sourceSchema),
		'',
		'Destination schema:',
		JSON.stringify(destinationSchema)
	];

	if (instructions?.trim())
		parts.push('', 'Additional instructions:', instructions.trim());

	return parts.join('\n');
}

export async function generateMapping({
	sourceSchema,
	destinationSchema,
	apiKey,
	options
}: GenerateMappingParams): Promise<RootMapping> {

	const client = new OpenAI({ apiKey, dangerouslyAllowBrowser: options?.dangerouslyAllowBrowser });
	const userMessage = buildUserMessage(sourceSchema, destinationSchema, options?.instructions);

	const response = await client.chat.completions.create({
		model: options?.model ?? 'gpt-5.5',
		messages: [
			{ role: 'system', content: SYSTEM_PROMPT },
			{ role: 'user', content: userMessage }
		],
		response_format: {
			type: 'json_object'
		}
	});

	const content = response.choices[0]?.message?.content;
	if (!content)
		throw new Error('OpenAI returned an empty response');

	try {
		const mapping = JSON.parse(content) as RootMapping;
		return options?.generateRequiredFields === false
			? mapping
			: generateRequiredMappings(mapping, destinationSchema, { replaceEmptyMappings: true });
	}
	catch (e) {
		throw new Error(`OpenAI returned invalid JSON: ${(e as Error).message}`);
	}
}
