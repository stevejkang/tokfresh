# Guideline

## Commit Message Convention

### Format

```
<Imperative verb> <what changed>
                                        ← blank line (optional, only if body needed)
<Additional details>                    ← body (optional)
```

- **No type prefixes** — Do NOT use `feat:`, `fix:`, `refactor:`, `chore:`, or any conventional commit types
- **No scopes** — Do NOT use `(auth):`, `(api):`, or any parenthesized scopes
- **Capitalize** the first letter of every sentence
- **Present tense**, imperative mood (e.g., "Add", not "Added" or "Adds")
- **72 characters max** for the first line
- **No trailing punctuation** on the subject line
- Focus on **what and why**, not how

### Approved Verbs

Use verbs like: `Add`, `Fix`, `Update`, `Remove`, `Replace`, `Rename`, `Move`, `Apply`, `Enforce`, `Refactor`,
`Simplify`, `Improve`, `Enhance`, `Implement`, `Persist`, `Prevent`, `Ensure`, `Correct`, `Avoid`, `Allow`, `Verify`,
`Enable`, `Disable`, `Increase`, `Decrease`, `Downsize`, `Set`, `Pass`, `Change`, `Make`, `Use`

### Examples

```
Add GA4 events for authentication flow
Fix spacing between AuthButton and FloatingActionButton on desktop
Replace Redis with MySQL for like and helpful data
Persist review helpful marks to MySQL and fix N+1 query
Rename KAKAO_API_CLIENT_SECRET to KAKAO_CLIENT_SECRET in deployment workflow
Apply Prettier formatting to API source files
Enforce single quotes and fix lint issues in frontend
Add fallback for FingerprintJS when blocked by browser privacy settings
Improve magic link email template
Downsize ECS Fargate task to 0.25 vCPU / 512MB for cost optimization
Update dependency @nestjs/config to ^4.0.3
```

### Bad Examples (DO NOT follow)

| Bad                           | Reason                                   |
|-------------------------------|------------------------------------------|
| `feat: add user auth`         | Type prefix `feat:` is prohibited        |
| `fix(auth): token expiry`     | Both type and scope are prohibited       |
| `added new endpoint`          | Past tense; must capitalize first letter |
| `update deps.`                | Trailing punctuation; too vague          |
| `Refactoring the user module` | Use imperative "Refactor", not gerund    |

### Multi-line Commits

When additional context is needed, add a body separated by a blank line:

```
Replace Redis with MySQL for like and helpful data

Redis was a single point of failure for persisted user interactions.
Migrated like and helpful counts to MySQL for durability.
```
