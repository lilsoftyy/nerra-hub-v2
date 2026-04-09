import { readFileSync } from 'fs';
import { join } from 'path';

const SKILLS_DIR = join(process.cwd(), 'lib', 'agents', 'skills');

export function loadSkill(name: string): string {
  try {
    return readFileSync(join(SKILLS_DIR, `${name}.md`), 'utf-8');
  } catch {
    throw new Error(`Skill "${name}" ikke funnet i ${SKILLS_DIR}`);
  }
}
