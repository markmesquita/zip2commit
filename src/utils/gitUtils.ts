import * as cp from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(cp.exec);

/**
 * Checks if a commit exists
 */
export async function commitExists(commitHash: string, workspacePath: string): Promise<boolean> {
  try {
    await execAsync(`git cat-file -e ${commitHash}`, { cwd: workspacePath });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Gets the name of the branch containing a commit
 */
export async function getBranchContainingCommit(commitHash: string, workspacePath: string): Promise<string> {
  const gitCommand = `git branch --contains ${commitHash} --format="%(refname:short)"`;
  console.log(`Executing git command: ${gitCommand}`);

  const { stdout } = await execAsync(gitCommand, { cwd: workspacePath });

  // May return multiple branches, take the first one
  const branches = stdout.trim().split('\n').filter(Boolean);
  console.log(`All branches containing commit: ${JSON.stringify(branches)}`);

  if (branches.length === 0) {
    throw new Error('No branches found containing this commit');
  }

  const branchName = branches[0];
  console.log(`Selected branch name: "${branchName}"`);

  if (!branchName) {
    throw new Error('Branch name is empty');
  }

  return branchName;
}

/**
 * Gets the name of the current branch
 */
export async function getCurrentBranch(workspacePath: string): Promise<string> {
  const { stdout } = await execAsync('git rev-parse --abbrev-ref HEAD', { cwd: workspacePath });
  return stdout.trim();
} 