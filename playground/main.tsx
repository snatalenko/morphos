import { StrictMode, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
	MappingEditor,
	type MappingEditorHandle,
	type MappingEditorComponents
} from '../src/react/index.ts';
import { generateInitialMapping, sampleForSchema } from '../src/utils/index.ts';
import bootstrap34 from '../src/react/bootstrap34/index.tsx';
import bootstrap53 from '../src/react/bootstrap53/index.tsx';
import {
	SchemaEditor,
	type SchemaEditorComponents
} from '../src/react-schema-editor/index.ts';
import schemaBootstrap34 from '../src/react-schema-editor/bootstrap34/index.tsx';
import schemaBootstrap53 from '../src/react-schema-editor/bootstrap53/index.tsx';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import {
	generateMapping as generateOpenAiMapping,
	type ReasoningEffort as OpenAiReasoningEffort
} from '../src/openai/index.ts';
import {
	generateMapping as generateAnthropicMapping,
	type ReasoningEffort as AnthropicReasoningEffort
} from '../src/anthropic/index.ts';
import createScript from '../src/createScript.ts';
import { createGlobalContext } from '../src/runtime/index.ts';
import type { RootMapping } from '../src/mappingTypes.ts';
import type { JsonSchema } from '../src/JsonSchema.ts';
import type { MappingGenerationUsage } from '../src/utils/MappingGenerationUsage.ts';
import {
	initial,
	sourceData as sampleSourceData,
	sourceSchema as sampleSource,
	destinationSchema as sampleDest
} from './shared/initial.ts';
import { documentSchemaSamples } from './shared/schemas/index.ts';
import type { DocumentSchemaSample } from './shared/schemas/index.ts';
import type { JSONSchema4 } from 'json-schema';

type EditorType = 'default' | 'bs34' | 'bs53' | 'json';
type SourceTab = 'schema' | 'data';
type DestinationTab = 'schema' | 'result';
type AiProvider = 'openai' | 'anthropic';
type AiReasoningEffort = '' | 'none' | 'minimal' | 'low' | 'medium' | 'high' | 'xhigh' | 'max';

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
const emptySchema: JsonSchema = { type: 'object', properties: {} };
const aiModelCachePrefix = 'morphos.playground.aiModels';
const aiProviderLabels: Record<AiProvider, string> = {
	openai: 'OpenAI',
	anthropic: 'Anthropic Claude'
};
const defaultFetchedAiModel: Partial<Record<AiProvider, string>> = {
	openai: 'gpt-5-mini'
};
const defaultFetchedReasoningEffort: Partial<Record<AiProvider, AiReasoningEffort>> = {
	openai: 'low'
};
const aiReasoningEffortOptions: Record<AiProvider, { value: AiReasoningEffort; label: string }[]> = {
	openai: [
		{ value: '', label: 'Provider default' },
		{ value: 'none', label: 'None' },
		{ value: 'minimal', label: 'Minimal' },
		{ value: 'low', label: 'Low' },
		{ value: 'medium', label: 'Medium' },
		{ value: 'high', label: 'High' },
		{ value: 'xhigh', label: 'Extra high' }
	],
	anthropic: [
		{ value: '', label: 'Provider default' },
		{ value: 'low', label: 'Low' },
		{ value: 'medium', label: 'Medium' },
		{ value: 'high', label: 'High' },
		{ value: 'xhigh', label: 'Extra high' },
		{ value: 'max', label: 'Max' }
	]
};

function getModelCacheKey(provider: AiProvider): string {
	return `${aiModelCachePrefix}.${provider}`;
}

function loadCachedModels(provider: AiProvider): string[] | undefined {
	try {
		const raw = localStorage.getItem(getModelCacheKey(provider));
		if (!raw)
			return undefined;

		const parsed = JSON.parse(raw) as unknown;
		if (!Array.isArray(parsed))
			return undefined;

		const models = parsed.filter((model): model is string => typeof model === 'string' && model.trim() !== '');
		return models.length ? sortModels(models) : undefined;
	}
	catch {
		return undefined;
	}
}

function cacheModels(provider: AiProvider, models: string[]): void {
	try {
		localStorage.setItem(getModelCacheKey(provider), JSON.stringify(sortModels(models)));
	}
	catch {
		// localStorage can be unavailable in private or restricted browser modes.
	}
}

function getReasoningEffortOptions(provider: AiProvider) {
	return aiReasoningEffortOptions[provider];
}

