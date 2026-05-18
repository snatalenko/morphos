import { useContext, useEffect, useRef, useState, type ComponentType } from 'react';
import { LabelsContext } from '../LabelsContext.ts';
import { ComponentsContext } from '../ComponentsContext.ts';
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
} from '../types.ts';

export const Container: ComponentType<ContainerProps> = ({ children }) => (
	<div className="dm-bs34-container form-horizontal">{children}</div>
);

export const Row: ComponentType<RowProps> = ({ keyInput, typeSelector, value, remove, reorder }) => {
	const isTemplate = !typeSelector && !value && !remove && !reorder;
	return (
		<div className="form-group">
			<div className={typeSelector || isTemplate ? 'col-sm-3' : 'col-sm-5'}>{keyInput}</div>
			{typeSelector ? <div className="col-sm-2">{typeSelector}</div> : null}
			{value ? <div className="col-sm-5">{value}</div> : null}
			{reorder || remove ? (
				<div className="col-sm-2" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
					{reorder}
					{remove}
				</div>
			) : null}
		</div>
	);
};

export const SectionRow: ComponentType<SectionRowProps> = ({
	keyInput,
	typeSelector,
	value,
	section,
	remove,
	reorder
}) => (
	<>
		<div className="form-group">
			<div className={typeSelector ? 'col-sm-3' : 'col-sm-5'}>{keyInput}</div>
			{typeSelector ? <div className="col-sm-2">{typeSelector}</div> : null}
			<div className="col-sm-5">{value}</div>
			<div className="col-sm-2" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
				{reorder}
				{remove}
			</div>
		</div>
		{section}
	</>
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
		<label className="control-label" title={schema.description}>
			<strong>{name}</strong>
			{required && <span className="text-danger" aria-label={labels.required}> *</span>}
		</label>
	);
};

export const RowLabel: ComponentType<RowLabelProps> = ({ label }) => (
	<label className="control-label">{label}</label>
);

export const InputResetButton: ComponentType<InputResetButtonProps> = ({ onClick }) => {
	const labels = useContext(LabelsContext);
	return (
		<span className="input-group-btn">
			<button
				type="button"
				className="btn btn-default"
				onClick={onClick}
				aria-label={labels.useSchemaFields}
				title={labels.useSchemaFields}
			>
				…
			</button>
		</span>
	);
};

const BS34_ADVANCED = '__dm_advanced__';

function SuggestedInput({
	value,
	onChange,
	options,
	inputClassName = 'form-control',
	selectClassName = 'form-control',
	placeholder,
	defaultAdvanced,
	focusOnAdvancedMount,
	onAdvanced
}: {
	value: string;
	onChange: (next: string) => void;
	options: FieldOption[];
	inputClassName?: string;
	selectClassName?: string;
	placeholder?: string;
	defaultAdvanced?: boolean;
	focusOnAdvancedMount?: boolean;
	onAdvanced?: () => void;
}) {
	const C = useContext(ComponentsContext);
	const labels = useContext(LabelsContext);
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

	if (!options.length) {
		return (
			<input
				ref={inputRef}
				type="text"
				className={inputClassName}
				value={value}
				onChange={e => onChange(e.target.value)}
				placeholder={placeholder}
			/>
		);
	}

	if (advanced) {
		return (
			<div className="input-group">
				<input
					ref={inputRef}
					type="text"
					className={inputClassName}
					value={value}
					onChange={e => onChange(e.target.value)}
					placeholder={placeholder}
				/>
				<C.InputResetButton onClick={() => setAdvanced(false)} />
			</div>
		);
	}

	return (
		<select
			className={selectClassName}
			value={matched ? value : ''}
			onChange={e => {
				const v = e.target.value;
				if (v === BS34_ADVANCED) {
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
			{options.map(o => (
				<option key={o.value} value={o.value}>{o.label ?? o.value}</option>
			))}
			<option value={BS34_ADVANCED}>{labels.advanced}</option>
		</select>
	);
}

export const SuggestedKeyInput: ComponentType<SuggestedKeyInputProps> = SuggestedInput;

export const SuggestedValueInput: ComponentType<SuggestedValueInputProps> = props => (
	<SuggestedInput {...props} inputClassName="form-control dm-mapping-value" />
);

export const ValueInput: ComponentType<ValueInputProps> = ({ value, onChange, placeholder }) => (
	<input
		type="text"
		className="form-control dm-mapping-value"
		value={value}
		onChange={e => onChange(e.target.value)}
		placeholder={placeholder}
	/>
);

export const RemoveButton: ComponentType<RemoveButtonProps> = ({ onClick }) => {
	const labels = useContext(LabelsContext);
	return (
		<button
			type="button"
			className="btn btn-default"
			onClick={onClick}
			aria-label={labels.removeField}
			style={{ paddingLeft: 5, paddingRight: 5 }}
		>
			×
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
			<option value="concat">{labels.concat}</option>
		</select>
	);
};

export const Reorder: ComponentType<ReorderProps> = ({ canMoveUp, canMoveDown, onMoveUp, onMoveDown }) => {
	const labels = useContext(LabelsContext);
	return (
		<div className="btn-group" role="group" aria-label={labels.reorder}>
			<button
				type="button"
				className="btn btn-default"
				onClick={onMoveUp}
				disabled={!canMoveUp}
				aria-label={labels.moveUp}
			>
				↑
			</button>
			<button
				type="button"
				className="btn btn-default"
				onClick={onMoveDown}
				disabled={!canMoveDown}
				aria-label={labels.moveDown}
			>
				↓
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

export const AddElseButton: ComponentType<AddElseButtonProps> = ({ onClick }) => {
	const labels = useContext(LabelsContext);
	return (
		<div style={{ marginTop: 8 }}>
			<button type="button" className="btn btn-default" onClick={onClick}>
				{labels.addElse}
			</button>
		</div>
	);
};

export const AddItemButton: ComponentType<AddItemButtonProps> = ({ onClick }) => {
	const labels = useContext(LabelsContext);
	return (
		<div style={{ marginTop: 8, textAlign: 'left' }}>
			<button type="button" className="btn btn-default" onClick={onClick}>
				{labels.addItem}
			</button>
		</div>
	);
};

export const Section: ComponentType<SectionProps> = ({ header, body }) => (
	<div className="panel panel-default">
		{header === undefined ? null : <div className="panel-heading" style={{ padding: '8px 12px' }}>{header}</div>}
		<div className="panel-body">{body}</div>
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
	RowLabel,
	SuggestedKeyInput,
	ValueInput,
	SuggestedValueInput,
	RemoveButton,
	InputResetButton,
	Reorder,
	TypeSelector,
	AddElseButton,
	AddItemButton,
	SchemaAddBar,
	Section,
	SectionHeader
};

export default components;
