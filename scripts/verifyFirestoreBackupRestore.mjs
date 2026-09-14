import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import {
  Bytes,
  GeoPoint,
  Timestamp,
  collection,
  doc,
  getDocs,
  writeBatch
} from 'firebase/firestore';

const EXPECTED_PROJECT_ID = 'ckg-malimpung-restore-drill';
const ALLOWED_EMULATOR_HOSTS = new Set(['127.0.0.1:8080', 'localhost:8080']);
const backupDir = path.resolve(process.env.DTD_RESTORE_BACKUP_DIR || '');

if (!process.env.DTD_RESTORE_BACKUP_DIR) {
  throw new Error('Set DTD_RESTORE_BACKUP_DIR to the validated backup directory.');
}
if (!ALLOWED_EMULATOR_HOSTS.has(process.env.FIRESTORE_EMULATOR_HOST)) {
  throw new Error('Restore drill refused: FIRESTORE_EMULATOR_HOST must be localhost:8080.');
}
if (process.env.GCLOUD_PROJECT !== EXPECTED_PROJECT_ID) {
  throw new Error(`Restore drill refused: GCLOUD_PROJECT must be ${EXPECTED_PROJECT_ID}.`);
}

const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');
const canonicalize = (value) => {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.keys(value).sort().map((key) => [key, canonicalize(value[key])])
  );
};
const canonicalJson = (value) => JSON.stringify(canonicalize(value));

const decodeFirestoreValue = (value, db) => {
  if (Array.isArray(value)) return value.map((item) => decodeFirestoreValue(item, db));
  if (!value || typeof value !== 'object') return value;

  switch (value.__firestoreType) {
    case 'timestamp':
      return new Timestamp(value.seconds, value.nanoseconds);
    case 'geopoint':
      return new GeoPoint(value.latitude, value.longitude);
    case 'bytes':
      return Bytes.fromBase64String(value.base64);
    case 'reference':
      return doc(db, value.path);
    default:
      return Object.fromEntries(
        Object.entries(value).map(([key, nested]) => [key, decodeFirestoreValue(nested, db)])
      );
  }
};

const encodeFirestoreValue = (value) => {
  if (value === null || value === undefined) return value ?? null;
  if (Array.isArray(value)) return value.map(encodeFirestoreValue);
  if (typeof value !== 'object') return value;
  if (value instanceof Timestamp) {
    return {
      __firestoreType: 'timestamp',
      seconds: value.seconds,
      nanoseconds: value.nanoseconds,
      iso: value.toDate().toISOString()
    };
  }
  if (value instanceof GeoPoint) {
    return { __firestoreType: 'geopoint', latitude: value.latitude, longitude: value.longitude };
  }
  if (value instanceof Bytes) {
    return { __firestoreType: 'bytes', base64: value.toBase64() };
  }
  if (typeof value.path === 'string' && value.firestore) {
    return { __firestoreType: 'reference', path: value.path };
  }
  return Object.fromEntries(
    Object.entries(value).map(([key, nested]) => [key, encodeFirestoreValue(nested)])
  );
};

const manifestPath = path.join(backupDir, 'manifest.json');
const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
if (manifest.mode !== 'read-only-client-sdk' || !manifest.collections) {
  throw new Error('Backup manifest is missing or is not a supported read-only backup.');
}

const loadedCollections = new Map();
for (const [collectionName, expected] of Object.entries(manifest.collections)) {
  const filename = `${collectionName}.json`;
  const raw = await fs.readFile(path.join(backupDir, filename), 'utf8');
  if (sha256(raw) !== expected.sha256) throw new Error(`Checksum mismatch: ${filename}`);
  const documents = JSON.parse(raw);
  if (!Array.isArray(documents) || documents.length !== expected.count) {
    throw new Error(`Document count mismatch: ${filename}`);
  }
  if (new Set(documents.map(({ id }) => id)).size !== documents.length) {
    throw new Error(`Duplicate document ID found: ${filename}`);
  }
  loadedCollections.set(collectionName, documents);
}

const testEnv = await initializeTestEnvironment({
  projectId: EXPECTED_PROJECT_ID,
  firestore: { host: '127.0.0.1', port: 8080 }
});

try {
  await testEnv.clearFirestore();
  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    for (const [collectionName, documents] of loadedCollections) {
      for (let offset = 0; offset < documents.length; offset += 400) {
        const batch = writeBatch(db);
        for (const item of documents.slice(offset, offset + 400)) {
          batch.set(doc(db, collectionName, item.id), decodeFirestoreValue(item.data, db));
        }
        await batch.commit();
      }
      console.log(`RESTORED ${collectionName}: ${documents.length}`);
    }
  });

  await testEnv.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    for (const [collectionName, expectedDocuments] of loadedCollections) {
      const snapshot = await getDocs(collection(db, collectionName));
      const actualById = new Map(
        snapshot.docs.map((item) => [item.id, canonicalJson(encodeFirestoreValue(item.data()))])
      );
      if (actualById.size !== expectedDocuments.length) {
        throw new Error(`Restored count mismatch: ${collectionName}`);
      }
      for (const item of expectedDocuments) {
        if (actualById.get(item.id) !== canonicalJson(item.data)) {
          throw new Error(`Restored data mismatch: ${collectionName}/${item.id}`);
        }
      }
      console.log(`VERIFIED ${collectionName}: ${actualById.size}`);
    }
  });

  console.log(`RESTORE_DRILL_PASS collections=${loadedCollections.size}`);
} finally {
  await testEnv.clearFirestore();
  await testEnv.cleanup();
}
