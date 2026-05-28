# FIREBASE INDEX GUIDE

## REQUIRED INDEX

patients:
- createdAt DESC
- nik ASC

visits:
- patientId ASC
- createdAt DESC

## FORBIDDEN

Jangan query:
- tanpa limit
- tanpa orderBy