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
	AddElseButtonProps,
	SchemaAddBarProps,
	SectionProps,
	SectionHeaderProps,
	TypeSelectorProps,
	MappingEditorComponents,
	AddKind
} from '../types.ts';

export const Container: ComponentType<ContainerProps> = ({ children }) => (
	<div className="dm-bs34-container">{children}</div>
);

export const Row: ComponentType<RowProps> = ({ keyInput, typeSelector, value, remove, reorder }) => (
	<div className="row" style={{ marginBottom: 8 }}>
		<div className={typeSelector ? 'col-xs-3' : 'col-xs-5'}>{keyInput}</div>
		{typeSelector ? <div className="col-xs-2">{typeSelector}</div> : null}
		<div className="col-xs-5">{value}</div>
		<div className="col-xs-2" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
			{reorder}
			{remove}
		</div>
	</div>
);

export const SectionRow: ComponentType<SectionRowProps> = ({
	keyInput,
	typeSelector,
	value,
	section,
	remove,
	reorder
}) => (
	<div className="row" style={{ marginBottom: 12 }}>
		<div className={typeSelector ? 'col-xs-3' : 'col-xs-5'} style={{ marginBottom: 8 }}>{keyInput}</div>
		{typeSelector ? <div className="col-xs-2" style={{ marginBottom: 8 }}>{typeSelector}</div> : null}
		<div className="col-xs-5" style={{ marginBottom: 8 }}>{value}</div>
		<div className="col-xs-2" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
			{reorder}
			{remove}
		</div>
		<div className="col-xs-12">{section}</div>
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
		<p
			className="form-control-static"
			title={schema.description}
			style={{ margin: 0, paddingTop: 7 }}
		>
			<strong>{name}</strong>
			{required && <span className="text-danger" aria-label={labels.required}> *</span>}
		</p>
	);
};

const BS34_KEY_ADVANCED = '__dm_key_advanced__';

export const SuggestedKeyInput: ComponentType<SuggestedKeyInputProps> = ({
	value,
	onChange,
	available,
	placeholder,
	allowCurrentValue
}) => {
	const labels = useContext(LabelsContext);
	const matched = value === ''
		|| available.some(f => f.name === value)
		|| (allowCurrentValue && value === '*');
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
				{(available.length > 0 || allowCurrentValue) && (
					<span className="input-group-btn">
						<button
							type="button"
							className="btn btn-default"
							onClick={() => setAdvanced(false)}
							aria-label={labels.useSchemaFields}
							title={labels.useSchemaFields}
						>
							<span className="glyphicon glyphicon-list" aria-hidden="true" />
						</button>
					</span>
				)}
			</div>
		);
	}

	return (
		<select
			className="form-control"
			value={matched ? value : ''}
			onChange={e => {
				const v = e.target.value;
				if (v === BS34_KEY_ADVANCED) {
					setAdvanced(true);
					return;
				}
				onChange(v);
			}}
		>
			<option value="" disabled>{labels.selectPlaceholder}</option>
			{allowCurrentValue && <option value="*">{labels.currentValue}</option>}
			{available.map(f => (
				<option key={f.name} value={f.name}>
					{f.name}{f.required ? ' *' : ''}
				</option>
			))}
			<option value={BS34_KEY_ADVANCED}>{labels.advanced}</option>
		</select>
	);
};

export const ValueInput: ComponentType<ValueInputProps> = ({ value, onChange, placeholder }) => (
	<input
		type="text"
		className="form-control"
		value={value}
		onChange={e => onChange(e.target.value)}
		placeholder={placeholder}
	/>
);

const BS34_ADVANCED = '__dm_advanced__';

