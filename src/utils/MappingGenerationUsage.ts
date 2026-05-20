export type MappingGenerationUsage = {
	provider: 'openai' | 'anthropic';
	model: string;
	inputTokens?: number;
	outputTokens?: number;
	totalTokens?: number;
	reasoningTokens?: number;
	cacheCreationInputTokens?: number | null;
	cacheReadInputTokens?: number | null;
};
