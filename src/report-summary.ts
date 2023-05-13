import * as core from '@actions/core'
import * as github from '@actions/github'
import {type Result} from './main'

export const reportSummary = async (
  results: readonly Result[]
): Promise<void> => {
  const baseUrl = `${github.context.serverUrl}/${github.context.repo.owner}/${github.context.repo.repo}/blob/${github.context.sha}`

  const rows = results.map(
    ({date, comment, type, blame, file, line, isExpired}) => [
      isExpired && date ? `:bomb: ${date}` : '',
      type,
      comment,
      `\n\n[${file}:${line}](${baseUrl}/${file}#L${line})`,
      blame?.date ?? '',
      blame?.author ?? ''
    ]
  )

  await core.summary
    .addHeading(':heavy_check_mark: TODO Comments')
    .addTable([
      [
        {data: 'Deadline :alarm_clock:', header: true},
        {data: 'Type :pencil2:', header: true},
        {data: 'Comment :memo:', header: true},
        {data: 'File :link:', header: true},
        {data: 'Updated :date:', header: true},
        {data: 'Author :sunglasses:', header: true}
      ],
      ...rows
    ])
    .write()

  core.debug(JSON.stringify(rows))
}
