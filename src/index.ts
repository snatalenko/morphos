export { default as createMapper } from './createMapper.ts';
export { default as mappingForSchema } from './mappingForSchema.ts';
export { default as sampleForSchema } from './sampleForSchema.ts';
export * from './shared/index.ts';
export type * from './mappingTypes.ts';
export type { JsonSchema } from './JsonSchema.ts';

// @ts-ignore
import * as schema from '../schemas/mapping.json';
export { schema as mappingSchema };
