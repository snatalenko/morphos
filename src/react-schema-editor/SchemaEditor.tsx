import {
	forwardRef,
	useContext,
	useEffect,
	useImperativeHandle,
	useMemo,
	useRef,
	useState
} from 'react';
import { ComponentsContext } from './ComponentsContext.ts';
import { LabelsContext } from './LabelsContext.ts';
import { defaultComponents } from './defaultComponents.tsx';
import { defaultLabels } from './defaultLabels.ts';
import type {
	JsonSchema,
	SchemaCheckboxSettingField,
	SchemaEditorComponents,
	SchemaEditorLabels,
	SchemaProperty,
	SchemaTextareaSettingField,
	SchemaTextSettingField,
	SchemaType,
	TypeSelectorOption
} from './types.ts';

const schemaTypes: SchemaType[] = ['string', 'number', 'integer', 'boolean', 'object', 'array'];

export interface SchemaEditorHandle {
	readonly value: JsonSchema;
}

export interface SchemaEditorProps {
	value?: JsonSchema;
	defaultValue?: JsonSchema;
	onChange?: (next: JsonSchema) => void;
	hideRootElement?: boolean;
	exposeTitle?: boolean;
	exposeDescription?: boolean;
	components?: Partial<SchemaEditorComponents>;
	labels?: Partial<SchemaEditorLabels>;
}

type SchemaSettingKey =
	'title' |
	'description' |
	'format' |
	'minimum' |
	'maximum' |
	'exclusiveMinimum' |
	'exclusiveMaximum' |
	'multipleOf' |
	'minLength' |
	'maxLength' |
	'pattern' |
	'enum' |
	'minItems' |
	'maxItems' |
	'minProperties' |
	'maxProperties';

const numericSettingKeys = new Set<SchemaSettingKey>([
	'minimum',
	'maximum',
	'exclusiveMinimum',
	'exclusiveMaximum',
	'multipleOf',
	'minLength',
	'maxLength',
	'minItems',
	'maxItems',
	'minProperties',
	'maxProperties'
]);

function asSchema(schema: SchemaProperty | undefined): JsonSchema {
	return typeof schema === 'object' && schema !== null && !Array.isArray(schema)
		? schema
		: {};
}

function schemaType(schema: JsonSchema): SchemaType {
	const type = Array.isArray(schema.type) ? schema.type.find(t => t !== 'null') : schema.type;
	if (
		type === 'string' ||
		type === 'number' ||
		type === 'integer' ||
		type === 'boolean' ||
		type === 'object' ||
		type === 'array'
	)
		return type;

	if (schema.properties)
		return 'object';
	if (schema.items)
		return 'array';
	return 'string';
}

function isNullable(schema: JsonSchema): boolean {
	return Array.isArray(schema.type) && schema.type.includes('null');
}

function withNullable(schema: JsonSchema, nullable: boolean): JsonSchema {
	const primary = schemaType(schema);
	return { ...schema, type: nullable ? [primary, 'null'] : primary };
}

function withSchemaType(schema: JsonSchema, type: SchemaType): JsonSchema {
	const nullable = isNullable(schema);
	const next: JsonSchema = {
		...schema,
		type: nullable ? [type, 'null'] : type
	};

	if (type === 'object') {
		next.properties = next.properties ?? {};
		delete next.items;
	}
	else if (type === 'array') {
		next.items = asSchema(next.items as SchemaProperty | undefined);
		delete next.properties;
		delete next.required;
	}
	else {
		delete next.properties;
		delete next.items;
		delete next.required;
	}
	if (type !== 'string')
		delete next.format;

	return next;
}

function setRequired(schema: JsonSchema, name: string, required: boolean): JsonSchema {
	const requiredSet = new Set(schema.required ?? []);
	if (required)
		requiredSet.add(name);
	else
		requiredSet.delete(name);

	const next = { ...schema };
	const requiredList = Array.from(requiredSet);
	if (requiredList.length)
		next.required = requiredList;
	else
		delete next.required;
	return next;
}

