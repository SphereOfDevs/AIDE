import path from 'path';
import { hashFile } from '../utils/manifest';
import { getPersona, type PersonaKey } from '../personas/registry';
import { relativeSurveyPath } from './survey-files';

export interface SurveyFileStatus {
  relativePath: string;
  exists: boolean;
  filled: boolean;
}

export async function getSurveyFileStatus(
  targetDir: string,
  relativePath: string,
  baselineHash: string | undefined
): Promise<SurveyFileStatus> {
  const absolutePath = path.join(targetDir, relativePath);
  const currentHash = await hashFile(absolutePath);

  if (currentHash === null) {
    return { relativePath, exists: false, filled: false };
  }

  if (!baselineHash) {
    return { relativePath, exists: true, filled: true };
  }

  return { relativePath, exists: true, filled: currentHash !== baselineHash };
}

export interface PersonaReadiness {
  persona: PersonaKey;
  ready: boolean;
  blockedBy: string[];
}

export async function computePersonaReadiness(
  targetDir: string,
  personas: PersonaKey[],
  surveyFiles: Record<string, string>
): Promise<PersonaReadiness[]> {
  const results: PersonaReadiness[] = [];

  for (const key of personas) {
    const persona = getPersona(key);
    const blockedBy: string[] = [];

    for (const fileName of persona.requiredSurveyFiles) {
      const relative = relativeSurveyPath(fileName);
      const status = await getSurveyFileStatus(targetDir, relative, surveyFiles[relative]);

      if (!status.exists || !status.filled) {
        blockedBy.push(relative);
      }
    }

    results.push({ persona: key, ready: blockedBy.length === 0, blockedBy });
  }

  return results;
}
