export { default as createMapper } from './createMapper.ts';
export { default as mappingForSchema } from './mappingForSchema.ts';
export { default as sampleForSchema } from './sampleForSchema.ts';
export type * from './mappingTypes.ts';
export type { MappingSchema } from './MappingSchema.ts';

// @ts-ignore
import * as schema from '../schemas/mapping.json';
export { schema as mappingSchema };
