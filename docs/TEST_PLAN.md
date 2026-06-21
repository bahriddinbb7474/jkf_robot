# Test Plan

## Stage 0-A

1. Run `npm install`.
2. Run `npm run build`; TypeScript and the production bundle must succeed.
3. Run `npm run lint`; no lint errors are allowed.
4. Run `npm run dev` and open the printed local URL.
5. Confirm the screen shows `JKF_robot`, `MVP Foundation Ready`, and `Stage 0-A` with no browser console errors.

## Future MVP coverage

- Launch and scene navigation.
- Player creation, separate save/load, and corrupt-data handling.
- Laser, rocket, and sword behavior.
- Mission start, outcome, reward, and progression.
- Shop purchases and garage equipment.
- Math/English question selection, answer validation, and bonus.
