import type { ComponentType, ReactNode } from 'react';

export type AddKind = 'expr' | 'array' | 'object' | 'conditional' | 'concat';
export type EntryKind = AddKind;

export type { MappingSchema } from '../MappingSchema.ts';
import type { MappingSchema } from '../MappingSchema.ts';

export interface SchemaFieldOption {
	name: string;
	label?: string;
	schema: MappingSchema;
	required: boolean;
}

export interface FieldOption {
	value: string;
	label?: string;
}

export interface SourceFieldMatch {
	path: string;
	label?: string;
	schema: MappingSchema;
}

export interface ContainerProps {
	children: ReactNode;
}

export interface RowProps {
	keyInput: ReactNode;
	typeSelector: ReactNode;
	value: ReactNode;
	remove: ReactNode;
	reorder: ReactNode;
}

export interface SectionRowProps {
	keyInput: ReactNode;
	typeSelector: ReactNode;
	value: ReactNode;
	section: ReactNode;
	remove: ReactNode;
	reorder: ReactNode;
}

export interface TypeSelectorProps {
	kind: EntryKind;
	onChange: (kind: AddKind) => void;
}

export interface KeyInputProps {
	value: string;
	onChange: (next: string) => void;
	placeholder?: string;
}

export interface KeyLabelProps {
	name: string;
	schema: MappingSchema;
	required: boolean;
}

export interface SuggestedKeyInputProps {
	value: string;
	onChange: (next: string) => void;
	options: FieldOption[];
	placeholder?: string;
	defaultAdvanced?: boolean;
	focusOnAdvancedMount?: boolean;
	onAdvanced?: () => void;
}

export interface ValueInputProps {
	value: string;
	onChange: (next: string) => void;
	placeholder?: string;
}

export interface SuggestedValueInputProps {
	value: string;
	onChange: (next: string) => void;
	placeholder?: string;
	defaultAdvanced?: boolean;
	options: FieldOption[];
}

export interface RowLabelProps {
	label: string;
}

export interface RemoveButtonProps {
	onClick: () => void;
}

export interface InputResetButtonProps {
	onClick: () => void;
}

export interface ReorderProps {
	canMoveUp: boolean;
	canMoveDown: boolean;
	onMoveUp: () => void;
	onMoveDown: () => void;
}

export interface AddElseButtonProps {
	onClick: () => void;
}

export interface AddItemButtonProps {
	onClick: () => void;
}

export interface SchemaAddBarProps {
	available: SchemaFieldOption[];
	onAdd: (name: string) => void;
}

export interface SectionProps {
	header?: ReactNode;
	body: ReactNode;
}

export interface SectionHeaderProps {
	label: 'forEach' | 'from' | 'when';
	valueInput: ReactNode;
}

export interface MappingEditorLabels {
	field: string;
	array: string;
	object: string;
	conditional: string;
	concat: string;
	addItem: string;
	addSchemaField: string;
	newField: string;
	selectPlaceholder: string;
	advanced: string;
	useSuggestions: string;
	useSchemaFields: string;
	customSuffix: string;
	currentValue: string;
	forEach: string;
	from: string;
	when: string;
	then: string;
	else: string;
	concatItem: string;
	addElse: string;
	keyPlaceholder: string;
	expressionPlaceholder: string;
	removeField: string;
	moveUp: string;
	moveDown: string;
	moveUpSymbol: string;
	moveDownSymbol: string;
	removeSymbol: string;
	useSuggestionsSymbol: string;
	reorder: string;
	mappingType: string;
	required: string;
}

export interface MappingEditorComponents {
	Container: ComponentType<ContainerProps>;
	Row: ComponentType<RowProps>;
	SectionRow: ComponentType<SectionRowProps>;
	KeyInput: ComponentType<KeyInputProps>;
	KeyLabel: ComponentType<KeyLabelProps>;
	RowLabel: ComponentType<RowLabelProps>;
	SuggestedKeyInput: ComponentType<SuggestedKeyInputProps>;
	ValueInput: ComponentType<ValueInputProps>;
	SuggestedValueInput: ComponentType<SuggestedValueInputProps>;
	RemoveButton: ComponentType<RemoveButtonProps>;
	InputResetButton: ComponentType<InputResetButtonProps>;
	Reorder: ComponentType<ReorderProps>;
	TypeSelector: ComponentType<TypeSelectorProps>;
	AddElseButton: ComponentType<AddElseButtonProps>;
	AddItemButton: ComponentType<AddItemButtonProps>;
	SchemaAddBar: ComponentType<SchemaAddBarProps>;
	Section: ComponentType<SectionProps>;
	SectionHeader: ComponentType<SectionHeaderProps>;
}
