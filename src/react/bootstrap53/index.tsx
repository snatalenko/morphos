import { useContext, useEffect, useRef, useState, type ComponentType, Fragment } from 'react';
import { LabelsContext } from '../LabelsContext.ts';
import { ComponentsContext } from '../ComponentsContext.ts';
import { renderFieldOptions } from '../renderFieldOptions.tsx';
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
	<Fragment>{children}</Fragment>
);

export const Row: ComponentType<RowProps> = ({ keyInput, typeSelector, value, remove, reorder }) => {
	const isTemplate = !typeSelector && !value && !remove && !reorder;
	return (
		<div className="row g-2 mb-2 align-items-start">
			<div className={typeSelector || isTemplate ? 'col-3' : 'col-5'}>{keyInput}</div>
			{typeSelector ? <div className="col-2">{typeSelector}</div> : null}
			{value ? <div className="col-5">{value}</div> : null}
			{reorder || remove ? (
				<div className="col-2 d-flex align-items-center justify-content-end gap-1">
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
	<div className="row g-2 mb-3 align-items-start">
		<div className={typeSelector ? 'col-3' : 'col-5'}>{keyInput}</div>
		{typeSelector ? <div className="col-2">{typeSelector}</div> : null}
		<div className="col-5">{value}</div>
		<div className="col-2 d-flex align-items-center justify-content-end gap-1">
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

export const RowLabel: ComponentType<RowLabelProps> = ({ label }) => (
	<label className="col-form-label">{label}</label>
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

export const InputResetButton: ComponentType<InputResetButtonProps> = ({ onClick }) => {
	const labels = useContext(LabelsContext);
	return (
		<button
			type="button"
			className="btn btn-outline-secondary"
			onClick={onClick}
			aria-label={labels.useSchemaFields}
			title={labels.useSchemaFields}
		>
			{labels.useSuggestionsSymbol}
		</button>
	);
};

const BS53_ADVANCED = '__dm_advanced__';

function BS53SuggestedInput({
	value,
	onChange,
	options,
	inputClassName = 'form-control',
	selectClassName = 'form-select',
	placeholder,
	defaultAdvanced,
	focusOnAdvancedMount,
	onAdvanced,
	advancedLabel
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
				if (v === BS53_ADVANCED) {
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
			<option value={BS53_ADVANCED}>{advancedLabel ?? labels.advanced}</option>
		</select>
	);
}

export const SuggestedKeyInput: ComponentType<SuggestedKeyInputProps> = ({
	value,
	onChange,
	options,
	placeholder,
	defaultAdvanced,
	focusOnAdvancedMount,
	onAdvanced
}) => (
	<BS53SuggestedInput
		value={value}
		onChange={onChange}
		options={options}
		inputClassName="form-control"
		placeholder={placeholder}
		defaultAdvanced={defaultAdvanced}
		focusOnAdvancedMount={focusOnAdvancedMount}
		onAdvanced={onAdvanced}
	/>
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

export const SuggestedValueInput: ComponentType<SuggestedValueInputProps> = ({
	value,
	onChange,
	options,
	placeholder,
	defaultAdvanced
}) => {
	const labels = useContext(LabelsContext);
	return (
		<BS53SuggestedInput
			value={value}
			onChange={onChange}
			options={options}
			inputClassName="form-control dm-mapping-value"
			placeholder={placeholder}
			defaultAdvanced={defaultAdvanced}
			advancedLabel={labels.jsExpression}
		/>
	);
};

export const RemoveButton: ComponentType<RemoveButtonProps> = ({ onClick }) => {
	const labels = useContext(LabelsContext);
	return (
		<button
			type="button"
			className="btn btn-outline-danger"
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
			<option value="conditional">{labels.conditional}</option>
			<option value="concat">{labels.concat}</option>
			<option value="tuple">{labels.tuple}</option>
		</select>
	);
};

export const Reorder: ComponentType<ReorderProps> = ({ canMoveUp, canMoveDown, onMoveUp, onMoveDown }) => {
	const labels = useContext(LabelsContext);
	return (
		<div className="btn-group" role="group" aria-label={labels.reorder}>
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

export const AddElseButton: ComponentType<AddElseButtonProps> = ({ onClick }) => {
	const labels = useContext(LabelsContext);
	return (
		<div className="d-flex justify-content-start mt-2">
			<button type="button" className="btn btn-outline-primary" onClick={onClick}>
				{labels.addElse}
			</button>
		</div>
	);
};

export const AddItemButton: ComponentType<AddItemButtonProps> = ({ onClick }) => {
	const labels = useContext(LabelsContext);
	return (
		<div className="d-flex justify-content-start mt-2">
			<button type="button" className="btn btn-outline-primary" onClick={onClick}>
				{labels.addItem}
			</button>
		</div>
	);
};

export const Section: ComponentType<SectionProps> = ({ header, body }) => (
	<div className="card">
		{header === undefined ? null : <div className="card-header py-2">{header}</div>}
		<div className="card-body">{body}</div>
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
