import * as commentPattern from 'comment-patterns'

const FILE_ALIASES: Record<string, string> = {
  Gemfile: 'Gemfile.rb',
  Rakefile: 'Rakefile.rb'
}

const TODO_PATTERN =
  /\s(TODO|FIXME)\s?(?:\s(?:\((?:[^)]+)\)|@(?:\w+)))?\s*(?:\[(\d{4}-\d{2}-\d{2})\])?:\s*(.*)$/i

// TODO: Do not use comment-patterns package
export const isComment = (file: string, text: string): boolean => {
  const aliasedFilename = FILE_ALIASES[file] ?? file
  try {
    return commentPattern.regex(aliasedFilename).regex.test(text)
  } catch (error) {
    return false
  }
}

export type TodoComment = {
  date: string | undefined
  comment: string
  type: 'TODO' | 'FIXME'
}

export const parseTodoComment = (text: string): TodoComment | undefined => {
  const match = text.match(TODO_PATTERN)
  if (!match) return

  const [, _type, date, comment] = match
  const type = _type.toUpperCase()
  if (type !== 'TODO' && type !== 'FIXME') return

  return {date, comment, type}
}

export const formatDate = (date: Date): string => {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export type Blame = {
  commit: string
  author: string
  date: string
}

const BLAME_PATTERN =
  /^(\w{40})[\s\S]+?author\s(.+?)\n[\s\S]+committer-time\s(\d+)/m

export const parseBlame = (text: string): Blame | undefined => {
  const match = text.match(BLAME_PATTERN)
  if (!match) return

  const [, commit, author, timestamp] = match
  return {
    commit,
    author,
    date: formatDate(new Date(parseInt(timestamp, 10) * 1000))
  }
}
