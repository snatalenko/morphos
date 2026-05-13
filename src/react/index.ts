export { default as MappingEditor } from './MappingEditor.tsx';
export { schemaToInitialMapping } from './utils/index.ts';
export type { MappingEditorProps, MappingEditorHandle } from './MappingEditor.tsx';
export { defaultComponents } from './defaultComponents.tsx';
export { defaultLabels } from './defaultLabels.ts';
export { LabelsContext } from './LabelsContext.ts';
export type {
	MappingEditorComponents,
	MappingEditorLabels,
	AddKind,
	EntryKind,
	TypeSelectorProps,
	ContainerProps,
	RowProps,
	SectionRowProps,
	KeyInputProps,
	KeyLabelProps,
	RowLabelProps,
	SuggestedKeyInputProps,
	ValueInputProps,
	SuggestedValueInputProps,
	SourceFieldMatch,
	RemoveButtonProps,
	InputResetButtonProps,
	ReorderProps,
	AddElseButtonProps,
	AddItemButtonProps,
	SchemaAddBarProps,
	SchemaFieldOption,
	MappingSchema,
	SectionProps,
	SectionHeaderProps
} from './types.ts';