function settingsForType(type: SchemaType): SchemaSettingKey[] {
	if (type === 'string')
		return ['title', 'description', 'format', 'minLength', 'maxLength', 'pattern', 'enum'];
	if (type === 'number' || type === 'integer')
		return ['title', 'description', 'minimum', 'maximum', 'exclusiveMinimum', 'exclusiveMaximum', 'multipleOf', 'enum'];
	if (type === 'array')
		return ['title', 'description', 'minItems', 'maxItems'];
	if (type === 'object')
		return ['title', 'description', 'minProperties', 'maxProperties'];
	return ['title', 'description', 'enum'];
}

function settingValue(schema: JsonSchema, key: SchemaSettingKey): string {
	const value = schema[key];
	if (value === undefined)
		return '';
	if (key === 'enum')
		return Array.isArray(value)
			? value.map(v => typeof v === 'string' ? v : JSON.stringify(v)).join(', ')
			: '';
	return String(value);
}

function parseEnumValue(value: string): unknown[] | undefined {
	if (value.trim() === '')
		return undefined;

	return value
		.split(',')
		.map(v => v.trim())
		.filter(Boolean)
		.map(v => {
			try {
				return JSON.parse(v);
			}
			catch {
				return v;
			}
		});
}

function examplesValue(schema: JsonSchema): string {
	return Array.isArray(schema.examples)
		? schema.examples.map(example => typeof example === 'string' ? example : JSON.stringify(example) ?? String(example)).join('\n')
		: '';
}

function parseExamplesValue(value: string): unknown[] | undefined {
	const lines = value
		.split('\n')
		.map(line => line.trim())
		.filter(Boolean);

	if (!lines.length)
		return undefined;

	return lines.map(line => {
		try {
			return JSON.parse(line);
		}
		catch {
			return line;
		}
	});
}

function updateSetting(schema: JsonSchema, key: SchemaSettingKey, value: string): JsonSchema {
	const next = { ...schema };
	const mutableNext = next as Record<SchemaSettingKey, unknown>;
	if (value.trim() === '') {
		delete next[key];
		return next;
	}

	if (key === 'enum') {
		next.enum = parseEnumValue(value);
		return next;
	}

	if (numericSettingKeys.has(key)) {
		if (value === 'true' || value === 'false')
			mutableNext[key] = value === 'true';
		else {
			const numericValue = Number(value);
			if (Number.isFinite(numericValue))
				mutableNext[key] = numericValue;
		}
		return next;
	}

	mutableNext[key] = value;
	return next;
}

function updateExamples(schema: JsonSchema, value: string): JsonSchema {
	const next = { ...schema };
	const examples = parseExamplesValue(value);
	if (examples === undefined)
		delete next.examples;
	else
		next.examples = examples;
	return next;
}

function settingsTextFields(
	schema: JsonSchema,
	type: SchemaType,
	labels: SchemaEditorLabels,
	onChange: (next: JsonSchema) => void
): SchemaTextSettingField[] {
	return settingsForType(type).map(key => ({
		key,
		label: labels[key],
		value: settingValue(schema, key),
		placeholder: key === 'enum' ? 'value1, value2' : undefined,
		onChange: value => onChange(updateSetting(schema, key, value))
	}));
}

function settingsCheckboxFields(
	schema: JsonSchema,
	labels: SchemaEditorLabels,
	onChange: (next: JsonSchema) => void
): SchemaCheckboxSettingField[] {
	return [{
		key: 'nullable',
		label: labels.nullable,
		type: 'checkbox',
		checked: isNullable(schema),
		onChange: checked => onChange(withNullable(schema, checked))
	}];
}

function settingsTextareaFields(
	schema: JsonSchema,
	labels: SchemaEditorLabels,
	onChange: (next: JsonSchema) => void
): SchemaTextareaSettingField[] {
	return [{
		key: 'examples',
		label: labels.examples,
		type: 'textarea',
		value: examplesValue(schema),
		placeholder: 'example 1\nexample 2',
		onChange: value => onChange(updateExamples(schema, value))
	}];
}

