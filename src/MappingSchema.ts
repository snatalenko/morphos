export interface MappingSchema {
	type?: string | string[];
	properties?: {
		[name: string]: MappingSchema | boolean
	};
	items?: MappingSchema | boolean | Array<MappingSchema | boolean>;
	required?: string[];
	enum?: unknown[];
	title?: string;
	description?: string;
}
