import { useContext, useEffect, useRef, useState, type ComponentType } from 'react';
import { LabelsContext } from './LabelsContext.ts';
// eslint-disable-next-line import/no-cycle
import { ComponentsContext } from './ComponentsContext.ts';
import { renderFieldOptions } from './renderFieldOptions.tsx';
import type {
	ContainerProps,
	RowProps,
	SectionRowProps,
	KeyInputProps,
	KeyLabelProps,
	RowLabelProps,
	SuggestedKeyInputProps,
	ValueInputProps,
	SuggestedValueInputProps,
	RemoveButtonProps,
	InputResetButtonProps,
	ReorderProps,
	AddElseButtonProps,
	AddItemButtonProps,
	SchemaAddBarProps,
	SectionProps,
	SectionHeaderProps,
	TypeSelectorProps,
	MappingEditorComponents,
	AddKind,
	FieldOption
} from './types.ts';

export const DefaultContainer: ComponentType<ContainerProps> = ({ children }) => (
	<div className="dm-mapping-entries">{children}</div>
);

export const DefaultRow: ComponentType<RowProps> = ({ keyInput, typeSelector, value, remove, reorder }) => (
	<div className="dm-mapping-row">
		{keyInput}
		{typeSelector}
		{value}
		{reorder || remove ? (
			<span className="dm-mapping-actions">
				{reorder}
				{remove}
			</span>
		) : null}
	</div>
);

export const DefaultSectionRow: ComponentType<SectionRowProps> = ({
	keyInput,
	typeSelector,
	value,
	section,
	remove,
	reorder
}) => (
	<div className="dm-mapping-row dm-mapping-row-section">
		<div className="dm-mapping-row-header">
			{keyInput}
			{typeSelector}
			{value}
			<span className="dm-mapping-actions">
				{reorder}
				{remove}
			</span>
		</div>
		{section}
	</div>
);

export const DefaultKeyInput: ComponentType<KeyInputProps> = ({ value, onChange, placeholder }) => (
	<input
		className="dm-mapping-key"
		value={value}
		onChange={e => onChange(e.target.value)}
		placeholder={placeholder}
	/>
);

export const DefaultRowLabel: ComponentType<RowLabelProps> = ({ label }) => (
	<label className="dm-mapping-label">{label}</label>
);

export const DefaultKeyLabel: ComponentType<KeyLabelProps> = ({ name, schema, required }) => {
	const labels = useContext(LabelsContext);
	return (
		<label className="dm-mapping-key-label" title={schema.description}>
			{name}
			{required && <span className="dm-mapping-required" aria-label={labels.required}> *</span>}
		</label>
	);
};

const DM_ADVANCED_SENTINEL = '__dm_advanced__';

export const DefaultInputResetButton: ComponentType<InputResetButtonProps> = ({ onClick }) => {
	const labels = useContext(LabelsContext);
	return (
		<button
			type="button"
			className="dm-mapping-key-back"
			onClick={onClick}
			aria-label={labels.useSchemaFields}
			title={labels.useSchemaFields}
		>
			{labels.useSuggestionsSymbol}
		</button>
	);
};

