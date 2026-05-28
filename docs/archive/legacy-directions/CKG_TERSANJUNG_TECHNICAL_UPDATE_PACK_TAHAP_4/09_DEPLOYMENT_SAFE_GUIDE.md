# SAFE DEPLOYMENT GUIDE

## BEFORE DEPLOY

- backup firestore
- export rules
- tag release

## DEPLOY ORDER

1. rules
2. indexes
3. functions
4. frontend

## AFTER DEPLOY

- test login
- test patient flow
- test export
- test offline