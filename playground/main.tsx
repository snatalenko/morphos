import { StrictMode, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
	MappingEditor,
	schemaToInitialMapping,
	type MappingEditorHandle,
	type MappingEditorComponents
} from '../src/react/index.ts';
import bootstrap34 from '../src/react/bootstrap34/index.tsx';
import bootstrap53 from '../src/react/bootstrap53/index.tsx';
import { generateMapping } from '../src/openai/index.ts';
import type { RootMapping } from '../src/mappingTypes.ts';
import type { MappingSchema } from '../src/MappingSchema.ts';
import { initial, sourceSchema as sampleSource, destinationSchema as sampleDest } from './shared/initial.ts';
import { documentSchemaSamples } from './shared/schemas/index.ts';
import type { DocumentSchemaSample } from './shared/schemas/index.ts';

type EditorType = 'default' | 'bs34' | 'bs53' | 'json';

function isEmptyMapping(m: RootMapping): boolean {
	return typeof m === 'object' && m !== null && !Array.isArray(m) && Object.keys(m).length === 0;
}


const BS34_CSS = 'https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/3.4.1/css/bootstrap.min.css';
const BS53_CSS = 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css';
const documentTypes: DocumentSchemaSample['documentType'][] = [
	'Purchase Order',
	'Invoice',
	'Shipment Notice',
	'GS1 EPCIS Event'
];

function useDynamicCss(href: string | null) {
	useEffect(() => {
		const id = 'dm-dynamic-bs-css';
		const existing = document.getElementById(id) as HTMLLinkElement | null;
		if (!href) {
			if (existing)
				existing.remove();
			return;
		}
		if (existing) {
			if (existing.href !== href)
				existing.href = href;
			return;
		}
		const link = document.createElement('link');
		link.id = id;
		link.rel = 'stylesheet';
		link.href = href;
		document.head.appendChild(link);
	}, [href]);
}

function JsonTextarea({
	value,
	onChange,
	minRows = 5,
	placeholder,
	sizeKey
}: {
	value: string;
	onChange: (next: string) => void;
	minRows?: number;
	placeholder?: string;
	sizeKey?: string | number;
}) {
	const ref = useRef<HTMLTextAreaElement>(null);

	useEffect(() => {
		const el = ref.current;
		if (!el)
			return;
		el.style.height = 'auto';
		el.style.height = `${el.scrollHeight}px`;
	}, [value, sizeKey]);

	return (
		<textarea
			ref={ref}
			value={value}
			onChange={e => onChange(e.target.value)}
			rows={minRows}
			placeholder={placeholder}
			spellCheck={false}
			style={{
				width: '100%',
				fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
				fontSize: '0.8rem',
				boxSizing: 'border-box',
				resize: 'vertical',
				padding: '0.5rem',
				border: '1px solid #ccc',
				borderRadius: 4,
				background: '#fff',
				overflow: 'hidden'
			}}
		/>
	);
}

const labelStyle = { fontSize: '0.8rem', color: '#666', marginBottom: '0.25rem', display: 'block' } as const;
const errStyle = { color: '#c00', fontSize: '0.8rem', marginTop: '0.25rem' } as const;
const sectionStyle = { display: 'flex', flexDirection: 'column' as const, gap: '0.5rem', minWidth: 0 };

