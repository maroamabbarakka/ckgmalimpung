# Urutan Commit Disarankan

Gunakan commit kecil agar mudah rollback.

## Sprint 0
1. `docs: add baseline audit`
2. `chore: record current build and lint status`

## Sprint 1
1. `refactor(auth): add centralized permission matrix`
2. `refactor(auth): introduce RequireRole route guard`
3. `docs(auth): add auth usage map`
4. `security: add firestore rules draft`
5. `feat(audit): log auth events`

## Sprint 2
1. `feat(workflow): add workflow state definitions`
2. `feat(workflow): add transition guards`
3. `feat(lock): add patient lock service`
4. `feat(pos): apply workflow guard to Pos1`
5. `feat(pos): apply workflow guard to remaining pos pages`

## Sprint 3
1. `ui: add shared UI components`
2. `ui(pos1): migrate to shared layout`
3. `ui(pos2): migrate to shared layout`
4. `ui(dashboard): standardize cards and badges`

## Sprint 4
1. `refactor(dashboard): split dashboard widgets`
2. `feat(reports): standardize export metadata`
3. `perf(dashboard): use aggregated stats service`

## Sprint 5
1. `feat(sync): add global sync indicator`
2. `feat(sync): add draft recovery service`
3. `feat(sync): add conflict detector`
4. `feat(sync): add retry queue`
