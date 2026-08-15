import { useContext } from 'react';
import { ComponentsContext } from './ComponentsContext.ts';
import { LabelsContext } from './LabelsContext.ts';
import {
	WILDCARD_KEY,
	convertEntryValueForSchema,
	schemaType,
	getItemsSchema,
	getTupleItemSchema,
	findSourceFields,
	resolveSourcePath,
	createEntryValue,
	enumOptionsForSchema,
	typesSuggestible,
	convertSuggestionForType,
	preferNameMatches,
	arrayContextSuggestions,
	mergeSourceSuggestions,
	parentContextSuggestions,
	type EntryValue
} from './utils/index.ts';
import type {
	FieldOption,
	MappingEditorComponents,
	JsonSchema,
	SourceFieldMatch
} from './types.ts';
import { EntriesEditor } from './EntriesEditor.tsx';

function renderExpressionInput(
	C: MappingEditorComponents,
	value: string,
	onChange: (next: string) => void,
	suggestions: SourceFieldMatch[],
	placeholder: string,
	forceSuggested = false,
	defaultAdvanced?: boolean,
	enumOptions: FieldOption[] = []
) {
	if (suggestions.length > 0 || forceSuggested || enumOptions.length > 0) {
		const sourceOptions: FieldOption[] = suggestions.map(s => ({
			value: s.path,
			label: s.label,
			group: s.path === ''
				? undefined
				: s.scope === 'parent'
				? 'parentField'
				: s.scope === 'internal' || s.path.startsWith('$')
					? 'internal'
					: 'field'
		}));
		const options: FieldOption[] = [...enumOptions, ...sourceOptions];
		return (
			<C.SuggestedValueInput
				value={value}
				onChange={onChange}
				options={options}
				placeholder={placeholder}
				defaultAdvanced={defaultAdvanced}
			/>
		);
	}

	return (
		<C.ValueInput
			value={value}
			onChange={onChange}
			placeholder={placeholder}
		/>
	);
}

function ConditionalBranch({
	label,
	value,
	onChange,
	onRemove,
	schema,
	sourceSchema,
	sourceSuggestions
}: {
	label: string;
	value: EntryValue;
	onChange: (next: EntryValue) => void;
	onRemove?: () => void;
	schema?: JsonSchema;
	sourceSchema?: JsonSchema;
	sourceSuggestions?: SourceFieldMatch[];
}) {
	const C = useContext(ComponentsContext);
	const isSection = value.kind !== 'expr';

	const keyInput = <C.RowLabel label={label} />;
	const typeSelector = (
		<C.TypeSelector
			kind={value.kind}
			onChange={to => onChange(convertEntryValueForSchema(value, to, schema))}
		/>
	);
	const remove = onRemove ? <C.RemoveButton onClick={onRemove} /> : null;

	if (!isSection) {
		return (
			<C.Row
				keyInput={keyInput}
				typeSelector={typeSelector}
				value={
					<ValueView
						name=""
						value={value}
						onChange={onChange}
						schema={schema}
						sourceSchema={sourceSchema}
						sourceSuggestions={sourceSuggestions}
						part="full"
					/>
				}
				reorder={null}
				remove={remove}
			/>
		);
	}

	return (
		<C.SectionRow
			keyInput={keyInput}
			typeSelector={typeSelector}
			value={
				<ValueView
					name=""
					value={value}
					onChange={onChange}
					schema={schema}
					sourceSchema={sourceSchema}
					sourceSuggestions={sourceSuggestions}
					part="control"
				/>
			}
			section={
				<ValueView
					name=""
					value={value}
					onChange={onChange}
					schema={schema}
					sourceSchema={sourceSchema}
					sourceSuggestions={sourceSuggestions}
					part="body"
				/>
			}
			reorder={null}
			remove={remove}
		/>
	);
}

