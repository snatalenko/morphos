export interface MappingSchema {
	type?: string | string[];
	properties?: {
		[name: string]: MappingSchema | boolean
	};
	items?: MappingSchema | boolean | Array<MappingSchema | boolean>;
	required?: string[];
	title?: string;
	description?: string;
}
