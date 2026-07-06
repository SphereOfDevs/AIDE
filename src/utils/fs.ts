import fs from 'fs-extra';
import path from 'path';

export interface PlaceholderValues {
  PROJECT_NAME: string;
  DATE: string;
}

const PLACEHOLDER_PATTERN = /\{\{([A-Z_]+)\}\}/g;

export function getPackageRoot(): string {
  return path.resolve(__dirname, '..', '..');
}

export function getTemplatesRoot(): string {
  return path.join(getPackageRoot(), 'templates');
}

export async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

export function renderPlaceholders(content: string, placeholders: PlaceholderValues): string {
  return content.replace(PLACEHOLDER_PATTERN, (match, key: string) => {
    const value = placeholders[key as keyof PlaceholderValues];
    return value ?? match;
  });
}

export function isTextFile(filePath: string): boolean {
  const ext = path.extname(filePath).toLowerCase();
  const textExtensions = new Set([
    '.md',
    '.mdc',
    '.json',
    '.txt',
    '.yml',
    '.yaml',
    '.js',
    '.ts',
    '.jsx',
    '.tsx',
    '.html',
    '.css',
    '.env',
    '.gitignore',
  ]);

  if (textExtensions.has(ext)) {
    return true;
  }

  const basename = path.basename(filePath);
  return basename === 'AGENTS.md' || basename === 'CLAUDE.md' || !ext;
}

export async function walkFiles(dir: string): Promise<string[]> {
  const files: string[] = [];

  async function walk(relativePath = ''): Promise<void> {
    const currentDir = path.join(dir, relativePath);
    const entries = await fs.readdir(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.name.startsWith('.git')) {
        continue;
      }

      const relativeEntry = relativePath ? path.join(relativePath, entry.name) : entry.name;

      if (entry.isDirectory()) {
        await walk(relativeEntry);
      } else if (entry.isFile()) {
        files.push(relativeEntry);
      }
    }
  }

  await walk();
  return files;
}

export async function copyTemplateTree(
  sourceDir: string,
  targetDir: string,
  placeholders: PlaceholderValues
): Promise<void> {
  await fs.ensureDir(targetDir);
  const copiedFiles = await copyTree(sourceDir, targetDir, { overwrite: true });
  await injectPlaceholders(copiedFiles, placeholders);
}

export async function mergeTemplateTree(
  sourceDir: string,
  targetDir: string,
  placeholders: PlaceholderValues
): Promise<string[]> {
  await fs.ensureDir(targetDir);
  const copiedFiles = await copyTree(sourceDir, targetDir, { overwrite: false });
  await injectPlaceholders(copiedFiles, placeholders);
  return copiedFiles;
}

async function copyTree(
  sourceDir: string,
  targetDir: string,
  options: { overwrite: boolean }
): Promise<string[]> {
  const relativeFiles = await walkFiles(sourceDir);
  const copiedFiles: string[] = [];

  for (const relative of relativeFiles) {
    const sourcePath = path.join(sourceDir, relative);
    const destinationPath = path.join(targetDir, relative);

    if (!options.overwrite && (await pathExists(destinationPath))) {
      continue;
    }

    await fs.ensureDir(path.dirname(destinationPath));
    await fs.copy(sourcePath, destinationPath, { overwrite: options.overwrite });
    copiedFiles.push(destinationPath);
  }

  return copiedFiles;
}

export async function injectPlaceholders(
  files: string[],
  placeholders: PlaceholderValues
): Promise<void> {
  for (const filePath of files) {
    if (!isTextFile(filePath)) {
      continue;
    }

    const content = await fs.readFile(filePath, 'utf8');
    const replaced = renderPlaceholders(content, placeholders);

    if (replaced !== content) {
      await fs.writeFile(filePath, replaced, 'utf8');
    }
  }
}

export async function initGitRepository(targetDir: string): Promise<void> {
  const { execSync } = await import('child_process');
  const gitDir = path.join(targetDir, '.git');

  if (await pathExists(gitDir)) {
    return;
  }

  execSync('git init', { cwd: targetDir, stdio: 'pipe' });

  const gitignorePath = path.join(targetDir, '.gitignore');
  if (!(await pathExists(gitignorePath))) {
    await fs.writeFile(
      gitignorePath,
      ['node_modules/', 'dist/', '.env', '.DS_Store', 'Thumbs.db', ''].join('\n'),
      'utf8'
    );
  }
}

export function buildPlaceholders(projectName: string): PlaceholderValues {
  return {
    PROJECT_NAME: projectName,
    DATE: new Date().toISOString().split('T')[0],
  };
}

export function resolveInitDirectory(outputDir?: string): string {
  return path.resolve(outputDir ?? process.cwd());
}

export async function readPackageName(targetDir: string): Promise<string | undefined> {
  const packageJsonPath = path.join(targetDir, 'package.json');

  if (!(await pathExists(packageJsonPath))) {
    return undefined;
  }

  try {
    const packageJson = await fs.readJson(packageJsonPath);
    if (typeof packageJson.name === 'string' && packageJson.name.trim()) {
      return packageJson.name.replace(/^@[^/]+\//, '').trim();
    }
  } catch {
    return undefined;
  }

  return undefined;
}
