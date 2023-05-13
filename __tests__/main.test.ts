import * as process from 'process'
import * as cp from 'child_process'
import * as path from 'path'
import {test, expect} from '@jest/globals'
import {isComment} from '../src/utils'

test('isComment', async () => {
  expect(isComment('test.js', '// TODO: Add tests')).toEqual(true)
  expect(isComment('test.js', 'TODO: Add tests')).toEqual(false)
  expect(isComment('test.js', '// FIXME: Add tests')).toEqual(true)
  expect(isComment('test.js', 'FIXME: Add tests')).toEqual(false)
})

// shows how the runner will run a javascript action with env / stdout protocol
test('test runs', () => {
  process.env['INPUT_MILLISECONDS'] = '500'
  const np = process.execPath
  const ip = path.join(__dirname, '..', 'lib', 'main.js')
  const options: cp.ExecFileSyncOptions = {
    env: process.env
  }
  console.log(cp.execFileSync(np, [ip], options).toString())
})
