# morphos/openai

## Overview

OpenAI-powered mapping generator for `morphos`. Given a source schema, a
destination schema, and an OpenAI API token, returns a `RootMapping` JSON that
transforms data of the source shape into data of the destination shape.

This entry is published as a subpath of `morphos`. It is **not** loaded unless
imported, so consumers of the main package pay nothing for the OpenAI SDK.

## Installation

`openai` is declared as an optional peer dependency. Install it in your app:

```bash
npm install openai
```

## Usage

```ts
import { generateMapping } from 'morphos/openai';
import type { MappingSchema } from 'morphos';

const sourceSchema: MappingSchema = {
    type: 'object',
    properties: {
        UPC: { type: 'string' },
        QTY: { type: 'number' },
        PRICE: { type: 'number' },
        CUSTOMER: {
            type: 'object',
            properties: {
                NAME: { type: 'string' },
                EMAIL: { type: 'string' }
            }
        }
    }
};

const destinationSchema: MappingSchema = {
    type: 'object',
    properties: {
        code: { type: 'string' },
        qty: { type: 'number' },
        amount: { type: 'number' },
        customer: {
            type: 'object',
            properties: {
                name: { type: 'string' },
                email: { type: 'string' }
            }
        }
    }
};

const mapping = await generateMapping({
    sourceSchema,
    destinationSchema,
    apiKey: process.env.OPENAI_API_KEY!,
    options: {
        instructions: 'Truncate UPC to 5 characters for the destination code field.',
        model: 'gpt-5.5',
        generateRequiredFields: true
    }
});

console.log(mapping);
// {
//   code: 'UPC.substring(0, 5)',
//   qty: 'QTY',
//   amount: 'QTY * PRICE',
//   customer: { from: 'CUSTOMER', map: { name: 'NAME', email: 'EMAIL' } }
// }
```

The returned value is a `RootMapping` that can be fed directly into `createMapper` from
the main package, or used as the initial `value` of the `MappingEditor`.

## Options

| Option              | Type            | Description                                                                                |
|---------------------|-----------------|--------------------------------------------------------------------------------------------|
| `sourceSchema`      | `MappingSchema` | JSON-schema-like description of input data. Required.                                       |
| `destinationSchema` | `MappingSchema` | JSON-schema-like description of desired output. Required.                                   |
| `apiKey`            | `string`        | OpenAI API key. Required.                                                                   |
| `options.instructions` | `string`     | Optional free-form text appended to the user prompt (e.g. naming conventions, edge cases). |
| `options.model`     | `string`        | Optional OpenAI model identifier. Defaults to `gpt-5.5`.                                   |
| `options.dangerouslyAllowBrowser` | `boolean` | Passed to the OpenAI client for browser usage. Defaults to `false`.               |
| `options.generateRequiredFields` | `boolean` | Add placeholders for unmapped required destination fields after generation. Defaults to `true`. |

When `generateRequiredFields` is enabled, unmapped required scalar fields are set to `""`, required objects are expanded as `{ "map": { ... } }`, and required arrays are expanded as `{ "forEach": "", "map": { ... } }`. The generated `map` contains only required child fields.

## How it works

The function instantiates an `OpenAI` client with the supplied API key and calls
`chat.completions.create` with:

* A system prompt describing the `morphos` mapping format (expression strings,
  `forEach`/`from` wrappers, plain nested objects, type-conversion conventions).
* A user message that includes both schemas as pretty-printed JSON and your `instructions`
  if provided.
* `response_format: { type: 'json_schema', json_schema: { schema, strict: false } }`
  where `schema` is the project's own [`schemas/mapping.json`](../../schemas/mapping.json)
  — the canonical grammar for any valid mapping (expression string, `forEach` iterator,
  `from` context switch, plain nested object, tuple, etc.). It is passed as a guidance
  schema (`strict: false`) rather than enforced, because the mapping grammar uses
  `oneOf`/`patternProperties` constructs that aren't part of OpenAI's strict subset, and
  because the same destination can legitimately be expressed in multiple shapes (e.g. an
  array destination can be mapped via `forEach`/`map` or via a single JS expression that
  returns the array).

The response is parsed and returned. If the model returns an empty content or invalid
JSON, the function throws.

## Notes

* The returned mapping is **not** validated against the `morphos` mapping
  schema. Pass it through `createMapper` (which performs its own validation) or wrap the
  call in your own validator if strict guarantees are required.
* For browser usage, instantiate your own `OpenAI` client with
  `dangerouslyAllowBrowser: true` and use the OpenAI SDK directly — this helper assumes
  Node-like environments by default. Exposing API tokens in browser code is generally a
  bad idea.
* The system prompt biases the model toward the simplest valid mapping (single expression
  string when possible, `forEach` for arrays, `from` for context switches). You can
  override behavior with `instructions`.
