export interface JsonSchema {
	type?: string | string[];
	properties?: {
		[name: string]: JsonSchema | boolean
	};
	items?: JsonSchema | boolean | Array<JsonSchema | boolean>;
	required?: string[];
	enum?: unknown[];
	format?: string;
	examples?: unknown[];
	title?: string;
	description?: string;
	minimum?: number;
	maximum?: number;
	exclusiveMinimum?: number | boolean;
	exclusiveMaximum?: number | boolean;
	multipleOf?: number;
	minLength?: number;
	maxLength?: number;
	pattern?: string;
	minItems?: number;
	maxItems?: number;
	minProperties?: number;
	maxProperties?: number;
}
