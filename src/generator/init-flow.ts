import path from 'path';
import { readManifest, touchState, writeManifest, hashFile } from '../utils/manifest';
import { logger } from '../utils/logger';
import type { PlaceholderValues } from '../utils/fs';
import { runSurveyPhase } from './survey';
import { runGeneratePhase } from './generate';
import { ensureTaskTemplateFile, relativeSurveyPath } from './survey-files';
import { PLANNING_PERSONAS, TASK_TEMPLATE_FILE } from '../personas/registry';

export interface InitFlowOptions {
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

export async function runInitFlow(options: InitFlowOptions): Promise<void> {
  const state = await readManifest(options.targetDir);

  if (!state) {
    await runSurveyPhase(options);
    return;
  }

  const wasGenerated = state.phase === 'generated';
  const addedSurveyFiles = await ensureMissingSurveyFiles(state, options);

  if (addedSurveyFiles.length > 0) {
    await writeManifest(options.targetDir, touchState(state));

    logger.title('New survey file(s) added');
    for (const file of addedSurveyFiles) {
      logger.step(file);
    }

    if (wasGenerated) {
      logger.dim('\nUpdating docs and AI team for new survey file(s)...\n');

      const forceRegenerate = state.personas.filter((key) => PLANNING_PERSONAS.includes(key));

      await runGeneratePhase(state, {
        targetDir: options.targetDir,
        placeholders: options.placeholders,
        autoConfirm: options.autoConfirm ?? true,
        forceRegenerate,
      });
      return;
    }

    state.phase = 'survey-created';
    await writeManifest(options.targetDir, touchState(state));
    logger.dim('\nFill in the new file(s), then run `aide init` again to update your AI team.\n');
    return;
  }

  if (state.phase === 'survey-created') {
    if (await needsTaskTemplateSync(state, options.targetDir)) {
      logger.dim('Syncing task-template to docs and updating PM/PO agents...\n');
      await runGeneratePhase(state, {
        targetDir: options.targetDir,
        placeholders: options.placeholders,
        autoConfirm: options.autoConfirm ?? true,
        forceRegenerate: state.personas.filter((key) => PLANNING_PERSONAS.includes(key)),
      });
      return;
    }

    await runGeneratePhase(state, {
      targetDir: options.targetDir,
      placeholders: options.placeholders,
      autoConfirm: options.autoConfirm,
    });
    return;
  }

  const taskTemplateRelative = relativeSurveyPath(TASK_TEMPLATE_FILE);
  const hasPlanningPersona = state.personas.some((key) => PLANNING_PERSONAS.includes(key));
  const taskTemplateHash = await hashFile(path.join(options.targetDir, taskTemplateRelative));

  if (
    hasPlanningPersona &&
    taskTemplateHash &&
    state.surveyFiles[taskTemplateRelative] &&
    taskTemplateHash !== state.surveyFiles[taskTemplateRelative]
  ) {
    await runGeneratePhase(state, {
      targetDir: options.targetDir,
      placeholders: options.placeholders,
      autoConfirm: options.autoConfirm,
      forceRegenerate: state.personas.filter((key) => PLANNING_PERSONAS.includes(key)),
    });
    return;
  }

  logger.title('AIDE — Already generated');
  logger.info(`Directory: ${logger.highlight(options.targetDir)}`);
  logger.info('Everything currently configured has already been generated.');
  logger.dim('Run `aide audit` to check status, `aide configure` to change providers/personas, or `aide persona add` to configure a new personality.\n');
}

async function ensureMissingSurveyFiles(
  state: NonNullable<Awaited<ReturnType<typeof readManifest>>>,
  options: InitFlowOptions
): Promise<string[]> {
  const added: string[] = [];

  const taskTemplate = await ensureTaskTemplateFile(
    options.targetDir,
    state.personas,
    options.placeholders,
    { autoConfirm: options.autoConfirm }
  );

  if (taskTemplate) {
    state.surveyFiles[taskTemplate.relativePath] = taskTemplate.hash;
    added.push(taskTemplate.relativePath);
  }

  return added;
}

async function needsTaskTemplateSync(
  state: NonNullable<Awaited<ReturnType<typeof readManifest>>>,
  targetDir: string
): Promise<boolean> {
  const hasPlanningPersona = state.personas.some((key) => PLANNING_PERSONAS.includes(key));

  if (!hasPlanningPersona) {
    return false;
  }

  const taskTemplateSurvey = relativeSurveyPath(TASK_TEMPLATE_FILE);
  const taskTemplateDoc = path.posix.join('docs', TASK_TEMPLATE_FILE);

  const surveyTracked = Boolean(state.surveyFiles[taskTemplateSurvey]);
  const docGenerated = Boolean(state.generatedFiles[taskTemplateDoc]);

  return surveyTracked && !docGenerated;
}
