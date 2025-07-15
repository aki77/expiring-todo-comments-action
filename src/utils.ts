const COMMENT_PATTERNS = {
  // Languages that use # for comments (Ruby, Python, Shell, YAML, etc.)
  hash: /#\s*(.+)$/,
  // Languages that use // for comments (JavaScript, Java, C++, Go, etc.)
  doubleSlash: /\/\/\s*(.+)$/,
  // Languages that use -- for comments (SQL, Haskell, etc.)
  doubleDash: /--\s*(.+)$/,
  // Languages that use ; for comments (Lisp, Assembly, etc.)
  semicolon: /;\s*(.+)$/
} as const

const FILE_ALIASES: Record<string, string> = {
  Gemfile: 'rb',
  Rakefile: 'rb',
  Dockerfile: 'sh',
  Makefile: 'sh'
} as const

const LANGUAGE_PATTERNS: Record<string, keyof typeof COMMENT_PATTERNS> = {
  // Ruby
  rb: 'hash',
  // JavaScript/TypeScript
  js: 'doubleSlash',
  ts: 'doubleSlash',
  jsx: 'doubleSlash',
  tsx: 'doubleSlash',
  // Python
  py: 'hash',
  // Shell scripts
  sh: 'hash',
  bash: 'hash',
  zsh: 'hash',
  // YAML
  yaml: 'hash',
  yml: 'hash',
  // SQL
  sql: 'doubleDash',
  // Other languages
  java: 'doubleSlash',
  cpp: 'doubleSlash',
  c: 'doubleSlash',
  go: 'doubleSlash',
  lisp: 'semicolon'
} as const

const TODO_PATTERN =
  /\s(TODO|FIXME)\s?(?:\s(?:\((?:[^)]+)\)|@(?:\w+)))?\s*(?:\[(\d{4}-\d{2}-\d{2})\])?:\s*(.*)$/i

export const isComment = (file: string, text: string): boolean => {
  const basename = file.split('/').pop() || file

  // 1. First check for file name aliases (for files without extensions)
  const aliasedExt = FILE_ALIASES[basename]
  if (aliasedExt) {
    const patternKey = LANGUAGE_PATTERNS[aliasedExt]
    if (patternKey) {
      const pattern = COMMENT_PATTERNS[patternKey]
      return pattern.test(text)
    }
  }

  // 2. Check by file extension
  const ext = basename.split('.').pop() || basename
  const patternKey = LANGUAGE_PATTERNS[ext]

  if (!patternKey) {
    return false
  }

  const pattern = COMMENT_PATTERNS[patternKey]
  return pattern.test(text)
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
