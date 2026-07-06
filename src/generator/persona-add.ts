import path from 'path';
import { logger } from '../utils/logger';
import { hashContent, readManifest, touchState, writeManifest } from '../utils/manifest';
import { resolvePersonas, resolveStacks } from '../utils/prompt';
import { getPersona, getPersonaChoices, type PersonaKey } from '../personas/registry';
import type { PlaceholderValues } from '../utils/fs';
import { ensurePersonaSurveyFile, ensureTaskTemplateFile, addStacksToCodingStandards, SURVEY_DIR } from './survey-files';

export interface PersonaAddOptions {
  targetDir: string;
  placeholders: PlaceholderValues;
  personasCli?: string;
  stacksCli?: string;
  autoConfirm?: boolean;
}

export async function runPersonaAdd(options: PersonaAddOptions): Promise<void> {
  const state = await readManifest(options.targetDir);

  if (!state) {
    logger.error('AIDE has not been initialized in this directory. Run `aide init` first.');
    return;
  }

  const available = getPersonaChoices(state.personas);

  if (available.length === 0) {
    logger.info('All personas are already configured.');
    return;
  }

  const newPersonas = await resolvePersonas(options.personasCli, state.personas);

  if (newPersonas.length === 0) {
    logger.info('No new personas selected.');
    return;
  }

  logger.title('AIDE — Add Personas');
  logger.info(`Adding: ${logger.highlight(newPersonas.map((k) => getPersona(k).label).join(', '))}`);

  const createdFiles: string[] = [];

  const taskTemplate = await ensureTaskTemplateFile(
    options.targetDir,
    [...state.personas, ...newPersonas],
    options.placeholders,
    { autoConfirm: options.autoConfirm }
  );

  if (taskTemplate) {
    state.surveyFiles[taskTemplate.relativePath] = taskTemplate.hash;
    createdFiles.push(taskTemplate.relativePath);
  }

  for (const personaKey of newPersonas) {
    const extra = await ensurePersonaSurveyFile(options.targetDir, personaKey, options.placeholders, {
      autoConfirm: options.autoConfirm,
    });

    if (extra) {
      state.surveyFiles[extra.relativePath] = extra.hash;
      createdFiles.push(extra.relativePath);
    }
  }

  if (newPersonas.includes('programmer' as PersonaKey)) {
    await handleProgrammerStacks(options, state);
  }

  state.personas = [...new Set([...state.personas, ...newPersonas])];
  state.phase = 'survey-created';

  await writeManifest(options.targetDir, touchState(state));

  printInstructions(options.targetDir, newPersonas, createdFiles);
}

async function handleProgrammerStacks(
  options: PersonaAddOptions,
  state: NonNullable<Awaited<ReturnType<typeof readManifest>>>
): Promise<void> {
  const existingStacks = state.stacks.programmer ?? [];
  const newStacks = await resolveStacks(options.stacksCli);
  const stacksToAdd = newStacks.filter((key) => !existingStacks.includes(key));

  if (stacksToAdd.length === 0) {
    return;
  }

  const relativePath = path.posix.join(SURVEY_DIR, 'coding-standards.md');
  const baselineHash = state.surveyFiles[relativePath];

  const result = await addStacksToCodingStandards(
    options.targetDir,
    stacksToAdd,
    baselineHash,
    hashContent,
    { autoConfirm: options.autoConfirm }
  );

  state.stacks.programmer = [...existingStacks, ...stacksToAdd];

  if (result.appended.length > 0) {
    logger.info(`Appended stack guidance for: ${result.appended.join(', ')}`);
  }

  if (result.stagedFilePath) {
    logger.warn(
      `coding-standards.md was already edited — new stack guidance staged in ${path.basename(result.stagedFilePath)}. Merge it manually.`
    );
  }
}

function printInstructions(targetDir: string, personas: PersonaKey[], createdFiles: string[]): void {
  logger.title('New survey file(s) created');

  logger.info(`Directory: ${logger.highlight(path.join(targetDir, SURVEY_DIR))}`);

  if (createdFiles.length > 0) {
    logger.dim('\nFill these in:\n');
    for (const file of createdFiles) {
      logger.step(file);
    }
  }

  logger.dim(
    `\n${personas
      .map((key) => getPersona(key).label)
      .join(', ')} will be generated once their required survey file(s) are filled — run \`aide init\` again.\n`
  );
}
