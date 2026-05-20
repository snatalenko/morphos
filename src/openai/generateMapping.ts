import OpenAI from 'openai';
import type { RootMapping } from '../mappingTypes.ts';
import type { JsonSchema } from '../JsonSchema.ts';
import type { MappingGenerationUsage } from '../utils/MappingGenerationUsage.ts';
import { appendRequiredMappings, generateInitialMapping } from '../utils/index.ts';
import { buildMappingPrompt } from '../utils/buildMappingPrompt.ts';
import { SYSTEM_PROMPT } from '../utils/SYSTEM_PROMPT.ts';

export type ReasoningEffort = 'none' | 'minimal' | 'low' | 'medium' | 'high' | 'xhigh';

export type GenerateMappingOptions = {

	/**
	 * Add schema-aware placeholders for unmapped required destination fields after AI generation.
	 *
	 * Defaults to `false`.
	 */
	generateRequiredFields?: boolean;

	/**
	 * Generate a mapping template from the destination schema and include it in the prompt.
	 * Ignored when mappingTemplate is provided.
	 *
	 * Defaults to `false`.
	 */
	generateMappingTemplate?: boolean;

	/**
	 * General mapping instructions explaining all aspects of the mapping.
	 *
	 * Defaults to {@link SYSTEM_PROMPT}
	 */
	systemInstructions?: string;

	/**
	 * Additional natural-language instructions appended to the prompt.
	 */
	instructions?: string;

	/**
	 * Explicit mapping shape for the model to preserve and fill when it finds confident matches.
	 */
	mappingTemplate?: RootMapping;

	/**
	 * OpenAI model id used for generation.
	 *
	 * Defaults to `'gpt-5.5'`.
	 */
	model?: string;

	/**
	 * Reasoning effort used by reasoning-capable OpenAI models.
	 */
	reasoningEffort?: ReasoningEffort;

	/**
	 * Receives token usage reported by OpenAI. The SDK does not return request cost.
	 */
	onUsage?: (usage: MappingGenerationUsage) => void;

	/**
	 * Passed to the OpenAI client for browser usage. Exposing API keys in browser code is unsafe.
	 */
	dangerouslyAllowBrowser?: boolean;
};

export const buildUserMessage = buildMappingPrompt;

export async function generateMapping(
	sourceSchema: JsonSchema,
	destinationSchema: JsonSchema,
	apiKey: string,
	options?: GenerateMappingOptions
): Promise<RootMapping> {
	const {
		model = 'gpt-5.5',
		systemInstructions = SYSTEM_PROMPT,
		instructions,
		generateMappingTemplate = false,
		generateRequiredFields = false,
		reasoningEffort = 'low',
		mappingTemplate = generateMappingTemplate ?
			generateInitialMapping(destinationSchema) :
			undefined
	} = options ?? {};

	const client = new OpenAI({ apiKey, dangerouslyAllowBrowser: options?.dangerouslyAllowBrowser });

	const userMessage = buildMappingPrompt(sourceSchema, destinationSchema, instructions, mappingTemplate);
	const response = await client.chat.completions.create({
		model,
		messages: [
			{ role: 'system', content: systemInstructions },
			{ role: 'user', content: userMessage }
		],
		response_format: {
			type: 'json_object'
		},
		reasoning_effort: reasoningEffort
	});

	if (response.usage) {
		options?.onUsage?.({
			provider: 'openai',
			model: response.model,
			inputTokens: response.usage.prompt_tokens,
			outputTokens: response.usage.completion_tokens,
			totalTokens: response.usage.total_tokens,
			reasoningTokens: response.usage.completion_tokens_details?.reasoning_tokens
		});
	}

	const content = response.choices[0]?.message?.content;
	if (!content)
		throw new Error('OpenAI returned an empty response');

	try {
		let mapping = JSON.parse(content) as RootMapping;
		if (generateRequiredFields)
			mapping = appendRequiredMappings(mapping, destinationSchema, { replaceEmptyMappings: true });

		return mapping;
	}
	catch (e) {
		throw new Error(`OpenAI returned invalid JSON: ${(e as Error).message}`);
	}
}
