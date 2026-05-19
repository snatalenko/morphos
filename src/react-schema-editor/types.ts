import type { ComponentType, ReactNode } from 'react';
import type { JsonSchema } from '../MappingSchema.ts';

export type { JsonSchema, MappingSchema } from '../MappingSchema.ts';

export type SchemaType = 'string' | 'number' | 'integer' | 'boolean' | 'object' | 'array';

export interface ContainerProps {
	children: ReactNode;
}

export interface RowProps {
	name: ReactNode;
	title?: ReactNode;
	description?: ReactNode;
	typeSelector: ReactNode;
	requiredToggle: ReactNode;
	settings: ReactNode;
	remove: ReactNode;
	section?: ReactNode;
}

export interface SectionProps {
	children: ReactNode;
}

export interface TextInputProps {
	value: string;
	onChange: (next: string) => void;
	placeholder?: string;
	focusOnMount?: boolean;
	readOnly?: boolean;
}

export interface FieldLabelProps {
	label: string;
}

export interface TypeSelectorOption {
	value: string;
	label: string;
	type: SchemaType;
	format?: string;
}

export interface TypeSelectorProps {
	value: string;
	options: TypeSelectorOption[];
	onChange: (next: TypeSelectorOption) => void;
	readOnly?: boolean;
}

export interface CheckboxProps {
	checked: boolean;
	onChange: (next: boolean) => void;
	label: string;
	readOnly?: boolean;
}

export interface RemoveButtonProps {
	onClick: () => void;
}

export interface SettingsButtonProps {
	expanded: boolean;
	onClick: () => void;
}

export interface AddPropertyInputProps {
	value: string;
	onChange: (next: string) => void;
	placeholder: string;
	exposeTitle?: boolean;
	exposeDescription?: boolean;
}

export interface SchemaTextSettingField {
	key: string;
	label: string;
	type?: 'text';
	value: string;
	placeholder?: string;
	readOnly?: boolean;
	onChange: (next: string) => void;
}

export interface SchemaCheckboxSettingField {
	key: string;
	label: string;
	type: 'checkbox';
	checked: boolean;
	readOnly?: boolean;
	onChange: (next: boolean) => void;
}

export interface SchemaTextareaSettingField {
	key: string;
	label: string;
	type: 'textarea';
	value: string;
	placeholder?: string;
	readOnly?: boolean;
	onChange: (next: string) => void;
}

export type SchemaSettingField = SchemaTextSettingField | SchemaCheckboxSettingField | SchemaTextareaSettingField;

export interface SettingsGroupProps {
	children: ReactNode;
}

export interface TextFieldSettingProps {
	field: SchemaTextSettingField;
}

export interface CheckboxFieldSettingProps {
	field: SchemaCheckboxSettingField;
}

export interface TextareaFieldSettingProps {
	field: SchemaTextareaSettingField;
}

export interface SchemaEditorLabels {
	title: string;
	propertyName: string;
	description: string;
	format: string;
	examples: string;
	required: string;
	settings: string;
	nullable: string;
	removeProperty: string;
	addProperty: string;
	rootElement: string;
	arrayItem: string;
	minimum: string;
	maximum: string;
	exclusiveMinimum: string;
	exclusiveMaximum: string;
	multipleOf: string;
	minLength: string;
	maxLength: string;
	pattern: string;
	enum: string;
	minItems: string;
	maxItems: string;
	minProperties: string;
	maxProperties: string;
}

export interface SchemaEditorComponents {
	Container: ComponentType<ContainerProps>;
	Row: ComponentType<RowProps>;
	Section: ComponentType<SectionProps>;
	TextInput: ComponentType<TextInputProps>;
	FieldLabel: ComponentType<FieldLabelProps>;
	TypeSelector: ComponentType<TypeSelectorProps>;
	RequirementControl: ComponentType<CheckboxProps>;
	SettingsButton: ComponentType<SettingsButtonProps>;
	SettingsGroup: ComponentType<SettingsGroupProps>;
	TextFieldSetting: ComponentType<TextFieldSettingProps>;
	CheckboxFieldSetting: ComponentType<CheckboxFieldSettingProps>;
	TextareaFieldSetting: ComponentType<TextareaFieldSettingProps>;
	RemoveButton: ComponentType<RemoveButtonProps>;
	AddPropertyInput: ComponentType<AddPropertyInputProps>;
}

export type SchemaProperty = JsonSchema | boolean;
