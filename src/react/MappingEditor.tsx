import {
	useState,
	useEffect,
	useImperativeHandle,
	useRef,
	useMemo,
	forwardRef
} from 'react';
import type { RootMapping } from '../mappingTypes.ts';
import { ComponentsContext } from './ComponentsContext.ts';
import { LabelsContext } from './LabelsContext.ts';
import { defaultComponents } from './defaultComponents.tsx';
import { defaultLabels } from './defaultLabels.ts';
import { generateInitialMapping } from '../utils/generateInitialMapping.ts';
import { rootToEntries, entriesToProps, type Entry } from './utils/index.ts';
import { EntriesEditor } from './EntriesEditor.tsx';
import type { MappingEditorComponents, MappingEditorLabels, JsonSchema } from './types.ts';

export interface MappingEditorHandle {
	readonly value: RootMapping;
}

export interface MappingEditorProps {
	value?: RootMapping;
	defaultValue?: RootMapping;
	onChange?: (next: RootMapping) => void;
	components?: Partial<MappingEditorComponents>;
	labels?: Partial<MappingEditorLabels>;
	schema?: JsonSchema;
	sourceSchema?: JsonSchema;
}

const MappingEditor = forwardRef<MappingEditorHandle, MappingEditorProps>(function MappingEditor(props, ref) {
	const [entries, setEntries] = useState<Entry[]>(() => {
		const root = props.value ?? props.defaultValue;
		if (root !== undefined)
			return rootToEntries(root);
		if (props.schema)
			return rootToEntries(generateInitialMapping(props.schema));
		return [];
	});

	useEffect(() => {
		if (props.value !== undefined)
			setEntries(rootToEntries(props.value));
	}, [props.value]);

	const entriesRef = useRef(entries);
	entriesRef.current = entries;

	useImperativeHandle(ref, () => ({
		get value(): RootMapping {
			return entriesToProps(entriesRef.current);
		}
	}), []);

	const mergedComponents = useMemo(
		() => ({ ...defaultComponents, ...props.components }),
		[props.components]
	);
	const mergedLabels = useMemo(
		() => ({ ...defaultLabels, ...props.labels }),
		[props.labels]
	);

	const handleEntriesChange = (next: Entry[]) => {
		setEntries(next);
		if (props.onChange)
			props.onChange(entriesToProps(next));
	};

	return (
		<LabelsContext.Provider value={mergedLabels}>
			<ComponentsContext.Provider value={mergedComponents}>
				<div className="dm-mapping-editor">
					<EntriesEditor
						entries={entries}
						onChange={handleEntriesChange}
						schema={props.schema}
						sourceSchema={props.sourceSchema}
					/>
				</div>
			</ComponentsContext.Provider>
		</LabelsContext.Provider>
	);
});

export default MappingEditor;
