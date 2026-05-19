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
	<div className="dm-schema-editor-bs34 form-horizontal">{children}</div>
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
	const detailClass = title && description ? 'col-sm-2' : 'col-sm-3';
	const nameClass = title && description ? 'col-sm-2' : hasDetails ? 'col-sm-3' : 'col-sm-4';
	return (
		<>
			<div className="form-group">
				<div className={nameClass}>{name}</div>
				<div className={hasDetails ? 'col-sm-2' : 'col-sm-3'}>{typeSelector}</div>
				<div className={hasDetails ? 'col-sm-2' : 'col-sm-3'}>{requiredToggle}</div>
				{title ? <div className={detailClass}>{title}</div> : null}
				{description ? <div className={detailClass}>{description}</div> : null}
				<div
					className="col-sm-2"
					style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}
				>
					{settings}
					{remove}
				</div>
			</div>
			{section}
		</>
	);
};

export const Section: ComponentType<SectionProps> = ({ children }) => (
	<div className="panel panel-default">
		<div className="panel-body">{children}</div>
	</div>
);

export const TextInput: ComponentType<TextInputProps> = ({ value, onChange, placeholder, focusOnMount, readOnly }) => {
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
			readOnly={readOnly}
		/>
	);
};

export const FieldLabel: ComponentType<FieldLabelProps> = ({ label }) => (
	<label className="control-label" title={label}>{label}</label>
);

export const TypeSelector: ComponentType<TypeSelectorProps> = ({ value, options, onChange, readOnly }) => (
	<select
		className="form-control dm-schema-editor-type"
		value={value}
		onChange={e => {
			const option = options.find(current => current.value === e.target.value);
			if (option)
				onChange(option);
		}}
		disabled={readOnly}
	>
		{options.map(option => (
			<option key={option.value} value={option.value}>{option.label}</option>
		))}
	</select>
);

export const RequirementControl: ComponentType<CheckboxProps> = ({ checked, onChange, label, readOnly }) => (
	<select
		className={`form-control dm-schema-editor-required ${checked ? 'dm-schema-editor-required-on' : 'dm-schema-editor-required-off'}`}
		value={checked ? 'required' : 'optional'}
		onChange={e => onChange(e.target.value === 'required')}
		aria-label={label}
		title={label}
		disabled={readOnly}
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
			className="btn btn-default"
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
	<div className="dm-schema-editor-settings form-horizontal">{children}</div>
);

export const CheckboxFieldSetting: ComponentType<CheckboxFieldSettingProps> = ({ field }) => (
	<div className="form-group">
		<label className="col-sm-5 control-label">{field.label}</label>
		<div className="col-sm-7">
			<div className="checkbox">
				<label>
					<input
						type="checkbox"
						checked={field.checked}
						onChange={e => field.onChange(e.target.checked)}
						disabled={field.readOnly}
					/>
				</label>
			</div>
		</div>
	</div>
);

export const TextFieldSetting: ComponentType<TextFieldSettingProps> = ({ field }) => (
	<div className="form-group">
		<label className="col-sm-5 control-label">{field.label}</label>
		<div className="col-sm-7">
			<input
				type="text"
				className="form-control"
				value={field.value}
				onChange={e => field.onChange(e.target.value)}
				placeholder={field.placeholder}
				readOnly={field.readOnly}
			/>
		</div>
	</div>
);

export const TextareaFieldSetting: ComponentType<TextareaFieldSettingProps> = ({ field }) => (
	<div className="form-group">
		<label className="col-sm-5 control-label">{field.label}</label>
		<div className="col-sm-7">
			<textarea
				className="form-control"
				value={field.value}
				onChange={e => field.onChange(e.target.value)}
				placeholder={field.placeholder}
				readOnly={field.readOnly}
				rows={3}
			/>
		</div>
	</div>
);

export const RemoveButton: ComponentType<RemoveButtonProps> = ({ onClick }) => {
	const labels = useContext(LabelsContext);
	return (
		<button type="button" className="btn btn-default" onClick={onClick} aria-label={labels.removeProperty}>
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
	const nameClass = exposeTitle && exposeDescription ? 'col-sm-2' : exposeTitle || exposeDescription ? 'col-sm-3' : 'col-sm-4';
	return (
		<div className="form-group dm-schema-editor-template-row">
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
