# declarative-mapper/react

A React-based visual editor for `declarative-mapper` mapping objects. Provides an editable
form whose value can be read back as a `RootMapping`, with optional **destination** and
**source** JSON Schemas to drive field suggestions, type inference, and dropdowns.

This entry is published as a subpath of `declarative-mapper`. It is **not** loaded unless
imported, so `declarative-mapper` consumers who don't need the editor pay no React cost.

## Installation

`react` is declared as an optional peer dependency. Install it (and `react-dom`) in your app:

```bash
npm install react react-dom
```

## Quick start

```tsx
import { useState } from 'react';
import { MappingEditor } from 'declarative-mapper/react';
import type { RootMapping } from 'declarative-mapper';

function Example() {
    const [snapshot, setSnapshot] = useState<RootMapping>({});

    return (
        <>
            <MappingEditor
                onChange={setSnapshot}
                defaultValue={{
                    code: 'UPC.substring(0, 5)',
                    qty: 'QTY',
                    lineItems: {
                        forEach: 'LINE_ITEMS',
                        map: { id: 'ID', qty: 'QTY' }
                    }
                }}
            />
            <pre>{JSON.stringify(snapshot, null, 2)}</pre>
        </>
    );
}
```

## Props

| Prop           | Type                                  | Description                                                                                              |
|----------------|---------------------------------------|----------------------------------------------------------------------------------------------------------|
| `value`        | `RootMapping`                         | Controlled value. Reading from `ref.current.value` reflects current internal state on demand.            |
| `defaultValue` | `RootMapping`                         | Uncontrolled initial value. Used once on mount.                                                          |
| `onChange`     | `(next: RootMapping) => void`          | Called after each edit with the complete current mapping object.                                         |
| `schema`       | `MappingSchema`                       | Destination JSON Schema. Drives field labels, type-aware add bar, and required indicators.               |
| `sourceSchema` | `MappingSchema`                       | Source JSON Schema. Drives dropdown suggestions for value expressions, `forEach`, and `from`.            |
| `components`   | `Partial<MappingEditorComponents>`    | Override any of the built-in UI parts (see [Theming](#theming)).                                          |
| `labels`       | `Partial<MappingEditorLabels>`        | Override any of the built-in user-visible strings (see [Localization](#localization)).                  |

The component exposes a ref handle:

```ts
interface MappingEditorHandle {
    readonly value: RootMapping;
}
```

Use `onChange` for live previews, validation, or controlled state:

```tsx
const [mapping, setMapping] = useState<RootMapping>({});

<MappingEditor value={mapping} onChange={setMapping} />
```

## Destination schema

Passing `schema` makes the editor list fields from the schema as drop-down options, infer the
mapping kind from each field's `type`, and show required-field markers.

```tsx
<MappingEditor
    schema={{
        type: 'object',
        required: ['code', 'amount'],
        properties: {
            code: { type: 'string' },
            qty: { type: 'number' },
            lineItems: {
                type: 'array',
                items: { type: 'object', properties: { id: { type: 'string' } } }
            }
        }
    }}
/>
```

Keys not present in the schema render as free-form text inputs ("custom" fields). Schema-bound
keys render as a dropdown with an `Advanced…` escape hatch — the same dropdown/input/reset
pattern used for values. When a mapping level has no sibling fields, it also exposes a
`Current value` option, which writes the wildcard key `'*'` and maps the value of the current
mapping level instead of one named property.

## Source schema

Passing `sourceSchema` populates dropdowns for value expressions, `forEach`, `from`, and
conditional `when` expressions:

* **Field values** suggest scalar paths from the source schema (e.g. `QTY`, `CUSTOMER.NAME`).
  Name matches (`qty` ≈ `QTY`, `lineItems` ≈ `LINE_ITEMS`) are sorted to the top.
* **`forEach`** suggests array paths.
* **`from`** suggests object paths.
* **`when`** suggests scalar paths that can be used as truthy/falsy conditions.

Inside a List mapping, value dropdowns also include array-context expressions:
`$index`, `$record`, and `$collection`.

Each dropdown has an `Advanced…` option that switches to a free-form expression input, and
a back button that returns to the dropdown without losing the typed value.

When descending into a List or Object section, the editor resolves the parent
`forEach`/`from` expression against the source schema and uses the matching sub-schema for
nested suggestions (so inside `lineItems.forEach = LINE_ITEMS`, the `id` field suggests `ID`).

## Theming

The editor is composed from small components. Override any of them via the `components`
prop. Each override receives the props for its slot and is responsible for rendering it.

```tsx
import { MappingEditor, type KeyInputProps } from 'declarative-mapper/react';

const MyKeyInput = ({ value, onChange, placeholder }: KeyInputProps) => (
    <input className="my-key" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
);

<MappingEditor components={{ KeyInput: MyKeyInput }} />
```

Built-in defaults render bare HTML with `dm-mapping-*` class hooks for styling.

### Overridable components

| Name                  | Purpose                                                                                  |
|-----------------------|------------------------------------------------------------------------------------------|
| `Container`           | Wraps the list of rows in a level (root or nested).                                      |
| `Row`                 | Renders a simple key→expression row. Receives `keyInput`, `typeSelector`, `value`, `reorder`, `remove` slots. |
| `SectionRow`          | Renders a key→section row (List / Object / Conditional). Same slots, `section` instead of `value`. |
| `KeyInput`            | Free-form key text input.                                                                |
| `KeyLabel`            | Read-only key display when bound to a schema field.                                      |
| `SuggestedKeyInput`   | Schema-aware key dropdown + Advanced… fallback (used when destination schema is set).    |
| `ValueInput`          | Free-form JS-expression text input.                                                      |
| `SuggestedValueInput` | Source-schema-aware value dropdown + Advanced… fallback.                                  |
| `RemoveButton`        | Per-row delete button.                                                                   |
| `Reorder`             | Up/down buttons for moving a row within its parent list.                                 |
| `TypeSelector`        | Per-row mapping-kind selector (Value / List / Object / Conditional).                     |
| `AddBar`              | Add controls (Value / List / Object / Conditional).                                      |
| `AddElseButton`       | Adds the optional fallback branch inside a Conditional mapping.                           |
| `SchemaAddBar`        | Legacy schema-fields dropdown (no longer rendered by default; kept for compatibility).    |
| `Section`             | Wraps a section's `header` + `body`.                                                     |
| `SectionHeader`       | Renders the `forEach`, optional `from`, or `when` label next to its value input.          |

### Built-in themes

Pre-built component sets are published as separate subpath exports — each comes with the
classes for its target Bootstrap version:

```tsx
import bootstrap34 from 'declarative-mapper/react/bootstrap34';
import bootstrap53 from 'declarative-mapper/react/bootstrap53';

<MappingEditor components={bootstrap34} />
<MappingEditor components={bootstrap53} />
```

The themes only emit class names — you bring the CSS yourself (e.g. via the relevant
Bootstrap CSS file or CDN link). Individual components are also re-exported from each theme
in case you want to mix-and-match:

```tsx
import { Row, SuggestedValueInput } from 'declarative-mapper/react/bootstrap53';
```

### Default components

If you want to extend the default rendering rather than replace it, import the
`defaultComponents` map and spread it:

```tsx
import { defaultComponents, MappingEditor } from 'declarative-mapper/react';

<MappingEditor
    components={{
        ...defaultComponents,
        AddBar: MyFancyAddBar
    }}
/>
```

## Localization

Every user-visible string lives in the `MappingEditorLabels` dictionary. Pass `labels` to
override any subset — the rest fall back to defaults.

```tsx
<MappingEditor
    labels={{
        field: 'Feld',
        array: 'Liste',
        object: 'Objekt',
        conditional: 'Wenn / sonst',
        addField: '+ Feld',
        addArray: '+ Liste',
        addObject: '+ Objekt',
        addConditional: '+ Wenn / sonst',
        selectPlaceholder: '— auswählen —',
        advanced: 'Erweitert…',
        useSuggestions: 'Vorschläge verwenden',
        useSchemaFields: 'Schemafelder verwenden',
        currentValue: 'Aktueller Wert',
        forEach: 'fürJedes',
        from: 'von',
        when: 'wenn',
        then: 'dann',
        else: 'sonst',
        addElse: '+ sonst',
        keyPlaceholder: 'Schlüssel',
        expressionPlaceholder: 'JS-Ausdruck',
        removeField: 'Feld entfernen',
        moveUp: 'Nach oben',
        moveDown: 'Nach unten'
    }}
/>
```

### Available label keys

| Key                       | Default              | Where used                                       |
|---------------------------|----------------------|--------------------------------------------------|
| `field`                   | `Value`              | Type-selector option for `expr` kind.            |
| `array`                   | `List`               | Type-selector option for `array` kind.           |
| `object`                  | `Object`             | Type-selector option for `object` kind.          |
| `conditional`             | `Conditional`        | Type-selector option for conditional kind.       |
| `addField`                | `+ Value`            | Add-bar button.                                  |
| `addArray`                | `+ List`             | Add-bar button.                                  |
| `addObject`               | `+ Object`           | Add-bar button.                                  |
| `addConditional`          | `+ Conditional`      | Add-bar button.                                  |
| `addSchemaField`          | `+ Add field…`       | Legacy `SchemaAddBar` placeholder.               |
| `selectPlaceholder`       | `— select —`         | Placeholder or empty option in dropdowns.        |
| `advanced`                | `Advanced…`          | Switch-to-input option in dropdowns.             |
| `useSuggestions`          | `Use suggestions`    | Back-button aria/title on value inputs.          |
| `useSchemaFields`         | `Use schema fields`  | Back-button aria/title on key inputs.            |
| `currentValue`             | `Current value`       | Key dropdown option for wildcard `'*'` mapping.  |
| `forEach`                 | `forEach`            | Array section header label.                      |
| `from`                    | `from`               | Object section optional source selector label.   |
| `when`                    | `when`               | Conditional section header label.                |
| `then`                    | `then`               | Conditional truthy branch label.                 |
| `else`                    | `else`               | Conditional fallback branch label.               |
| `addElse`                 | `+ else`             | Add fallback branch button.                      |
| `keyPlaceholder`          | `key`                | Free-form key input placeholder.                 |
| `expressionPlaceholder`   | `js expression`      | Value input placeholder.                         |
| `removeField`             | `Remove field`       | Remove-button aria-label.                        |
| `moveUp`                  | `Move up`            | Up-button aria-label.                            |
| `moveDown`                | `Move down`          | Down-button aria-label.                          |
| `moveUpSymbol`            | `↑`                  | Visible glyph in up-button (default + BS5).      |
| `moveDownSymbol`          | `↓`                  | Visible glyph in down-button (default + BS5).    |
| `removeSymbol`            | `×`                  | Visible glyph in remove-button (default + BS5).  |
| `useSuggestionsSymbol`    | `↩`                  | Visible glyph in back-to-suggestions button.     |
| `reorder`                 | `Reorder`            | Reorder group aria-label.                        |
| `mappingType`             | `Mapping type`       | Type-selector aria-label.                        |
| `required`                | `required`           | Required-marker aria-label.                      |

Bootstrap 3 keeps glyphicons (`glyphicon-chevron-up`, etc.) for icon-font reasons — the
`*Symbol` labels apply to the default and Bootstrap 5 themes.

### Default labels

Import `defaultLabels` if you need to spread-and-override or build a localized object:

```tsx
import { defaultLabels, MappingEditor } from 'declarative-mapper/react';

const ru = { ...defaultLabels, field: 'Поле', array: 'Массив', /* … */ };
<MappingEditor labels={ru} />
```

## Custom components reading labels

When writing your own components, read labels from the exported `LabelsContext`:

```tsx
import { useContext } from 'react';
import { LabelsContext, type AddBarProps } from 'declarative-mapper/react';

const MyAddBar = ({ onAdd }: AddBarProps) => {
    const labels = useContext(LabelsContext);
    return (
        <button onClick={() => onAdd('expr')}>{labels.addField}</button>
    );
};
```

## Limitations

* Tuple-form `PropertiesMap` (`ValueMap[]`) inputs are currently ignored on load.
* Schema features beyond `type`, `properties`, `items`, `required`, `title`, `description`
  are not interpreted (no `$ref`, `oneOf`, `additionalProperties`, etc.).
