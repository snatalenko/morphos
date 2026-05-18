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
	SchemaType,
	SectionProps,
	SettingsButtonProps,
	SettingsGroupProps,
	TextFieldSettingProps,
	TextInputProps,
	TypeSelectorProps
} from '../types.ts';

const schemaTypes: SchemaType[] = ['string', 'number', 'integer', 'boolean', 'object', 'array'];

export const Container: ComponentType<ContainerProps> = ({ children }) => (
	<div className="dm-schema-editor-bs34 form-horizontal">{children}</div>
);

export const Row: ComponentType<RowProps> = ({
	name,
	typeSelector,
	requiredToggle,
	settings,
	remove,
	section
}) => (
	<>
		<div className="form-group">
			<div className="col-sm-4">{name}</div>
			<div className="col-sm-3">{typeSelector}</div>
			<div className="col-sm-3">{requiredToggle}</div>
			<div className="col-sm-2" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
				{settings}
				{remove}
			</div>
		</div>
		{section}
	</>
);

export const Section: ComponentType<SectionProps> = ({ children }) => (
	<div className="panel panel-default">
		<div className="panel-body">{children}</div>
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
	<label className="control-label" title={label}>{label}</label>
);

export const TypeSelector: ComponentType<TypeSelectorProps> = ({ value, onChange }) => (
	<select
		className="form-control dm-schema-editor-type"
		value={value}
		onChange={e => onChange(e.target.value as SchemaType)}
	>
		{schemaTypes.map(type => (
			<option key={type} value={type}>{type[0].toUpperCase() + type.slice(1)}</option>
		))}
	</select>
);

export const RequirementControl: ComponentType<CheckboxProps> = ({ checked, onChange, label }) => (
	<select
		className={`form-control dm-schema-editor-required ${checked ? 'dm-schema-editor-required-on' : 'dm-schema-editor-required-off'}`}
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

export const AddPropertyInput: ComponentType<AddPropertyInputProps> = ({ value, onChange, placeholder }) => (
	<div className="form-group dm-schema-editor-template-row">
		<div className="col-sm-4">
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
	RemoveButton,
	AddPropertyInput
};

export default components;
