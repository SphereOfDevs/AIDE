import path from 'path';
import fs from 'fs-extra';
import { logger } from '../utils/logger';
import { writeManagedFile } from '../utils/conflicts';
import { addManagedMarker } from '../utils/markers';
import { hashContent, touchState, writeManifest, type AideState } from '../utils/manifest';
import { resolveConfirmation } from '../utils/prompt';
import { getPersona, PLANNING_PERSONAS, type PersonaKey } from '../personas/registry';
import type { PlaceholderValues } from '../utils/fs';
import { computePersonaReadiness } from './survey-status';
import { readSurveyFile } from './survey-files';
import {
  buildAgentFileContent,
  buildStackRuleContent,
  getAgentRelativePath,
  getStackRuleRelativePath,
} from './agent-files';
import { buildInstructionContent } from './instruction';

export interface GeneratePhaseOptions {
  targetDir: string;
  placeholders: PlaceholderValues;
  autoConfirm?: boolean;
  /** Regenerate these personas even when already generated (e.g. after adding task-template). */
  forceRegenerate?: PersonaKey[];
}

const DOCS_FROM_SURVEY = [
  'project.md',
  'business.md',
  'architecture.md',
  'coding-standards.md',
  'task-template.md',
];

export async function runGeneratePhase(state: AideState, options: GeneratePhaseOptions): Promise<void> {
  logger.title('AIDE — Phase 2: Generate AI Team');

  const readiness = await computePersonaReadiness(options.targetDir, state.personas, state.surveyFiles);
  printReadinessReport(readiness);

  const readyFromSurvey = readiness.filter((item) => item.ready).map((item) => item.persona);
  const forced = (options.forceRegenerate ?? []).filter((key) => state.personas.includes(key));
  const readyPersonas = mergeUnique(readyFromSurvey, forced);

  if (readyPersonas.length === 0) {
    logger.warn('No personas are ready yet. Fill in the blocked survey file(s) above, then run `aide init` again.');
    return;
  }

  const confirmed = await resolveConfirmation(
    `Generate agents for: ${readyPersonas.map((key) => getPersona(key).label).join(', ')}. Continue?`,
    { autoConfirm: options.autoConfirm || (options.forceRegenerate?.length ?? 0) > 0, default: true }
  );

  if (!confirmed) {
    logger.info('Generation cancelled. Nothing was written.');
    return;
  }

  const generatedFiles: Record<string, string> = { ...state.generatedFiles };

  await generateAgents(readyPersonas, state, options, generatedFiles);
  await syncDocsFromSurvey(options, generatedFiles);
  await ensureTasksDirectory(options, mergeUnique(readyPersonas, state.personas.filter((k) => PLANNING_PERSONAS.includes(k))), generatedFiles);
  await writeInstruction(mergeUnique(state.generatedPersonas, readyPersonas), state, options, generatedFiles);

  const nextState = touchState({
    ...state,
    phase: 'generated',
    generatedPersonas: mergeUnique(state.generatedPersonas, readyPersonas),
    generatedFiles,
  });

  await writeManifest(options.targetDir, nextState);

  printCompletionSummary(options.targetDir, readyPersonas, state);
}

function printReadinessReport(readiness: Awaited<ReturnType<typeof computePersonaReadiness>>): void {
  logger.dim('\nPersona readiness:\n');

  for (const item of readiness) {
    const persona = getPersona(item.persona);

    if (item.ready) {
      logger.success(`${persona.label} — ready`);
    } else {
      logger.warn(`${persona.label} — blocked (fill in: ${item.blockedBy.join(', ')})`);
    }
  }

  console.log('');
}

