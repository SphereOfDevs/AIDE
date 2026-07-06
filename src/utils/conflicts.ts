import fs from 'fs-extra';
import path from 'path';
import confirm from '@inquirer/confirm';
import { logger } from './logger';
import { isTextFile, pathExists, renderPlaceholders, walkFiles, type PlaceholderValues } from './fs';
import { addManagedMarker, hasManagedMarker } from './markers';

export interface ApplyManagedTreeOptions {
  force?: boolean;
  autoConfirm?: boolean;
}

export interface ApplyManagedTreeResult {
  written: string[];
  regenerated: string[];
  skippedForeign: string[];
}

export async function applyManagedTree(
  sourceDir: string,
  targetDir: string,
  placeholders: PlaceholderValues,
  options: ApplyManagedTreeOptions = {}
): Promise<ApplyManagedTreeResult> {
  const relativeFiles = await walkFiles(sourceDir);

  const toWrite: { relative: string; sourcePath: string; destinationPath: string; isNew: boolean }[] = [];
  const foreign: string[] = [];

  for (const relative of relativeFiles) {
    const sourcePath = path.join(sourceDir, relative);
    const destinationPath = path.join(targetDir, relative);
    const exists = await pathExists(destinationPath);

    if (!exists) {
      toWrite.push({ relative, sourcePath, destinationPath, isNew: true });
      continue;
    }

    if (!isTextFile(destinationPath)) {
      continue;
    }

    const existingContent = await fs.readFile(destinationPath, 'utf8');

    if (hasManagedMarker(existingContent)) {
      toWrite.push({ relative, sourcePath, destinationPath, isNew: false });
    } else {
      foreign.push(relative);
    }
  }

  let overwriteForeign = Boolean(options.force);

  if (foreign.length > 0 && !overwriteForeign) {
    logger.warn(`Found ${foreign.length} existing file(s) not managed by AIDE:`);
    for (const relative of foreign) {
      logger.dim(`  - ${relative}`);
    }

    if (options.autoConfirm) {
      overwriteForeign = true;
    } else {
      overwriteForeign = await confirm({
        message: 'Overwrite these files with AIDE-managed versions?',
        default: false,
      });
    }

    if (!overwriteForeign) {
      logger.info('Keeping existing files — AIDE will skip them.');
    }
  }

  if (overwriteForeign) {
    for (const relative of foreign) {
      toWrite.push({
        relative,
        sourcePath: path.join(sourceDir, relative),
        destinationPath: path.join(targetDir, relative),
        isNew: false,
      });
    }
  }

  const written: string[] = [];
  const regenerated: string[] = [];

  for (const item of toWrite) {
    await fs.ensureDir(path.dirname(item.destinationPath));

    if (!isTextFile(item.sourcePath)) {
      await fs.copy(item.sourcePath, item.destinationPath, { overwrite: true });
      written.push(item.destinationPath);
      continue;
    }

    const rawContent = await fs.readFile(item.sourcePath, 'utf8');
    const rendered = renderPlaceholders(rawContent, placeholders);
    const marked = addManagedMarker(rendered);

    await fs.writeFile(item.destinationPath, marked, 'utf8');

    if (item.isNew) {
      written.push(item.destinationPath);
    } else {
      regenerated.push(item.destinationPath);
    }
  }

  return {
    written,
    regenerated,
    skippedForeign: overwriteForeign ? [] : foreign,
  };
}

export interface WriteManagedFileOptions {
  force?: boolean;
  autoConfirm?: boolean;
}

export async function writeManagedFile(
  destinationPath: string,
  content: string,
  options: WriteManagedFileOptions = {}
): Promise<{ written: boolean; skipped: boolean }> {
  const marked = addManagedMarker(content);
  const exists = await pathExists(destinationPath);

  if (exists && isTextFile(destinationPath)) {
    const existingContent = await fs.readFile(destinationPath, 'utf8');

    if (!hasManagedMarker(existingContent) && !options.force) {
      logger.warn(`Existing file not managed by AIDE: ${destinationPath}`);

      const overwrite = options.autoConfirm
        ? true
        : await confirm({ message: 'Overwrite this file with the AIDE-managed version?', default: false });

      if (!overwrite) {
        logger.info(`Skipped: ${destinationPath}`);
        return { written: false, skipped: true };
      }
    }
  }

  await fs.ensureDir(path.dirname(destinationPath));
  await fs.writeFile(destinationPath, marked, 'utf8');
  return { written: true, skipped: false };
}
