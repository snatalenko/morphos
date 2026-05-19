import { useContext, useEffect, useRef, type ComponentType } from 'react';
import { LabelsContext } from '../LabelsContext.ts';
import type {
	AddPropertyInputProps,
	CheckboxFieldSettingProps,
	CheckboxProps,
	ContainerProps,
	FieldLabelProps,
	RemoveButtonProps,
	RowProps,
	SchemaEditorComponents,
	SectionProps,
	SettingsButtonProps,
	SettingsGroupProps,
	TextareaFieldSettingProps,
	TextFieldSettingProps,
	TextInputProps,
	TypeSelectorProps
} from '../types.ts';

export const Container: ComponentType<ContainerProps> = ({ children }) => (
	<div className="dm-schema-editor-bs53">{children}</div>
);

export const Row: ComponentType<RowProps> = ({
	name,
	title,
	description,
	typeSelector,
	requiredToggle,
	settings,
	remove,
	section
}) => {
	const hasDetails = !!title || !!description;
	const detailClass = title && description ? 'col-2' : 'col-3';
	const nameClass = title && description ? 'col-2' : hasDetails ? 'col-3' : 'col-4';
	return (
		<div className="row g-2 mb-2 align-items-start">
			<div className={nameClass}>{name}</div>
			<div className={hasDetails ? 'col-2' : 'col-3'}>{typeSelector}</div>
			<div className={hasDetails ? 'col-2' : 'col-3'}>{requiredToggle}</div>
			{title ? <div className={detailClass}>{title}</div> : null}
			{description ? <div className={detailClass}>{description}</div> : null}
			<div className="col-2 d-flex align-items-center justify-content-end gap-1">
				{settings}
				{remove}
			</div>
			{section ? <div className="col-12">{section}</div> : null}
		</div>
	);
};

export const Section: ComponentType<SectionProps> = ({ children }) => (
	<div className="card mb-1">
		<div className="card-body">{children}</div>
	</div>
);

export const TextInput: ComponentType<TextInputProps> = ({ value, onChange, placeholder, focusOnMount }) => {
	const ref = useRef<HTMLInputElement>(null);
	useEffect(() => {
		if (focusOnMount)
			ref.current?.focus();
	}, [focusOnMount]);

	return (
		<input
			ref={ref}
			type="text"
			className="form-control"
			value={value}
			onChange={e => onChange(e.target.value)}
			placeholder={placeholder}
		/>
	);
};

export const FieldLabel: ComponentType<FieldLabelProps> = ({ label }) => (
	<label className="col-form-label fw-semibold mb-0" title={label}>{label}</label>
);

export const TypeSelector: ComponentType<TypeSelectorProps> = ({ value, options, onChange }) => (
	<select
		className="form-select dm-schema-editor-type"
		value={value}
		onChange={e => {
			const option = options.find(current => current.value === e.target.value);
			if (option)
				onChange(option);
		}}
	>
		{options.map(option => (
			<option key={option.value} value={option.value}>{option.label}</option>
		))}
	</select>
);

export const RequirementControl: ComponentType<CheckboxProps> = ({ checked, onChange, label }) => (
	<select
		className={`form-select dm-schema-editor-required ${checked ? 'dm-schema-editor-required-on' : 'dm-schema-editor-required-off'}`}
		value={checked ? 'required' : 'optional'}
		onChange={e => onChange(e.target.value === 'required')}
		aria-label={label}
		title={label}
	>
		<option value="optional">Optional</option>
		<option value="required">Required</option>
	</select>
);

export const SettingsButton: ComponentType<SettingsButtonProps> = ({ expanded, onClick }) => {
	const labels = useContext(LabelsContext);
	return (
		<button
			type="button"
			className="btn btn-outline-secondary"
			onClick={onClick}
			aria-expanded={expanded}
			aria-label={labels.settings}
			title={labels.settings}
		>
			{labels.settings}
		</button>
	);
};

export const SettingsGroup: ComponentType<SettingsGroupProps> = ({ children }) => (
	<div className="dm-schema-editor-settings">{children}</div>
);

export const CheckboxFieldSetting: ComponentType<CheckboxFieldSettingProps> = ({ field }) => (
	<div className="row g-2 mb-2 align-items-center">
		<label className="col-5 col-form-label">{field.label}</label>
		<div className="col-7">
			<input
				type="checkbox"
				className="form-check-input"
				checked={field.checked}
				onChange={e => field.onChange(e.target.checked)}
			/>
		</div>
	</div>
);

export const TextFieldSetting: ComponentType<TextFieldSettingProps> = ({ field }) => (
	<div className="row g-2 mb-2 align-items-center">
		<label className="col-5 col-form-label">{field.label}</label>
		<div className="col-7">
			<input
				type="text"
				className="form-control"
				value={field.value}
				onChange={e => field.onChange(e.target.value)}
				placeholder={field.placeholder}
			/>
		</div>
	</div>
);

export const TextareaFieldSetting: ComponentType<TextareaFieldSettingProps> = ({ field }) => (
	<div className="row g-2 mb-2 align-items-start">
		<label className="col-5 col-form-label">{field.label}</label>
		<div className="col-7">
			<textarea
				className="form-control"
				value={field.value}
				onChange={e => field.onChange(e.target.value)}
				placeholder={field.placeholder}
				rows={3}
			/>
		</div>
	</div>
);

export const RemoveButton: ComponentType<RemoveButtonProps> = ({ onClick }) => {
	const labels = useContext(LabelsContext);
	return (
		<button type="button" className="btn btn-outline-danger" onClick={onClick} aria-label={labels.removeProperty}>
			×
		</button>
	);
};

export const AddPropertyInput: ComponentType<AddPropertyInputProps> = ({
	value,
	onChange,
	placeholder,
	exposeTitle,
	exposeDescription
}) => {
	const nameClass = exposeTitle && exposeDescription ? 'col-2' : exposeTitle || exposeDescription ? 'col-3' : 'col-4';
	return (
		<div className="row g-2 mb-2 dm-schema-editor-template-row">
			<div className={nameClass}>
				<input
					type="text"
					className="form-control"
					value={value}
					onChange={e => onChange(e.target.value)}
					placeholder={placeholder}
				/>
			</div>
		</div>
	);
};

const components: Partial<SchemaEditorComponents> = {
	Container,
	Row,
	Section,
	TextInput,
	FieldLabel,
	TypeSelector,
	RequirementControl,
	SettingsButton,
	SettingsGroup,
	TextFieldSetting,
	CheckboxFieldSetting,
	TextareaFieldSetting,
	RemoveButton,
	AddPropertyInput
};

export default components;
