# `morphos/react-schema-editor`

## Overview

React editor for building and maintaining JSON Schemas in a web UI.

The editor follows the same component/label override pattern as `morphos/react`, including optional Bootstrap component packs.

## Installation

`react` is declared as an optional peer dependency. Install it (and `react-dom`) in your app:

```bash
npm install react react-dom
```

Install `morphos` if it is not already part of the app:

```bash
npm install morphos
```

## Quick start

```tsx
import { useState } from 'react';
import { SchemaEditor } from 'morphos/react-schema-editor';
import type { JsonSchema } from 'morphos/react-schema-editor';

const initialSchema: JsonSchema = {
	type: 'object',
	properties: {
		invoiceNumber: { type: 'string' },
		totalAmount: { type: 'number' },
		billTo: {
			type: 'object',
			properties: {
				name: { type: 'string' }
			}
		},
		lines: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					sku: { type: 'string' },
					quantity: { type: 'number' }
				}
			}
		}
	},
	required: ['invoiceNumber']
};

function Example() {
	const [schema, setSchema] = useState<JsonSchema>(initialSchema);

	return (
		<>
			<SchemaEditor value={schema} onChange={setSchema} />
			<pre>{JSON.stringify(schema, null, 2)}</pre>
		</>
	);
}
```

## Themes

Built-in defaults render bare HTML with `dm-schema-editor-*` class hooks for styling.
Bootstrap themes are available as separate subpath exports:

```tsx
import bootstrap34 from 'morphos/react-schema-editor/bootstrap34';
import bootstrap53 from 'morphos/react-schema-editor/bootstrap53';

<SchemaEditor components={bootstrap53} />
```

The Bootstrap themes only emit class names. Load the corresponding Bootstrap CSS in your app.
Individual components are also exported from each theme if you want to replace only one slot:

```tsx
import { Row, TextFieldSetting } from 'morphos/react-schema-editor/bootstrap53';
```

## API

```tsx
<SchemaEditor
	value={schema}
	onChange={setSchema}
	hideRootElement
	exposeTitle
	exposeDescription
	components={components}
	labels={labels}
/>
```

| Prop           | Type                                  | Description                                                              |
|----------------|---------------------------------------|--------------------------------------------------------------------------|
| `value`        | `JsonSchema`                          | Controlled schema value.                                                 |
| `defaultValue` | `JsonSchema`                          | Uncontrolled initial schema. Used once on mount.                         |
| `onChange`     | `(next: JsonSchema) => void`           | Called after each edit with the complete current schema.                 |
| `hideRootElement` | `boolean`                          | Hide the root row and render only the root object's properties or array item editor. |
| `exposeTitle`  | `boolean`                             | Show each field's `title` in the main field row.                         |
| `exposeDescription` | `boolean`                       | Show each field's `description` in the main field row.                   |
| `components`   | `Partial<SchemaEditorComponents>`     | Override any built-in UI slot.                                           |
| `labels`       | `Partial<SchemaEditorLabels>`         | Override any user-visible strings.                                       |

Use `hideRootElement` when the parent UI already shows the root context. The root schema still comes from `value`
or `defaultValue`, including its `type`, `properties`, and `items`.

```tsx
<SchemaEditor
	value={schema}
	onChange={setSchema}
	hideRootElement
/>
```

The component exposes a ref handle:

```ts
interface SchemaEditorHandle {
	readonly value: JsonSchema;
}
```

The editor supports object properties, required flags, nullable fields, scalar types, nested objects, arrays, and array item schemas.
String schemas can also define `format`; when present, the type dropdown adds the capitalized format as a separate option.
Selecting the standard `String` option clears the field's format.
Schema `examples` are edited as a multi-line value where each line becomes one example.

Field settings are rendered through separate theme components:

| Component | Purpose |
| --- | --- |
| `SettingsGroup` | Wraps the expanded settings area. |
| `TextFieldSetting` | Renders text-based settings such as title, description, min/max, pattern, and enum. |
| `CheckboxFieldSetting` | Renders boolean settings such as nullable. |
| `TextareaFieldSetting` | Renders multi-line settings such as examples. |

Override these components to replace the inline settings block with a custom panel, popover, or modal while keeping the editor state handling unchanged.
