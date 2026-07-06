import path from 'path';
import fs from 'fs-extra';
import confirm from '@inquirer/confirm';
import { getTemplatesRoot, isTextFile, pathExists, walkFiles } from '../utils/fs';
import { logger } from '../utils/logger';
import { getManifestDir, readManifest } from '../utils/manifest';
import { hasManagedMarker } from '../utils/markers';
import { resolveConfirmation } from '../utils/prompt';
import { SURVEY_DIR } from './survey-files';
import type { Provider } from '../utils/manifest';

export interface DeleteOptions {
  targetDir: string;
  removeInstructions?: boolean;
  autoConfirm?: boolean;
}

const INSTRUCTION_ROOT_FILES = ['AGENTS.md', 'CLAUDE.md', 'workflows.md', 'project-structure.md', 'mcp.json'];

export async function runDelete(options: DeleteOptions): Promise<void> {
  const state = await readManifest(options.targetDir);
  const manifestExists = Boolean(state);

  if (!manifestExists) {
    const hasSurvey = await pathExists(path.join(options.targetDir, SURVEY_DIR));
    const hasManifestDir = await pathExists(getManifestDir(options.targetDir));

    if (!hasSurvey && !hasManifestDir) {
      logger.warn('No AIDE installation found in this directory.');
      return;
    }
  }

  logger.title('AIDE — Delete');

  const confirmed = await resolveConfirmation(
    'Remove all AIDE-managed files from this project? This cannot be undone.',
    { autoConfirm: options.autoConfirm, default: false }
  );

  if (!confirmed) {
    logger.info('Delete cancelled. Nothing was removed.');
    return;
  }

  let removeInstructions = options.removeInstructions;

  if (removeInstructions === undefined) {
    if (options.autoConfirm) {
      removeInstructions = false;
    } else if (process.stdin.isTTY && process.stdout.isTTY) {
      removeInstructions = await confirm({
        message: 'Also remove AI instruction files (AGENTS.md, CLAUDE.md, .cursor/, .claude/, commands/, skills)?',
        default: false,
      });
    } else {
      removeInstructions = false;
    }
  }

  const removed: string[] = [];

  if (state) {
    for (const relativePath of Object.keys(state.generatedFiles)) {
      if (await removeFile(options.targetDir, relativePath)) {
        removed.push(relativePath);
      }
    }

    for (const relativePath of Object.keys(state.surveyFiles)) {
      if (await removeFile(options.targetDir, relativePath)) {
        removed.push(relativePath);
      }
    }
  }

  await removePathIfExists(path.join(options.targetDir, SURVEY_DIR), removed, SURVEY_DIR);
  await removePathIfExists(path.join(options.targetDir, 'AIDE_INSTRUCTION.md'), removed, 'AIDE_INSTRUCTION.md');
  await removePathIfExists(getManifestDir(options.targetDir), removed, '.aide/');

  if (removeInstructions) {
    await removeInstructionFiles(options.targetDir, state?.providers ?? [], removed);
  }

  logger.title('AIDE removed');

  if (removed.length === 0) {
    logger.info('No files were found to remove.');
    return;
  }

  logger.success(`Removed ${removed.length} path(s).`);
  logger.dim('\nRemoved:\n');

  for (const item of removed.slice(0, 30)) {
    logger.step(item);
  }

  if (removed.length > 30) {
    logger.dim(`... and ${removed.length - 30} more`);
  }

  console.log('');
}

async function removeInstructionFiles(
  targetDir: string,
  providers: Provider[],
  removed: string[]
): Promise<void> {
  for (const provider of providers) {
    const templateDir = path.join(getTemplatesRoot(), provider);
    const relativeFiles = await walkFiles(templateDir);

    for (const relative of relativeFiles) {
      const destinationPath = path.join(targetDir, relative);

      if (!(await pathExists(destinationPath)) || !isTextFile(destinationPath)) {
        continue;
      }

      const content = await fs.readFile(destinationPath, 'utf8');

      if (!hasManagedMarker(content)) {
        continue;
      }

      if (await removeFile(targetDir, relative)) {
        removed.push(relative);
      }
    }
  }

  for (const fileName of INSTRUCTION_ROOT_FILES) {
    const destinationPath = path.join(targetDir, fileName);

    if (!(await pathExists(destinationPath)) || !isTextFile(destinationPath)) {
      continue;
    }

    const content = await fs.readFile(destinationPath, 'utf8');

    if (!hasManagedMarker(content)) {
      continue;
    }

    if (await removeFile(targetDir, fileName)) {
      removed.push(fileName);
    }
  }

  await pruneEmptyManagedDirs(targetDir, removed);
}

async function pruneEmptyManagedDirs(targetDir: string, removed: string[]): Promise<void> {
  const candidateDirs = ['.cursor/agents', '.cursor/rules/stacks', '.cursor/rules', '.cursor/skills', '.cursor', '.claude/agents', '.claude', 'commands'];

  for (const relativeDir of candidateDirs) {
    const absoluteDir = path.join(targetDir, relativeDir);

    if (!(await pathExists(absoluteDir))) {
      continue;
    }

    const entries = await fs.readdir(absoluteDir);

    if (entries.length === 0) {
      await fs.remove(absoluteDir);
      removed.push(`${relativeDir}/`);
    }
  }
}

async function removePathIfExists(
  absolutePath: string,
  removed: string[],
  label: string
): Promise<void> {
  if (await pathExists(absolutePath)) {
    await fs.remove(absolutePath);
    removed.push(label);
  }
}

async function removeFile(targetDir: string, relativePath: string): Promise<boolean> {
  const absolutePath = path.join(targetDir, relativePath);

  if (!(await pathExists(absolutePath))) {
    return false;
  }

  await fs.remove(absolutePath);
  return true;
}
