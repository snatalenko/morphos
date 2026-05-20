export { default as createMapper } from './createMapper.ts';
export * from './utils/index.ts';
export type * from './mappingTypes.ts';
export type * from './JsonSchema.ts';

// @ts-ignore
import * as schema from '../schemas/mapping.json';
export { schema as mappingSchema };