function ConcatItemView({
	index,
	value,
	onChange,
	onRemove,
	canMoveUp,
	canMoveDown,
	onMoveUp,
	onMoveDown,
	schema,
	sourceSchema,
	sourceSuggestions
}: {
	index: number;
	value: EntryValue;
	onChange: (next: EntryValue) => void;
	onRemove: () => void;
	canMoveUp: boolean;
	canMoveDown: boolean;
	onMoveUp: () => void;
	onMoveDown: () => void;
	schema?: JsonSchema;
	sourceSchema?: JsonSchema;
	sourceSuggestions?: SourceFieldMatch[];
}) {
	const C = useContext(ComponentsContext);
	const labels = useContext(LabelsContext);
	const isSection = value.kind !== 'expr';

	const keyInput = <C.RowLabel label={`${labels.concatItem} ${index + 1}`} />;
	const typeSelector = (
		<C.TypeSelector
			kind={value.kind}
			onChange={to => onChange(convertEntryValueForSchema(value, to, schema))}
		/>
	);
	const reorder = (
		<C.Reorder
			canMoveUp={canMoveUp}
			canMoveDown={canMoveDown}
			onMoveUp={onMoveUp}
			onMoveDown={onMoveDown}
		/>
	);
	const remove = <C.RemoveButton onClick={onRemove} />;

	if (!isSection) {
		return (
			<C.Row
				keyInput={keyInput}
				typeSelector={typeSelector}
				value={
					<ValueView
						name=""
						value={value}
						onChange={onChange}
						schema={schema}
						sourceSchema={sourceSchema}
						sourceSuggestions={sourceSuggestions}
						part="full"
					/>
				}
				reorder={reorder}
				remove={remove}
			/>
		);
	}

	return (
		<C.SectionRow
			keyInput={keyInput}
			typeSelector={typeSelector}
			value={
				<ValueView
					name=""
					value={value}
					onChange={onChange}
					schema={schema}
					sourceSchema={sourceSchema}
					sourceSuggestions={sourceSuggestions}
					part="control"
				/>
			}
			section={
				<ValueView
					name=""
					value={value}
					onChange={onChange}
					schema={schema}
					sourceSchema={sourceSchema}
					sourceSuggestions={sourceSuggestions}
					part="body"
				/>
			}
			reorder={reorder}
			remove={remove}
		/>
	);
}

function schemaForConcatItem(
	schema: JsonSchema | undefined,
	value: EntryValue
): JsonSchema | undefined {
	if (schemaType(schema) !== 'array')
		return schema;

	const itemSchema = getItemsSchema(schema) ?? schema;
	if (value.kind === 'array' || value.kind === 'concat' || value.kind === 'tuple')
		return schema;
	if (value.kind === 'conditional') {
		const branchReturnsArray = value.then.kind === 'array'
			|| value.then.kind === 'concat'
			|| value.then.kind === 'tuple'
			|| value.else?.kind === 'array'
			|| value.else?.kind === 'concat'
			|| value.else?.kind === 'tuple';

		return branchReturnsArray ? schema : itemSchema;
	}

	return itemSchema;
}

