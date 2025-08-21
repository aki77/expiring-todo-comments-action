import * as core from '@actions/core'
import {exec} from 'child_process'
import {promisify} from 'util'
import {createIssueCreator} from './create-issues'
import {reportSummary} from './report-summary'
import {sortBy} from './sort-by'
import {
  type Blame,
  formatDate,
  isComment,
  parseBlame,
  parseTodoComment,
  type TodoComment
} from './utils'

const execAsync = promisify(exec)

const LINE_PATTERN = /^(\S+):(\d+):(.*)$/

type TodoCommentLine = {
  file: string
  line: number
  text: string
}

export type Result = Pick<TodoCommentLine, 'file' | 'line'> &
  TodoComment & {
    blame: Blame
    isExpired: boolean
  }

// TODO: Add tests
const getBlame = async (
  file: string,
  line: number
): Promise<Blame | undefined> => {
  const {stdout} = await execAsync(
    `git blame --line-porcelain -L ${line},${line} ${file}`
  )

  // Debug: Log raw git blame output
  core.debug(`Git blame output for ${file}:${line}:`)
  core.debug(stdout)

  const blame = parseBlame(stdout)

  // Debug: Log parsed blame information
  if (blame) {
    core.debug(`Parsed blame info:`)
    core.debug(`  - commit: ${blame.commit}`)
    core.debug(`  - author: ${blame.author}`)
    core.debug(`  - authorEmail: ${blame.authorEmail}`)
    core.debug(`  - date: ${blame.date}`)
  }

  return blame
}

// TODO [2021-10-10]: Add tests
const getAllTodoCommentLines = async (): Promise<
  readonly TodoCommentLine[]
> => {
  const {stdout} = await execAsync(
    "git grep -I -n -P '\\s(TODO|FIXME)\\s?(\\[.*?\\])?:'"
  )
  return stdout
    .trim()
    .split('\n')
    .map(lineText => {
      const match = lineText.match(LINE_PATTERN)
      if (!match) return

      const [, file, line, text] = match
      if (!isComment(file, text)) return

      return {file, line: parseInt(line, 10), text: text.trim()}
    })
    .filter((line): line is TodoCommentLine => !!line)
}

// FIXME: dummy
async function run(): Promise<void> {
  try {
    const todayString = formatDate(new Date())
    const todoCommentLines = await getAllTodoCommentLines()
    const promises = todoCommentLines.map(async ({file, line, text}) => {
      const blame = await getBlame(file, line)
      if (!blame) return

      const todoComment = parseTodoComment(text)
      if (!todoComment) return

      const isExpired = !!(todoComment.date && todoComment.date < todayString)

      return {file, line, blame, ...todoComment, isExpired}
    })

    const results: readonly Result[] = (await Promise.all(promises)).filter(
      (result): result is Exclude<typeof result, undefined> => !!result
    )
    const sortedResults = sortBy(results, ({date, blame}) => {
      return [date ?? '9999-99-99', blame.date].join('-')
    })

    core.debug(JSON.stringify(sortedResults))
    await reportSummary(sortedResults)

    const createIssues = core.getInput('create-issues') === 'true'
    const githubToken = core.getInput('github-token')

    if (createIssues && githubToken) {
      const issueCreator = createIssueCreator(githubToken)
      await issueCreator.createIssuesForExpiredTodos(sortedResults)
    } else if (createIssues && !githubToken) {
      core.warning('github-token is required to create issues')
    }

    if (results.some(result => result.isExpired)) {
      core.setFailed('Some TODOs are expired!')
    }
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
