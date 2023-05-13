import * as commentPattern from 'comment-patterns'

export const isComment = (file: string, text: string): boolean => {
  return commentPattern.regex(file).regex.test(text)
}

export const formatDate = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}
