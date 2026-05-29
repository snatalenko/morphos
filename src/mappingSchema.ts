// Re-exports the mapping schema from its source of truth, schemas/mapping.json.
//
// At dev/test time (ts-jest, Vite) the JSON is resolved natively, so this module
// works as-is. The published build REPLACES this module's compiled output in
// dist/ with an inlined object literal (see scripts/gen-schema.mjs), so library
// clients never receive a JSON-module import — which would otherwise require
// import attributes in native ESM and behave inconsistently across CJS/ESM.

// @ts-ignore - schemas/ lives outside rootDir; resolved at dev/test time only.
import * as mappingSchema from '../schemas/mapping.json';

export { mappingSchema };
export default mappingSchema;
