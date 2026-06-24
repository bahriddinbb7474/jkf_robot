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

## Stage 4

1. Run `npm.cmd run format`.
2. Run `npm.cmd run build`.
3. Run `npm.cmd run lint`.
4. Run the game locally.
5. Create a player and confirm it appears in the player list.
6. Reload the browser and confirm the player remains selected.
7. Start battle and confirm the selected player name appears in the HUD.
8. Win a battle and confirm that player's wins increase by one.
9. Create/select a second player and confirm its wins/losses are independent.
10. Lose a battle and confirm only the selected player's losses increase by one.
11. Corrupt `jkf_robot.players.v1` in browser storage and confirm StartScene recovers without crashing.
