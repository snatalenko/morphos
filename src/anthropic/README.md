# morphos/anthropic

## Overview

Claude-powered mapping generator for `morphos`. Given a source schema, a
destination schema, and an Anthropic API token, returns a `RootMapping` JSON that
transforms data of the source shape into data of the destination shape.

This entry is published as a subpath of `morphos`. It is **not** loaded unless
imported, so consumers of the main package pay nothing for the Anthropic SDK.

## Installation

`@anthropic-ai/sdk` is declared as an optional peer dependency. Install it in
your app:

```bash
npm install @anthropic-ai/sdk
```

## Usage

```ts
import { generateMapping } from 'morphos/anthropic';
import type { JsonSchema } from 'morphos';

const sourceSchema: JsonSchema = {
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

const destinationSchema: JsonSchema = {
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

const mapping = await generateMapping(
    sourceSchema,
    destinationSchema,
    process.env.ANTHROPIC_API_KEY!,
    {
        instructions: 'Truncate UPC to 5 characters for the destination code field.',
        model: 'claude-opus-4-7',
        generateMappingTemplate: true,
        generateRequiredFields: true
    }
);

console.log(mapping);
// {
//   code: 'UPC.substring(0, 5)',
//   qty: 'QTY',
//   amount: 'QTY * PRICE',
//   customer: { from: 'CUSTOMER', map: { name: 'NAME', email: 'EMAIL' } }
// }
```

The returned value is a `RootMapping` that can be fed directly into
`createMapper` from the main package, or used as the initial `value` of the
`MappingEditor`.

## Options

| Option              | Type         | Description                                                                                |
|---------------------|--------------|--------------------------------------------------------------------------------------------|
| `sourceSchema`      | `JsonSchema` | JSON-schema-like description of input data. Required.                                      |
| `destinationSchema` | `JsonSchema` | JSON-schema-like description of desired output. Required.                                  |
| `apiKey`            | `string`     | Anthropic API key. Required.                                                               |
| `options.instructions` | `string`  | Optional free-form text appended to the user prompt (e.g. naming conventions, edge cases). |
| `options.mappingTemplate` | `RootMapping` | Optional mapping shape for the model to preserve and fill when confident.           |
| `options.generateMappingTemplate` | `boolean` | Generate a mapping template from the destination schema before calling Claude. Defaults to `false`. |
| `options.model`     | `string`     | Optional Claude model identifier. Defaults to `claude-sonnet-4-6`.                         |
| `options.maxTokens` | `number`     | Maximum output tokens for the Claude response. Defaults to `4096`.                         |
| `options.dangerouslyAllowBrowser` | `boolean` | Passed to the Anthropic client for browser usage. Defaults to `false`.           |
| `options.generateRequiredFields` | `boolean` | Add placeholders for unmapped required destination fields after generation. Defaults to `false`. |

When `mappingTemplate` is provided, it is sent with the schemas as the preferred
output shape. When `generateMappingTemplate` is enabled and `mappingTemplate` is
not provided, a template is generated from the destination schema first. Blank
values are treated as fields the model may fill when it finds a confident source
mapping, literal, or JavaScript expression.

When `generateRequiredFields` is enabled, unmapped required scalar fields are set
to `""`, required objects are expanded as `{ "map": { ... } }`, homogeneous
arrays are expanded as `{ "forEach": "", "map": { ... } }`, and tuple arrays are
expanded as positional object mappings such as `{ "0": "", "1": { "map": { ... } } }`.
Generated nested maps contain only required child fields.

## How it works

The function instantiates an `Anthropic` client with the supplied API key and
calls `messages.create` with:

* The same system prompt used by the OpenAI helper, describing the `morphos`
  mapping format.
* A user message that includes both schemas, your `mappingTemplate`, and your
  `instructions` if provided.
* Claude structured output configured as a JSON object.

The response is parsed and returned. If Claude returns an empty content block or
invalid JSON, the function throws.

## Notes

* The returned mapping is **not** validated against the `morphos` mapping schema.
  Pass it through `createMapper` or your own validator if strict guarantees are
  required.
* For browser usage, pass `dangerouslyAllowBrowser: true` to the helper only when
  you understand the risk of exposing API keys in browser code.
* The system prompt biases the model toward the simplest valid mapping. You can
  override behavior with `instructions`.
