Morphos
=======

[![Version](https://img.shields.io/npm/v/morphos.svg)](https://www.npmjs.com/package/morphos)
[![Coverage](https://coveralls.io/repos/github/snatalenko/morphos/badge.svg?branch=master&v=1.7.1)](https://coveralls.io/github/snatalenko/morphos?branch=master)
[![Downloads](https://img.shields.io/npm/dm/morphos.svg)](https://www.npmjs.com/package/morphos)
[![License](https://img.shields.io/github/license/snatalenko/morphos.svg?v=1.7.1)](https://github.com/snatalenko/morphos)
[![Tests/Audit](https://github.com/snatalenko/morphos/actions/workflows/ci.yml/badge.svg)](https://github.com/snatalenko/morphos/actions)

<p align="center">
  <img src="docs/images/morphos_logo.svg" width="250" />
</p>

## Overview

JSON-to-JSON mapper with user-defined JSON mapping specs, plain JS transformation expressions, and isolated VM execution.

Users define the mapping as JSON, so it can be stored, versioned, generated, or edited from a UI. Unlike many transformation tools, it does not invent a custom expression language: field transforms are plain JavaScript expressions, executed in a restricted VM context for predictable behavior without giving mappings access to the host environment.

Try it in the [interactive playground](https://morphosjs.org/playground/#/bootstrap53).

### Table of Contents

- [Overview](#overview)
  - [Features](#features)
  - [Visual Mapping Editor](#visual-mapping-editor)
  - [JSON Schema Editor](#json-schema-editor)
  - [AI Mapping Generation](#ai-mapping-generation)
  - [Installation](#installation)
  - [Quick Start Example](#quick-start-example)
- [Compatibility](#compatibility)
- [Security](#security)
- [Validating Mapping Specs](#validating-mapping-specs)
- [Mapping Instructions](#mapping-instructions)
  - [Runtime Variables Quick Reference](#runtime-variables-quick-reference)
  - [Objects](#objects)
  - [Arrays](#arrays)
    - [String\[\] from Object\[\]](#string-from-object)
    - [String\[\] from String\[\]](#string-from-string)
  - [Tuple Arrays](#tuple-arrays)
  - [Context Switching](#context-switching)
  - [Conditional Fields](#conditional-fields)
  - [Concatenating Arrays](#concatenating-arrays)
  - [Dynamic Output Keys](#dynamic-output-keys)
- [Extensions](#extensions)
- [Mapper Options](#mapper-options)
- [Upgrading](#upgrading)

### Features

- **JSON-defined** - mappings are JSON documents, so they are easy to store, diff, generate, validate, and edit from a UI.
- **JavaScript-native** - transformations use ordinary JavaScript expressions instead of a custom DSL.
- **Isolated** - expressions run in a separate [V8 Virtual Machine](https://nodejs.org/api/vm.html) context with restricted access to the outside environment.
- **Fast** - mapping instructions are compiled once into a reusable mapper; the repository includes simple and complex throughput benchmarks.
- **Typed** - written in TypeScript with declarations for mappings, schemas, editors, and integrations.
- **Lightweight** - the runtime has no required dependencies; integrations use optional peer dependencies.

### Visual Mapping Editor

Need users to build or maintain mappings in a web app? Use the React mapping editor and save the result as the same JSON mapping spec the runtime executes.

<table>
  <tr>
    <td width="50%" style="border: none">
      <a href="https://morphosjs.org/playground/#/bootstrap53" target="_blank">
        <img src="docs/images/mapping-editor-browser.png" alt="Mapping editor in browser" width="100%" />
      </a>
    </td>
    <td width="50%" style="border: none">
      <img src="docs/images/mapping-editor-code.png" alt="Mapping JSON in code editor" width="100%" />
    </td>
  </tr>
</table>

The editor can suggest source and destination fields from JSON Schemas, lets users choose mapping instructions such as fields, objects, arrays, conditionals, and concatenation, and outputs plain JSON. A typical flow is: users build mappings in a web app, the app saves those JSON specs, and the server executes them later in the isolated runtime.

The UI is available as an optional subpath import and is loaded only when used:

```ts
import { MappingEditor } from 'morphos/react';
```

See [`morphos/react`](src/react/README.md) for the editor API, schema-driven suggestions, change handling, and built-in default/Bootstrap themes.

### JSON Schema Editor

Need users to define the source and destination formats before building mappings? Use the React schema editor to create and maintain JSON Schemas in the same kind of web UI.

```ts
import { SchemaEditor } from 'morphos/react-schema-editor';
```

See [`morphos/react-schema-editor`](src/react-schema-editor/README.md) for installation, usage, and theme customization.

### AI Mapping Generation

When both incoming and outgoing formats are known, OpenAI or Anthropic Claude can generate a first-pass mapping from two JSON Schemas.

This is useful for document-to-document transformations, API payload conversions, imports, exports, and other structured JSON workflows: as long as the source and destination formats are known, the model can infer likely field matches, calculations, object mappings, list mappings, and conditional rules. The generated output is still just a JSON mapping spec, so it can be reviewed in the editor, adjusted, stored, and executed by the same runtime.

The AI helpers are also optional subpath imports:

```ts
import { generateMapping } from 'morphos/openai';
// or
import { generateMapping } from 'morphos/anthropic';
```

See [`morphos/openai`](src/openai/README.md) for schema-based mapping generation and natural-language instructions.
See [`morphos/anthropic`](src/anthropic/README.md) for the same workflow using Anthropic Claude.

### Installation

```sh
npm install morphos
```

Optional React UI packages require React:

```sh
npm install react react-dom
```

AI mapping helpers require the relevant provider SDK:

```sh
npm install openai
# or
npm install @anthropic-ai/sdk
```

### Quick Start Example

```ts
import { createMapper } from 'morphos';

const mapper = createMapper({
  code: 'sku',
  name: 'name.trim()',
  amount: 'Number(unitPrice) * quantity'
});

const result = mapper({
  sku: 'A-1',
  name: '  Widget  ',
  unitPrice: '12.50',
  quantity: 3
});

console.log(result);
// { code: 'A-1', name: 'Widget', amount: 37.5 }
```

## Compatibility

| Capability | Environment |
| --- | --- |
| Mapping runtime | Node.js 16+ |
| Mapping and schema editors | Browser applications using React 18+ |
| OpenAI and Anthropic helpers | Node.js by default; browser use requires explicit SDK opt-in and exposes API credentials |
| Mapping runtime in browsers | Best-effort support; requires a compatible `vm` polyfill |

## Security

Similar mappings can be achieved with plain JavaScript, but this library is designed for a different case: user-controlled mapping templates executed on the server.

Mappings stay simple for non-technical users, while technical users can still use JavaScript expressions.
Instead of `eval`, expressions run in an isolated VM context with built-ins, mapping input, and explicit `extensions` only, which reduces JS injection risk.

`timeout` prevents long-running expressions from blocking the process indefinitely. It has a performance cost, so use it only when executing mappings that cannot be trusted.

## Validating Mapping Specs

Morphos exports its mapping grammar as a JSON Schema Draft 7 document:

```ts
import { mappingSchema } from 'morphos';
```

Use `mappingSchema` with the JSON Schema validator already used by your application before storing or executing
externally created mappings. `createMapper` reports malformed instructions and JavaScript syntax errors during
compilation, but it does not replace full schema validation.

The same schema is available at
[`https://morphosjs.org/schemas/mapping.json`](https://morphosjs.org/schemas/mapping.json) for editors and other
tools. For example, associate files named `*.morphos.json` with it in VS Code workspace settings:

```json
{
  "json.schemas": [
    {
      "fileMatch": ["**/*.morphos.json"],
      "url": "https://morphosjs.org/schemas/mapping.json"
    }
  ]
}
```

The schema provides validation, hover descriptions, property suggestions, and snippets for complete mapping
instructions. Other editors with JSON Schema associations can use the same URL. Prefer an editor association over
adding a `$schema` property to the mapping itself, because mapping keys represent destination fields.

## Mapping Instructions

In mapping JSON, the left side is a key in the resulting object.
The right side is either a string with a valid JS expression or an object with mapping instructions.

```json
{
  "id": "Number(sourceId)",
  "kind": "'order'",
  "customer": {
    "from": "buyer",
    "map": {
      "name": "name.trim()"
    }
  },
  "items": {
    "forEach": "lineItems",
    "map": {
      "code": "sku",
      "amount": "quantity * unitPrice"
    }
  },
  "status": {
    "when": "cancelledAt",
    "then": "'cancelled'",
    "else": "'active'"
  },
  "references": {
    "concat": ["primaryReferences", "secondaryReferences"]
  },
  "${prefix}_${sourceId}": "value"
}
```

Expression strings can read the current source context and use JavaScript built-ins. String literals need inner
quotes, as in `"'order'"`. Instruction objects provide nested object mapping, array iteration, context switching,
conditions, concatenation, tuple arrays, wildcards, and dynamic output keys.

### Runtime Variables Quick Reference

| Variable | Description | Available in |
| --- | --- | --- |
| `$input` | Entire source document passed to the mapper. | All mapping contexts |
| `$record` | Current element in a `forEach` iteration. | `forEach` → `map` |
| `$index` | Current element index in a `forEach` iteration. | `forEach` → `map` |
| `$collection` | Entire source array selected by `forEach`. | `forEach` → `map` |
| `$context` | Object selected by `from`. | `from` → `map` |

### Objects

Mapping of an object with inner properties:

```json
{
  "key": {
    "foo": "-1"
  }
}
```
or

```json
{
  "key": {
    "map": {
      "foo": "-1"
    }
  }
}
```

Both examples above produce the same result (the second one is more verbose, but keeps a consistent format with array mappings):

```json
{
  "key": {
    "foo": -1
  }
}
```

Use `"*"` as a value to copy the current source object or array into one destination field:

```json
{
  "key": "*"
}
```

Use `"*": "*"` inside an object mapping to copy all current source fields/elements into the current
destination object or array before applying explicit mappings:

```json
{
  "*": "*",
  "normalizedName": "name.trim()"
}
```

If the current context is an array, numeric destination keys override array positions:

```json
{
  "*": "*",
  "1": "$context[1] + 10"
}
```

### Arrays

Assume we have input with an array of objects and need to produce one output object per element. In such cases, the `"forEach": "", "map": {}` construction can be used:

```json
{
  "inputArray": [{
    "arrayInnerProperty": "value1"
  }, {
    "arrayInnerProperty": "value2"
  }]
}
```

```json
{
  "key": {
    "forEach": "inputArray",
    "map": {
      "foo": "arrayInnerProperty"
    }
  }
}
```

Result: 

```json
{
  "key": [
    {
      "foo": "value1"
    },
    {
      "foo": "value2"
    }
  ]
}
```

In this mapping, the execution context shifts to each input object, so inner properties can be referenced directly as `arrayInnerProperty` instead of `inputArray[index].arrayInnerProperty`.

Inside `forEach` mappings, `$record`, `$index`, `$collection`, and `$input` are also available.
More on that in [Context Switching](#context-switching).


#### String[] from Object[]

If the array should contain plain values instead of objects, use `"*"` on the left side instead of a key name:

```json
{
  "key": {
    "forEach": "inputArray",
    "map": {
      "*": "arrayInnerProperty"
    }
  }
}
```

Produces:

```json
{
  "key": [
    "value1",
    "value2"
  ]
}
```

#### String[] from String[]

Arrays with simple values can be mapped the same way, and the current iterated element is available as `$record`:

```json
{
  "inputValues": [1, 2, 3]
}
```

```json
{
  "forEach": "inputValues",
  "map": {
    "*": "$record * 2"
  }
}
```

Result:

```json
[2, 4, 6]
```

### Tuple Arrays

If the array should have a predefined set of elements, each element can be mapped by index:

```json
{
  "key": {
    "0": {
      "foo": "\"text1\""
    },
    "2": "1000"
  }
}
```

Result:

```json
{
  "key": [
    {
      "foo": "text1"
    },
    null,
    1000
  ]
}
```



### Context Switching

When arrays are mapped with the `"forEach": "", "map": {}` statement, the execution context automatically switches to the objects selected by `forEach` ([see above](#arrays)). A similar technique is useful when many properties need to be mapped from an object outside the current context. In that case, use the `"from": "", "map": {}` statement.



Down in the source tree:

```json
{
  "key": {
    "from": "field.innerArray[0].innerObject",
    "map": {
      "foo": "nestedProperty"
    }
  }
}
```

Or up in the source document:

```json
{
  "key": {
    "from": "$input.rootLevelProperty",
    "map": {
      "foo": "nestedProperty"
    }
  }
}
```

Inside `from` mappings, you can still reference root-level fields through `$input`.

You can also preserve the selected context while adding mapped fields:

```json
{
  "from": "BUYER",
  "map": {
    "rawData": "*",
    "mappedName": "NAME"
  }
}
```

Or copy the selected context into the current output object and override selected fields:

```json
{
  "from": "BUYER",
  "map": {
    "*": "*",
    "mappedName": "NAME"
  }
}
```

Runtime variables:

- `$record` - current element of the array being iterated with `forEach`
- `$index` - index of the current array element
- `$collection` - entire collection of the elements being iterated
- `$input` - entire document passed as mapping input

Combined example (`forEach` + root reference):

```json
{
  "forEach": "LINE_ITEMS",
  "map": {
    "lineNo": "$index + 1",
    "sourceId": "$input.id",
    "raw": "$record"
  }
}
```

### Conditional Fields

Use `"when"` / `"then"` to include a field only when a condition is truthy:

```json
{
  "shipment": {
    "id": "shipment.asnNumber",
    "billOfLading": {
      "when": "shipment.billOfLadingNumber",
      "then": "shipment.billOfLadingNumber"
    }
  }
}
```

When the condition is false and no `"else"` is provided, the field is omitted.
Use `"else"` when a fallback value should be emitted:

```json
{
  "status": {
    "when": "cancelledAt",
    "then": "'cancelled'",
    "else": "'active'"
  }
}
```

### Concatenating Arrays

Use `"concat"` to build arrays from multiple mapping branches. Omitted conditional
branches are skipped, and array branch results are flattened:

```json
{
  "bizTransactionList": {
    "concat": [
      {
        "when": "shipment.purchaseOrderNumber",
        "then": {
          "type": "'po'",
          "bizTransaction": "shipment.purchaseOrderNumber"
        }
      },
      {
        "when": "shipment.asnNumber",
        "then": {
          "type": "'desadv'",
          "bizTransaction": "shipment.asnNumber"
        }
      }
    ]
  }
}
```

### Dynamic Output Keys

You can build output property names dynamically with template-based keys on the left side.
This works in regular mappings, `forEach` mappings, and `from` mappings.

```json
{
  "${prefix}_${id}": "value"
}
```

For input:

```json
{
  "prefix": "item",
  "id": 7,
  "value": "abc"
}
```

Output:

```json
{
  "item_7": "abc"
}
```

To keep `${...}` as a literal key (without interpolation), escape it with a leading backslash:

```json
{
  "\\${prefix}_${id}": "value"
}
```

## Extensions

Use `extensions` to pass helper functions and lookup data into mapping expressions:

```ts
const mapper = createMapper({
  code: 'catalog[itemId]',
  normalizedName: 'normalize(name)'
}, {
  extensions: {
    catalog: { A1: 'SKU-001' },
    normalize: (s: string) => s.trim().toUpperCase()
  }
});
```

Extension keys are available as globals in expressions.

If an extension key conflicts with an input field name, mapper throws an error.

## Mapper Options

`createMapper(mapping, options)` accepts:

| Option | Description |
| --- | --- |
| `extensions` | Helper functions, lookup tables, and other explicit values exposed to mapping expressions. |
| `logger` | Receives the generated script through `trace` and blocked-access warnings through `warn`. |
| `timeout` | Maximum execution time per document in milliseconds. Disabled by default because it adds overhead. |

The mapping is compiled when `createMapper` is called. Invalid instructions or expression syntax fail at that point;
errors raised while transforming a document are propagated by the returned mapper.

To see these instructions combined in complete, editable mappings, open the
[interactive playground](https://morphosjs.org/playground/#/bootstrap53).

## Upgrading

### From 1.x to 2.x

Mapper input must now be JSON-serializable. If your input already contains only JSON-compatible values, no changes are needed.

If input used complex values like `Date` or `BigInt`, convert them to primitives before passing them to the mapper, such as timestamps, ISO strings, or strings.