function DefaultSuggestedInput({
	value,
	onChange,
	options,
	inputClassName,
	wrapperClassName,
	placeholder,
	defaultAdvanced,
	focusOnAdvancedMount,
	onAdvanced,
	advancedLabel
}: {
	value: string;
	onChange: (next: string) => void;
	options: FieldOption[];
	inputClassName: string;
	wrapperClassName: string;
	placeholder?: string;
	defaultAdvanced?: boolean;
	focusOnAdvancedMount?: boolean;
	onAdvanced?: () => void;
	advancedLabel?: string;
}) {
	const C = useContext(ComponentsContext);
	const labels = useContext(LabelsContext);
	const hasOptions = options.length > 0;
	const matched = value === '' || options.some(o => o.value === value);
	const [advanced, setAdvanced] = useState(!!defaultAdvanced || !matched);
	const inputRef = useRef<HTMLInputElement>(null);
	const focusAdvancedRef = useRef(!!focusOnAdvancedMount && (!!defaultAdvanced || !matched));

	useEffect(() => {
		if (advanced && focusAdvancedRef.current) {
			inputRef.current?.focus();
			inputRef.current?.select();
		}
		focusAdvancedRef.current = false;
	}, [advanced]);

	if (!hasOptions) {
		return (
			<input
				ref={inputRef}
				className={inputClassName}
				value={value}
				onChange={e => onChange(e.target.value)}
				placeholder={placeholder}
			/>
		);
	}

	if (advanced) {
		return (
			<span className={wrapperClassName}>
				<input
					ref={inputRef}
					className={inputClassName}
					value={value}
					onChange={e => onChange(e.target.value)}
					placeholder={placeholder}
				/>
				<C.InputResetButton onClick={() => setAdvanced(false)} />
			</span>
		);
	}

	return (
		<select
			className={inputClassName}
			value={matched ? value : ''}
			onChange={e => {
				const v = e.target.value;
				if (v === DM_ADVANCED_SENTINEL) {
					focusAdvancedRef.current = true;
					setAdvanced(true);
					if (onAdvanced)
						onAdvanced();
					return;
				}
				onChange(v);
			}}
		>
			{!options.some(o => o.value === '') && (
				<option value="" disabled>{labels.selectPlaceholder}</option>
			)}
			{renderFieldOptions(options, labels)}
			<option value={DM_ADVANCED_SENTINEL}>{advancedLabel ?? labels.advanced}</option>
		</select>
	);
}

export const DefaultSuggestedKeyInput: ComponentType<SuggestedKeyInputProps> = ({
	value,
	onChange,
	options,
	placeholder,
	defaultAdvanced,
	focusOnAdvancedMount,
	onAdvanced
}) => (
	<DefaultSuggestedInput
		value={value}
		onChange={onChange}
		options={options}
		inputClassName="dm-mapping-key"
		wrapperClassName="dm-mapping-key-advanced"
		placeholder={placeholder}
		defaultAdvanced={defaultAdvanced}
		focusOnAdvancedMount={focusOnAdvancedMount}
		onAdvanced={onAdvanced}
	/>
);

export const DefaultValueInput: ComponentType<ValueInputProps> = ({ value, onChange, placeholder }) => (
	<input
		className="dm-mapping-value"
		value={value}
		onChange={e => onChange(e.target.value)}
		placeholder={placeholder}
	/>
);

export const DefaultSuggestedValueInput: ComponentType<SuggestedValueInputProps> = ({
	value,
	onChange,
	options,
	placeholder,
	defaultAdvanced
}) => {
	const labels = useContext(LabelsContext);
	return (
		<DefaultSuggestedInput
			value={value}
			onChange={onChange}
			options={options}
			inputClassName="dm-mapping-value"
			wrapperClassName="dm-mapping-suggested-advanced"
			placeholder={placeholder}
			defaultAdvanced={defaultAdvanced}
			advancedLabel={labels.jsExpression}
		/>
	);
};

export const DefaultRemoveButton: ComponentType<RemoveButtonProps> = ({ onClick }) => {
	const labels = useContext(LabelsContext);
	return (
		<button type="button" className="dm-mapping-remove" onClick={onClick} aria-label={labels.removeField}>
			{labels.removeSymbol}
		</button>
	);
};

export const DefaultReorder: ComponentType<ReorderProps> = ({ canMoveUp, canMoveDown, onMoveUp, onMoveDown }) => {
	const labels = useContext(LabelsContext);
	return (
		<span className="dm-mapping-reorder" aria-label={labels.reorder}>
			<button
				type="button"
				className="dm-mapping-move-up"
				onClick={onMoveUp}
				disabled={!canMoveUp}
				aria-label={labels.moveUp}
			>
				{labels.moveUpSymbol}
			</button>
			<button
				type="button"
				className="dm-mapping-move-down"
				onClick={onMoveDown}
				disabled={!canMoveDown}
				aria-label={labels.moveDown}
			>
				{labels.moveDownSymbol}
			</button>
		</span>
	);
};

