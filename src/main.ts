import * as core from '@actions/core'
import {exec} from 'child_process'
import {promisify} from 'util'
import {formatDate, isComment} from './utils'

const execAsync = promisify(exec)

const LINE_PATTERN = /^(\S+):(\d+):(.*)$/
const TODO_PATTERN = /\s(TODO|FIXME)\s?(?:\[(\d{4}-\d{2}-\d{2})\])?:(.*)$/
const BLAME_PATTERN =
  /^(\w{40})[\s\S]+?author\s(.+?)\n[\s\S]+committer-time\s(\d+)/m

type Blame = {
  commit: string
  author: string
  date: string
}
type TodoCommentLine = {
  file: string
  line: number
  text: string
}

type TodoComment = {
  date: string | undefined
  comment: string
  type: 'TODO' | 'FIXME'
}

const parseTodoComment = (text: string): TodoComment | undefined => {
  const match = text.match(TODO_PATTERN)
  if (!match) return

  const [, type, date, comment] = match
  if (type !== 'TODO' && type !== 'FIXME') return

  return {date, comment, type}
}

// TODO: Add tests
const getBlame = async (
  file: string,
  line: number
): Promise<Blame | undefined> => {
  const {stdout} = await execAsync(
    `git blame --line-porcelain -L ${line},${line} ${file}`
  )
  const match = stdout.match(BLAME_PATTERN)
  if (!match) return

  const [, commit, author, timestamp] = match
  return {
    commit,
    author,
    date: formatDate(new Date(parseInt(timestamp, 10) * 1000))
  }
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

    const results = (await Promise.all(promises)).filter(
      (result): result is Exclude<typeof result, undefined> => !!result
    )

    core.debug(JSON.stringify(results))

    if (results.some(result => result.isExpired)) {
      core.setFailed('Some TODOs are expired!')
    }
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
