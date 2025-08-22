import {expect, test} from '@jest/globals'
import {isComment, parseBlame, parseTodoComment} from '../src/utils'

test('isComment', async () => {
  // JavaScript/TypeScript
  expect(isComment('test.js', '// TODO: Add tests')).toEqual(true)
  expect(isComment('test.js', 'TODO: Add tests')).toEqual(false)
  expect(isComment('test.js', '// FIXME: Add tests')).toEqual(true)
  expect(isComment('test.js', 'code() // TODO: Fix this')).toEqual(true)
  expect(isComment('test.ts', 'const x = 1 // TODO: Update')).toEqual(true)

  // Ruby - 行頭コメント
  expect(isComment('Gemfile', '# TODO: version up')).toEqual(true)
  expect(isComment('fixtures/Gemfile', '# TODO: version up')).toEqual(true)
  expect(isComment('fixtures/Rakefile', '# TODO: add tests')).toEqual(true)

  // Ruby - 行末コメント（重要なテストケース）
  expect(isComment('Gemfile', "gem 'test' # TODO: Update")).toEqual(true)
  expect(
    isComment(
      'fixtures/Gemfile',
      "gem 'commonmarker', '2.0.4' # TODO[2025-04-30]: Update"
    )
  ).toEqual(true)
  expect(isComment('Rakefile', 'task :test # TODO: Add description')).toEqual(
    true
  )
  expect(isComment('test.rb', 'def method # FIXME: Refactor')).toEqual(true)

  // Python
  expect(isComment('test.py', '# TODO: Add tests')).toEqual(true)
  expect(isComment('test.py', 'def func(): # TODO: Implement')).toEqual(true)

  // SQL
  expect(
    isComment('test.sql', 'SELECT * FROM table -- TODO: Optimize')
  ).toEqual(true)

  // 未対応の言語
  expect(isComment('test.unknown', '# TODO: Add tests')).toEqual(false)
})

test('parseTodoComment', async () => {
  expect(parseTodoComment('// TODO: Add tests')).toEqual({
    date: undefined,
    comment: 'Add tests',
    type: 'TODO'
  })
  expect(parseTodoComment('// todo: Add tests')).toEqual({
    date: undefined,
    comment: 'Add tests',
    type: 'TODO'
  })
  expect(parseTodoComment('// FIXME [2021-10-10]: Add tests')).toEqual({
    date: '2021-10-10',
    comment: 'Add tests',
    type: 'FIXME'
  })
  expect(
    parseTodoComment(
      '// TODO (lubien) [2200-12-12]: You can add something before the arguments.'
    )
  ).toEqual({
    date: '2200-12-12',
    comment: 'You can add something before the arguments.',
    type: 'TODO'
  })
  expect(
    parseTodoComment(
      '// TODO @lubien [2200-12-12]: You can add something before the arguments.'
    )
  ).toEqual({
    date: '2200-12-12',
    comment: 'You can add something before the arguments.',
    type: 'TODO'
  })
})

test('parseBlame', async () => {
  const stdout = `b0546e57f74ec824e6c5cd8601808bd54d6b141e 40 40 1
author aki
author-mail <aki@test.test>
author-time 1683849528
author-tz +0900
committer aki
committer-mail <aki@test.test>
committer-time 1683849528
committer-tz +0900
summary First release
previous c9c6e64d1107a46fc864209228565d0d92e75c5c src/main.ts
filename src/main.ts
    if (!match) return`

  expect(parseBlame(stdout)).toEqual({
    commit: 'b0546e57f74ec824e6c5cd8601808bd54d6b141e',
    author: 'aki',
    authorEmail: 'aki@test.test',
    date: '2023-05-11'
  })
})