export const DefaultAddElseButton: ComponentType<AddElseButtonProps> = ({ onClick }) => {
	const labels = useContext(LabelsContext);
	return (
		<button type="button" className="dm-mapping-add-else" onClick={onClick}>
			{labels.addElse}
		</button>
	);
};

export const DefaultAddItemButton: ComponentType<AddItemButtonProps> = ({ onClick }) => {
	const labels = useContext(LabelsContext);
	return (
		<button type="button" className="dm-mapping-add-item" onClick={onClick}>
			{labels.addItem}
		</button>
	);
};

export const DefaultSchemaAddBar: ComponentType<SchemaAddBarProps> = ({ available, onAdd }) => {
	const labels = useContext(LabelsContext);
	if (available.length === 0)
		return null;

	return (
		<select
			className="dm-mapping-schema-add"
			value=""
			onChange={e => {
				const v = e.target.value;
				if (v)
					onAdd(v);
			}}
		>
			<option value="">{labels.addSchemaField}</option>
			{available.map(f => (
				<option key={f.name} value={f.name}>
					{f.name}{f.required ? ' *' : ''}
				</option>
			))}
		</select>
	);
};

export const DefaultSection: ComponentType<SectionProps> = ({ header, body }) => (
	<div className="dm-mapping-section">
		{header ?? null}
		<div
			className="dm-mapping-section-body"
			style={{
				marginTop: '0.35rem',
				marginLeft: '0',
				padding: '0.5rem 0 0.5rem 0.75rem',
				borderLeft: '2px solid #e3e7ec'
			}}
		>
			{body}
		</div>
	</div>
);

export const DefaultTypeSelector: ComponentType<TypeSelectorProps> = ({ kind, onChange }) => {
	const labels = useContext(LabelsContext);
	return (
		<select
			className="dm-mapping-type"
			value={kind}
			onChange={e => onChange(e.target.value as AddKind)}
			aria-label={labels.mappingType}
		>
			<option value="expr">{labels.field}</option>
			<option value="array">{labels.array}</option>
			<option value="object">{labels.object}</option>
			<option value="conditional">{labels.conditional}</option>
			<option value="concat">{labels.concat}</option>
			<option value="tuple">{labels.tuple}</option>
		</select>
	);
};

export const DefaultSectionHeader: ComponentType<SectionHeaderProps> = ({ label, valueInput }) => {
	const labels = useContext(LabelsContext);
	const displayLabel = label === 'forEach'
		? labels.forEach
		: label === 'when'
			? labels.when
			: labels.from;
	return (
		<div className="dm-mapping-section-header">
			<label className="dm-mapping-label">{displayLabel}</label>
			{valueInput}
		</div>
	);
};

export const defaultComponents: MappingEditorComponents = {
	Container: DefaultContainer,
	Row: DefaultRow,
	SectionRow: DefaultSectionRow,
	KeyInput: DefaultKeyInput,
	KeyLabel: DefaultKeyLabel,
	RowLabel: DefaultRowLabel,
	SuggestedKeyInput: DefaultSuggestedKeyInput,
	ValueInput: DefaultValueInput,
	SuggestedValueInput: DefaultSuggestedValueInput,
	RemoveButton: DefaultRemoveButton,
	InputResetButton: DefaultInputResetButton,
	Reorder: DefaultReorder,
	TypeSelector: DefaultTypeSelector,
	AddElseButton: DefaultAddElseButton,
	AddItemButton: DefaultAddItemButton,
	SchemaAddBar: DefaultSchemaAddBar,
	Section: DefaultSection,
	SectionHeader: DefaultSectionHeader
};