export const SuggestedValueInput: ComponentType<SuggestedValueInputProps> = ({
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
			<div className="input-group">
				<input
					type="text"
					className="form-control"
					value={value}
					onChange={e => onChange(e.target.value)}
					placeholder={placeholder}
				/>
				{suggestions.length > 0 && (
					<span className="input-group-btn">
						<button
							type="button"
							className="btn btn-default"
							onClick={() => setAdvanced(false)}
							aria-label={labels.useSuggestions}
							title={labels.useSuggestions}
						>
							<span className="glyphicon glyphicon-list" aria-hidden="true" />
						</button>
					</span>
				)}
			</div>
		);
	}

	return (
		<select
			className="form-control"
			value={isMatched ? value : ''}
			onChange={e => {
				const v = e.target.value;
				if (v === BS34_ADVANCED) {
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
			<option value={BS34_ADVANCED}>{labels.advanced}</option>
		</select>
	);
};

export const RemoveButton: ComponentType<RemoveButtonProps> = ({ onClick }) => {
	const labels = useContext(LabelsContext);
	return (
		<button
			type="button"
			className="btn btn-sm btn-default"
			onClick={onClick}
			aria-label={labels.removeField}
			style={{ paddingLeft: 5, paddingRight: 5 }}
		>
			<span className="glyphicon glyphicon-remove" aria-hidden="true" />
		</button>
	);
};

export const TypeSelector: ComponentType<TypeSelectorProps> = ({ kind, onChange }) => {
	const labels = useContext(LabelsContext);
	return (
		<select
			className="form-control"
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

export const Reorder: ComponentType<ReorderProps> = ({ canMoveUp, canMoveDown, onMoveUp, onMoveDown }) => {
	const labels = useContext(LabelsContext);
	return (
		<div className="btn-group btn-group-sm" role="group" aria-label={labels.reorder}>
			<button
				type="button"
				className="btn btn-default"
				onClick={onMoveUp}
				disabled={!canMoveUp}
				aria-label={labels.moveUp}
				style={{ paddingLeft: 5, paddingRight: 5 }}
			>
				<span className="glyphicon glyphicon-chevron-up" aria-hidden="true" />
			</button>
			<button
				type="button"
				className="btn btn-default"
				onClick={onMoveDown}
				disabled={!canMoveDown}
				aria-label={labels.moveDown}
				style={{ paddingLeft: 5, paddingRight: 5 }}
			>
				<span className="glyphicon glyphicon-chevron-down" aria-hidden="true" />
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
			className="form-control"
			style={{ marginTop: 8, maxWidth: 320 }}
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
		<div style={{ marginTop: 8, textAlign: 'right' }}>
			<div className="btn-group" role="group">
				<button type="button" className="btn btn-default" onClick={() => onAdd('expr')}>{labels.addField}</button>
				<button type="button" className="btn btn-default" onClick={() => onAdd('array')}>{labels.addArray}</button>
				<button type="button" className="btn btn-default" onClick={() => onAdd('object')}>{labels.addObject}</button>
				<button type="button" className="btn btn-default" onClick={() => onAdd('conditional')}>{labels.addConditional}</button>
			</div>
		</div>
	);
};

export const AddElseButton: ComponentType<AddElseButtonProps> = ({ onClick }) => {
	const labels = useContext(LabelsContext);
	return (
		<button type="button" className="btn btn-default" onClick={onClick}>
			{labels.addElse}
		</button>
	);
};

export const Section: ComponentType<SectionProps> = ({ header, body }) => (
	<div className="panel panel-default" style={{ marginBottom: 0 }}>
		{header === undefined ? null : <div className="panel-heading" style={{ padding: '8px 12px' }}>{header}</div>}
		<div className="panel-body" style={{ padding: '12px' }}>{body}</div>
	</div>
);

export const SectionHeader: ComponentType<SectionHeaderProps> = ({ label, valueInput }) => {
	const labels = useContext(LabelsContext);
	const displayLabel = label === 'forEach'
		? labels.forEach
		: label === 'when'
			? labels.when
			: labels.from;
	return (
		<div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
			<code style={{ flexShrink: 0, padding: '6px 10px', background: '#eee', borderRadius: 3 }}>{displayLabel}</code>
			<div style={{ flex: 1 }}>{valueInput}</div>
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
	AddElseButton,
	SchemaAddBar,
	Section,
	SectionHeader
};

export default components;
