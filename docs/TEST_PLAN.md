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

## Stage 5

1. Run `npm.cmd run format`.
2. Run `npm.cmd run build`.
3. Run `npm.cmd run lint`.
4. Run the game locally.
5. Select or create a player and open Garage.
6. Confirm Garage shows player name, money, current build, current stats, and a robot preview.
7. Select owned parts in body/head/legs/armor/color slots and confirm the preview/stats update before saving.
8. Save the build, leave Garage, return, and confirm the selected build persists.
9. Reload the browser and confirm the saved build still appears.
10. Start battle from Garage and confirm HP max, player color, armor/damage HUD text, and movement speed reflect the saved build.
11. Confirm laser/rocket/sword weapon switching still works and battle waves/boss/victory/defeat/R restart still work.
12. Confirm two players keep separate saved builds.

## Stage 6

1. Run `npm.cmd run format`.
2. Run `npm.cmd run build`.
3. Run `npm.cmd run lint`.
4. Run the game locally.
5. Select or create a player and open Shop.
6. Confirm Shop shows player name, money, all configured parts, and owned/available/locked/no-money states.
7. Buy an available paid part and confirm money decreases and the row changes to owned.
8. Confirm duplicate purchase is blocked and does not subtract money again.
9. Confirm locked parts cannot be bought.
10. Confirm unaffordable parts cannot be bought.
11. Open Garage and confirm the bought part appears in the owned part list.
12. Equip the bought part, save the build, reload the browser, and confirm the build persists.
13. Create or select a second player and confirm shop purchases and garage builds do not mix between players.
14. Start battle from Garage and confirm the saved build still affects HP/speed/armor/damage/color/weapons.
