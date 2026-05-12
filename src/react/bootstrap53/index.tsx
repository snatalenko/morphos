import { useContext, useState, type ComponentType } from 'react';
import { LabelsContext } from '../LabelsContext.ts';
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
	SchemaAddBarProps,
	SectionProps,
	SectionHeaderProps,
	TypeSelectorProps,
	MappingEditorComponents,
	AddKind
} from '../types.ts';

export const Container: ComponentType<ContainerProps> = ({ children }) => (
	<div className="dm-bs53-container">{children}</div>
);

export const Row: ComponentType<RowProps> = ({ keyInput, typeSelector, value, remove, reorder }) => (
	<div className="row g-2 mb-2 align-items-start">
		<div className={typeSelector ? 'col-3' : 'col-5'}>{keyInput}</div>
		{typeSelector ? <div className="col-2">{typeSelector}</div> : null}
		<div className="col-5">{value}</div>
		<div className="col-2 d-flex align-items-center justify-content-end gap-1">
			{reorder}
			{remove}
		</div>
	</div>
);

export const SectionRow: ComponentType<SectionRowProps> = ({ keyInput, typeSelector, section, remove, reorder }) => (
	<div className="row g-2 mb-3 align-items-start">
		<div className={typeSelector ? 'col-3' : 'col-5'}>{keyInput}</div>
		{typeSelector ? <div className="col-2">{typeSelector}</div> : null}
		<div className="col-2 offset-5 d-flex align-items-center justify-content-end gap-1">
			{reorder}
			{remove}
		</div>
		<div className="col-12">{section}</div>
	</div>
);

export const KeyInput: ComponentType<KeyInputProps> = ({ value, onChange, placeholder }) => (
	<input
		type="text"
		className="form-control"
		value={value}
		onChange={e => onChange(e.target.value)}
		placeholder={placeholder}
	/>
);

export const KeyLabel: ComponentType<KeyLabelProps> = ({ name, schema, required }) => {
	const labels = useContext(LabelsContext);
	return (
		<label
			className="col-form-label fw-semibold"
			title={schema.description}
			style={{ paddingTop: 7 }}
		>
			{name}
			{required && <span className="text-danger" aria-label={labels.required}> *</span>}
		</label>
	);
};

const BS53_KEY_ADVANCED = '__dm_key_advanced__';

