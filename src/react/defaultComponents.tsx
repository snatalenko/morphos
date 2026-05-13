import { useContext, useState, type ComponentType } from 'react';
import { LabelsContext } from './LabelsContext.ts';
import type {
	ContainerProps,
	RowProps,
	SectionRowProps,
	KeyInputProps,
	KeyLabelProps,
	SuggestedKeyInputProps,
	ValueInputProps,
	SuggestedValueInputProps,
	RemoveButtonProps,
	ReorderProps,
	AddBarProps,
	AddElseButtonProps,
	SchemaAddBarProps,
	SectionProps,
	SectionHeaderProps,
	TypeSelectorProps,
	MappingEditorComponents,
	AddKind
} from './types.ts';

export const DefaultContainer: ComponentType<ContainerProps> = ({ children }) => (
	<div className="dm-mapping-entries">{children}</div>
);

export const DefaultRow: ComponentType<RowProps> = ({ keyInput, typeSelector, value, remove, reorder }) => (
	<div className="dm-mapping-row">
		{keyInput}
		{typeSelector}
		{value}
		<span className="dm-mapping-actions">
			{reorder}
			{remove}
		</span>
	</div>
);

export const DefaultSectionRow: ComponentType<SectionRowProps> = ({ keyInput, typeSelector, section, remove, reorder }) => (
	<div className="dm-mapping-row dm-mapping-row-section">
		<div className="dm-mapping-row-header">
			{keyInput}
			{typeSelector}
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

export const DefaultKeyLabel: ComponentType<KeyLabelProps> = ({ name, schema, required }) => {
	const labels = useContext(LabelsContext);
	return (
		<label className="dm-mapping-key-label" title={schema.description}>
			{name}
			{required && <span className="dm-mapping-required" aria-label={labels.required}> *</span>}
		</label>
	);
};

const KEY_ADVANCED_SENTINEL = '__dm_key_advanced__';

export const DefaultSuggestedKeyInput: ComponentType<SuggestedKeyInputProps> = ({
	value,
	onChange,
	available,
	placeholder
}) => {
	const labels = useContext(LabelsContext);
	const matched = value === '' || available.some(f => f.name === value);
	const [advanced, setAdvanced] = useState(!matched);

	if (advanced) {
		return (
			<span className="dm-mapping-key-advanced">
				<input
					className="dm-mapping-key"
					value={value}
					onChange={e => onChange(e.target.value)}
					placeholder={placeholder}
				/>
				{available.length > 0 && (
					<button
						type="button"
						className="dm-mapping-key-back"
						onClick={() => setAdvanced(false)}
						aria-label={labels.useSchemaFields}
						title={labels.useSchemaFields}
					>
						{labels.useSuggestionsSymbol}
					</button>
				)}
			</span>
		);
	}

	return (
		<select
			className="dm-mapping-key"
			value={matched ? value : ''}
			onChange={e => {
				const v = e.target.value;
				if (v === KEY_ADVANCED_SENTINEL) {
					setAdvanced(true);
					return;
				}
				onChange(v);
			}}
		>
			<option value="" disabled>{labels.selectPlaceholder}</option>
			{available.map(f => (
				<option key={f.name} value={f.name}>
					{f.name}{f.required ? ' *' : ''}
				</option>
			))}
			<option value={KEY_ADVANCED_SENTINEL}>{labels.advanced}</option>
		</select>
	);
};

export const DefaultValueInput: ComponentType<ValueInputProps> = ({ value, onChange, placeholder }) => (
	<input
		className="dm-mapping-value"
		value={value}
		onChange={e => onChange(e.target.value)}
		placeholder={placeholder}
	/>
);

const ADVANCED_SENTINEL = '__dm_advanced__';

export const DefaultSuggestedValueInput: ComponentType<SuggestedValueInputProps> = ({
	value,
	onChange,
	placeholder,
	emptyLabel,
	defaultAdvanced,
	suggestions
}) => {
	const labels = useContext(LabelsContext);
	const isMatched = value === '' || suggestions.some(s => s.path === value);
	const [advanced, setAdvanced] = useState(!!defaultAdvanced || !isMatched);

	if (advanced) {
		return (
			<span className="dm-mapping-suggested-advanced">
				<input
					className="dm-mapping-value"
					value={value}
					onChange={e => onChange(e.target.value)}
					placeholder={placeholder}
				/>
				{suggestions.length > 0 && (
					<button
						type="button"
						className="dm-mapping-suggested-back"
						onClick={() => setAdvanced(false)}
						aria-label={labels.useSuggestions}
						title={labels.useSuggestions}
					>
						{labels.useSuggestionsSymbol}
					</button>
				)}
			</span>
		);
	}

	return (
		<select
			className="dm-mapping-value"
			value={isMatched ? value : ''}
			onChange={e => {
				const v = e.target.value;
				if (v === ADVANCED_SENTINEL) {
					setAdvanced(true);
					return;
				}
				onChange(v);
			}}
		>
			<option value="">{emptyLabel ?? labels.selectPlaceholder}</option>
			{suggestions.map(s => (
				<option key={s.path} value={s.path}>{s.path}</option>
			))}
			<option value={ADVANCED_SENTINEL}>{labels.advanced}</option>
		</select>
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

export const DefaultAddBar: ComponentType<AddBarProps> = ({ onAdd }) => {
	const labels = useContext(LabelsContext);
	return (
		<div className="dm-mapping-add">
			<button type="button" onClick={() => onAdd('expr')}>{labels.addField}</button>
			<button type="button" onClick={() => onAdd('array')}>{labels.addArray}</button>
			<button type="button" onClick={() => onAdd('object')}>{labels.addObject}</button>
			<button type="button" onClick={() => onAdd('conditional')}>{labels.addConditional}</button>
		</div>
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
		{header}
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
	SuggestedKeyInput: DefaultSuggestedKeyInput,
	ValueInput: DefaultValueInput,
	SuggestedValueInput: DefaultSuggestedValueInput,
	RemoveButton: DefaultRemoveButton,
	Reorder: DefaultReorder,
	TypeSelector: DefaultTypeSelector,
	AddBar: DefaultAddBar,
	AddElseButton: DefaultAddElseButton,
	SchemaAddBar: DefaultSchemaAddBar,
	Section: DefaultSection,
	SectionHeader: DefaultSectionHeader
};
