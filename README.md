# expiring-todo-comments-action

Add expiration date to TODO comments.

![Demo](https://i.gyazo.com/fa4eb1b27afa01f7ab8b35e84075c281.png)

## Usage

Please write the due date in the TODO comment in the following format.
If the expiration date expires, the github action will fail.

```typescript
// TODO [2019-11-15]: Refactor this code before the sprint ends.
// FIXME [2019-08-10]: I must refactor this for sure before I deliver.
// TODO: TODO comments with no due date will also be listed.
```

## Example

```yaml
name: TODO comments
on:
  workflow_dispatch:
  schedule:
    - cron: '10 9 * * *'
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0
      - uses: aki77/expiring-todo-comments-action@v1
```

Inspired by [eslint\-plugin\-unicorn](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/expiring-todo-comments.md).
