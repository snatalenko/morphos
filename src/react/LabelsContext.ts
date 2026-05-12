import { createContext } from 'react';
import { defaultLabels } from './defaultLabels.ts';
import type { MappingEditorLabels } from './types.ts';

export const LabelsContext = createContext<MappingEditorLabels>(defaultLabels);
