import Anthropic from '@anthropic-ai/sdk';
import type { Message } from '@anthropic-ai/sdk/resources/messages';
import type { RootMapping } from '../mappingTypes.ts';
import type { JsonSchema } from '../JsonSchema.ts';
import type { MappingGenerationUsage } from '../utils/MappingGenerationUsage.ts';
import { appendRequiredMappings, generateInitialMapping } from '../utils/index.ts';
import { buildMappingPrompt } from '../utils/buildMappingPrompt.ts';
import { SYSTEM_PROMPT } from '../utils/SYSTEM_PROMPT.ts';

export type ReasoningEffort = 'low' | 'medium' | 'high' | 'xhigh' | 'max';

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
	 * Anthropic Claude model id used for generation.
	 *
	 * Defaults to `'claude-sonnet-4-6'`.
	 */
	model?: string;

	/**
	 * Maximum output tokens for the Claude response.
	 *
	 * Defaults to `4096`.
	 */
	maxTokens?: number;

	/**
	 * Reasoning effort used by Claude models that support effort controls.
	 */
	reasoningEffort?: ReasoningEffort;

	/**
	 * Receives token usage reported by Anthropic. The SDK does not return request cost.
	 */
	onUsage?: (usage: MappingGenerationUsage) => void;

	/**
	 * Passed to the Anthropic client for browser usage. Exposing API keys in browser code is unsafe.
	 */
	dangerouslyAllowBrowser?: boolean;
};

const mappingOutputSchema = {
	type: 'object',
	properties: {
		mapping: {
			type: 'string'
		}
	},
	required: ['mapping'],
	additionalProperties: false
};

function getTextContent(response: Message): string {
	return response.content
		.filter(block => block.type === 'text')
		.map(block => block.text)
		.join('')
		.trim();
}

function parseMappingResponse(content: string): RootMapping {
	const parsed = JSON.parse(content) as { mapping?: unknown };
	if (typeof parsed.mapping !== 'string')
		return parsed as RootMapping;

	return JSON.parse(parsed.mapping) as RootMapping;
}

export async function generateMapping(
	sourceSchema: JsonSchema,
	destinationSchema: JsonSchema,
	apiKey: string,
	options?: GenerateMappingOptions
): Promise<RootMapping> {
	const {
		model = 'claude-sonnet-4-6',
		maxTokens = 4096,
		systemInstructions = SYSTEM_PROMPT,
		instructions,
		generateMappingTemplate = false,
		generateRequiredFields = false,
		reasoningEffort,
		mappingTemplate = generateMappingTemplate ?
			generateInitialMapping(destinationSchema) :
			undefined
	} = options ?? {};

	const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: options?.dangerouslyAllowBrowser });
	const userMessage = `${buildMappingPrompt(sourceSchema, destinationSchema, instructions, mappingTemplate)}

Return a JSON object with one property named "mapping". The "mapping" value must be a JSON string containing only the generated mapping object.`;
	const response = await client.messages.create({
		model,
		max_tokens: maxTokens,
		system: systemInstructions,
		messages: [
			{ role: 'user', content: userMessage }
		],
		output_config: {
			effort: reasoningEffort,
			format: {
				type: 'json_schema',
				schema: mappingOutputSchema
			}
		}
	});

	options?.onUsage?.({
		provider: 'anthropic',
		model: response.model,
		inputTokens: response.usage.input_tokens,
		outputTokens: response.usage.output_tokens,
		totalTokens: response.usage.input_tokens + response.usage.output_tokens,
		cacheCreationInputTokens: response.usage.cache_creation_input_tokens,
		cacheReadInputTokens: response.usage.cache_read_input_tokens
	});

	const content = getTextContent(response);
	if (!content)
		throw new Error('Anthropic returned an empty response');

	try {
		let mapping = parseMappingResponse(content);
		if (generateRequiredFields)
			mapping = appendRequiredMappings(mapping, destinationSchema, { replaceEmptyMappings: true });

		return mapping;
	}
	catch (e) {
		throw new Error(`Anthropic returned invalid JSON: ${(e as Error).message}`);
	}
}
