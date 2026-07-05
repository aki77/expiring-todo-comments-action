import * as core from '@actions/core'
import * as github from '@actions/github'

export interface GitHubCommitAuthor {
  username: string | null
  isBot: boolean
  name: string
  email: string | undefined
}

type GitHubUsernameResult = {
  username: string | null
  isBot: boolean
}

/**
 * Get the exact GitHub username from a commit using GitHub API
 * @param token GitHub token
 * @param owner Repository owner
 * @param repo Repository name
 * @param commitSha Commit SHA
 * @returns GitHub username (if exists) or null, along with whether it's a bot account
 */
export const getGitHubUsernameFromCommit = async (
  token: string,
  owner: string,
  repo: string,
  commitSha: string
): Promise<GitHubUsernameResult> => {
  try {
    const octokit = github.getOctokit(token)

    core.debug(`Fetching commit details from GitHub API for SHA: ${commitSha}`)

    // Get commit details from GitHub API
    const {data: commit} = await octokit.rest.repos.getCommit({
      owner,
      repo,
      ref: commitSha
    })

    // Check commit author information on GitHub
    // author: User information when linked to a GitHub account
    // commit.author: Author information from the git commit itself

    if (commit.author?.login) {
      // When linked to a GitHub account
      core.debug(
        `Found GitHub username from commit author: ${commit.author.login}`
      )
      return {
        username: commit.author.login,
        isBot: commit.author.type === 'Bot'
      }
    }

    // Also check committer information (may differ from author)
    if (commit.committer?.login && commit.committer.login !== 'web-flow') {
      // Exclude web-flow as it's a bot for commits via GitHub Web interface
      core.debug(
        `Found GitHub username from committer: ${commit.committer.login}`
      )
      return {
        username: commit.committer.login,
        isBot: commit.committer.type === 'Bot'
      }
    }

    core.debug(`No GitHub username found for commit ${commitSha}`)
    return {username: null, isBot: false}
  } catch (error) {
    core.debug(
      `Failed to get GitHub username from commit ${commitSha}: ${error}`
    )
    return {username: null, isBot: false}
  }
}

/**
 * Get author information from commit (prioritizing GitHub username)
 * @param token GitHub token
 * @param owner Repository owner
 * @param repo Repository name
 * @param commitSha Commit SHA
 * @param fallbackAuthor Author name obtained from git blame
 * @param fallbackEmail Email obtained from git blame (optional)
 * @returns Author information
 */
export const getCommitAuthorInfo = async (
  token: string,
  owner: string,
  repo: string,
  commitSha: string,
  fallbackAuthor: string,
  fallbackEmail: string | undefined
): Promise<GitHubCommitAuthor> => {
  const {username, isBot} = await getGitHubUsernameFromCommit(
    token,
    owner,
    repo,
    commitSha
  )

  return {
    username,
    isBot,
    name: fallbackAuthor,
    email: fallbackEmail
  }
}
