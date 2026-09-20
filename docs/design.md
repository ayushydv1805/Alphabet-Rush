# Design System & UX — Alphabet Rush

## 1. Design Direction

Alphabet Rush uses a modern multiplayer-game dashboard aesthetic built around indigo/violet accents, glass-like surfaces, strong typography, high-contrast primary actions, subtle motion, responsive layouts and shared theme tokens.

The goal is a polished product UI without unnecessary decoration.

## 2. Typography

Primary typeface: **Inter**

| Level | Purpose |
| --- | --- |
| Large title | Screen identity |
| Section title | Group content |
| Body | Instructions and context |
| Label | Form guidance |
| Helper text | Secondary information |
| Button text | Clear action |

Use size and weight to create hierarchy instead of many font families.

## 3. Theme

The global theme is controlled by useTheme.js.

The preference is stored under the localStorage key:

~~~text
alphabet-rush-theme
~~~

The theme switcher is rendered from the app shell, so it remains available across routes.

## 4. Home

The home screen should explain the game immediately, make Create Room and Join Room obvious, communicate multiplayer value and avoid unnecessary controls.

## 5. Create / Join Room

The shared form language is:

- Clear title.
- Short supporting copy.
- Labels above inputs.
- Large touch-friendly controls.
- One obvious primary action.
- Simple back action.

## 6. Waiting Room

The waiting room should make these answers obvious:

1. What room am I in?
2. Who is here?
3. What happens next?

The room code is prominent and copyable.

## 7. Game

The game screen prioritizes speed:

1. Game title and round.
2. Timer.
3. Current letter.
4. Submission status.
5. Answer fields.
6. Submit button.

Every label stays visually attached to its input.

## 8. Results

Round Result should show the winner, letter, current scores and next action.

Leaderboard should show final scores, score order, play-again action and return-to-home action.

## 9. Interaction

- Primary actions should look primary.
- Secondary actions should remain visually quieter.
- Disabled controls should look disabled.
- Hover should enhance, not dominate.
- Focus states must remain visible.
- Motion should never be required to understand the interface.

## 10. Responsive Behavior

The UI has desktop-first card layouts with responsive rules around the mobile/tablet range and additional handling for very narrow screens.

All core flows should remain usable without horizontal scrolling.

## 11. Accessibility

Current design includes input labels, keyboard focus outlines, semantic buttons and links, ARIA labels for icon-only controls and reduced-motion handling.

Future work should include formal keyboard-flow and screen-reader testing.
