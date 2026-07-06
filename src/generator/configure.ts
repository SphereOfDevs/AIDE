import path from 'path';
import { getTemplatesRoot } from '../utils/fs';
import { applyManagedTree } from '../utils/conflicts';
import { logger } from '../utils/logger';
import { readManifest, touchState, writeManifest, hashContent, type AideState } from '../utils/manifest';
import {
  parsePersonas,
  parseProviders,
  parseStacks,
  promptForPersonasAll,
  promptForProvidersConfigured,
  promptForStacksConfigured,
  resolveConfirmation,
} from '../utils/prompt';
import { getPersona, type PersonaKey } from '../personas/registry';
import type { StackKey } from '../stacks/registry';
import type { PlaceholderValues } from '../utils/fs';
import {
  addStacksToCodingStandards,
  ensurePersonaSurveyFile,
  ensureTaskTemplateFile,
  SURVEY_DIR,
} from './survey-files';
import { formatList, formatProviders } from './shared-template';

export interface ConfigureOptions {
  targetDir: string;
  placeholders: PlaceholderValues;
  providersCli?: string;
  personasCli?: string;
  stacksCli?: string;
  autoConfirm?: boolean;
}

export async function runConfigure(options: ConfigureOptions): Promise<void> {
  const state = await readManifest(options.targetDir);

  if (!state) {
    logger.error('AIDE has not been initialized in this directory. Run `aide init` first.');
    return;
  }

  logger.title('AIDE — Configure');

  const providers = await resolveConfiguredProviders(state, options.providersCli);
  const personas = await resolveConfiguredPersonas(state, options.personasCli);
  const stacks = await resolveConfiguredStacks(personas, state, options.stacksCli);

  const addedProviders = providers.filter((provider) => !state.providers.includes(provider));
  const removedProviders = state.providers.filter((provider) => !providers.includes(provider));
  const addedPersonas = personas.filter((persona) => !state.personas.includes(persona));
  const removedPersonas = state.personas.filter((persona) => !personas.includes(persona));

  logger.info(`Providers: ${logger.highlight(formatProviders(providers))}`);
  logger.info(`Personas: ${logger.highlight(formatList(personas))}`);

  if (addedProviders.length === 0 && removedProviders.length === 0 && addedPersonas.length === 0 && removedPersonas.length === 0) {
    const stackChanged = stacksChanged(state.stacks.programmer ?? [], stacks);
    if (!stackChanged) {
      logger.info('No configuration changes selected.');
      return;
    }
  }

  const confirmed = await resolveConfirmation('Apply these configuration changes?', {
    autoConfirm: options.autoConfirm,
    default: true,
  });

  if (!confirmed) {
    logger.info('Configuration cancelled. Nothing was changed.');
    return;
  }

  for (const provider of addedProviders) {
    const templateDir = path.join(getTemplatesRoot(), provider);
    logger.info(`Applying ${provider} template for newly selected provider...`);

    await applyManagedTree(templateDir, options.targetDir, options.placeholders, {
      autoConfirm: options.autoConfirm ?? true,
    });
  }

  const createdFiles: string[] = [];

  const taskTemplate = await ensureTaskTemplateFile(options.targetDir, personas, options.placeholders, {
    autoConfirm: options.autoConfirm,
  });

  if (taskTemplate) {
    state.surveyFiles[taskTemplate.relativePath] = taskTemplate.hash;
    createdFiles.push(taskTemplate.relativePath);
  }

  for (const personaKey of addedPersonas) {
    const extra = await ensurePersonaSurveyFile(options.targetDir, personaKey, options.placeholders, {
      autoConfirm: options.autoConfirm,
    });

    if (extra) {
      state.surveyFiles[extra.relativePath] = extra.hash;
      createdFiles.push(extra.relativePath);
    }
  }

  if (personas.includes('programmer')) {
    await syncProgrammerStacks(options, state, stacks);
  } else {
    delete state.stacks.programmer;
  }

  state.providers = providers;
  state.personas = personas;
  state.generatedPersonas = state.generatedPersonas.filter((persona) => personas.includes(persona));

  if (addedPersonas.length > 0 || createdFiles.length > 0) {
    state.phase = 'survey-created';
  }

  await writeManifest(options.targetDir, touchState(state));

  printSummary(options.targetDir, {
    addedProviders,
    removedProviders,
    addedPersonas,
    removedPersonas,
    createdFiles,
  });
}

