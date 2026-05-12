import OpenAI from 'openai';
import type { RootMapping } from '../mappingTypes.ts';
import type { MappingSchema } from '../MappingSchema.ts';
import { SYSTEM_PROMPT } from './SYSTEM_PROMPT.ts';

export function buildUserMessage(
	sourceSchema: MappingSchema,
	destinationSchema: MappingSchema,
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
	instructions,
	model = 'gpt-5.5',
	dangerouslyAllowBrowser
}: {
	sourceSchema: MappingSchema;
	destinationSchema: MappingSchema;
	apiKey: string;
	instructions?: string;
	model?: string;
	dangerouslyAllowBrowser?: boolean;
}): Promise<RootMapping> {

	const client = new OpenAI({ apiKey, dangerouslyAllowBrowser });
	const userMessage = buildUserMessage(sourceSchema, destinationSchema, instructions);

	const response = await client.chat.completions.create({
		model,
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
		return JSON.parse(content) as RootMapping;
	}
	catch (e) {
		throw new Error(`OpenAI returned invalid JSON: ${(e as Error).message}`);
	}
}