async function generateAgents(
  readyPersonas: PersonaKey[],
  state: AideState,
  options: GeneratePhaseOptions,
  generatedFiles: Record<string, string>
): Promise<void> {
  for (const personaKey of readyPersonas) {
    for (const provider of state.providers) {
      const extraSections: string[] = [];

      if (personaKey === 'programmer' && provider === 'claude') {
        const stacks = state.stacks.programmer ?? [];
        if (stacks.length > 0) {
          const { buildStackGuidanceSection } = await import('./survey-files');
          const guidance = await buildStackGuidanceSection(stacks);
          if (guidance) {
            extraSections.push(guidance.trim());
          }
        }
      }

      const content = await buildAgentFileContent(personaKey, provider, options.placeholders, extraSections);
      const relativePath = getAgentRelativePath(provider, personaKey);
      const destinationPath = path.join(options.targetDir, relativePath);

      await writeManagedFile(destinationPath, content, { force: true });
      generatedFiles[relativePath] = hashContent(addManagedMarker(content));
    }

    if (personaKey === 'programmer' && state.providers.includes('cursor')) {
      const stacks = state.stacks.programmer ?? [];

      for (const stackKey of stacks) {
        const content = await buildStackRuleContent(stackKey, options.placeholders);
        const relativePath = getStackRuleRelativePath(stackKey);
        const destinationPath = path.join(options.targetDir, relativePath);

        await writeManagedFile(destinationPath, content, { force: true });
        generatedFiles[relativePath] = hashContent(addManagedMarker(content));
      }
    }
  }
}

async function syncDocsFromSurvey(
  options: GeneratePhaseOptions,
  generatedFiles: Record<string, string>
): Promise<void> {
  for (const fileName of DOCS_FROM_SURVEY) {
    const content = await readSurveyFile(options.targetDir, fileName);

    if (content === null) {
      continue;
    }

    const relativePath = path.posix.join('docs', fileName);
    const destinationPath = path.join(options.targetDir, relativePath);

    await writeManagedFile(destinationPath, content, { force: true });
    generatedFiles[relativePath] = hashContent(addManagedMarker(content));
  }
}

async function ensureTasksDirectory(
  options: GeneratePhaseOptions,
  readyPersonas: PersonaKey[],
  generatedFiles: Record<string, string>
): Promise<void> {
  const hasPlanningPersona = readyPersonas.some((key) => PLANNING_PERSONAS.includes(key));

  if (!hasPlanningPersona) {
    return;
  }

  const tasksDir = path.join(options.targetDir, 'docs', 'tasks');
  const readmePath = path.join(tasksDir, 'README.md');
  const relativePath = path.posix.join('docs', 'tasks', 'README.md');

  if (await fs.pathExists(readmePath)) {
    return;
  }

  const content = [
    '<!-- managed-by: aide -->',
    '',
    '# Tasks',
    '',
    'Individual work items live here. PO (or PM when no PO) creates files using `docs/task-template.md`.',
    '',
    'Example: `docs/tasks/AIDE-001-user-login.md`',
    '',
  ].join('\n');

  await fs.ensureDir(tasksDir);
  await writeManagedFile(readmePath, content, { force: true });
  generatedFiles[relativePath] = hashContent(addManagedMarker(content));
}

async function writeInstruction(
  instructionPersonas: PersonaKey[],
  state: AideState,
  options: GeneratePhaseOptions,
  generatedFiles: Record<string, string>
): Promise<void> {
  const content = buildInstructionContent(state.projectName, state.providers, instructionPersonas, state.stacks);
  const relativePath = 'AIDE_INSTRUCTION.md';
  const destinationPath = path.join(options.targetDir, relativePath);

  await writeManagedFile(destinationPath, content, { force: true });
  generatedFiles[relativePath] = hashContent(addManagedMarker(content));
}

function mergeUnique<T>(a: T[], b: T[]): T[] {
  return [...new Set([...a, ...b])];
}

function printCompletionSummary(targetDir: string, readyPersonas: PersonaKey[], state: AideState): void {
  logger.title('AI team generated');

  logger.info(`Directory: ${logger.highlight(targetDir)}`);
  logger.info(`Generated personas: ${logger.highlight(readyPersonas.map((k) => getPersona(k).label).join(', '))}`);
  logger.info(`Providers: ${logger.highlight(state.providers.join(' + '))}`);

  logger.dim('\nRead AIDE_INSTRUCTION.md for how to use everything that was generated.\n');
}