async function resolveConfiguredProviders(
  state: AideState,
  cliValue?: string
): Promise<AideState['providers']> {
  if (cliValue?.trim()) {
    return parseProviders(cliValue);
  }

  if (process.stdin.isTTY && process.stdout.isTTY) {
    return promptForProvidersConfigured(state.providers);
  }

  return state.providers;
}

async function resolveConfiguredPersonas(state: AideState, cliValue?: string): Promise<PersonaKey[]> {
  if (cliValue?.trim()) {
    return parsePersonas(cliValue);
  }

  if (process.stdin.isTTY && process.stdout.isTTY) {
    return promptForPersonasAll(state.personas);
  }

  return state.personas;
}

async function resolveConfiguredStacks(
  personas: PersonaKey[],
  state: AideState,
  cliValue?: string
): Promise<StackKey[]> {
  if (!personas.includes('programmer')) {
    return [];
  }

  if (cliValue?.trim()) {
    return parseStacks(cliValue);
  }

  if (process.stdin.isTTY && process.stdout.isTTY) {
    return promptForStacksConfigured(state.stacks.programmer ?? []);
  }

  return state.stacks.programmer ?? [];
}

function stacksChanged(existing: StackKey[], next: StackKey[]): boolean {
  if (existing.length !== next.length) {
    return true;
  }

  return existing.some((stack) => !next.includes(stack)) || next.some((stack) => !existing.includes(stack));
}

async function syncProgrammerStacks(
  options: ConfigureOptions,
  state: AideState,
  stacks: StackKey[]
): Promise<void> {
  const existingStacks = state.stacks.programmer ?? [];
  const stacksToAdd = stacks.filter((stack) => !existingStacks.includes(stack));

  if (stacksToAdd.length > 0) {
    const relativePath = path.posix.join(SURVEY_DIR, 'coding-standards.md');
    const baselineHash = state.surveyFiles[relativePath];

    const result = await addStacksToCodingStandards(
      options.targetDir,
      stacksToAdd,
      baselineHash,
      hashContent,
      { autoConfirm: options.autoConfirm }
    );

    if (result.appended.length > 0) {
      logger.info(`Appended stack guidance for: ${result.appended.join(', ')}`);
    }
  }

  state.stacks.programmer = stacks;
}

interface ConfigureSummary {
  addedProviders: AideState['providers'];
  removedProviders: AideState['providers'];
  addedPersonas: PersonaKey[];
  removedPersonas: PersonaKey[];
  createdFiles: string[];
}

function printSummary(targetDir: string, summary: ConfigureSummary): void {
  logger.title('Configuration updated');

  if (summary.addedProviders.length > 0) {
    logger.success(`Added providers: ${summary.addedProviders.join(', ')}`);
  }

  if (summary.removedProviders.length > 0) {
    logger.warn(
      `Removed providers from config: ${summary.removedProviders.join(', ')} (existing template files were kept on disk)`
    );
  }

  if (summary.addedPersonas.length > 0) {
    logger.success(
      `Added personas: ${summary.addedPersonas.map((key) => getPersona(key).label).join(', ')}`
    );
  }

  if (summary.removedPersonas.length > 0) {
    logger.warn(
      `Removed personas from config: ${summary.removedPersonas
        .map((key) => getPersona(key).label)
        .join(', ')} (existing agent files were kept on disk)`
    );
  }

  if (summary.createdFiles.length > 0) {
    logger.dim('\nNew survey file(s):\n');
    for (const file of summary.createdFiles) {
      logger.step(file);
    }
  }

  logger.dim(`\nDirectory: ${logger.highlight(path.join(targetDir, SURVEY_DIR))}`);
  logger.dim('Run `aide init` to regenerate agents and docs after filling in any new survey files.\n');
}
