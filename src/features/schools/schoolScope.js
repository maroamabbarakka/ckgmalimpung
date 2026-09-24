/**
 * Modul Definisi Cakupan & Penyelarasan Satuan Pendidikan
 * Khusus Wilayah Puskesmas CKG Malimpung
 * 
 * Target Sasaran Default:
 * 1. Desa Malimpung (6 Satuan Pendidikan)
 * 2. Desa Padangloang (6 Satuan Pendidikan)
 * 3. Kelurahan Maccirinna (4 Satuan Pendidikan)
 * Total: 16 Satuan Pendidikan Resmi
 */

export const CKG_TARGET_WILAYAH = [
  'Desa Malimpung',
  'Desa Padangloang',
  'Kelurahan Maccirinna'
];

export const CKG_TARGET_SCHOOLS_SCOPE = [
  // --- DESA MALIMPUNG ---
  {
    npsn: '69911295',
    name: 'TK NEGERI PEMBINA II PATAMPANUA',
    level: 'TK/PAUD',
    desa: 'Desa Malimpung',
    status: 'Negeri',
    address: 'Jl. Poros Malimpung, Desa Malimpung'
  },
  {
    npsn: '40304322',
    name: 'UPT SD NEGERI 121 PINRANG',
    level: 'SD',
    desa: 'Desa Malimpung',
    status: 'Negeri',
    address: 'Malimpung, Desa Malimpung'
  },
  {
    npsn: '40305338',
    name: 'UPT SD NEGERI 123 PINRANG',
    level: 'SD',
    desa: 'Desa Malimpung',
    status: 'Negeri',
    address: 'Malimpung, Desa Malimpung'
  },
  {
    npsn: '40305274',
    name: 'UPT SD NEGERI 195 PINRANG',
    level: 'SD',
    desa: 'Desa Malimpung',
    status: 'Negeri',
    address: 'Malimpung, Desa Malimpung'
  },
  {
    npsn: '69761928',
    name: 'UPT SMP NEGERI 5 PATAMPANUA',
    level: 'SMP',
    desa: 'Desa Malimpung',
    status: 'Negeri',
    address: 'Jl. Poros Malimpung, Desa Malimpung'
  },
  {
    npsn: '40305095',
    name: 'UPT SMP NEGERI 4 PATAMPANUA',
    level: 'SMP',
    desa: 'Desa Malimpung',
    status: 'Negeri',
    address: 'Malimpung, Desa Malimpung'
  },

  // --- DESA PADANGLOANG ---
  {
    npsn: '69886044',
    name: 'RA DDI AL-MUNAWARAH PALITA',
    level: 'TK/PAUD',
    desa: 'Desa Padangloang',
    status: 'Swasta',
    address: 'Palita, Desa Padangloang'
  },
  {
    npsn: '69886045',
    name: 'RA DDI ASH-SHIDDIQ',
    level: 'TK/PAUD',
    desa: 'Desa Padangloang',
    status: 'Swasta',
    address: 'Padangloang, Desa Padangloang'
  },
  {
    npsn: '69769246',
    name: 'TK MEKAR',
    level: 'TK/PAUD',
    desa: 'Desa Padangloang',
    status: 'Swasta',
    address: 'Padangloang, Desa Padangloang'
  },
  {
    npsn: '40316640',
    name: 'UPT SD NEGERI PALITA PINRANG',
    level: 'SD',
    desa: 'Desa Padangloang',
    status: 'Negeri',
    address: 'Palita, Desa Padangloang'
  },
  {
    npsn: '40305055',
    name: 'UPT SD NEGERI 260 PINRANG',
    level: 'SD',
    desa: 'Desa Padangloang',
    status: 'Negeri',
    address: 'Padangloang, Desa Padangloang'
  },
  {
    npsn: '40305178',
    name: 'UPT SD NEGERI INPRES PADANG LOANG',
    level: 'SD',
    desa: 'Desa Padangloang',
    status: 'Negeri',
    address: 'Padangloang, Desa Padangloang'
  },

  // --- KELURAHAN MACCIRINNA ---
  {
    npsn: '69751520',
    name: 'RA/BA/TA DDI TAKKALALLA TIMUR',
    level: 'TK/PAUD',
    desa: 'Kelurahan Maccirinna',
    status: 'Swasta',
    address: 'Takkalalla Timur, Kelurahan Maccirinna'
  },
  {
    npsn: '60723874',
    name: 'MIS DDI TAKKALALLA TIMUR',
    level: 'MI',
    desa: 'Kelurahan Maccirinna',
    status: 'Swasta',
    address: 'Takkalalla Timur, Kelurahan Maccirinna'
  },
  {
    npsn: '40305052',
    name: 'UPT SD NEGERI 258 PINRANG',
    level: 'SD',
    desa: 'Kelurahan Maccirinna',
    status: 'Negeri',
    address: 'Maccirinna, Kelurahan Maccirinna'
  },
  {
    npsn: '69788489',
    name: 'MTsS DDI TAKKALALLA TIMUR',
    level: 'MTs',
    desa: 'Kelurahan Maccirinna',
    status: 'Swasta',
    address: 'Takkalalla Timur, Kelurahan Maccirinna'
  }
];

