import path from 'path';
import fs from 'fs-extra';
import { getTemplatesRoot, pathExists, renderPlaceholders, type PlaceholderValues } from '../utils/fs';
import { writeManagedFile } from '../utils/conflicts';
import { hashContent } from '../utils/manifest';
import { getStack, type StackKey } from '../stacks/registry';
import { getPersona, PLANNING_PERSONAS, TASK_TEMPLATE_FILE, type PersonaKey } from '../personas/registry';

export const SURVEY_DIR = 'AIDE_SURVEY';
export const BASE_SURVEY_FILES = ['project.md', 'business.md', 'architecture.md', 'coding-standards.md'];

export function getSurveyDir(targetDir: string): string {
  return path.join(targetDir, SURVEY_DIR);
}

export function getSurveyFilePath(targetDir: string, fileName: string): string {
  return path.join(getSurveyDir(targetDir), fileName);
}

export function relativeSurveyPath(fileName: string): string {
  return path.posix.join(SURVEY_DIR, fileName);
}

export async function readSurveyTemplate(templateName: string): Promise<string> {
  const templatePath = path.join(getTemplatesRoot(), 'survey', templateName);
  return fs.readFile(templatePath, 'utf8');
}

export async function readSurveyFile(targetDir: string, fileName: string): Promise<string | null> {
  const filePath = getSurveyFilePath(targetDir, fileName);

  try {
    return await fs.readFile(filePath, 'utf8');
  } catch {
    return null;
  }
}

export async function readStackFragment(key: StackKey): Promise<string> {
  const stack = getStack(key);
  const fragmentPath = path.join(getTemplatesRoot(), 'stacks', stack.fragmentFile);
  return fs.readFile(fragmentPath, 'utf8');
}

export async function buildStackGuidanceSection(stacks: StackKey[]): Promise<string> {
  if (stacks.length === 0) {
    return '';
  }

  const fragments = await Promise.all(stacks.map((key) => readStackFragment(key)));
  return `\n## Stack Guidance\n\n${fragments.join('\n')}`;
}

export interface EnsureSurveyOptions {
  autoConfirm?: boolean;
}

export async function ensureBaseSurveyFiles(
  targetDir: string,
  placeholders: PlaceholderValues,
  stacks: StackKey[],
  options: EnsureSurveyOptions = {}
): Promise<Record<string, string>> {
  const hashes: Record<string, string> = {};

  for (const fileName of BASE_SURVEY_FILES) {
    const destinationPath = getSurveyFilePath(targetDir, fileName);

    if (await pathExists(destinationPath)) {
      continue;
    }

    let content = renderPlaceholders(await readSurveyTemplate(fileName), placeholders);

    if (fileName === 'coding-standards.md') {
      content += await buildStackGuidanceSection(stacks);
    }

    await writeManagedFile(destinationPath, content, options);
    hashes[relativeSurveyPath(fileName)] = hashContent(content);
  }

  return hashes;
}

export async function ensureTaskTemplateFile(
  targetDir: string,
  personas: PersonaKey[],
  placeholders: PlaceholderValues,
  options: EnsureSurveyOptions = {}
): Promise<{ relativePath: string; hash: string } | null> {
  const needsTaskTemplate = personas.some((key) => PLANNING_PERSONAS.includes(key));

  if (!needsTaskTemplate) {
    return null;
  }

  const destinationPath = getSurveyFilePath(targetDir, TASK_TEMPLATE_FILE);

  if (await pathExists(destinationPath)) {
    return null;
  }

  const content = renderPlaceholders(await readSurveyTemplate(TASK_TEMPLATE_FILE), placeholders);
  await writeManagedFile(destinationPath, content, options);

  return {
    relativePath: relativeSurveyPath(TASK_TEMPLATE_FILE),
    hash: hashContent(content),
  };
}

export async function ensurePersonaSurveyFile(
  targetDir: string,
  personaKey: PersonaKey,
  placeholders: PlaceholderValues,
  options: EnsureSurveyOptions = {}
): Promise<{ relativePath: string; hash: string } | null> {
  const persona = getPersona(personaKey);

  if (!persona.extraSurveyFile) {
    return null;
  }

  const destinationPath = getSurveyFilePath(targetDir, persona.extraSurveyFile.fileName);

  if (await pathExists(destinationPath)) {
    return null;
  }

  const content = renderPlaceholders(
    await readSurveyTemplate(persona.extraSurveyFile.templateName),
    placeholders
  );
  await writeManagedFile(destinationPath, content, options);

  return {
    relativePath: relativeSurveyPath(persona.extraSurveyFile.fileName),
    hash: hashContent(content),
  };
}

export interface StackGuidanceUpdateResult {
  appended: StackKey[];
  stagedFilePath?: string;
}

export async function addStacksToCodingStandards(
  targetDir: string,
  stacks: StackKey[],
  baselineHash: string | undefined,
  currentHash: (content: string) => string,
  options: EnsureSurveyOptions = {}
): Promise<StackGuidanceUpdateResult> {
  if (stacks.length === 0) {
    return { appended: [] };
  }

  const codingStandardsPath = getSurveyFilePath(targetDir, 'coding-standards.md');

  if (!(await pathExists(codingStandardsPath))) {
    return { appended: [] };
  }

  const existingContent = await fs.readFile(codingStandardsPath, 'utf8');
  const existingHash = currentHash(existingContent);

  const newFragments = await Promise.all(
    stacks.map(async (key) => ({ key, content: await readStackFragment(key) }))
  );
  const missingFragments = newFragments.filter(({ content }) => !existingContent.includes(content));

  if (missingFragments.length === 0) {
    return { appended: [] };
  }

  if (existingHash !== baselineHash) {
    const stagedPath = getSurveyFilePath(targetDir, 'coding-standards.additions.md');
    const stagedContent = [
      '<!-- managed-by: aide -->',
      '',
      '# New Stack Guidance to merge into coding-standards.md',
      '',
      '> coding-standards.md has already been edited, so AIDE staged the new stack guidance here instead of overwriting your changes. Merge manually, then delete this file.',
      '',
      ...missingFragments.map(({ content }) => content),
    ].join('\n');

    await writeManagedFile(stagedPath, stagedContent, options);
    return { appended: [], stagedFilePath: stagedPath };
  }

  const updatedContent = `${existingContent}\n${missingFragments.map(({ content }) => content).join('\n')}`;
  await writeManagedFile(codingStandardsPath, updatedContent, { ...options, force: true });

  return { appended: missingFragments.map(({ key }) => key) };
}
