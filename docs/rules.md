# Engineering Rules — Alphabet Rush

## 1. General

- Prefer small, focused modules.
- Keep route pages readable.
- Reuse shared components.
- Avoid duplicating business logic.
- Keep external integrations isolated.

## 2. React

- Use functional components.
- Use descriptive component names.
- Clean up Socket.IO listeners.
- Use semantic HTML where practical.
- Associate labels with form inputs.
- Use type="button" for non-submit buttons.
- Extract repeated UI before pages become difficult to maintain.

## 3. Realtime

- Treat the server as authoritative.
- Do not trust browser-provided scores.
- Keep Socket event payloads explicit.
- Remove page-specific listeners during unmount.
- Keep one logical owner for each event.

## 4. Validation

- Trim user-entered names and text.
- Validate required data before emitting it.
- Keep API secrets on the server.
- Treat AI responses as service results, not guaranteed truth.
- Keep AI integration in server/src/services/.

## 5. Security

- Never commit environment files or API keys.
- Never put the OpenAI API key in frontend code.
- Validate and limit user-controlled payloads on the server.
- Do not accept client-provided score changes as authoritative.
- Add explicit authorization to host-only operations.
- Add rate limiting before high-cost public AI operations.

## 6. Styling

- Use shared CSS variables.
- Maintain both light and dark themes.
- Use readable font sizes.
- Preserve responsive behavior.
- Prefer separate style files by concern.
- Avoid fixing one page through accidental global regressions.

## 7. Git

Recommended prefixes: feat:, fix:, refactor:, docs:, style:, chore:, test:.

Keep commits focused and explain behavior changes clearly.

## 8. Documentation

Update documentation when a major folder is added, a Socket event changes, environment variables change, deployment behavior changes, gameplay rules change, or a significant limitation is removed.

## 9. Quality Gate

Before merging a substantial change:

- Check the primary user flow.
- Check both themes.
- Check mobile layout.
- Check Socket listener cleanup.
- Run frontend lint/build.
- Run relevant tests when available.
- Update documentation when architecture or behavior changes.
