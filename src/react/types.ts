import type { ComponentType, ReactNode } from 'react';

export type AddKind = 'expr' | 'array' | 'object';
export type EntryKind = AddKind;

export type { MappingSchema } from '../MappingSchema.ts';
import type { MappingSchema } from '../MappingSchema.ts';

export interface SchemaFieldOption {
	name: string;
	schema: MappingSchema;
	required: boolean;
}

export interface SourceFieldMatch {
	path: string;
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
	available: SchemaFieldOption[];
	placeholder?: string;
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
	emptyLabel?: string;
	suggestions: SourceFieldMatch[];
}

export interface RemoveButtonProps {
	onClick: () => void;
}

export interface ReorderProps {
	canMoveUp: boolean;
	canMoveDown: boolean;
	onMoveUp: () => void;
	onMoveDown: () => void;
}

export interface AddBarProps {
	onAdd: (kind: AddKind) => void;
}

export interface SchemaAddBarProps {
	available: SchemaFieldOption[];
	onAdd: (name: string) => void;
}

export interface SectionProps {
	header: ReactNode;
	body: ReactNode;
}

export interface SectionHeaderProps {
	label: 'forEach' | 'from';
	valueInput: ReactNode;
}

export interface MappingEditorLabels {
	field: string;
	array: string;
	object: string;
	addField: string;
	addArray: string;
	addObject: string;
	addSchemaField: string;
	selectPlaceholder: string;
	advanced: string;
	useSuggestions: string;
	useSchemaFields: string;
	customSuffix: string;
	forEach: string;
	from: string;
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
	SuggestedKeyInput: ComponentType<SuggestedKeyInputProps>;
	ValueInput: ComponentType<ValueInputProps>;
	SuggestedValueInput: ComponentType<SuggestedValueInputProps>;
	RemoveButton: ComponentType<RemoveButtonProps>;
	Reorder: ComponentType<ReorderProps>;
	TypeSelector: ComponentType<TypeSelectorProps>;
	AddBar: ComponentType<AddBarProps>;
	SchemaAddBar: ComponentType<SchemaAddBarProps>;
	Section: ComponentType<SectionProps>;
	SectionHeader: ComponentType<SectionHeaderProps>;
}