function App() {
	const [sourceText, setSourceText] = useState(JSON.stringify(sampleSource, null, 2));
	const [sourceSchema, setSourceSchema] = useState<MappingSchema | undefined>(sampleSource);
	const [sourceError, setSourceError] = useState<string | null>(null);

	const [destText, setDestText] = useState(JSON.stringify(sampleDest, null, 2));
	const [destSchema, setDestSchema] = useState<MappingSchema | undefined>(sampleDest);
	const [destError, setDestError] = useState<string | null>(null);

	const [editorType, setEditorType] = useState<EditorType>('default');
	const [mapping, setMapping] = useState<RootMapping>(initial);
	const [mappingText, setMappingText] = useState(JSON.stringify(initial, null, 2));
	const [mappingError, setMappingError] = useState<string | null>(null);
	const [mappingVersion, setMappingVersion] = useState(0);

	const [apiKey, setApiKey] = useState('');
	const [aiModel, setAiModel] = useState('gpt-4.1');
	const [aiInstructions, setAiInstructions] = useState('');
	const [loading, setLoading] = useState(false);
	const [aiError, setAiError] = useState<string | null>(null);

	const editorRef = useRef<MappingEditorHandle>(null);
	const userModifiedRef = useRef(false);

	const handleEditorChange = (next: RootMapping) => {
		userModifiedRef.current = true;
		setMapping(next);
		setMappingText(JSON.stringify(next, null, 2));
		setMappingError(null);
	};

	useDynamicCss(
		editorType === 'bs34' ? BS34_CSS :
			editorType === 'bs53' ? BS53_CSS :
				null
	);

	// Bootstrap 3.4 sets html { font-size: 10px } which breaks rem-based sizes
	// across the whole playground. Pin the root back to 16 px so our chrome
	// stays consistent; Bootstrap's em-based component styles are unaffected.
	useEffect(() => {
		document.documentElement.style.fontSize = editorType === 'bs34' ? '16px' : '';
	}, [editorType]);

	const updateSchemaText = (
		text: string,
		setText: (s: string) => void,
		setSchema: (s: MappingSchema | undefined) => void,
		setError: (s: string | null) => void
	) => {
		setText(text);
		if (text.trim() === '') {
			setSchema(undefined);
			setError(null);
			return;
		}
		try {
			setSchema(JSON.parse(text) as MappingSchema);
			setError(null);
		}
		catch (e) {
			setError((e as Error).message);
		}
	};

	const loadSample = (
		sample: MappingSchema | null,
		setText: (s: string) => void,
		setSchema: (s: MappingSchema | undefined) => void,
		setError: (s: string | null) => void
	) => {
		if (sample === null) {
			setText('');
			setSchema(undefined);
		}
		else {
			setText(JSON.stringify(sample, null, 2));
			setSchema(sample);
		}
		setError(null);
	};

	const loadSchemaSelection = (
		value: string,
		defaultSample: MappingSchema,
		setText: (s: string) => void,
		setSchema: (s: MappingSchema | undefined) => void,
		setError: (s: string | null) => void
	) => {
		if (value === 'sample') {
			loadSample(defaultSample, setText, setSchema, setError);
			return;
		}
		if (value === 'empty') {
			loadSample(null, setText, setSchema, setError);
			return;
		}

		const selected = documentSchemaSamples.find(sample => sample.id === value);
		if (selected)
			loadSample(selected.schema, setText, setSchema, setError);
	};

	const handleDestSchemaSelect = (value: string) => {
		loadSchemaSelection(value, sampleDest, setDestText, setDestSchema, setDestError);

		if (!userModifiedRef.current || isEmptyMapping(mapping)) {
			const schema = value === 'sample'
				? sampleDest
				: value === 'empty'
					? undefined
					: documentSchemaSamples.find(s => s.id === value)?.schema;
			const autoMapping = schemaToInitialMapping(schema);
			setMapping(autoMapping);
			setMappingText(JSON.stringify(autoMapping, null, 2));
			setMappingVersion(v => v + 1);
			userModifiedRef.current = false;
		}
	};

	const switchEditor = (next: EditorType) => {
		setMappingError(null);
		setEditorType(next);
	};

	const updateMappingText = (text: string) => {
		userModifiedRef.current = true;
		setMappingText(text);
		if (text.trim() === '') {
			setMapping({});
			setMappingError(null);
			return;
		}
		try {
			setMapping(JSON.parse(text) as RootMapping);
			setMappingError(null);
		}
		catch (e) {
			setMappingError((e as Error).message);
		}
	};

	const generateFromAi = async () => {
		if (!apiKey.trim()) {
			setAiError('Provide an OpenAI API key');
			return;
		}
		if (!sourceSchema || !destSchema) {
			setAiError('Both source and destination schemas are required');
			return;
		}
		setLoading(true);
		setAiError(null);
		try {
			const result = await generateMapping({
				sourceSchema,
				destinationSchema: destSchema,
				apiKey,
				model: aiModel,
				instructions: aiInstructions || undefined,
				dangerouslyAllowBrowser: true
			});
			setMapping(result);
			setMappingText(JSON.stringify(result, null, 2));
			setMappingVersion(v => v + 1);
		}
		catch (e) {
			setAiError((e as Error).message);
		}
		finally {
			setLoading(false);
		}
	};

	const components: Partial<MappingEditorComponents> | undefined =
		editorType === 'bs34' ? bootstrap34 :
			editorType === 'bs53' ? bootstrap53 :
				undefined;

	const schemaSampleOptions = (
		<>
			<option value="">Load…</option>
			<option value="sample">PO to invoice sample</option>
			{documentTypes.map(documentType => (
				<optgroup key={documentType} label={documentType}>
					{documentSchemaSamples
						.filter(sample => sample.documentType === documentType)
						.map(sample => (
							<option key={sample.id} value={sample.id}>{sample.label}</option>
						))}
				</optgroup>
			))}
			<option value="empty">Empty</option>
		</>
	);

	return (
		<div style={{
			fontFamily: 'system-ui, -apple-system, sans-serif',
			padding: '1rem 1.5rem',
			color: '#222',
			maxWidth: 1800,
			margin: '0 auto'
		}}>
			<style>
				{`
					.dm-mapping-value {
						font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace !important;
					}
				`}
			</style>
			<header style={{ marginBottom: '1rem' }}>
				<h1 style={{ marginBottom: '0.25rem', fontSize: '1.5rem' }}>declarative-mapper playground</h1>
				<p style={{ margin: 0, color: '#666', fontSize: '0.85rem' }}>
					Edit the schemas on the sides, the mapping in the middle, or generate one with OpenAI.
				</p>
			</header>

			<div style={{
				display: 'grid',
				gridTemplateColumns: 'minmax(280px, 1fr) minmax(440px, 2fr) minmax(280px, 1fr)',
				gap: '1rem',
				alignItems: 'start'
			}}>
				{/* Source schema */}
				<section style={sectionStyle}>
					<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
						<h2 style={{ margin: 0, fontSize: '1rem' }}>Source schema</h2>
						<select
							value=""
							onChange={e => loadSchemaSelection(
								e.target.value,
								sampleSource,
								setSourceText,
								setSourceSchema,
								setSourceError
							)}
							style={{ fontSize: '0.85rem' }}
						>
							{schemaSampleOptions}
						</select>
					</div>
					<label style={labelStyle}>JSON Schema describing the input data</label>
					<JsonTextarea
						value={sourceText}
						onChange={text => updateSchemaText(text, setSourceText, setSourceSchema, setSourceError)}
						placeholder='{ "type": "object", "properties": { ... } }'
						sizeKey={editorType}
					/>
					{sourceError && <div style={errStyle}>{sourceError}</div>}
				</section>

				{/* Mapping */}
				<section style={sectionStyle}>
					<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
						<h2 style={{ margin: 0, fontSize: '1rem' }}>Mapping</h2>
						<div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
							<label style={{ fontSize: '0.85rem', color: '#666' }}>Editor:</label>
							<select
								value={editorType}
								onChange={e => switchEditor(e.target.value as EditorType)}
								style={{ fontSize: '0.85rem' }}
							>
								<option value="default">Default HTML</option>
								<option value="bs34">Bootstrap 3.4</option>
								<option value="bs53">Bootstrap 5.3</option>
								<option value="json">Plain JSON</option>
							</select>
						</div>
					</div>

					<div style={{
						border: '1px solid #e3e7ec',
						borderRadius: 4,
						padding: '0.75rem',
						background: '#fff',
						minHeight: 200
					}}>
						{editorType === 'json' ? (
							<JsonTextarea
								value={mappingText}
								onChange={updateMappingText}
								placeholder='{ "field": "EXPRESSION" }'
								sizeKey={editorType}
							/>
						) : (
							<MappingEditor
								ref={editorRef}
								key={`${editorType}-${mappingVersion}`}
								defaultValue={mapping}
								onChange={handleEditorChange}
								schema={destSchema}
								sourceSchema={sourceSchema}
								components={components}
							/>
						)}
						{mappingError && <div style={errStyle}>{mappingError}</div>}
					</div>

					<div style={{
						marginTop: '0.5rem',
						padding: '0.75rem',
						background: '#f5f7fa',
						border: '1px solid #e3e7ec',
						borderRadius: 4
					}}>
						<h3 style={{ margin: '0 0 0.5rem', fontSize: '0.9rem' }}>Generate with OpenAI</h3>
						<label style={labelStyle}>API key (not stored — memory only)</label>
						<input
							type="password"
							value={apiKey}
							onChange={e => setApiKey(e.target.value)}
							placeholder="sk-..."
							style={{
								width: '100%',
								fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
								fontSize: '0.85rem',
								padding: '0.4rem 0.5rem',
								boxSizing: 'border-box',
								border: '1px solid #ccc',
								borderRadius: 4
							}}
						/>
						<div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.25rem' }}>
							<label style={{ ...labelStyle, marginBottom: 0 }}>Model</label>
							<select
								value={aiModel}
								onChange={e => setAiModel(e.target.value)}
								style={{ fontSize: '0.85rem', padding: '0.4rem 0.5rem', border: '1px solid #ccc', borderRadius: 4 }}
							>
								<option value="gpt-4.1">gpt-4.1</option>
								<option value="gpt-4.1-mini">gpt-4.1-mini</option>
								<option value="gpt-4o">gpt-4o</option>
								<option value="gpt-4o-mini">gpt-4o-mini</option>
								<option value="o4-mini">o4-mini</option>
								<option value="o3">o3</option>
								<option value="gpt-5.5">gpt-5.5</option>
							</select>
						</div>
						<label style={{ ...labelStyle, marginTop: '0.5rem' }}>Instructions (optional)</label>
						<textarea
							value={aiInstructions}
							onChange={e => setAiInstructions(e.target.value)}
							rows={2}
							placeholder="e.g. use snake_case for all field names, map dates to ISO 8601 strings…"
							style={{
								width: '100%',
								fontFamily: 'system-ui, -apple-system, sans-serif',
								fontSize: '0.85rem',
								padding: '0.4rem 0.5rem',
								boxSizing: 'border-box',
								border: '1px solid #ccc',
								borderRadius: 4,
								resize: 'vertical'
							}}
						/>
						<div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
							<button
								type="button"
								onClick={generateFromAi}
								disabled={loading || !apiKey.trim() || !sourceSchema || !destSchema}
								style={{
									padding: '0.4rem 0.8rem',
									background: loading ? '#999' : '#1a73e8',
									color: '#fff',
									border: 'none',
									borderRadius: 4,
									cursor: loading ? 'wait' : 'pointer'
								}}
							>
								{loading ? 'Generating…' : 'Generate mapping'}
							</button>
							<span style={{ fontSize: '0.75rem', color: '#888' }}>
								Uses both schemas above. Output replaces the mapping.
							</span>
						</div>
						{aiError && <div style={errStyle}>{aiError}</div>}
					</div>
				</section>

				{/* Destination schema */}
				<section style={sectionStyle}>
					<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
						<h2 style={{ margin: 0, fontSize: '1rem' }}>Destination schema</h2>
						<select
							value=""
							onChange={e => handleDestSchemaSelect(e.target.value)}
							style={{ fontSize: '0.85rem' }}
						>
							{schemaSampleOptions}
						</select>
					</div>
					<label style={labelStyle}>JSON Schema describing the output data</label>
					<JsonTextarea
						value={destText}
						onChange={text => updateSchemaText(text, setDestText, setDestSchema, setDestError)}
						placeholder='{ "type": "object", "properties": { ... } }'
						sizeKey={editorType}
					/>
					{destError && <div style={errStyle}>{destError}</div>}
				</section>
			</div>
		</div>
	);
}

const container = document.getElementById('root');
if (!container)
	throw new Error('Root element not found');

createRoot(container).render(
	<StrictMode>
		<App />
	</StrictMode>
);
