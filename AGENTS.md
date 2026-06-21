# JKF_robot Agent Guide

## Project identity

- Product name: `JKF_robot`.
- Technical directory: `jkf_robot`.
- The product is a local browser-based 2D top-down combat robot game for teenagers.

## MVP goal and loop

The MVP must run locally in a browser and provide the smallest complete progression loop:

`create player -> battle -> victory/defeat -> reward -> shop -> garage -> new mission`

The final MVP scope includes WASD and mouse controls, laser/rocket/sword weapons, enemies and a boss, separate player progress, a shop, a garage, missions, math/English multiple-choice bonus questions, and basic sounds.

## Allowed stack

- TypeScript
- Phaser 3
- Vite
- Static JSON configuration
- A storage abstraction may be introduced when assigned.
- Backend and SQLite are allowed only in a separate, explicit future task.

## MVP constraints

Do not add:

- multiplayer or other online features;
- VPS or deployment infrastructure;
- login/password or Google login;
- an admin panel;
- AI-generated questions;
- complex layered robot visual assembly;
- a repair system;
- mobile controls;
- a large campaign.

Keep the MVP local and deliberately small. Bought parts are permanent. Questions are multiple-choice only. Energy is not part of the MVP.

## Required workflow

1. Read `AGENTS.md` and the relevant files in `docs/` before changing code.
2. Work only on the assigned stage or substage.
3. Do not add unrequested features or advance to another stage without an explicit user or architect instruction.
4. Make small, focused changes.
5. Run the checks appropriate to the change before committing.
6. Commit only after verification succeeds.

## Required report

Every completed task report must include:

- files changed;
- what was implemented;
- checks run and their results;
- final result or verdict;
- commit hash and message;
- risks, limitations, and notes.
