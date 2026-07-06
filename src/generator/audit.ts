import path from 'path';
import { logger } from '../utils/logger';
import { hashFile, readManifest } from '../utils/manifest';
import { pathExists } from '../utils/fs';
import { getPersona, getPersonaChoices, type PersonaKey } from '../personas/registry';
import { computePersonaReadiness, getSurveyFileStatus } from './survey-status';

export interface AuditOptions {
  targetDir: string;
}

export async function runAudit(options: AuditOptions): Promise<void> {
  logger.title('AIDE — Audit');

  const state = await readManifest(options.targetDir);

  if (!state) {
    logger.warn('AIDE has not been initialized in this directory.');
    logger.dim('Run `aide init` to get started.\n');
    return;
  }

  logger.info(`Providers: ${logger.highlight(state.providers.join(' + ') || 'none')}`);
  logger.info(`Personas configured: ${logger.highlight(state.personas.map((k) => getPersona(k).label).join(', ') || 'none')}`);
  logger.info(`Personas generated: ${logger.highlight(state.generatedPersonas.map((k) => getPersona(k).label).join(', ') || 'none')}`);
  logger.info(`Phase: ${logger.highlight(state.phase)}`);

  await printSurveyStatus(options.targetDir, state.surveyFiles);
  await printGeneratedFileStatus(options.targetDir, state.generatedFiles);
  await printSuggestions(options.targetDir, state);
}

async function printSurveyStatus(
  targetDir: string,
  surveyFiles: Record<string, string>
): Promise<void> {
  logger.dim('\nSurvey files:\n');

  const entries = Object.entries(surveyFiles);

  if (entries.length === 0) {
    logger.dim('  (none tracked)');
    return;
  }

  for (const [relativePath, baselineHash] of entries) {
    const status = await getSurveyFileStatus(targetDir, relativePath, baselineHash);

    if (!status.exists) {
      logger.error(`${relativePath} — missing`);
    } else if (status.filled) {
      logger.success(`${relativePath} — filled`);
    } else {
      logger.warn(`${relativePath} — not filled (still template default)`);
    }
  }
}

async function printGeneratedFileStatus(
  targetDir: string,
  generatedFiles: Record<string, string>
): Promise<void> {
  logger.dim('\nGenerated files:\n');

  const entries = Object.entries(generatedFiles);

  if (entries.length === 0) {
    logger.dim('  (none generated yet)');
    return;
  }

  for (const [relativePath, baselineHash] of entries) {
    const absolutePath = path.join(targetDir, relativePath);
    const exists = await pathExists(absolutePath);

    if (!exists) {
      logger.error(`${relativePath} — missing (regenerate with \`aide init\`)`);
      continue;
    }

    const currentHash = await hashFile(absolutePath);

    if (currentHash === baselineHash) {
      logger.success(`${relativePath} — in sync`);
    } else {
      logger.warn(`${relativePath} — drifted (edited after generation)`);
    }
  }
}

async function printSuggestions(
  targetDir: string,
  state: Awaited<ReturnType<typeof readManifest>>
): Promise<void> {
  if (!state) {
    return;
  }

  logger.dim('\nSuggestions:\n');

  const suggestions: string[] = [];

  const notYetSelected = getPersonaChoices(state.personas);
  if (notYetSelected.length > 0) {
    suggestions.push(
      `${notYetSelected.length} persona(s) not configured yet (${notYetSelected
        .map((c) => c.value)
        .join(', ')}) — run \`aide persona add\`.`
    );
  }

  const pendingPersonas = state.personas.filter(
    (key: PersonaKey) => !state.generatedPersonas.includes(key)
  );

  if (pendingPersonas.length > 0) {
    const readiness = await computePersonaReadiness(targetDir, pendingPersonas, state.surveyFiles);

    for (const item of readiness) {
      const persona = getPersona(item.persona);
      if (item.ready) {
        suggestions.push(`${persona.label} is ready but not generated yet — run \`aide init\`.`);
      } else {
        suggestions.push(`${persona.label} is blocked — fill in: ${item.blockedBy.join(', ')}.`);
      }
    }
  }

  if (state.phase === 'survey-created' && state.generatedPersonas.length === 0) {
    suggestions.push('Nothing generated yet — fill in `AIDE_SURVEY/` and run `aide init`.');
  }

  if (suggestions.length === 0) {
    logger.success('Everything looks up to date.');
    return;
  }

  for (const suggestion of suggestions) {
    logger.step(suggestion);
  }

  console.log('');
}
