import { createContext } from 'react';
import { defaultComponents } from './defaultComponents.tsx';
import type { MappingEditorComponents } from './types.ts';

export const ComponentsContext = createContext<MappingEditorComponents>(defaultComponents);