function labelForType(type: SchemaType): string {
	return type[0].toUpperCase() + type.slice(1);
}

function labelForFormat(format: string): string {
	return format[0].toUpperCase() + format.slice(1);
}

function typeSelectorOptions(format: string | undefined): TypeSelectorOption[] {
	const options: TypeSelectorOption[] = schemaTypes.map(type => ({
		value: type,
		label: labelForType(type),
		type
	}));
	if (format) {
		options.push({
			value: `format:${format}`,
			label: labelForFormat(format),
			type: 'string',
			format
		});
	}
	return options;
}

function typeSelectorValue(type: SchemaType, format: string | undefined): string {
	return type === 'string' && format ? `format:${format}` : type;
}

interface PropertySlot {
	id: number;
	name?: string;
	value: string;
	focusNameOnMount?: boolean;
}

function rootLabel(labels: SchemaEditorLabels): string {
	return labels.rootElement;
}

function SchemaNodeEditor({
	schema,
	onChange,
	name,
	onNameChange,
	required,
	onRequiredChange,
	onRemove,
	root = false,
	hideSelf = false,
	arrayItem = false,
	exposeTitle = false,
	exposeDescription = false,
	focusNameOnMount = false
}: {
	schema: JsonSchema;
	onChange: (next: JsonSchema) => void;
	name?: string;
	onNameChange?: (next: string) => void;
	required?: boolean;
	onRequiredChange?: (next: boolean) => void;
	onRemove?: () => void;
	root?: boolean;
	hideSelf?: boolean;
	arrayItem?: boolean;
	exposeTitle?: boolean;
	exposeDescription?: boolean;
	focusNameOnMount?: boolean;
}) {
	const C = useContext(ComponentsContext);
	const labels = useContext(LabelsContext);
	const [settingsOpen, setSettingsOpen] = useState(false);
	const [propertySlots, setPropertySlots] = useState<PropertySlot[]>(() => [{ id: 0, value: '' }]);
	const nextPropertySlotIdRef = useRef(1);
	const type = schemaType(schema);

	const updateType = (option: TypeSelectorOption) => {
		const next = withSchemaType(schema, option.type);
		if (option.type === 'string' && option.format)
			next.format = option.format;
		else
			delete next.format;
		onChange(next);
	};

	const createProperty = (slotId: number, value: string): boolean => {
		const propertyName = value.trim();
		if (propertyName === '')
			return false;

		const properties = schema.properties ?? {};
		if (propertyName in properties)
			return false;

		onChange({
			...schema,
			type: 'object',
			properties: {
				...properties,
				[propertyName]: { type: 'string' }
			}
		});
		setPropertySlots(slots => {
			const updated = slots.map(slot => slot.id === slotId ? {
				...slot,
				name: propertyName,
				value: propertyName,
				focusNameOnMount: true
			} : slot);
			if (updated.every(slot => slot.name))
				updated.push({ id: nextPropertySlotIdRef.current++, value: '' });
			return updated;
		});
		return true;
	};

	const renameProperty = (from: string, to: string): boolean => {
		if (to === '' || from === to)
			return false;

		const properties = schema.properties ?? {};
		if (to in properties)
			return false;

		const nextProperties: NonNullable<JsonSchema['properties']> = {};
		for (const [key, value] of Object.entries(properties))
			nextProperties[key === from ? to : key] = value;

		const requiredSet = new Set(schema.required ?? []);
		if (requiredSet.delete(from))
			requiredSet.add(to);

		const next: JsonSchema = {
			...schema,
			properties: nextProperties
		};
		const requiredList = Array.from(requiredSet);
		if (requiredList.length)
			next.required = requiredList;
		else
			delete next.required;
		onChange(next);
		return true;
	};

	const renameSlottedProperty = (slotId: number, from: string, to: string) => {
		if (!renameProperty(from, to))
			return;
		setPropertySlots(slots => slots.map(slot => slot.id === slotId ? {
			...slot,
			name: to,
			value: to,
			focusNameOnMount: false
		} : slot));
	};

	const updateProperty = (propertyName: string, propertySchema: JsonSchema) => {
		onChange({
			...schema,
			properties: {
				...(schema.properties ?? {}),
				[propertyName]: propertySchema
			}
		});
	};

	const removeProperty = (propertyName: string) => {
		const properties = { ...(schema.properties ?? {}) };
		delete properties[propertyName];
		const next = setRequired({ ...schema, properties }, propertyName, false);
		onChange(next);
		setPropertySlots(slots => {
			const updated = slots.filter(slot => slot.name !== propertyName);
			if (updated.every(slot => slot.name))
				updated.push({ id: nextPropertySlotIdRef.current++, value: '' });
			return updated;
		});
	};

	const updateArrayItems = (items: JsonSchema) => {
		onChange({
			...schema,
			type: 'array',
			items
		});
	};

	const baseNameControl = root || arrayItem ? (
		<C.FieldLabel label={root ? rootLabel(labels) : labels.arrayItem} />
	) : (
		<C.TextInput
			value={name ?? ''}
			onChange={onNameChange ?? (() => {})}
			placeholder={labels.propertyName}
			focusOnMount={focusNameOnMount}
		/>
	);
	const titleControl = exposeTitle ? (
		<C.TextInput
			value={schema.title ?? ''}
			onChange={value => onChange(updateSetting(schema, 'title', value))}
			placeholder={labels.title}
		/>
	) : undefined;
	const descriptionControl = exposeDescription ? (
		<C.TextInput
			value={schema.description ?? ''}
			onChange={value => onChange(updateSetting(schema, 'description', value))}
			placeholder={labels.description}
		/>
	) : undefined;

	const slotNames = new Set(propertySlots.map(slot => slot.name).filter((slotName): slotName is string => !!slotName));
	const properties = schema.properties ?? {};

	const nestedContent = type === 'object' ? (
		<>
			{Object.entries(properties).filter(([propertyName]) => !slotNames.has(propertyName)).map(([propertyName, propertySchema]) => (
				<SchemaNodeEditor
					key={propertyName}
					name={propertyName}
					schema={asSchema(propertySchema)}
					onNameChange={next => renameProperty(propertyName, next)}
					onChange={next => updateProperty(propertyName, next)}
					required={(schema.required ?? []).includes(propertyName)}
					onRequiredChange={next => onChange(setRequired(schema, propertyName, next))}
					onRemove={() => removeProperty(propertyName)}
					exposeTitle={exposeTitle}
					exposeDescription={exposeDescription}
				/>
			))}
			{propertySlots.map(slot => slot.name ? (
				properties[slot.name] ? (
					<SchemaNodeEditor
						key={slot.id}
						name={slot.name}
						schema={asSchema(properties[slot.name])}
						onNameChange={next => renameSlottedProperty(slot.id, slot.name ?? '', next)}
						onChange={next => slot.name && updateProperty(slot.name, next)}
						required={(schema.required ?? []).includes(slot.name)}
						onRequiredChange={next => slot.name && onChange(setRequired(schema, slot.name, next))}
						onRemove={() => slot.name && removeProperty(slot.name)}
						exposeTitle={exposeTitle}
						exposeDescription={exposeDescription}
						focusNameOnMount={!!slot.focusNameOnMount}
					/>
				) : null
			) : (
				<C.AddPropertyInput
					key={slot.id}
					value={slot.value}
					onChange={next => {
						if (!createProperty(slot.id, next)) {
							setPropertySlots(slots => slots.map(current => current.id === slot.id ? {
								...current,
								value: next
							} : current));
						}
						else
							return;
					}}
					placeholder={labels.addProperty}
					exposeTitle={exposeTitle}
					exposeDescription={exposeDescription}
				/>
			))}
		</>
	) : type === 'array' ? (
		<>
			<SchemaNodeEditor
				arrayItem
				schema={asSchema(schema.items as SchemaProperty | undefined)}
				onChange={updateArrayItems}
				exposeTitle={exposeTitle}
				exposeDescription={exposeDescription}
			/>
		</>
	) : null;
	const nestedSection = nestedContent ? <C.Section>{nestedContent}</C.Section> : null;

	const section = settingsOpen || nestedSection ? (
		<>
			{settingsOpen ? (
				<C.Section>
					<C.SettingsGroup>
						{(() => {
							const textFields = settingsTextFields(schema, type, labels, onChange);
							return (
								<>
									{textFields.slice(0, 2).map(f => <C.TextFieldSetting key={f.key} field={f} />)}
									{settingsCheckboxFields(schema, labels, onChange).map(f => <C.CheckboxFieldSetting key={f.key} field={f} />)}
									{textFields.slice(2).map(f => <C.TextFieldSetting key={f.key} field={f} />)}
									{settingsTextareaFields(schema, labels, onChange).map(f => <C.TextareaFieldSetting key={f.key} field={f} />)}
								</>
							);
						})()}
					</C.SettingsGroup>
				</C.Section>
			) : null}
			{nestedSection}
		</>
	) : undefined;

	if (hideSelf)
		return <>{nestedContent}</>;

	return (
		<C.Row
			name={baseNameControl}
			title={titleControl}
			description={descriptionControl}
			typeSelector={(
				<C.TypeSelector
					value={typeSelectorValue(type, schema.format)}
					options={typeSelectorOptions(schema.format)}
					onChange={updateType}
				/>
			)}
			requiredToggle={
				root || arrayItem || !onRequiredChange ? null : (
					<C.RequirementControl
						checked={required ?? false}
						onChange={onRequiredChange}
						label={labels.required}
					/>
				)
			}
			settings={(
				<C.SettingsButton
					expanded={settingsOpen}
					onClick={() => setSettingsOpen(open => !open)}
				/>
			)}
			remove={root || arrayItem || !onRemove ? null : <C.RemoveButton onClick={onRemove} />}
			section={section}
		/>
	);
}

