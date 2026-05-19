import OpenAI from 'openai';
import type { RootMapping } from '../mappingTypes.ts';
import type { JsonSchema } from '../JsonSchema.ts';
import { appendRequiredMappings, generateInitialMapping } from '../shared/index.ts';
import { SYSTEM_PROMPT } from './SYSTEM_PROMPT.ts';

export type GenerateMappingOptions = {

	/**
	 * Add schema-aware placeholders for unmapped required destination fields after AI generation.
	 * Defaults to true.
	 */
	generateRequiredFields?: boolean;

	/**
	 * Generate a mapping template from the destination schema and include it in the prompt.
	 * Ignored when mappingTemplate is provided. Defaults to false.
	 */
	generateMappingTemplate?: boolean;

	/**
	 * Additional natural-language instructions appended to the prompt.
	 */
	instructions?: string;

	/**
	 * Explicit mapping shape for the model to preserve and fill when it finds confident matches.
	 */
	mappingTemplate?: RootMapping;

	/**
	 * OpenAI model id used for generation. Defaults to gpt-5.5.
	 */
	model?: string;

	/**
	 * Passed to the OpenAI client for browser usage. Exposing API keys in browser code is unsafe.
	 */
	dangerouslyAllowBrowser?: boolean;
};

export function buildUserMessage(
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

export function resolveMappingTemplate(
	destinationSchema: JsonSchema,
	options?: GenerateMappingOptions
): RootMapping | undefined {
	if (options?.mappingTemplate !== undefined)
		return options.mappingTemplate;

	return options?.generateMappingTemplate === true
		? generateInitialMapping(destinationSchema)
		: undefined;
}

export async function generateMapping(
	sourceSchema: JsonSchema,
	destinationSchema: JsonSchema,
	apiKey: string,
	options?: GenerateMappingOptions
): Promise<RootMapping> {
	const client = new OpenAI({ apiKey, dangerouslyAllowBrowser: options?.dangerouslyAllowBrowser });
	const userMessage = buildUserMessage(
		sourceSchema,
		destinationSchema,
		options?.instructions,
		resolveMappingTemplate(destinationSchema, options)
	);

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
			: appendRequiredMappings(mapping, destinationSchema, { replaceEmptyMappings: true });
	}
	catch (e) {
		throw new Error(`OpenAI returned invalid JSON: ${(e as Error).message}`);
	}
}
