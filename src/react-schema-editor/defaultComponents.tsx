import { useContext, useEffect, useRef, type ComponentType } from 'react';
import { LabelsContext } from './LabelsContext.ts';
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
} from './types.ts';

const schemaTypes: SchemaType[] = ['string', 'number', 'integer', 'boolean', 'object', 'array'];

export const DefaultContainer: ComponentType<ContainerProps> = ({ children }) => (
	<div className="dm-schema-editor-entries">{children}</div>
);

export const DefaultRow: ComponentType<RowProps> = ({
	name,
	typeSelector,
	requiredToggle,
	settings,
	remove,
	section
}) => (
	<>
		<div className="dm-schema-editor-row">
			{name}
			{typeSelector}
			<span className="dm-schema-editor-actions">
				{requiredToggle}
				{settings}
				{remove}
			</span>
		</div>
		{section}
	</>
);

export const DefaultSection: ComponentType<SectionProps> = ({ children }) => (
	<div className="dm-mapping-section">
		<div
			className="dm-mapping-section-body"
			style={{
				marginTop: '0.35rem',
				marginLeft: '0',
				padding: '0.5rem 0 0.5rem 0.75rem',
				borderLeft: '2px solid #e3e7ec'
			}}
		>
			{children}
		</div>
	</div>
);

export const DefaultTextInput: ComponentType<TextInputProps> = ({ value, onChange, placeholder, focusOnMount }) => {
	const ref = useRef<HTMLInputElement>(null);
	useEffect(() => {
		if (focusOnMount)
			ref.current?.focus();
	}, [focusOnMount]);

	return (
		<input
			ref={ref}
			className="dm-schema-editor-input"
			value={value}
			onChange={e => onChange(e.target.value)}
			placeholder={placeholder}
		/>
	);
};

export const DefaultFieldLabel: ComponentType<FieldLabelProps> = ({ label }) => (
	<label className="dm-schema-editor-label">{label}</label>
);

export const DefaultTypeSelector: ComponentType<TypeSelectorProps> = ({ value, onChange }) => (
	<select
		className="dm-schema-editor-type"
		value={value}
		onChange={e => onChange(e.target.value as SchemaType)}
	>
		{schemaTypes.map(type => (
			<option key={type} value={type}>{type[0].toUpperCase() + type.slice(1)}</option>
		))}
	</select>
);

export const DefaultCheckbox: ComponentType<CheckboxProps> = ({ checked, onChange, label }) => (
	<select
		className={`dm-schema-editor-required ${checked ? 'dm-schema-editor-required-on' : 'dm-schema-editor-required-off'}`}
		value={checked ? 'required' : 'optional'}
		onChange={e => onChange(e.target.value === 'required')}
		aria-label={label}
		title={label}
	>
		<option value="optional">Optional</option>
		<option value="required">Required</option>
	</select>
);

export const DefaultSettingsButton: ComponentType<SettingsButtonProps> = ({ expanded, onClick }) => {
	const labels = useContext(LabelsContext);
	return (
		<button
			type="button"
			className="dm-schema-editor-settings-toggle"
			onClick={onClick}
			aria-expanded={expanded}
			aria-label={labels.settings}
			title={labels.settings}
		>
			{labels.settings}
		</button>
	);
};

export const DefaultSettingsGroup: ComponentType<SettingsGroupProps> = ({ children }) => (
	<div className="dm-schema-editor-settings">{children}</div>
);

export const DefaultTextFieldSetting: ComponentType<TextFieldSettingProps> = ({ field }) => (
	<label className="dm-schema-editor-setting">
		<span>{field.label}</span>
		<input
			className="dm-schema-editor-input"
			value={field.value}
			onChange={e => field.onChange(e.target.value)}
			placeholder={field.placeholder}
		/>
	</label>
);

export const DefaultCheckboxFieldSetting: ComponentType<CheckboxFieldSettingProps> = ({ field }) => (
	<label className="dm-schema-editor-setting">
		<input
			type="checkbox"
			checked={field.checked}
			onChange={e => field.onChange(e.target.checked)}
		/>
		<span>{field.label}</span>
	</label>
);

export const DefaultRemoveButton: ComponentType<RemoveButtonProps> = ({ onClick }) => {
	const labels = useContext(LabelsContext);
	return (
		<button
			type="button"
			className="dm-schema-editor-remove"
			onClick={onClick}
			aria-label={labels.removeProperty}
		>
			×
		</button>
	);
};

export const DefaultAddPropertyInput: ComponentType<AddPropertyInputProps> = ({ value, onChange, placeholder }) => (
	<div className="dm-schema-editor-row dm-schema-editor-template-row">
		<input
			className="dm-schema-editor-input"
			value={value}
			onChange={e => onChange(e.target.value)}
			placeholder={placeholder}
		/>
	</div>
);

export const defaultComponents: SchemaEditorComponents = {
	Container: DefaultContainer,
	Row: DefaultRow,
	Section: DefaultSection,
	TextInput: DefaultTextInput,
	FieldLabel: DefaultFieldLabel,
	TypeSelector: DefaultTypeSelector,
	RequirementControl: DefaultCheckbox,
	SettingsButton: DefaultSettingsButton,
	SettingsGroup: DefaultSettingsGroup,
	TextFieldSetting: DefaultTextFieldSetting,
	CheckboxFieldSetting: DefaultCheckboxFieldSetting,
	RemoveButton: DefaultRemoveButton,
	AddPropertyInput: DefaultAddPropertyInput
};