function isReasoningEffortSupported(provider: AiProvider, effort: AiReasoningEffort): boolean {
	return getReasoningEffortOptions(provider).some(option => option.value === effort);
}

function getDefaultFetchedModel(provider: AiProvider, models: string[]): string {
	const defaultModel = defaultFetchedAiModel[provider];
	return defaultModel && models.includes(defaultModel) ? defaultModel : '';
}

function getDefaultFetchedReasoningEffort(provider: AiProvider, model: string): AiReasoningEffort {
	const defaultReasoningEffort = defaultFetchedReasoningEffort[provider];
	return model && defaultReasoningEffort && isReasoningEffortSupported(provider, defaultReasoningEffort) ?
		defaultReasoningEffort :
		'';
}

function sortModels(models: string[]): string[] {
	return [...models].sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
}

function formatTokenCount(value?: number | null): string {
	return typeof value === 'number' ? value.toLocaleString() : 'n/a';
}

async function fetchOpenAiModels(apiKey: string): Promise<string[]> {
	const client = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
	const models: string[] = [];
	for await (const model of client.models.list())
		models.push(model.id);
	return models;
}

async function fetchAnthropicModels(apiKey: string): Promise<string[]> {
	const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
	const models: string[] = [];
	for await (const model of client.models.list())
		models.push(model.id);
	return models;
}

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
		<div className="dm-code-frame">
			<div className="dm-code-toolbar">
				<span className="dm-code-dots" aria-hidden="true">
					<span />
					<span />
					<span />
				</span>
				<span className="dm-code-label">JSON</span>
			</div>
			<textarea
				ref={ref}
				className="dm-code-textarea"
				value={value}
				onChange={e => onChange(e.target.value)}
				rows={minRows}
				placeholder={placeholder}
				spellCheck={false}
			/>
		</div>
	);
}

const labelStyle = { fontSize: '0.8rem', color: '#666', marginBottom: '0.25rem', display: 'block' } as const;
const errStyle = { color: '#c00', fontSize: '0.8rem', marginTop: '0.25rem' } as const;
const sectionStyle = { display: 'flex', flexDirection: 'column' as const, gap: '0.5rem', minWidth: 0 };
const primaryButtonStyle = {
	padding: '0.4rem 0.8rem',
	background: '#1a73e8',
	color: '#fff',
	border: 'none',
	borderRadius: 4,
	cursor: 'pointer'
} as const;
const secondaryButtonStyle = {
	padding: '0.35rem 0.7rem',
	border: '1px solid #c8d1dc',
	borderRadius: 4,
	background: '#fff',
	color: '#334155',
	cursor: 'pointer',
	fontSize: '0.8rem'
} as const;
const aiControlLabelStyle = { ...labelStyle, marginBottom: 0, minWidth: '5rem' } as const;
const aiControlRowStyle = {
	display: 'flex',
	gap: '0.5rem',
	alignItems: 'center',
	marginTop: '0.25rem'
} as const;

function tabStyle(active: boolean) {
	return {
		padding: '0.35rem 0.7rem',
		border: `1px solid ${active ? '#9db2ce' : '#ccd3dd'}`,
		borderRadius: 4,
		background: active ? '#e8eef7' : '#fff',
		color: active ? '#1f3a5f' : '#333',
		cursor: 'pointer',
		fontSize: '0.8rem',
		fontWeight: active ? 600 : 400
	} as const;
}

