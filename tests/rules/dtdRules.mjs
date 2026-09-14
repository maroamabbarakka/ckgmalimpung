import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment
} from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

const projectId = 'ckg-malimpung-dtd-rules-test';
const rules = await fs.readFile(new URL('../../firestore.rules', import.meta.url), 'utf8');
const testEnv = await initializeTestEnvironment({ projectId, firestore: { rules } });

const dtdDb = testEnv.authenticatedContext('dtd-user', {
  roles: ['door_to_door'],
  isActive: true
}).firestore();
const adminDb = testEnv.authenticatedContext('admin-user', {
  roles: ['admin'],
  isActive: true
}).firestore();
const doctorDb = testEnv.authenticatedContext('doctor-user', {
  roles: ['dokter'],
  isActive: true
}).firestore();

try {
  await assertSucceeds(setDoc(doc(dtdDb, 'patients', 'patient-dtd'), {
    nik: 'patient-dtd',
    name: 'Pasien DTD'
  }));
  await assertSucceeds(getDoc(doc(dtdDb, 'patients', 'patient-dtd')));
  await assertSucceeds(updateDoc(doc(dtdDb, 'patients', 'patient-dtd'), { phone: '08123456789' }));
  await assertFails(updateDoc(doc(dtdDb, 'patients', 'patient-dtd'), { adminOnly: true }));

  await assertSucceeds(setDoc(doc(dtdDb, 'visits', 'dtd-visit'), {
    visit_source: 'door_to_door',
    jalur_pemeriksaan: 'Kunjungan Rumah',
    created_by_uid: 'dtd-user',
    status_antrian: 'Selesai'
  }));
  await assertSucceeds(updateDoc(doc(dtdDb, 'visits', 'dtd-visit'), { kesimpulan_dokter: '' }));
  await assertFails(updateDoc(doc(dtdDb, 'visits', 'dtd-visit'), { created_by_uid: 'other-user' }));
  await assertSucceeds(setDoc(doc(dtdDb, 'visits', 'legacy-dtd-visit'), {
    jalur_pemeriksaan: 'Kunjungan Rumah',
    created_by_uid: 'dtd-user',
    status_antrian: 'Selesai'
  }));
  await assertSucceeds(updateDoc(doc(dtdDb, 'visits', 'legacy-dtd-visit'), { kesimpulan_dokter: '' }));
  await assertFails(setDoc(doc(dtdDb, 'visits', 'normal-visit-attempt'), {
    jalur_pemeriksaan: 'Puskesmas',
    created_by_uid: 'dtd-user'
  }));

  await testEnv.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'visits', 'normal-existing'), {
      jalur_pemeriksaan: 'Puskesmas',
      status_antrian: 'Pos 1'
    });
  });
  await assertFails(updateDoc(doc(dtdDb, 'visits', 'normal-existing'), { status_antrian: 'Selesai' }));

  await assertFails(setDoc(doc(dtdDb, 'users', 'forbidden'), { roles: ['admin'] }));
  await assertFails(setDoc(doc(dtdDb, 'staff', 'forbidden'), { role: ['admin'] }));
  await assertFails(setDoc(doc(dtdDb, 'pengaturan', 'forbidden'), { active: true }));
  await assertFails(setDoc(doc(dtdDb, 'public_queue', 'forbidden'), { status_antrian: 'Pos 1' }));

  await assertSucceeds(setDoc(doc(adminDb, 'visits', 'admin-normal'), {
    jalur_pemeriksaan: 'Puskesmas',
    status_antrian: 'Pos 1'
  }));
  await assertSucceeds(setDoc(doc(doctorDb, 'patients', 'doctor-patient'), {
    nik: 'doctor-patient',
    name: 'Pasien Dokter',
    clinicalLegacyField: true
  }));

  const adminVisit = await getDoc(doc(adminDb, 'visits', 'admin-normal'));
  assert.equal(adminVisit.exists(), true);
  console.log('Firestore DTD rules matrix: PASS');
} finally {
  await testEnv.cleanup();
}
