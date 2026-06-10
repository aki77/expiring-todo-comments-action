---
name: expiring-todo-comments
description: Write expiring TODO/FIXME comments for use with the expiring-todo-comments-action. Use this skill whenever the user asks to add a TODO comment, FIXME comment, or any time-bounded reminder comment in code — especially when they mention a deadline, date, or want the CI to catch stale comments automatically.
---

## Format

```
<comment-prefix> TODO[YYYY-MM-DD]: <description>
<comment-prefix> FIXME[YYYY-MM-DD]: <description>
```

The date in `[YYYY-MM-DD]` is the expiry date. The action will fail the CI check on or after that date.

## Comment prefix by language

| Language | Prefix |
|---|---|
| JS/TS/Go/Java/C/C++ | `//` |
| Ruby/Python/Shell/YAML | `#` |
| SQL/Haskell | `--` |
| ERB | `<%#` … `%>` |
| HAML | `-#` |

## Examples

```js
// TODO[2026-12-31]: Remove after migration to new API
// FIXME[2026-09-01]: Fix memory leak before next major release
```

```ruby
# TODO[2026-06-30]: Deprecate this endpoint
```

```erb
<%# TODO[2026-12-31]: Replace with new component %>
```

## Tips

- Write the description as a short imperative phrase (e.g., "Remove after migration", "Fix before release").
- Omitting the date is valid but won't trigger CI failures — always include a date when there's a real deadline.
- Use ISO 8601 format (`YYYY-MM-DD`). Other formats are not recognized.
- Both `TODO` and `FIXME` are supported (case-insensitive).
