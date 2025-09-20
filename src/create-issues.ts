import * as core from '@actions/core'
import * as github from '@actions/github'
import * as crypto from 'crypto'
import {getCommitAuthorInfo} from './github-commit-helper'
import {type Result} from './main'

type IssueCreator = {
  createIssuesForExpiredTodos: (results: readonly Result[]) => Promise<void>
}

export const createIssueCreator = (token: string): IssueCreator => {
  const octokit = github.getOctokit(token)
  const {owner, repo} = github.context.repo

  const generateIssueIdentifier = (result: Result): string => {
    // Create a stable hash based on file path, TODO type, and comment content
    // This ensures the same TODO will have the same identifier even if line numbers change
    const contentToHash = `${result.file}:${result.type}:${result.comment.trim()}`
    const hash = crypto.createHash('sha256').update(contentToHash).digest('hex')
    // Use first 8 characters of hash for readability
    return `TODO-${hash.substring(0, 8)}`
  }

  const checkExistingIssue = async (identifier: string): Promise<boolean> => {
    try {
      const {data: issues} = await octokit.rest.issues.listForRepo({
        owner,
        repo,
        state: 'open',
        per_page: 100
      })

      return issues.some(
        issue =>
          issue.title?.includes(identifier) || issue.body?.includes(identifier)
      )
    } catch (error) {
      core.warning(`Failed to check existing issues: ${error}`)
      return false
    }
  }

  const createIssueForTodo = async (result: Result): Promise<void> => {
    const identifier = generateIssueIdentifier(result)

    const existingIssue = await checkExistingIssue(identifier)
    if (existingIssue) {
      core.info(`Issue already exists for ${identifier}, skipping`)
      return
    }

    // Get exact username from commit information via GitHub API
    const authorInfo = await getCommitAuthorInfo(
      token,
      owner,
      repo,
      result.blame.commit,
      result.blame.author,
      undefined
    )

    // Use @mention if GitHub username exists, otherwise use blame.author as is
    const mention = authorInfo.username
      ? `@${authorInfo.username}`
      : result.blame.author || 'Unknown'

    const title = `[TODO] Expired: ${result.file}:${result.line}`
    const fileUrl = `${github.context.serverUrl}/${owner}/${repo}/blob/${github.context.sha}/${result.file}#L${result.line}`
    const commitUrl = `${github.context.serverUrl}/${owner}/${repo}/commit/${result.blame.commit}`

    const body = `## Expired TODO Comment

**Identifier**: \`${identifier}\`

### Details
- **Type**: ${result.type}
- **Comment**: ${result.comment}
- **Due Date**: ${result.date}
- **File**: [${result.file}:${result.line}](${fileUrl})
- **Last Updated**: [${result.blame.date}](${commitUrl})
- **Author**: ${mention}

### Full Comment
\`\`\`
${result.type}${result.date ? ` [${result.date}]` : ''}: ${result.comment}
\`\`\`

---
*This issue was automatically generated from an expired TODO comment.*
*Identifier is content-based to prevent duplicates when line numbers change.*`

    const labelsInput = core.getInput('issue-labels')
    const labels = labelsInput
      ? labelsInput.split(',').map(label => label.trim())
      : ['expired-todo']

    try {
      const issueParams = {
        owner,
        repo,
        title,
        body,
        labels,
        ...(authorInfo.username && {assignees: [authorInfo.username]})
      }

      const {data: issue} = await octokit.rest.issues.create(issueParams)

      core.info(`Created issue #${issue.number} for ${identifier}`)
    } catch (error) {
      core.error(`Failed to create issue for ${identifier}: ${error}`)
    }
  }

  return {
    createIssuesForExpiredTodos: async (results: readonly Result[]) => {
      const expiredResults = results.filter(result => result.isExpired)

      if (expiredResults.length === 0) {
        core.info('No expired TODOs found')
        return
      }

      core.info(`Found ${expiredResults.length} expired TODO(s)`)

      for (const result of expiredResults) {
        await createIssueForTodo(result)
      }
    }
  }
}