export function ValueView({
	name,
	value,
	onChange,
	schema,
	sourceSchema,
	sourceSuggestions = [],
	part = 'full'
}: {
	name: string;
	value: EntryValue;
	onChange: (next: EntryValue) => void;
	schema?: JsonSchema;
	sourceSchema?: JsonSchema;
	sourceSuggestions?: SourceFieldMatch[];
	part?: 'full' | 'control' | 'body';
}) {
	const C = useContext(ComponentsContext);
	const labels = useContext(LabelsContext);

	if (value.kind === 'expr') {
		const destType = schemaType(schema);
		const allScalars = sourceSchema
			? [...findSourceFields(sourceSchema, {})].filter(s => {
				const t = schemaType(s.schema);
				if (name === WILDCARD_KEY)
					return typesSuggestible(destType, t);
				if (t === 'object' || t === 'array')
					return false;

				return typesSuggestible(destType, t);
			})
			: [];
		const suggestions = preferNameMatches(
			mergeSourceSuggestions(allScalars, sourceSuggestions),
			sourceSchema,
			name
		).map(s => convertSuggestionForType(s, destType));
		const enumOptions = enumOptionsForSchema(schema);
		const wildcardOptions: FieldOption[] = sourceSchema
			? [{ value: WILDCARD_KEY, label: labels.currentFields, group: 'field' }]
			: [];
		return renderExpressionInput(
			C,
			value.expr,
			expr => onChange({ kind: 'expr', expr }),
			suggestions,
			labels.expressionPlaceholder,
			!!sourceSchema,
			undefined,
			[...wildcardOptions, ...enumOptions]
		);
	}

	if (value.kind === 'array') {
		const itemsSchema = getItemsSchema(schema);
		const forEachSuggestions = preferNameMatches(
			mergeSourceSuggestions(
				[...findSourceFields(sourceSchema, { type: 'array' })],
				sourceSuggestions.filter(s => schemaType(s.schema) === 'array')
			),
			sourceSchema,
			name,
			'array'
		);
		const resolved = resolveSourcePath(sourceSchema, value.forEach);
		const resolvedItems = (resolved && schemaType(resolved) === 'array')
			? getItemsSchema(resolved)
			: undefined;
		const nestedSourceSchema = resolvedItems ?? sourceSchema;
		const nestedSourceSuggestions = resolvedItems
			? [
				...parentContextSuggestions(sourceSchema, sourceSuggestions, value.forEach),
				...arrayContextSuggestions(resolvedItems, resolved)
			]
			: sourceSuggestions;
		const valueInput = renderExpressionInput(
			C,
			value.forEach,
			forEach => onChange({ ...value, forEach }),
			forEachSuggestions,
			labels.expressionPlaceholder,
			!!sourceSchema,
			false
		);
		const body = (
			<EntriesEditor
				entries={value.entries}
				onChange={entries => onChange({ ...value, entries })}
				schema={itemsSchema}
				sourceSchema={nestedSourceSchema}
				sourceSuggestions={nestedSourceSuggestions}
				wildcardCreatesSpread
			/>
		);

		if (part === 'control')
			return valueInput;
		if (part === 'body')
			return <C.Section body={body} />;

		return (
			<C.Section
				header={
					<C.SectionHeader
						label="forEach"
						valueInput={valueInput}
					/>
				}
				body={body}
			/>
		);
	}

	if (value.kind === 'object') {
		const fromSuggestions = preferNameMatches(
			mergeSourceSuggestions(
				[...findSourceFields(sourceSchema, { type: 'object' })],
				sourceSuggestions.filter(s => schemaType(s.schema) === 'object')
			),
			sourceSchema,
			name,
			'object'
		);
		const resolved = resolveSourcePath(sourceSchema, value.from);
		const resolvedFrom = (resolved && schemaType(resolved) === 'object')
			? resolved
			: undefined;
		const nestedSourceSchema = resolvedFrom ?? sourceSchema;
		const nestedSourceSuggestions = resolvedFrom
			? parentContextSuggestions(sourceSchema, sourceSuggestions, value.from)
			: sourceSuggestions;
		const fromWithRoot: SourceFieldMatch[] = [
			{ path: '', schema: {} },
			...fromSuggestions
		];
		const valueInput = renderExpressionInput(
			C,
			value.from,
			from => onChange({ ...value, from }),
			fromWithRoot,
			labels.expressionPlaceholder,
			!!sourceSchema
		);
		const body = (
			<EntriesEditor
				entries={value.entries}
				onChange={entries => onChange({ ...value, entries })}
				schema={schema}
				sourceSchema={nestedSourceSchema}
				sourceSuggestions={nestedSourceSuggestions}
				wildcardCreatesSpread
			/>
		);

		if (part === 'control')
			return valueInput;
		if (part === 'body')
			return <C.Section body={body} />;

		return (
			<C.Section
				header={
					<C.SectionHeader
						label="from"
						valueInput={valueInput}
					/>
				}
				body={body}
			/>
		);
	}

	if (value.kind === 'conditional') {
		const addElse = () => onChange({ ...value, else: { kind: 'expr', expr: '' } });
		const removeElse = () => onChange({ kind: 'conditional', when: value.when, then: value.then });
		const whenSuggestions = mergeSourceSuggestions(
			[...findSourceFields(sourceSchema, {})],
			sourceSuggestions
		).filter(s => {
			const t = schemaType(s.schema);
			return t !== 'object' && t !== 'array';
		});
		const whenMatchesSuggestion = whenSuggestions.some(s => s.path === value.when);
		const valueInput = renderExpressionInput(
			C,
			value.when,
			when => onChange({ ...value, when }),
			whenSuggestions,
			labels.expressionPlaceholder,
			!!sourceSchema,
			value.when === '' || !whenMatchesSuggestion
		);
		const body = (
			<>
				<ConditionalBranch
					label={labels.then}
					value={value.then}
					onChange={thenValue => onChange({ ...value, then: thenValue })}
					schema={schema}
					sourceSchema={sourceSchema}
					sourceSuggestions={sourceSuggestions}
				/>
				{value.else === undefined ? (
					<div className="dm-mapping-conditional-add-else">
						<C.AddElseButton onClick={addElse} />
					</div>
				) : (
					<ConditionalBranch
						label={labels.else}
						value={value.else}
						onChange={elseValue => onChange({ ...value, else: elseValue })}
						onRemove={removeElse}
						schema={schema}
						sourceSchema={sourceSchema}
						sourceSuggestions={sourceSuggestions}
					/>
				)}
			</>
		);

		if (part === 'control')
			return valueInput;
		if (part === 'body')
			return <C.Section body={body} />;

		return (
			<C.Section
				header={
					<C.SectionHeader
						label="when"
						valueInput={valueInput}
					/>
				}
				body={body}
			/>
		);
	}

	if (value.kind === 'concat' || value.kind === 'tuple') {
		const updateItem = (index: number, nextValue: EntryValue) => {
			const next = value.items.slice();
			next[index] = nextValue;
			onChange({ ...value, items: next });
		};
		const removeItem = (index: number) => {
			onChange({ ...value, items: value.items.filter((_, i) => i !== index) });
		};
		const moveItem = (index: number, direction: -1 | 1) => {
			const target = index + direction;
			if (target < 0 || target >= value.items.length)
				return;

			const next = value.items.slice();
			const [moved] = next.splice(index, 1);
			next.splice(target, 0, moved);
			onChange({ ...value, items: next });
		};
		const addItem = () => {
			onChange({ ...value, items: [...value.items, createEntryValue('expr')] });
		};
		const body = (
			<>
				{value.items.map((item, index) => (
					<ConcatItemView
						key={index}
						index={index}
						value={item}
						onChange={nextValue => updateItem(index, nextValue)}
						onRemove={() => removeItem(index)}
						canMoveUp={index > 0}
						canMoveDown={index < value.items.length - 1}
						onMoveUp={() => moveItem(index, -1)}
						onMoveDown={() => moveItem(index, 1)}
						schema={
							value.kind === 'tuple'
								? getTupleItemSchema(schema, index)
								: schemaForConcatItem(schema, item)
						}
						sourceSchema={sourceSchema}
						sourceSuggestions={sourceSuggestions}
					/>
				))}
				<C.AddItemButton onClick={addItem} />
			</>
		);

		if (part === 'control')
			return null;
		return <C.Section body={body} />;
	}

	throw new Error(`Unknown mapping value kind: ${JSON.stringify(value)}`);
}
