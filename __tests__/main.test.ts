import {test, expect} from '@jest/globals'
import {isComment, parseBlame} from '../src/utils'

test('isComment', async () => {
  expect(isComment('test.js', '// TODO: Add tests')).toEqual(true)
  expect(isComment('test.js', 'TODO: Add tests')).toEqual(false)
  expect(isComment('test.js', '// FIXME: Add tests')).toEqual(true)

  // TODO: Support for Gemfile
  expect(isComment('Gemfile', '# TODO: version up')).toEqual(false)
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
    date: '2023-05-12'
  })
})