const SchemaEditor = forwardRef<SchemaEditorHandle, SchemaEditorProps>(function SchemaEditor(props, ref) {
	const hideRootElement = props.hideRootElement ?? false;
	const [schema, setSchema] = useState<JsonSchema>(() => props.value ?? props.defaultValue ?? { type: 'object' });
	const schemaRef = useRef(schema);
	schemaRef.current = schema;

	useEffect(() => {
		if (props.value !== undefined)
			setSchema(props.value);
	}, [props.value]);

	useImperativeHandle(ref, () => ({
		get value(): JsonSchema {
			return schemaRef.current;
		}
	}), []);

	const mergedComponents = useMemo(
		() => ({ ...defaultComponents, ...props.components }),
		[props.components]
	);
	const mergedLabels = useMemo(
		() => ({ ...defaultLabels, ...props.labels }),
		[props.labels]
	);
	const C = mergedComponents;

	const handleChange = (next: JsonSchema) => {
		setSchema(next);
		if (props.onChange)
			props.onChange(next);
	};

	return (
		<LabelsContext.Provider value={mergedLabels}>
			<ComponentsContext.Provider value={mergedComponents}>
				<div className="dm-schema-editor">
					<C.Container>
						<SchemaNodeEditor
							schema={schema}
							onChange={handleChange}
							root
							hideSelf={hideRootElement}
							exposeTitle={props.exposeTitle ?? false}
							exposeDescription={props.exposeDescription ?? false}
						/>
					</C.Container>
				</div>
			</ComponentsContext.Provider>
		</LabelsContext.Provider>
	);
});

export default SchemaEditor;