export const CKG_TARGET_NPSNS = new Set(CKG_TARGET_SCHOOLS_SCOPE.map((s) => s.npsn));

/**
 * Normalisasi teks sederhana untuk pencocokan toleran whitespace/simbol.
 */
export function normalizeSchoolText(value) {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/**
 * Normalisasi variasi nama desa target ke bentuk standar:
 * 'Desa Malimpung' | 'Desa Padangloang' | 'Kelurahan Maccirinna'
 */
export function normalizeTargetDesa(desaRaw) {
  const norm = normalizeSchoolText(desaRaw);
  if (norm.includes('malimpung')) return 'Desa Malimpung';
  if (norm.includes('padang')) return 'Desa Padangloang';
  if (norm.includes('maccirinna')) return 'Kelurahan Maccirinna';
  return desaRaw || '';
}

/**
 * Mengambil dan menormalkan sekolah sasaran CKG Malimpung dari seluruh data sekolah.
 * 
 * Fitur penting:
 * - Tidak menghapus data Firestore.
 * - Mengelompokkan sekolah berdasarkan NPSN 16 target.
 * - Melakukan deduplikasi di view: memilih representative record secara deterministik
 *   dan mengumpulkan semua Firestore ID ke dalam `aliasIds`.
 * - Jika sekolah target belum ada di Firestore sama sekali, tetap dibuatkan record
 *   representatif dari scope master agar dashboard 16 sekolah tetap lengkap.
 * 
 * @param {Array<Object>} allSchools - Seluruh dokumen dari Firestore koleksi 'schools'
 * @returns {Array<Object>} 16 sekolah sasaran yang sudah dinormalisasi dan ter-deduplikasi
 */
export function getCkgTargetSchools(allSchools = []) {
  const schoolsByNpsn = new Map();

  // Kumpulkan semua dokumen yang cocok dengan 16 target NPSN
  for (const school of allSchools) {
    const rawNpsn = String(school.npsn || '').trim();
    if (CKG_TARGET_NPSNS.has(rawNpsn)) {
      if (!schoolsByNpsn.has(rawNpsn)) {
        schoolsByNpsn.set(rawNpsn, []);
      }
      schoolsByNpsn.get(rawNpsn).push(school);
    }
  }

  // Bangun daftar 16 sekolah ter-deduplikasi dengan representative record yang deterministik
  return CKG_TARGET_SCHOOLS_SCOPE.map((target) => {
    const matchingDocs = schoolsByNpsn.get(target.npsn) || [];
    
    if (matchingDocs.length === 0) {
      // Belum ada dokumen di database, gunakan representasi master
      return {
        id: `virtual_${target.npsn}`,
        ...target,
        aliasIds: [],
        source: 'Master Target Scope',
        studentSnapshots: {},
        isVirtual: true
      };
    }

    // Pilih representative doc: utamakan yang memiliki snapshot siswa terbaru atau lastUpdated terbaru
    const sorted = [...matchingDocs].sort((a, b) => {
      const aSnapshots = Object.keys(a.studentSnapshots || {}).length;
      const bSnapshots = Object.keys(b.studentSnapshots || {}).length;
      if (bSnapshots !== aSnapshots) return bSnapshots - aSnapshots;
      
      const aUpdated = a.lastUpdated || a.syncedAt || '';
      const bUpdated = b.lastUpdated || b.syncedAt || '';
      return String(bUpdated).localeCompare(String(aUpdated));
    });

    const representative = sorted[0];
    const allIds = Array.from(new Set(matchingDocs.map((d) => d.id).filter(Boolean)));

    return {
      ...target,
      ...representative,
      id: representative.id,
      aliasIds: allIds,
      // Pastikan atribut scope dasar terjaga bila record Firestore belum lengkap
      level: representative.level || target.level,
      desa: normalizeTargetDesa(representative.desa || target.desa),
      address: representative.address || target.address,
      npsn: target.npsn,
      studentSnapshots: representative.studentSnapshots || {},
      totalStudents: representative.totalStudents ?? null
    };
  });
}

/**
 * Memeriksa apakah suatu satuan pendidikan cocok untuk kategori usia pasien di Pos 1.
 * 
 * Aturan kesesuaian:
 * - Kategori SD: SD, MI
 * - Kategori SMP: SMP, MTs
 * - Kategori SMA: SMA, SMK, MA
 * - Kategori TK/PAUD: TK, RA, PAUD, BA, TA
 * 
 * @param {string} schoolLevel - Jenjang sekolah (SD, MI, SMP, MTs, TK/PAUD, dll)
 * @param {string} ageCategory - Kategori usia Pos 1 ('SD', 'SMP', 'SMA', 'Balita', dll)
 * @returns {boolean}
 */
export function isSchoolCompatibleWithAgeCategory(schoolLevel = '', ageCategory = '') {
  const normLevel = normalizeSchoolText(schoolLevel).toUpperCase();
  const category = String(ageCategory || '').toUpperCase();

  if (category === 'SD') {
    return normLevel.includes('SD') || normLevel.includes('MI');
  }

  if (category === 'SMP') {
    return normLevel.includes('SMP') || normLevel.includes('MTS');
  }

  if (category === 'SMA') {
    return normLevel.includes('SMA') || normLevel.includes('SMK') || normLevel.includes('MA');
  }

  if (category === 'TK' || category === 'PAUD' || category === 'BALITA') {
    return (
      normLevel.includes('TK') ||
      normLevel.includes('RA') ||
      normLevel.includes('PAUD') ||
      normLevel.includes('BA') ||
      normLevel.includes('TA')
    );
  }

  return false;
}

/**
 * Mencocokkan suatu kunjungan (visit) dengan sekolah target secara deterministik dan aman.
 * 
 * Urutan prioritas matching:
 * 1. exact schoolId (visit.schoolId === school.id atau visit.pasien_snapshot?.schoolId === school.id)
 * 2. alias schoolId (school.aliasIds berisi ID dokumen duplikat historis)
 * 3. NPSN snapshot bila tersedia pada visit/pasien_snapshot
 * 4. Fallback legacy nama kuat (hanya untuk data lama yang belum memiliki schoolId)
 * 
 * @param {Object} visit
 * @param {Object} school
 * @returns {boolean}
 */
export function visitMatchesSchool(visit, school) {
  if (!visit || !school) return false;

  const visitSchoolId = visit.schoolId || visit.pasien_snapshot?.schoolId;
  
  // 1. Exact schoolId match
  if (visitSchoolId && school.id && visitSchoolId === school.id) {
    return true;
  }

  // 2. Alias schoolId match (untuk menangani dokumen duplikat tanpa menghapusnya dari database)
  if (visitSchoolId && Array.isArray(school.aliasIds) && school.aliasIds.includes(visitSchoolId)) {
    return true;
  }

  // 3. NPSN snapshot match bila ada di visit
  const visitNpsn = String(visit.npsn || visit.pasien_snapshot?.npsn || '').trim();
  const targetNpsn = String(school.npsn || '').trim();
  if (visitNpsn && targetNpsn && visitNpsn === targetNpsn) {
    return true;
  }

  // Jika visit sudah memiliki schoolId tetapi tidak cocok dengan sekolah ini, jangan gunakan name fallback
  if (visitSchoolId) {
    return false;
  }

  // 4. Fallback legacy: hanya jika visit belum memiliki schoolId
  const cluster = visit.klaster || visit.cluster || visit.pasien_snapshot?.klaster;
  // Periksa apakah anak sekolah/siswa/balita
  const isEligibleCluster = !cluster || cluster.includes('Anak') || cluster.includes('Siswa') || cluster.includes('Balita');
  if (!isEligibleCluster) {
    return false;
  }

  const schoolNameNorm = normalizeSchoolText(school.name);
  if (!schoolNameNorm || schoolNameNorm.length < 5) {
    return false;
  }

  // Cek pada field nama sekolah snapshot bila ada di visit
  const snapshotSchoolName = normalizeSchoolText(
    visit.schoolNameSnapshot ||
    visit.schoolName ||
    visit.sekolah ||
    visit.nama_sekolah ||
    visit.pasien_snapshot?.schoolName ||
    visit.pasien_snapshot?.sekolah
  );

  if (snapshotSchoolName && (snapshotSchoolName === schoolNameNorm || snapshotSchoolName.includes(schoolNameNorm))) {
    return true;
  }

  return false;
}
