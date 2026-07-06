import fs from 'fs-extra';
import path from 'path';
import crypto from 'crypto';
import type { PersonaKey } from '../personas/registry';
import type { StackKey } from '../stacks/registry';

export type Provider = 'cursor' | 'claude';
export type AidePhase = 'survey-created' | 'generated';

export interface AideState {
  schemaVersion: 1;
  projectName: string;
  providers: Provider[];
  personas: PersonaKey[];
  generatedPersonas: PersonaKey[];
  stacks: Partial<Record<PersonaKey, StackKey[]>>;
  phase: AidePhase;
  surveyFiles: Record<string, string>;
  generatedFiles: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

const MANIFEST_DIR = '.aide';
const MANIFEST_FILE = 'state.json';

export function getManifestDir(targetDir: string): string {
  return path.join(targetDir, MANIFEST_DIR);
}

export function getManifestPath(targetDir: string): string {
  return path.join(getManifestDir(targetDir), MANIFEST_FILE);
}

export function hashContent(content: string): string {
  return `sha256:${crypto.createHash('sha256').update(content).digest('hex')}`;
}

export async function hashFile(filePath: string): Promise<string | null> {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    return hashContent(content);
  } catch {
    return null;
  }
}

export async function readManifest(targetDir: string): Promise<AideState | null> {
  const manifestPath = getManifestPath(targetDir);

  try {
    const state = await fs.readJson(manifestPath);
    return normalizeState(state);
  } catch {
    return null;
  }
}

export async function writeManifest(targetDir: string, state: AideState): Promise<void> {
  const manifestPath = getManifestPath(targetDir);
  await fs.ensureDir(path.dirname(manifestPath));
  await fs.writeJson(manifestPath, state, { spaces: 2 });
}

export function createEmptyState(projectName: string): AideState {
  const now = new Date().toISOString();
  return {
    schemaVersion: 1,
    projectName,
    providers: [],
    personas: [],
    generatedPersonas: [],
    stacks: {},
    phase: 'survey-created',
    surveyFiles: {},
    generatedFiles: {},
    createdAt: now,
    updatedAt: now,
  };
}

export function touchState(state: AideState): AideState {
  return { ...state, updatedAt: new Date().toISOString() };
}

function normalizeState(state: Partial<AideState>): AideState {
  return {
    schemaVersion: 1,
    projectName: state.projectName ?? 'project',
    providers: state.providers ?? [],
    personas: state.personas ?? [],
    generatedPersonas: state.generatedPersonas ?? [],
    stacks: state.stacks ?? {},
    phase: state.phase ?? 'survey-created',
    surveyFiles: state.surveyFiles ?? {},
    generatedFiles: state.generatedFiles ?? {},
    createdAt: state.createdAt ?? new Date().toISOString(),
    updatedAt: state.updatedAt ?? new Date().toISOString(),
  };
}
