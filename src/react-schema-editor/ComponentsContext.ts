import { createContext } from 'react';
import { defaultComponents } from './defaultComponents.tsx';
import type { SchemaEditorComponents } from './types.ts';

export const ComponentsContext = createContext<SchemaEditorComponents>(defaultComponents);
