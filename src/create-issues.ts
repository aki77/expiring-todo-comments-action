import * as core from '@actions/core'
import * as github from '@actions/github'
import {type Result} from './main'

type IssueCreator = {
  createIssuesForExpiredTodos: (results: readonly Result[]) => Promise<void>
}

export const createIssueCreator = (token: string): IssueCreator => {
  const octokit = github.getOctokit(token)
  const {owner, repo} = github.context.repo

  const generateIssueIdentifier = (result: Result): string => {
    return `[TODO] ${result.file}:${result.line}`
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

  const getUsernameFromEmail = async (
    email: string
  ): Promise<string | null> => {
    try {
      core.debug(`Looking up GitHub username for email: ${email}`)

      const {data: users} = await octokit.rest.search.users({
        q: `${email} in:email`,
        per_page: 1
      })

      if (users.items.length > 0) {
        core.debug(`Found user via email search: ${users.items[0].login}`)
        return users.items[0].login
      }

      core.debug(`No user found via email search, trying username from email`)
      const emailParts = email.split('@')
      if (emailParts.length === 2) {
        const username = emailParts[0]
        core.debug(`Trying to find user with username: ${username}`)
        try {
          const {data: user} = await octokit.rest.users.getByUsername({
            username
          })
          core.debug(`Found user via username lookup: ${user.login}`)
          return user.login
        } catch {
          core.debug(`User not found with username: ${username}`)
          return null
        }
      }

      return null
    } catch (error) {
      core.debug(`Failed to get username from email ${email}: ${error}`)
      return null
    }
  }

  const createIssueForTodo = async (result: Result): Promise<void> => {
    const identifier = generateIssueIdentifier(result)

    const existingIssue = await checkExistingIssue(identifier)
    if (existingIssue) {
      core.info(`Issue already exists for ${identifier}, skipping`)
      return
    }

    const username = result.blame.authorEmail
      ? await getUsernameFromEmail(result.blame.authorEmail)
      : null
    const mention = username ? `@${username}` : result.blame.author || 'Unknown'

    const title = `[TODO] 期限切れ: ${result.file}:${result.line}`
    const fileUrl = `${github.context.serverUrl}/${owner}/${repo}/blob/${github.context.sha}/${result.file}#L${result.line}`
    const commitUrl = `${github.context.serverUrl}/${owner}/${repo}/commit/${result.blame.commit}`

    const body = `## 期限切れのTODOコメント

**識別子**: \`${identifier}\`

### 詳細
- **タイプ**: ${result.type}
- **コメント**: ${result.comment}
- **期限**: ${result.date}
- **ファイル**: [${result.file}:${result.line}](${fileUrl})
- **最終更新**: [${result.blame.date}](${commitUrl})
- **作成者**: ${mention}

### コメント全文
\`\`\`
${result.type}${result.date ? ` [${result.date}]` : ''}: ${result.comment}
\`\`\`

---
*このIssueは期限切れのTODOコメントから自動生成されました。*`

    const labelsInput = core.getInput('issue-labels')
    const labels = labelsInput
      ? labelsInput.split(',').map(label => label.trim())
      : ['expired-todo']

    try {
      const {data: issue} = await octokit.rest.issues.create({
        owner,
        repo,
        title,
        body,
        labels
      })

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
