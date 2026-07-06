import path from 'path';
import { getTemplatesRoot, type PlaceholderValues } from '../utils/fs';
import { applyManagedTree } from '../utils/conflicts';
import { logger } from '../utils/logger';
import {
  createEmptyState,
  writeManifest,
  type Provider,
} from '../utils/manifest';
import { resolvePersonas, resolveProviders, resolveStacks } from '../utils/prompt';
import { getPersona, type PersonaKey } from '../personas/registry';
import type { StackKey } from '../stacks/registry';
import {
  copySharedDocs,
  maybeInitGit,
  writeProjectPackageJson,
  formatList,
  formatProviders,
} from './shared-template';
import { ensureBaseSurveyFiles, ensurePersonaSurveyFile, ensureTaskTemplateFile, SURVEY_DIR } from './survey-files';

export interface SurveyPhaseOptions {
  projectName: string;
  targetDir: string;
  placeholders: PlaceholderValues;
  providersCli?: string;
  personasCli?: string;
  stacksCli?: string;
  initGit: boolean;
  force?: boolean;
  autoConfirm?: boolean;
}

export async function runSurveyPhase(options: SurveyPhaseOptions): Promise<void> {
  const providers = await resolveProviders(options.providersCli);

  logger.title('AIDE — Phase 1: Setup & Survey');
  logger.info(`Providers: ${logger.highlight(formatProviders(providers))}`);

  await applyProviderTemplates(providers, options);

  const sharedCopied = await copySharedDocs({
    projectName: options.projectName,
    targetDir: options.targetDir,
    placeholders: options.placeholders,
  });
  logger.info(`Added ${sharedCopied.length} shared documentation file(s).`);

  await writeProjectPackageJson(options.targetDir, options.projectName);

  if (options.initGit) {
    await maybeInitGit(options.targetDir);
  }

  const personas = await resolvePersonas(options.personasCli);
  logger.info(`Personas: ${logger.highlight(formatList(personas))}`);

  const stacks = await resolveStacksForPersonas(personas, options.stacksCli);

  const surveyFiles = await ensureBaseSurveyFiles(
    options.targetDir,
    options.placeholders,
    stacks.programmer ?? [],
    { autoConfirm: options.autoConfirm }
  );

  const taskTemplate = await ensureTaskTemplateFile(
    options.targetDir,
    personas,
    options.placeholders,
    { autoConfirm: options.autoConfirm }
  );

  if (taskTemplate) {
    surveyFiles[taskTemplate.relativePath] = taskTemplate.hash;
  }

  for (const persona of personas) {
    const extra = await ensurePersonaSurveyFile(options.targetDir, persona, options.placeholders, {
      autoConfirm: options.autoConfirm,
    });

    if (extra) {
      surveyFiles[extra.relativePath] = extra.hash;
    }
  }

  const state = createEmptyState(options.projectName);
  state.providers = providers;
  state.personas = personas;
  state.stacks = stacks;
  state.surveyFiles = surveyFiles;
  state.phase = 'survey-created';

  await writeManifest(options.targetDir, state);

  printSurveyInstructions(options.targetDir, personas);
}

async function applyProviderTemplates(
  providers: Provider[],
  options: SurveyPhaseOptions
): Promise<void> {
  for (const provider of providers) {
    const templateDir = path.join(getTemplatesRoot(), provider);
    logger.info(`Applying ${provider} template...`);

    const result = await applyManagedTree(templateDir, options.targetDir, options.placeholders, {
      force: options.force,
      autoConfirm: options.autoConfirm,
    });

    logger.info(
      `${provider}: ${result.written.length} new, ${result.regenerated.length} regenerated, ${result.skippedForeign.length} skipped.`
    );
  }
}

async function resolveStacksForPersonas(
  personas: PersonaKey[],
  stacksCli?: string
): Promise<Partial<Record<PersonaKey, StackKey[]>>> {
  if (!personas.includes('programmer')) {
    return {};
  }

  const stacks = await resolveStacks(stacksCli);
  return stacks.length > 0 ? { programmer: stacks } : {};
}

function printSurveyInstructions(targetDir: string, personas: PersonaKey[]): void {
  logger.title('Survey created — fill it in before generating agents');

  logger.info(`Directory: ${logger.highlight(path.join(targetDir, SURVEY_DIR))}`);
  logger.dim('\nFocus on filling these files — the more detail, the better your generated AI team will be:\n');

  logger.step('AIDE_SURVEY/project.md');
  logger.step('AIDE_SURVEY/business.md');
  logger.step('AIDE_SURVEY/architecture.md');
  logger.step('AIDE_SURVEY/coding-standards.md');

  const hasPlanningPersona = personas.some((key) => key === 'pm' || key === 'po');
  if (hasPlanningPersona) {
    logger.step('AIDE_SURVEY/task-template.md (PM & PO — customize how new tasks are written)');
  }

  for (const key of personas) {
    const persona = getPersona(key);
    if (persona.extraSurveyFile) {
      logger.step(`AIDE_SURVEY/${persona.extraSurveyFile.fileName} (${persona.label})`);
    }
  }

  logger.dim('\nOnce filled in, run `aide init` again to generate your AI team.');
  logger.dim('AIDE will tell you exactly which personas are still blocked if a required file is unfilled.\n');
}
