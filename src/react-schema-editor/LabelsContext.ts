import { createContext } from 'react';
import { defaultLabels } from './defaultLabels.ts';
import type { SchemaEditorLabels } from './types.ts';

export const LabelsContext = createContext<SchemaEditorLabels>(defaultLabels);