export const SuggestedKeyInput: ComponentType<SuggestedKeyInputProps> = ({
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
			<div className="input-group">
				<input
					type="text"
					className="form-control"
					value={value}
					onChange={e => onChange(e.target.value)}
					placeholder={placeholder}
				/>
				{available.length > 0 && (
					<button
						type="button"
						className="btn btn-outline-secondary"
						onClick={() => setAdvanced(false)}
						aria-label={labels.useSchemaFields}
						title={labels.useSchemaFields}
					>
						{labels.useSuggestionsSymbol}
					</button>
				)}
			</div>
		);
	}

	return (
		<select
			className="form-select"
			value={matched ? value : ''}
			onChange={e => {
				const v = e.target.value;
				if (v === BS53_KEY_ADVANCED) {
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
			<option value={BS53_KEY_ADVANCED}>{labels.advanced}</option>
		</select>
	);
};

export const ValueInput: ComponentType<ValueInputProps> = ({ value, onChange, placeholder }) => (
	<input
		type="text"
		className="form-control font-monospace"
		value={value}
		onChange={e => onChange(e.target.value)}
		placeholder={placeholder}
	/>
);

const BS53_ADVANCED = '__dm_advanced__';

export const SuggestedValueInput: ComponentType<SuggestedValueInputProps> = ({
	value,
	onChange,
	placeholder,
	emptyLabel,
	suggestions
}) => {
	const labels = useContext(LabelsContext);
	const isMatched = value === '' || suggestions.some(s => s.path === value);
	const [advanced, setAdvanced] = useState(!isMatched);

	if (advanced) {
		return (
			<div className="input-group">
				<input
					type="text"
					className="form-control font-monospace"
					value={value}
					onChange={e => onChange(e.target.value)}
					placeholder={placeholder}
				/>
				{suggestions.length > 0 && (
					<button
						type="button"
						className="btn btn-outline-secondary"
						onClick={() => setAdvanced(false)}
						aria-label={labels.useSuggestions}
						title={labels.useSuggestions}
					>
						{labels.useSuggestionsSymbol}
					</button>
				)}
			</div>
		);
	}

	return (
		<select
			className="form-select"
			value={isMatched ? value : ''}
			onChange={e => {
				const v = e.target.value;
				if (v === BS53_ADVANCED) {
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
			<option value={BS53_ADVANCED}>{labels.advanced}</option>
		</select>
	);
};

export const RemoveButton: ComponentType<RemoveButtonProps> = ({ onClick }) => {
	const labels = useContext(LabelsContext);
	return (
		<button
			type="button"
			className="btn btn-sm btn-outline-danger"
			onClick={onClick}
			aria-label={labels.removeField}
		>
			<span aria-hidden="true">{labels.removeSymbol}</span>
		</button>
	);
};

export const TypeSelector: ComponentType<TypeSelectorProps> = ({ kind, onChange }) => {
	const labels = useContext(LabelsContext);
	return (
		<select
			className="form-select"
			value={kind}
			onChange={e => onChange(e.target.value as AddKind)}
			aria-label={labels.mappingType}
		>
			<option value="expr">{labels.field}</option>
			<option value="array">{labels.array}</option>
			<option value="object">{labels.object}</option>
		</select>
	);
};

export const Reorder: ComponentType<ReorderProps> = ({ canMoveUp, canMoveDown, onMoveUp, onMoveDown }) => {
	const labels = useContext(LabelsContext);
	return (
		<div className="btn-group btn-group-sm" role="group" aria-label={labels.reorder}>
			<button
				type="button"
				className="btn btn-outline-secondary"
				onClick={onMoveUp}
				disabled={!canMoveUp}
				aria-label={labels.moveUp}
			>
				{labels.moveUpSymbol}
			</button>
			<button
				type="button"
				className="btn btn-outline-secondary"
				onClick={onMoveDown}
				disabled={!canMoveDown}
				aria-label={labels.moveDown}
			>
				{labels.moveDownSymbol}
			</button>
		</div>
	);
};

export const SchemaAddBar: ComponentType<SchemaAddBarProps> = ({ available, onAdd }) => {
	const labels = useContext(LabelsContext);
	if (available.length === 0)
		return null;

	return (
		<select
			className="form-select mt-2"
			style={{ maxWidth: 320 }}
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

export const AddBar: ComponentType<AddBarProps> = ({ onAdd }) => {
	const labels = useContext(LabelsContext);
	return (
		<div className="d-flex justify-content-end mt-2">
			<div className="btn-group" role="group">
				<button type="button" className="btn btn-outline-primary" onClick={() => onAdd('expr')}>
					{labels.addField}
				</button>
				<button type="button" className="btn btn-outline-primary" onClick={() => onAdd('array')}>
					{labels.addArray}
				</button>
				<button type="button" className="btn btn-outline-primary" onClick={() => onAdd('object')}>
					{labels.addObject}
				</button>
			</div>
		</div>
	);
};

export const Section: ComponentType<SectionProps> = ({ header, body }) => (
	<div className="card">
		<div className="card-header py-2">{header}</div>
		<div className="card-body">{body}</div>
	</div>
);

export const SectionHeader: ComponentType<SectionHeaderProps> = ({ label, valueInput }) => {
	const labels = useContext(LabelsContext);
	const displayLabel = label === 'forEach' ? labels.forEach : labels.from;
	return (
		<div className="d-flex align-items-center gap-2">
			<code className="px-2 py-1 bg-body-secondary rounded text-nowrap">{displayLabel}</code>
			<div className="flex-fill">{valueInput}</div>
		</div>
	);
};

const components: Partial<MappingEditorComponents> = {
	Container,
	Row,
	SectionRow,
	KeyInput,
	KeyLabel,
	SuggestedKeyInput,
	ValueInput,
	SuggestedValueInput,
	RemoveButton,
	Reorder,
	TypeSelector,
	AddBar,
	SchemaAddBar,
	Section,
	SectionHeader
};

export default components;
