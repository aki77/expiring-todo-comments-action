# Expiring TODO Comments Action

A GitHub Action that helps you manage technical debt by tracking TODO comments with expiration dates. Never let temporary fixes become permanent again!

![Demo](https://i.gyazo.com/fa4eb1b27afa01f7ab8b35e84075c281.png)

## Why Use This Action?

- **Prevent Technical Debt**: Automatically track and remind you of TODOs that need attention
- **Deadline Enforcement**: Fail builds when TODO comments pass their expiration date
- **Team Accountability**: Keep your team aware of pending tasks and deadlines
- **Zero Configuration**: Works out of the box with sensible defaults

## Usage

Add expiration dates to your TODO comments using the format `[YYYY-MM-DD]`:

```typescript
// TODO [2024-12-31]: Refactor this code before the sprint ends
// FIXME [2024-08-15]: Fix this performance issue before the next release
// TODO: Comments without dates are also tracked (won't fail the build)
```

### Supported Comment Formats

The action recognizes these comment patterns:
- `TODO [date]: description`
- `FIXME [date]: description`

Supports various programming languages including JavaScript, TypeScript, Python, Ruby, Shell, SQL, and more.

## Basic Setup

Create `.github/workflows/todo-check.yml`:

```yaml
name: Check TODO Comments
on:
  workflow_dispatch:
  schedule:
    - cron: '0 9 * * *'  # Run daily at 9 AM UTC
  pull_request:
    types: [opened, synchronize]

jobs:
  check-todos:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
        with:
          fetch-depth: 0
      - uses: aki77/expiring-todo-comments-action@v3
```

### With GitHub Issue Creation

![Image from Gyazo](https://i.gyazo.com/6832986e3146292760b58ac113d94805.png)

To automatically create GitHub issues for expired TODOs:

```yaml
name: Check TODO Comments with Issue Creation
on:
  workflow_dispatch:
  schedule:
    - cron: '0 9 * * *'  # Run daily at 9 AM UTC

jobs:
  check-todos:
    runs-on: ubuntu-latest
    permissions:
      issues: write      # Required to create issues
      contents: read     # Required to read repository
    steps:
      - uses: actions/checkout@v5
        with:
          fetch-depth: 0
      - uses: aki77/expiring-todo-comments-action@v3
        with:
          create-issues: true
          github-token: ${{ github.token }}
          issue-labels: 'expired-todo,technical-debt'  # Optional: customize labels
```

## How It Works

The action scans your repository for TODO and FIXME comments with expiration dates and:

1. **Searches** all files in your repository for TODO/FIXME comments
2. **Parses** comments with the format `[YYYY-MM-DD]` to extract expiration dates
3. **Checks** if any comments have passed their expiration date
4. **Reports** findings in the GitHub Actions summary with file links and author information
5. **Creates** GitHub issues for expired TODOs (optional)
6. **Fails** the workflow if any expired TODO comments are found

All date calculations use UTC timezone.

## Usage Examples

### Daily Scheduled Check

```yaml
name: Daily TODO Check
on:
  schedule:
    - cron: '0 9 * * *'  # Run daily at 9 AM UTC

jobs:
  check-todos:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: aki77/expiring-todo-comments-action@v3
```

### Manual Trigger

```yaml
name: Manual TODO Check
on:
  workflow_dispatch:

jobs:
  check-todos:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: aki77/expiring-todo-comments-action@v3
```

## Best Practices

1. **Set Realistic Dates**: Don't set expiration dates too far in the future
2. **Be Specific**: Include context about why the TODO exists and what needs to be done
3. **Use FIXME for Bugs**: Use `FIXME` for bugs and `TODO` for improvements
4. **Regular Reviews**: Run the action on a schedule to catch expired TODOs early
5. **Team Communication**: Use TODO comments to communicate with your team about temporary code

## Example TODO Comments

```javascript
// TODO [2024-12-31]: Migrate to new authentication system after Q4 security audit
// FIXME [2024-08-15]: This causes memory leak in production - see issue #123
// TODO [2024-10-15]: Add proper error handling for edge cases
// FIXME [2024-11-01]: Fix performance issue in user search functionality
// TODO: This is a regular TODO without expiration date
```

## Troubleshooting

### Action Passes with "No TODO comments found"

This is normal behavior when there are no TODO comments in your codebase. The action will pass successfully.

### Comments Not Being Detected

1. Ensure the comment format matches exactly: `// TODO [YYYY-MM-DD]: description`
2. Check that your comment syntax is supported for your programming language
3. Verify that the file contains valid TODO or FIXME comments

### Date Format Issues

- Use the exact format `[YYYY-MM-DD]` (e.g., `[2024-12-31]`)
- Ensure square brackets are present around the date
- The action uses UTC timezone for all date calculations

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Inspiration

Inspired by [eslint-plugin-unicorn](https://github.com/sindresorhus/eslint-plugin-unicorn/blob/main/docs/rules/expiring-todo-comments.md)'s expiring-todo-comments rule.
