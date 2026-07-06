import path from 'path';
import fs from 'fs-extra';
import { getTemplatesRoot, initGitRepository, mergeTemplateTree, pathExists, type PlaceholderValues } from '../utils/fs';
import { logger } from '../utils/logger';
import type { Provider } from '../utils/manifest';
import { isValidProjectName } from '../utils/prompt';

export type { Provider };

export interface SharedGenerationOptions {
  projectName: string;
  targetDir: string;
  placeholders: PlaceholderValues;
}

export async function copySharedDocs(options: SharedGenerationOptions): Promise<string[]> {
  const sharedDocsDir = path.join(getTemplatesRoot(), 'shared', 'docs');
  const targetDocsDir = path.join(options.targetDir, 'docs');

  return mergeTemplateTree(sharedDocsDir, targetDocsDir, options.placeholders);
}

export async function writeProjectPackageJson(
  targetDir: string,
  projectName: string
): Promise<void> {
  const packageJsonPath = path.join(targetDir, 'package.json');

  if (await pathExists(packageJsonPath)) {
    logger.info('Existing package.json found — keeping it unchanged.');
    return;
  }

  const packageJson = {
    name: isValidProjectName(projectName)
      ? projectName
      : projectName.toLowerCase().replace(/[^a-z0-9._-]+/g, '-'),
    version: '0.1.0',
    private: true,
    description: `${projectName} — AI-assisted software project`,
    scripts: {
      test: 'echo "Add your test runner" && exit 0',
    },
  };

  await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
}

export async function maybeInitGit(targetDir: string): Promise<void> {
  const gitDir = path.join(targetDir, '.git');

  if (await pathExists(gitDir)) {
    logger.info('Git repository already exists — skipping git init.');
    return;
  }

  logger.info('Initializing git repository...');
  await initGitRepository(targetDir);
}

export function formatProviders(providers: Provider[]): string {
  return providers.join(' + ');
}

export function formatList(items: string[]): string {
  return items.length > 0 ? items.join(', ') : 'none';
}