function App() {
	const [sourceTab, setSourceTab] = useState<SourceTab>('schema');
	const [destinationTab, setDestinationTab] = useState<DestinationTab>('schema');
	const [editorExpanded, setEditorExpanded] = useState(false);
	const [aiPanelVisible, setAiPanelVisible] = useState(false);

	const [sourceText, setSourceText] = useState(JSON.stringify(sampleSource, null, 2));
	const [sourceSchema, setSourceSchema] = useState<JsonSchema | undefined>(sampleSource);
	const [sourceError, setSourceError] = useState<string | null>(null);
	const [sourceSchemaSelection, setSourceSchemaSelection] = useState('sample');
	const [sourceDataText, setSourceDataText] = useState(JSON.stringify(sampleSourceData, null, 2));
	const [sourceDataError, setSourceDataError] = useState<string | null>(null);

	const [destText, setDestText] = useState(JSON.stringify(sampleDest, null, 2));
	const [destSchema, setDestSchema] = useState<JsonSchema | undefined>(sampleDest);
	const [destError, setDestError] = useState<string | null>(null);
	const [destSchemaSelection, setDestSchemaSelection] = useState('sample');
	const [resultText, setResultText] = useState('');
	const [runError, setRunError] = useState<string | null>(null);
	const [runMs, setRunMs] = useState<number | null>(null);

	const [editorType, setEditorType] = useState<EditorType>('json');
	const [mapping, setMapping] = useState<RootMapping>(initial);
	const [mappingText, setMappingText] = useState(JSON.stringify(initial, null, 2));
	const [mappingError, setMappingError] = useState<string | null>(null);
	const [mappingVersion, setMappingVersion] = useState(0);

	const [cachedAiModels, setCachedAiModels] = useState<Partial<Record<AiProvider, string[]>>>(() => ({
		openai: loadCachedModels('openai'),
		anthropic: loadCachedModels('anthropic')
	}));
	const [aiProvider, setAiProvider] = useState<AiProvider>('openai');
	const [apiKey, setApiKey] = useState('');
	const [aiModel, setAiModel] = useState(() => getDefaultFetchedModel(
		'openai',
		loadCachedModels('openai') ?? []
	));
	const [aiReasoningEffort, setAiReasoningEffort] = useState<AiReasoningEffort>(() => {
		const cachedOpenAiModels = loadCachedModels('openai') ?? [];
		const model = getDefaultFetchedModel('openai', cachedOpenAiModels);
		return getDefaultFetchedReasoningEffort('openai', model);
	});
	const [aiInstructions, setAiInstructions] = useState('');
	const [aiSendCurrentMappingTemplate, setAiSendCurrentMappingTemplate] = useState(true);
	const [aiGenerateMappingTemplate, setAiGenerateMappingTemplate] = useState(false);
	const [aiGenerateRequiredFields, setAiGenerateRequiredFields] = useState(false);
	const [loading, setLoading] = useState(false);
	const [loadingModels, setLoadingModels] = useState(false);
	const [aiModelMessage, setAiModelMessage] = useState<string | null>(null);
	const [aiUsage, setAiUsage] = useState<MappingGenerationUsage | null>(null);
	const [aiError, setAiError] = useState<string | null>(null);

	const editorRef = useRef<MappingEditorHandle>(null);
	const userModifiedRef = useRef(false);
	const apiKeyProviderLabel = aiProvider === 'openai' ? 'OpenAI' : 'Anthropic';
	const apiKeyPlaceholder = aiProvider === 'openai' ? 'sk-...' : 'sk-ant-api...';
	const aiModels = cachedAiModels[aiProvider] ?? [];

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

	useEffect(() => {
		document.body.style.overflow = editorExpanded ? 'hidden' : '';
		return () => {
			document.body.style.overflow = '';
		};
	}, [editorExpanded]);

	const updateSchemaText = (
		text: string,
		setText: (s: string) => void,
		setSchema: (s: JsonSchema | undefined) => void,
		setError: (s: string | null) => void,
		onUserEdit: () => void
	) => {
		onUserEdit();
		setText(text);
		if (text.trim() === '') {
			setSchema(undefined);
			setError(null);
			return;
		}
		try {
			setSchema(JSON.parse(text) as JsonSchema);
			setError(null);
		}
		catch (e) {
			setError((e as Error).message);
		}
	};

	const updateSourceSchemaFromEditor = (next: JsonSchema) => {
		setSourceSchemaSelection('');
		setSourceSchema(next);
		setSourceText(JSON.stringify(next, null, 2));
		setSourceError(null);
	};

	const updateDestSchemaFromEditor = (next: JsonSchema) => {
		setDestSchemaSelection('');
		setDestSchema(next);
		setDestText(JSON.stringify(next, null, 2));
		setDestError(null);
	};

	const updateSourceDataText = (text: string) => {
		setSourceDataText(text);
		if (text.trim() === '') {
			setSourceDataError(null);
			return;
		}
		try {
			JSON.parse(text);
			setSourceDataError(null);
		}
		catch (e) {
			setSourceDataError((e as Error).message);
		}
	};

	const formatSourceData = () => {
		try {
			const parsed = sourceDataText.trim() ? JSON.parse(sourceDataText) : {};
			setSourceDataText(JSON.stringify(parsed, null, 2));
			setSourceDataError(null);
		}
		catch (e) {
			setSourceDataError((e as Error).message);
		}
	};

	const generateSourceDataSample = (schema = sourceSchema) => {
		if (!schema) {
			setSourceDataError('Source schema is required');
			return;
		}
		try {
			const sample = sampleForSchema(schema as unknown as JSONSchema4);
			setSourceDataText(JSON.stringify(sample, null, 2));
			setSourceDataError(null);
			if (mode === 'test')
				setSourceTab('data');
		}
		catch (e) {
			setSourceDataError((e as Error).message);
		}
	};

	const loadSample = (
		sample: JsonSchema | null,
		setText: (s: string) => void,
		setSchema: (s: JsonSchema | undefined) => void,
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
		defaultSample: JsonSchema,
		setText: (s: string) => void,
		setSchema: (s: JsonSchema | undefined) => void,
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

	const handleSourceSchemaSelect = (value: string) => {
		setSourceSchemaSelection(value);
		if (value === '')
			return;

		loadSchemaSelection(value, sampleSource, setSourceText, setSourceSchema, setSourceError);

		const schema = value === 'sample'
			? sampleSource
			: value === 'empty'
				? undefined
				: documentSchemaSamples.find(s => s.id === value)?.schema;
		if (value === 'sample') {
			setSourceDataText(JSON.stringify(sampleSourceData, null, 2));
			setSourceDataError(null);
		}
		else if (schema) {
			try {
				setSourceDataText(JSON.stringify(sampleForSchema(schema as unknown as JSONSchema4), null, 2));
				setSourceDataError(null);
			}
			catch {
				setSourceDataText('');
			}
		}
		else if (value === 'empty') {
			setSourceDataText('');
			setSourceDataError(null);
		}
	};

	const handleDestSchemaSelect = (value: string) => {
		setDestSchemaSelection(value);
		if (value === '')
			return;

		loadSchemaSelection(value, sampleDest, setDestText, setDestSchema, setDestError);

		if (!userModifiedRef.current || isEmptyMapping(mapping)) {
			const schema = value === 'sample'
				? sampleDest
				: value === 'empty'
					? undefined
					: documentSchemaSamples.find(s => s.id === value)?.schema;
			const autoMapping = generateInitialMapping(schema);
			setMapping(autoMapping);
			setMappingText(JSON.stringify(autoMapping, null, 2));
			setMappingVersion(v => v + 1);
			userModifiedRef.current = false;
		}
	};

	const switchEditor = (next: EditorType) => {
		if (next === 'json' && editorType !== 'json') {
			const current = editorRef.current?.value;
			if (current) {
				setMapping(current);
				setMappingText(JSON.stringify(current, null, 2));
			}
		}
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

	const handleAiProviderChange = (provider: AiProvider) => {
		const model = getDefaultFetchedModel(provider, cachedAiModels[provider] ?? []);
		setAiProvider(provider);
		setAiModel(model);
		setAiReasoningEffort(
			getDefaultFetchedReasoningEffort(provider, model) ||
				(isReasoningEffortSupported(provider, aiReasoningEffort) ? aiReasoningEffort : '')
		);
		setApiKey('');
		setAiModelMessage(null);
		setAiUsage(null);
		setAiError(null);
	};

	const fetchAiModels = async () => {
		if (!apiKey.trim()) {
			setAiError(`Provide an ${apiKeyProviderLabel} API key`);
			return;
		}

		setLoadingModels(true);
		setAiModelMessage(null);
		setAiError(null);
		try {
			const models = aiProvider === 'openai'
				? await fetchOpenAiModels(apiKey)
				: await fetchAnthropicModels(apiKey);

			if (!models.length)
				throw new Error(`${aiProviderLabels[aiProvider]} returned no models`);

			const sortedModels = sortModels(models);
			const model = getDefaultFetchedModel(aiProvider, sortedModels);

			cacheModels(aiProvider, sortedModels);
			setCachedAiModels(current => ({ ...current, [aiProvider]: sortedModels }));
			setAiModel(model);
			setAiReasoningEffort(getDefaultFetchedReasoningEffort(aiProvider, model));
			setAiModelMessage(`Loaded ${models.length} models`);
		}
		catch (e) {
			setAiError((e as Error).message);
		}
		finally {
			setLoadingModels(false);
		}
	};

	const runMapping = () => {
		setRunError(null);
		setRunMs(null);
		setSourceTab('data');
		setDestinationTab('result');
		try {
			const currentMapping = editorType === 'json'
				? JSON.parse(mappingText || '{}') as RootMapping
				: mapping;
			const sourceData = sourceDataText.trim() ? JSON.parse(sourceDataText) : {};
			const start = performance.now();
			const script = createScript(currentMapping);
			const run = new Function(
				'$input',
				'$createGlobalContext',
				`var $result;\n${script}\nreturn $result;`
			);
			const result = run(sourceData, createGlobalContext);
			setRunMs(performance.now() - start);
			setResultText(JSON.stringify(result, null, 2));
		}
		catch (e) {
			setRunError((e as Error).message);
			setResultText('');
		}
	};

	const generateFromAi = async () => {
		if (!apiKey.trim()) {
			setAiError(`Provide an ${apiKeyProviderLabel} API key`);
			return;
		}
		if (!sourceSchema || !destSchema) {
			setAiError('Both source and destination schemas are required');
			return;
		}
		if (!aiModel) {
			setAiError('Select a model');
			return;
		}
		setLoading(true);
		setAiError(null);
		setAiUsage(null);
		try {
			const commonOptions = {
				model: aiModel,
				instructions: aiInstructions || undefined,
				mappingTemplate: aiSendCurrentMappingTemplate && !isEmptyMapping(mapping) ? mapping : undefined,
				generateMappingTemplate: aiGenerateMappingTemplate,
				generateRequiredFields: aiGenerateRequiredFields,
				onUsage: setAiUsage,
				dangerouslyAllowBrowser: true
			};
			const result = aiProvider === 'openai'
				? await generateOpenAiMapping(sourceSchema, destSchema, apiKey, {
					...commonOptions,
					reasoningEffort: aiReasoningEffort ?
						aiReasoningEffort as OpenAiReasoningEffort :
						undefined
				})
				: await generateAnthropicMapping(sourceSchema, destSchema, apiKey, {
					...commonOptions,
					reasoningEffort: aiReasoningEffort ?
						aiReasoningEffort as AnthropicReasoningEffort :
						undefined
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

	const schemaComponents: Partial<SchemaEditorComponents> | undefined =
		editorType === 'bs34' ? schemaBootstrap34 :
			editorType === 'bs53' ? schemaBootstrap53 :
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
		<div className={`dm-playground dm-playground-theme-${editorType}`} style={{
			fontFamily: 'system-ui, -apple-system, sans-serif',
			padding: '1rem 1.5rem',
			color: '#222',
			maxWidth: 1800,
			margin: '0 auto'
		}}>
			<header style={{ marginBottom: '1.5rem' }}>
				<h1 style={{ marginBottom: '0.25rem', fontSize: '1.5rem' }}>Morphos Playground</h1>
				<p style={{ margin: 0, color: '#666', fontSize: '0.85rem' }}>
					Edit the schemas on the sides, the mapping in the middle, or generate one with AI.
				</p>
				<div style={{
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
					gap: '0.75rem',
					flexWrap: 'wrap',
					marginTop: '0.75rem'
				}}>
					<div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
						<button type="button" style={tabStyle(editorType === 'json')} onClick={() => switchEditor('json')}>
							Raw Json
						</button>
						<button type="button" style={tabStyle(editorType === 'default')} onClick={() => switchEditor('default')}>
							Plain HTML
						</button>
						<button type="button" style={tabStyle(editorType === 'bs34')} onClick={() => switchEditor('bs34')}>
							Bootstrap 3.4
						</button>
						<button type="button" style={tabStyle(editorType === 'bs53')} onClick={() => switchEditor('bs53')}>
							Bootstrap 5.3
						</button>
					</div>
				</div>
			</header>

			<div style={{
				display: 'grid',
				gridTemplateColumns: 'minmax(280px, 1fr) minmax(440px, 2fr) minmax(280px, 1fr)',
				gap: '1rem',
				alignItems: 'start'
			}}>
				{/* Source */}
				{!editorExpanded && <section style={sectionStyle}>
					<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
						<h2 style={{ margin: 0, fontSize: '1rem' }}>Source</h2>
						<div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
							<button type="button" style={tabStyle(sourceTab === 'schema')} onClick={() => setSourceTab('schema')}>
								Schema
							</button>
							<button type="button" style={tabStyle(sourceTab === 'data')} onClick={() => setSourceTab('data')}>
								Data
							</button>
						</div>
					</div>
					{sourceTab === 'schema' ? (
						<>
							<div style={{
								display: 'flex',
								justifyContent: 'space-between',
								alignItems: 'center',
								gap: '0.5rem',
								flexWrap: 'wrap'
							}}>
								<select
									className="dm-playground-select"
									value={sourceSchemaSelection}
									onChange={e => handleSourceSchemaSelect(e.target.value)}
									style={{ flex: '1 1 220px', minWidth: 0, fontSize: '0.85rem' }}
								>
									{schemaSampleOptions}
								</select>
							</div>
							{editorType === 'json' ? (
								<JsonTextarea
									value={sourceText}
									onChange={text => updateSchemaText(
										text,
										setSourceText,
										setSourceSchema,
										setSourceError,
										() => setSourceSchemaSelection('')
									)}
									placeholder='{ "type": "object", "properties": { ... } }'
									sizeKey={`${editorType}-${sourceTab}`}
								/>
							) : (
								<SchemaEditor
									value={sourceSchema ?? emptySchema}
									onChange={updateSourceSchemaFromEditor}
									components={schemaComponents}
								/>
							)}
							{sourceError && <div style={errStyle}>{sourceError}</div>}
						</>
					) : (
						<>
							<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
								<label style={{ ...labelStyle, marginBottom: 0 }}>JSON document to transform</label>
								<div style={{ display: 'flex', gap: '0.35rem' }}>
									<button type="button" style={secondaryButtonStyle} onClick={() => generateSourceDataSample()}>
										Generate sample
									</button>
									<button type="button" style={secondaryButtonStyle} onClick={formatSourceData}>
										Format
									</button>
								</div>
							</div>
							<JsonTextarea
								value={sourceDataText}
								onChange={updateSourceDataText}
								placeholder='{ "PO_HDR": { ... }, "LINES": [ ... ] }'
								sizeKey={`${editorType}-${sourceTab}`}
							/>
							{sourceDataError && <div style={errStyle}>{sourceDataError}</div>}
						</>
					)}
				</section>}

				{/* Mapping */}
				<section style={editorExpanded ? {
					...sectionStyle,
					position: 'fixed',
					inset: 0,
					zIndex: 1000,
					padding: '1rem 1.5rem',
					background: '#f8fafc',
					overflow: 'auto'
				} : sectionStyle}>
					<div style={{
						display: 'flex',
						alignItems: 'flex-start',
						justifyContent: 'space-between',
						gap: '0.75rem',
						flexWrap: 'wrap'
					}}>
						<h2 style={{ margin: '0.35rem 0 0', fontSize: '1rem' }}>Mapping</h2>
						<div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
							{runMs !== null && !runError && (
								<span style={{ fontSize: '0.75rem', color: '#666' }}>{runMs.toFixed(2)} ms</span>
							)}
							{runError && <span style={{ ...errStyle, marginTop: 0 }}>{runError}</span>}
							<button
								type="button"
								style={tabStyle(aiPanelVisible)}
								onClick={() => setAiPanelVisible(v => !v)}
							>
								Generate with AI
							</button>
							<button type="button" onClick={runMapping} style={secondaryButtonStyle}>Run</button>
							<button type="button" style={secondaryButtonStyle} onClick={() => setEditorExpanded(v => !v)}>
								{editorExpanded ? 'Exit full screen' : 'Full screen'}
							</button>
						</div>
					</div>

					<div style={{
						order: 2,
						border: '1px solid #e3e7ec',
						borderRadius: 4,
						padding: '0.75rem',
						background: '#fff',
						minHeight: editorExpanded ? 'calc(100vh - 6.5rem)' : 200,
						overflow: 'auto'
					}}>
						{editorType === 'json' ? (
							<JsonTextarea
								value={mappingText}
								onChange={updateMappingText}
								placeholder='{ "field": "EXPRESSION" }'
								minRows={editorExpanded ? 30 : 5}
								sizeKey={`${editorType}-${editorExpanded ? 'expanded' : 'normal'}`}
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

					{!editorExpanded && aiPanelVisible && (
						<div style={{
							order: 1,
							marginTop: '0.5rem',
							padding: '0.75rem',
							background: '#f5f7fa',
							border: '1px solid #e3e7ec',
							borderRadius: 4
						}}>
							<h3 style={{ margin: '0 0 1rem', fontSize: '0.9rem' }}>Generate with AI</h3>
							<div style={{ ...aiControlRowStyle, marginTop: 0, marginBottom: '0.5rem' }}>
								<label style={aiControlLabelStyle}>Provider</label>
								<select
									className="dm-playground-select"
									value={aiProvider}
									onChange={e => handleAiProviderChange(e.target.value as AiProvider)}
									style={{
										flex: '1 1 auto',
										fontSize: '0.85rem',
										padding: '0.4rem 0.5rem',
										border: '1px solid #ccc',
										borderRadius: 4
									}}
								>
									{Object.entries(aiProviderLabels).map(([provider, label]) => (
										<option key={provider} value={provider}>{label}</option>
									))}
								</select>
							</div>
							<div style={aiControlRowStyle}>
								<label style={aiControlLabelStyle}>API key</label>
								<input
									type="password"
									value={apiKey}
									onChange={e => setApiKey(e.target.value)}
									placeholder={apiKeyPlaceholder}
									style={{
										flex: '1 1 auto',
										width: '100%',
										fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
										fontSize: '0.85rem',
										padding: '0.4rem 0.5rem',
										boxSizing: 'border-box',
										border: '1px solid #ccc',
										borderRadius: 4
									}}
								/>
							</div>
							<div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem', marginLeft: '5.5rem' }}>
								Never stored, removed on page refresh
							</div>
							{aiModels.length ? (
								<div style={aiControlRowStyle}>
									<label style={aiControlLabelStyle}>Model</label>
									<select
										className="dm-playground-select"
										value={aiModel}
										onChange={e => setAiModel(e.target.value)}
										style={{
											flex: '1 1 auto',
											fontSize: '0.85rem',
											padding: '0.4rem 0.5rem',
											border: '1px solid #ccc',
											borderRadius: 4,
											minWidth: 0
										}}
									>
										<option value="">Select model…</option>
										{aiModels.map(model => (
											<option key={model} value={model}>{model}</option>
										))}
									</select>
									<button
										type="button"
										style={{
											...secondaryButtonStyle,
											padding: '0.4rem 0.7rem',
											cursor: loadingModels ? 'wait' : secondaryButtonStyle.cursor,
											whiteSpace: 'nowrap'
										}}
										disabled={loadingModels || !apiKey.trim()}
										onClick={fetchAiModels}
									>
										{loadingModels ? 'Refreshing…' : 'Refresh Models'}
									</button>
								</div>
							) : (
								<div style={aiControlRowStyle}>
									<label style={aiControlLabelStyle}>Model</label>
									<button
										type="button"
										style={{
											...secondaryButtonStyle,
											padding: '0.4rem 0.7rem',
											cursor: loadingModels ? 'wait' : secondaryButtonStyle.cursor,
											whiteSpace: 'nowrap'
										}}
										disabled={loadingModels || !apiKey.trim()}
										onClick={fetchAiModels}
									>
										{loadingModels ? 'Fetching…' : 'Fetch Models'}
									</button>
								</div>
							)}
							<div style={aiControlRowStyle}>
								<label style={aiControlLabelStyle}>Reasoning</label>
								<select
									className="dm-playground-select"
									value={aiReasoningEffort}
									onChange={e => setAiReasoningEffort(e.target.value as AiReasoningEffort)}
									style={{
										flex: '1 1 auto',
										fontSize: '0.85rem',
										padding: '0.4rem 0.5rem',
										border: '1px solid #ccc',
										borderRadius: 4
									}}
								>
									{getReasoningEffortOptions(aiProvider).map(option => (
										<option key={option.value} value={option.value}>{option.label}</option>
									))}
								</select>
							</div>
							{aiModelMessage && <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
								{aiModelMessage}
							</div>}
							<div style={{ ...aiControlRowStyle, alignItems: 'flex-start', marginTop: '0.5rem' }}>
								<label style={aiControlLabelStyle}>Options</label>
								<div style={{
									display: 'flex',
									flexDirection: 'column',
									gap: '0.35rem',
									fontSize: '0.8rem',
									color: '#334155'
								}}>
									<label
										title="mappingTemplate"
										style={{
											display: 'inline-flex',
											alignItems: 'center',
											gap: '0.35rem',
											margin: 0,
											color: aiGenerateMappingTemplate ? '#94a3b8' : '#334155'
										}}
									>
										<input
											type="checkbox"
											checked={aiSendCurrentMappingTemplate}
											disabled={aiGenerateMappingTemplate}
											onChange={e => setAiSendCurrentMappingTemplate(e.target.checked)}
										/>
										Send current mapping as a template
									</label>
									<label
										title="generateMappingTemplate"
										style={{
											display: 'inline-flex',
											alignItems: 'center',
											gap: '0.35rem',
											margin: 0,
											color: aiSendCurrentMappingTemplate ? '#94a3b8' : '#334155'
										}}
									>
										<input
											type="checkbox"
											checked={aiGenerateMappingTemplate}
											disabled={aiSendCurrentMappingTemplate}
											onChange={e => setAiGenerateMappingTemplate(e.target.checked)}
										/>
										Send generated schema template with the request
									</label>
									<label
										title="generateRequiredFields"
										style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', margin: 0 }}
									>
										<input
											type="checkbox"
											checked={aiGenerateRequiredFields}
											onChange={e => setAiGenerateRequiredFields(e.target.checked)}
										/>
										Add missing required placeholders after the response
									</label>
								</div>
							</div>
							<div style={{ ...aiControlRowStyle, alignItems: 'flex-start', marginTop: '0.5rem' }}>
								<label style={aiControlLabelStyle}>Instructions</label>
								<textarea
									value={aiInstructions}
									onChange={e => setAiInstructions(e.target.value)}
									rows={2}
									placeholder="e.g. use snake_case for all field names, map dates to ISO 8601 strings…"
									style={{
										flex: '1 1 auto',
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
							</div>
							<div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'flex-end' }}>
								<button
									type="button"
									onClick={generateFromAi}
									disabled={loading || !apiKey.trim() || !aiModel || !sourceSchema || !destSchema}
									style={{
										...primaryButtonStyle,
										background: loading ? '#999' : primaryButtonStyle.background,
										cursor: loading ? 'wait' : primaryButtonStyle.cursor
									}}
								>
									{loading ? 'Generating…' : 'Generate mapping'}
								</button>
							</div>
							{aiUsage && (
								<div style={{
									marginTop: '0.5rem',
									fontSize: '0.75rem',
									color: '#475569',
									display: 'flex',
									gap: '0.5rem',
									flexWrap: 'wrap'
								}}>
									<span>Tokens:</span>
									<span>input {formatTokenCount(aiUsage.inputTokens)}</span>
									<span>output {formatTokenCount(aiUsage.outputTokens)}</span>
									<span>total {formatTokenCount(aiUsage.totalTokens)}</span>
									{typeof aiUsage.reasoningTokens === 'number' && (
										<span>reasoning {formatTokenCount(aiUsage.reasoningTokens)}</span>
									)}
									{typeof aiUsage.cacheReadInputTokens === 'number' && aiUsage.cacheReadInputTokens > 0 && (
										<span>cache read {formatTokenCount(aiUsage.cacheReadInputTokens)}</span>
									)}
								</div>
							)}
							{aiError && <div style={errStyle}>{aiError}</div>}
						</div>
					)}
				</section>

				{/* Destination */}
				{!editorExpanded && <section style={sectionStyle}>
					<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
						<h2 style={{ margin: 0, fontSize: '1rem' }}>Destination</h2>
						<div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
							<button
								type="button"
								style={tabStyle(destinationTab === 'schema')}
								onClick={() => setDestinationTab('schema')}
							>
								Schema
							</button>
							<button
								type="button"
								style={tabStyle(destinationTab === 'result')}
								onClick={() => setDestinationTab('result')}
							>
								Result
							</button>
						</div>
					</div>
					{destinationTab === 'schema' ? (
						<>
							<div style={{
								display: 'flex',
								justifyContent: 'space-between',
								alignItems: 'center',
								gap: '0.5rem',
								flexWrap: 'wrap'
							}}>
								<select
									className="dm-playground-select"
									value={destSchemaSelection}
									onChange={e => handleDestSchemaSelect(e.target.value)}
									style={{ flex: '1 1 220px', minWidth: 0, fontSize: '0.85rem' }}
								>
									{schemaSampleOptions}
								</select>
							</div>
							{editorType === 'json' ? (
								<JsonTextarea
									value={destText}
									onChange={text => updateSchemaText(
										text,
										setDestText,
										setDestSchema,
										setDestError,
										() => setDestSchemaSelection('')
									)}
									placeholder='{ "type": "object", "properties": { ... } }'
									sizeKey={`${editorType}-${destinationTab}`}
								/>
							) : (
								<SchemaEditor
									value={destSchema ?? emptySchema}
									onChange={updateDestSchemaFromEditor}
									components={schemaComponents}
								/>
							)}
							{destError && <div style={errStyle}>{destError}</div>}
						</>
					) : (
						<>
							<JsonTextarea
								value={resultText}
								onChange={setResultText}
								placeholder="Run the mapping to see the result."
								sizeKey={`${editorType}-${destinationTab}`}
							/>
							{runError && <div style={errStyle}>{runError}</div>}
						</>
					)}
				</section>}
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
