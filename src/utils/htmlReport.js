const STATUS_SELESAI = 'Selesai';

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const formatNumber = (value) => new Intl.NumberFormat('id-ID').format(value || 0);

const toDate = (value) => {
  if (!value) return null;
  if (value.toDate) return value.toDate();
  if (value.toMillis) return new Date(value.toMillis());
  if (value instanceof Date) return value;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const getVisitDate = (visit) =>
  toDate(visit.waktu_ambil_tiket || visit.waktu_selesai_total || visit.waktu_selesai || visit.lastUpdated || visit._date);

const dateKey = (date) => {
  if (!date) return 'Tanpa tanggal';
  return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
};

const getCluster = (visit) => {
  const raw = String(visit.kategori_usia_satusehat || '').toLowerCase();
  if (raw.includes('bayi') || raw.includes('balita')) return 'Bayi/Balita';
  if (raw.includes('anak') || raw.includes('remaja') || raw.includes('siswa') || ['sd', 'smp', 'sma'].includes(raw)) return 'Anak/Siswa';
  if (raw.includes('lansia')) return 'Lansia';
  return 'Dewasa';
};

const getAge = (visit) => {
  const directAge = parseInt(visit.umur_saat_periksa ?? visit.pos1?.umur ?? visit.pasien_snapshot?.umur, 10);
  if (!Number.isNaN(directAge)) return directAge;
  const birthDate = visit.pasien_snapshot?.tgl_lahir ? new Date(`${visit.pasien_snapshot.tgl_lahir}T00:00:00`) : null;
  if (!birthDate || Number.isNaN(birthDate.getTime())) return null;
  const visitDate = getVisitDate(visit) || new Date();
  let age = visitDate.getFullYear() - birthDate.getFullYear();
  const monthDiff = visitDate.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && visitDate.getDate() < birthDate.getDate())) age -= 1;
  return age >= 0 ? age : null;
};

const getAgeGroup = (visit) => {
  const age = getAge(visit);
  if (age === null) return 'Belum diisi';
  if (age <= 5) return 'Balita (0-5)';
  if (age <= 11) return 'Anak (6-11)';
  if (age <= 18) return 'Remaja (12-18)';
  if (age <= 39) return 'Dewasa Muda (19-39)';
  if (age <= 59) return 'Dewasa (40-59)';
  return 'Lansia (60+)';
};

const isCompleted = (visit) => visit.status_antrian === STATUS_SELESAI;

const isAttended = (visit) =>
  Boolean(visit.patientNIK || visit.pasien_snapshot?.nama || isCompleted(visit) || visit.status_antrian !== 'Antri Pos 1');

const extractValue = (posData, keywords, questionMap = {}) => {
  if (!posData) return null;
  const key = Object.keys(posData).find((itemKey) => {
    const keyText = String(itemKey).toLowerCase();
    const questionText = String(questionMap[itemKey] || '').toLowerCase();
    return keywords.some((keyword) => keyText.includes(keyword) || questionText.includes(keyword));
  });
  return key ? posData[key] : null;
};

const getRiskStats = (visits) => {
  const stats = { hipertensi: 0, hiperglikemia: 0, obesitas: 0, paru: 0, mental: 0, indera: 0 };

  visits.forEach((visit) => {
    const td = String(visit.pos2?.td || extractValue(visit.pos2, ['tekanan darah'], visit.pos2_question_map) || '');
    const systolic = parseInt(extractValue(visit.pos2, ['sistolik'], visit.pos2_question_map) || td.split('/')[0], 10);
    const diastolic = parseInt(extractValue(visit.pos2, ['diastolik'], visit.pos2_question_map) || td.split('/')[1], 10);
    if ((!Number.isNaN(systolic) && systolic >= 140) || (!Number.isNaN(diastolic) && diastolic >= 90)) stats.hipertensi += 1;

    const gds = parseInt(visit.pos4?.gds || extractValue(visit.pos4, ['gula darah sewaktu', 'gds'], visit.pos4_question_map) || visit.pos2?.gds || extractValue(visit.pos2, ['gula darah sewaktu', 'gds'], visit.pos2_question_map) || 0, 10);
    const gdp = parseInt(visit.pos4?.gdp || extractValue(visit.pos4, ['gula darah puasa', 'gdp'], visit.pos4_question_map) || visit.pos2?.gdp || extractValue(visit.pos2, ['gula darah puasa', 'gdp'], visit.pos2_question_map) || 0, 10);
    if (gds >= 200 || gdp >= 126) stats.hiperglikemia += 1;

    const tb = parseFloat(visit.pos2?.tb || extractValue(visit.pos2, ['tinggi badan'], visit.pos2_question_map) || 0);
    const bb = parseFloat(visit.pos2?.bb || extractValue(visit.pos2, ['berat badan'], visit.pos2_question_map) || 0);
    if (tb > 0 && bb > 0 && getCluster(visit) !== 'Bayi/Balita') {
      const imt = bb / Math.pow(tb / 100, 2);
      if (imt >= 25) stats.obesitas += 1;
    }

    const p3 = visit.pos3 || {};
    const p4 = visit.pos4 || {};
    const p5 = visit.pos5 || {};
    const p6 = visit.pos6 || {};
    const skilas = p3.skilas || p6.skilas || {};

    if (p4.ppok?.nafas_pendek === 'Ya' || p5.ppok?.nafas_pendek === 'Ya' || p4.resiko_ca_paru?.riw_merokok === 'Ya' || p4.resiko_tb?.batuk_lama === '>2Mg' || p5.resiko_tb?.batuk === 'Ya') stats.paru += 1;

    const mental =
      Object.values(p3.jiwa_srq20 || {}).some((value) => String(value) !== 'Tidak' && String(value) !== 'Tdk' && value !== '') ||
      Object.values(p6.jiwa_srq20 || {}).some((value) => String(value) !== 'Tidak' && String(value) !== 'Tdk' && value !== '') ||
      Object.values(p3.jiwa_sdq || {}).some((value) => String(value) === 'Ya') ||
      skilas.dep_sedih === 'Ya' ||
      skilas.dep_minat_turun === 'Ya';
    if (mental) stats.mental += 1;

    const visus = String(p3.mata?.visus || '').toLowerCase();
    if ((visus && !['6/6', 'normal'].includes(visus)) || p3.telinga?.gg_pendengaran === 'Ya' || p3.telinga?.infeksi === 'Ya') stats.indera += 1;
  });

  return stats;
};

const countBy = (items, getKey) => {
  const map = new Map();
  items.forEach((item) => {
    const key = getKey(item) || 'Belum diisi';
    map.set(key, (map.get(key) || 0) + 1);
  });
  return Array.from(map.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name));
};

const percent = (value, total) => (total ? Math.round((value / total) * 100) : 0);

const riskLabel = {
  hipertensi: 'Hipertensi',
  hiperglikemia: 'Hiperglikemia',
  obesitas: 'Obesitas/IMT Tinggi',
  paru: 'Risiko Paru/TB/PPOK',
  mental: 'Kesehatan Mental',
  indera: 'Indera'
};

const riskTone = (value, total) => {
  const pct = percent(value, total);
  if (pct >= 30) return 'Tinggi';
  if (pct >= 15) return 'Sedang';
  if (pct > 0) return 'Terkendali';
  return 'Belum tampak';
};

const getHealthConclusion = ({ total, selesai, hadir, risks, topRisk, topWilayah }) => {
  if (!total) return 'Belum ada data pada filter ini. Laporan belum dapat menggambarkan kondisi kesehatan masyarakat.';
  const completion = percent(selesai, total);
  const attendance = percent(hadir, total);
  const riskTotal = Object.values(risks).reduce((sum, value) => sum + value, 0);
  const riskDensity = Math.round((riskTotal / Math.max(total, 1)) * 100) / 100;
  const riskText = topRisk?.value
    ? `${riskLabel[topRisk.name] || topRisk.name} menjadi temuan paling menonjol`
    : 'belum ada risiko dominan yang muncul';
  const wilayahText = topWilayah
    ? ` Konsentrasi perhatian terbesar berada di ${topWilayah.name}.`
    : '';

  if (completion >= 80 && riskDensity < 0.5) {
    return `Gambaran umum menunjukkan cakupan pemeriksaan baik (${completion}% selesai; ${attendance}% hadir) dengan beban risiko relatif rendah. ${riskText}.${wilayahText}`;
  }
  if (riskDensity >= 1) {
    return `Data CKG menunjukkan beban risiko kesehatan masyarakat perlu perhatian intensif: rata-rata terdapat ${riskDensity} temuan risiko per peserta. ${riskText}.${wilayahText}`;
  }
  if (completion < 60) {
    return `Gambaran kesehatan masyarakat belum sepenuhnya utuh karena pemeriksaan selesai baru ${completion}%. Perlu penguatan penyelesaian alur pemeriksaan agar pemetaan risiko lebih akurat. ${riskText}.${wilayahText}`;
  }
  return `Kondisi kesehatan masyarakat menunjukkan capaian layanan cukup, dengan beberapa indikator risiko yang perlu ditindaklanjuti terarah. ${riskText}.${wilayahText}`;
};

const barRows = (rows, total, tone = 'teal') =>
  rows.map((row) => {
    const pct = percent(row.value, total);
    return `
      <div class="bar-row">
        <div class="bar-head"><span>${escapeHtml(row.name)}</span><strong>${formatNumber(row.value)} (${pct}%)</strong></div>
        <div class="bar-track"><div class="bar-fill ${tone}" style="width:${pct}%"></div></div>
      </div>
    `;
  }).join('');

const metricCard = (label, value, helper, tone = '') => `
  <div class="metric ${tone}">
    <span>${escapeHtml(label)}</span>
    <strong>${escapeHtml(value)}</strong>
    <small>${escapeHtml(helper)}</small>
  </div>
`;

const donutCard = (label, value, total, helper, tone = 'teal') => {
  const pct = percent(value, total);
  return `
    <div class="donut-card">
      <div class="donut ${tone}" style="--pct:${pct}"><span>${pct}%</span></div>
      <div>
        <strong>${escapeHtml(label)}</strong>
        <p>${formatNumber(value)} dari ${formatNumber(total)} ${escapeHtml(helper)}</p>
      </div>
    </div>
  `;
};

const riskCards = (rows, total) =>
  rows.map((row) => `
    <div class="risk-card">
      <div class="risk-top">
        <span>${escapeHtml(riskLabel[row.name] || row.name)}</span>
        <strong>${formatNumber(row.value)}</strong>
      </div>
      <div class="risk-meta">
        <span>${percent(row.value, total)}% peserta</span>
        <b>${riskTone(row.value, total)}</b>
      </div>
      <div class="bar-track compact"><div class="bar-fill rose" style="width:${percent(row.value, Math.max(...rows.map((item) => item.value), 1))}%"></div></div>
    </div>
  `).join('');

const wilayahCards = (rows, maxValue) =>
  rows.map((row, index) => {
    const intensity = Math.max(10, percent(row.risiko || row.total, maxValue || 1));
    return `
      <div class="wilayah-card" style="--intensity:${intensity}%">
        <div class="rank">${index + 1}</div>
        <div>
          <strong>${escapeHtml(row.name)}</strong>
          <p>${formatNumber(row.total)} peserta | ${formatNumber(row.risiko)} akumulasi risiko | ${percent(row.selesai, row.total)}% selesai</p>
        </div>
      </div>
    `;
  }).join('');

const serviceFlow = (items, total) =>
  items.map((item) => `
    <div class="flow-step">
      <span>${escapeHtml(item.label)}</span>
      <strong>${formatNumber(item.value)}</strong>
      <div class="bar-track compact"><div class="bar-fill" style="width:${percent(item.value, total)}%"></div></div>
    </div>
  `).join('');

const tableRows = (rows) =>
  rows.map((row, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${escapeHtml(row.name)}</td>
      <td>${formatNumber(row.total ?? row.value)}</td>
      <td>${formatNumber(row.selesai ?? 0)}</td>
      <td>${formatNumber(row.risiko ?? 0)}</td>
    </tr>
  `).join('');

const buildInsight = ({ total, selesai, hadir, risks, topDusun }) => {
  const dominantRisk = Object.entries(risks).sort((a, b) => b[1] - a[1])[0];
  const completion = percent(selesai, total);
  const attendance = percent(hadir, total);
  return [
    `Periode/filter ini memuat ${formatNumber(total)} pendaftar, dengan ${formatNumber(hadir)} peserta hadir (${attendance}%) dan ${formatNumber(selesai)} pemeriksaan selesai (${completion}%).`,
    dominantRisk && dominantRisk[1] > 0
      ? `Indikator risiko terbanyak adalah ${dominantRisk[0]} sebanyak ${formatNumber(dominantRisk[1])} temuan.`
      : 'Belum ada indikator risiko dominan dari data yang terfilter.',
    topDusun
      ? `Wilayah dengan volume data tertinggi adalah ${topDusun.name} dengan ${formatNumber(topDusun.total)} peserta.`
      : 'Sebaran wilayah belum cukup untuk ditarik menjadi prioritas lokasi.'
  ];
};

export const buildIntegratedHtmlReport = (visits = [], filters = {}) => {
  const now = new Date();
  const assetBase = typeof window !== 'undefined' ? window.location.origin : '';
  const total = visits.length;
  const hadir = visits.filter(isAttended).length;
  const selesai = visits.filter(isCompleted).length;
  const risks = getRiskStats(visits);
  const clusterRows = countBy(visits, getCluster);
  const desaRows = countBy(visits, (visit) => visit.pasien_snapshot?.desa || visit.desa_pelaksanaan || 'Belum diisi');
  const dusunRows = countBy(visits, (visit) => visit.pasien_snapshot?.dusun || visit.tempat_pelaksanaan || 'Belum diisi').slice(0, 8);
  const trendRows = countBy(visits, (visit) => dateKey(getVisitDate(visit))).slice(0, 10).reverse();
  const genderRows = countBy(visits, (visit) => visit.pasien_snapshot?.j_kelamin === 'L' ? 'Laki-laki' : visit.pasien_snapshot?.j_kelamin === 'P' ? 'Perempuan' : 'Belum diisi');
  const ageRows = countBy(visits, getAgeGroup);
  const riskRows = Object.entries(risks).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  const topDusun = dusunRows[0] ? {
    ...dusunRows[0],
    total: dusunRows[0].value,
    selesai: visits.filter((visit) => (visit.pasien_snapshot?.dusun || visit.tempat_pelaksanaan || 'Belum diisi') === dusunRows[0].name && isCompleted(visit)).length,
    risiko: 0
  } : null;
  const insight = buildInsight({ total, selesai, hadir, risks, topDusun });
  const topRisk = riskRows[0];
  const healthConclusion = getHealthConclusion({ total, selesai, hadir, risks, topRisk, topWilayah: topDusun });
  const filterText = Object.entries(filters)
    .filter(([, value]) => value && value !== 'Semua')
    .map(([key, value]) => `${key}: ${value}`)
    .join(' | ') || 'Semua data';

  const wilayahTable = dusunRows.map((row) => {
    const scoped = visits.filter((visit) => (visit.pasien_snapshot?.dusun || visit.tempat_pelaksanaan || 'Belum diisi') === row.name);
    const scopedRisks = getRiskStats(scoped);
    return {
      name: row.name,
      total: row.value,
      selesai: scoped.filter(isCompleted).length,
      risiko: Object.values(scopedRisks).reduce((sum, value) => sum + value, 0)
    };
  });
  const maxWilayahSignal = Math.max(...wilayahTable.map((row) => row.risiko || row.total), 1);
  const statusRows = [
    { label: 'Pendaftar', value: total },
    { label: 'Hadir', value: hadir },
    { label: 'Selesai', value: selesai },
    { label: 'Belum tuntas', value: Math.max(total - selesai, 0) }
  ];
  const riskTotal = Object.values(risks).reduce((sum, value) => sum + value, 0);

  return `<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Laporan HTML Terpadu TERSANJUNG</title>
  <style>
    :root { --ink:#0f172a; --muted:#64748b; --line:#dbe5ef; --paper:#ffffff; --bg:#eef5f7; --teal:#0f766e; --emerald:#10b981; --amber:#d97706; --rose:#e11d48; --navy:#111827; }
    * { box-sizing: border-box; }
    body { margin:0; font-family: Inter, "Segoe UI", Arial, sans-serif; color:var(--ink); background:linear-gradient(135deg,#eef7f5 0%,#f8fafc 45%,#fff7ed 100%); }
    .page { width:min(1180px, calc(100% - 32px)); margin:32px auto; }
    .print-header, .print-footer { display:none; }
    .hero { position:relative; overflow:hidden; border-radius:28px; background:linear-gradient(135deg,#0f766e,#0f172a); color:white; padding:34px; box-shadow:0 22px 60px rgba(15,23,42,.18); }
    .hero:after { content:""; position:absolute; inset:auto -80px -120px auto; width:340px; height:340px; border-radius:50%; background:rgba(255,255,255,.09); }
    .letter { display:flex; justify-content:space-between; gap:24px; align-items:center; position:relative; z-index:1; }
    .logos { display:flex; gap:10px; align-items:center; }
    .logos img { width:54px; height:54px; object-fit:contain; background:white; padding:5px; border-radius:14px; }
    h1 { margin:26px 0 8px; font-size:clamp(30px,5vw,58px); line-height:.98; letter-spacing:-.02em; max-width:820px; position:relative; z-index:1; }
    .hero p { color:#d7fffb; max-width:760px; margin:0; font-size:15px; line-height:1.7; position:relative; z-index:1; }
    .chips { display:flex; flex-wrap:wrap; gap:10px; margin-top:22px; position:relative; z-index:1; }
    .chip { border:1px solid rgba(255,255,255,.26); background:rgba(255,255,255,.12); color:white; padding:9px 12px; border-radius:999px; font-size:12px; font-weight:800; }
    .toolbar { margin:18px 0 0; display:flex; justify-content:flex-end; gap:10px; }
    .toolbar button { border:0; background:var(--navy); color:white; padding:12px 16px; border-radius:14px; font-weight:900; cursor:pointer; }
    .section { background:rgba(255,255,255,.88); border:1px solid var(--line); border-radius:24px; padding:24px; margin-top:18px; box-shadow:0 12px 38px rgba(15,23,42,.06); }
    .section h2 { margin:0 0 16px; font-size:18px; letter-spacing:.08em; text-transform:uppercase; }
    .lead-panel { display:grid; grid-template-columns:1.2fr .8fr; gap:18px; align-items:stretch; }
    .diagnosis { border-radius:24px; background:linear-gradient(135deg,#ecfeff,#f8fafc); border:1px solid #bae6fd; padding:24px; }
    .diagnosis span { display:inline-flex; padding:8px 12px; border-radius:999px; background:#0f766e; color:white; font-size:11px; font-weight:900; letter-spacing:.1em; text-transform:uppercase; }
    .diagnosis h2 { margin:18px 0 10px; font-size:34px; line-height:1.05; letter-spacing:-.02em; text-transform:none; }
    .diagnosis p { margin:0; color:#334155; font-size:15px; line-height:1.7; font-weight:700; }
    .snapshot-list { display:grid; gap:12px; }
    .snapshot { display:flex; align-items:center; justify-content:space-between; gap:16px; border:1px solid var(--line); border-radius:18px; padding:16px; background:white; }
    .snapshot small { display:block; color:var(--muted); font-size:11px; font-weight:900; letter-spacing:.08em; text-transform:uppercase; }
    .snapshot strong { font-size:24px; }
    .metrics { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; }
    .metric { border:1px solid var(--line); border-radius:20px; padding:18px; background:white; min-height:128px; }
    .metric span { display:block; color:var(--muted); font-size:11px; font-weight:900; text-transform:uppercase; letter-spacing:.1em; }
    .metric strong { display:block; font-size:34px; margin-top:12px; line-height:1; }
    .metric small { display:block; color:var(--muted); margin-top:10px; font-weight:700; line-height:1.4; }
    .metric.teal { border-color:#99f6e4; background:#f0fdfa; }
    .metric.amber { border-color:#fde68a; background:#fffbeb; }
    .metric.rose { border-color:#fecdd3; background:#fff1f2; }
    .grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:18px; }
    .grid-3 { display:grid; grid-template-columns:repeat(3,1fr); gap:16px; }
    .insight { display:grid; gap:12px; }
    .insight div { border-left:5px solid var(--teal); background:#f8fafc; padding:14px 16px; border-radius:14px; color:#334155; line-height:1.55; font-weight:700; }
    .bar-row { margin:0 0 14px; }
    .bar-head { display:flex; justify-content:space-between; gap:12px; font-size:13px; font-weight:900; margin-bottom:8px; }
    .bar-head span { color:#334155; }
    .bar-track { width:100%; height:12px; border-radius:999px; background:#e2e8f0; overflow:hidden; }
    .bar-fill { height:100%; border-radius:999px; background:linear-gradient(90deg,#14b8a6,#0f766e); }
    .bar-fill.rose { background:linear-gradient(90deg,#fb7185,#be123c); }
    .bar-fill.amber { background:linear-gradient(90deg,#fbbf24,#d97706); }
    .bar-track.compact { height:9px; margin-top:10px; }
    .donut-wrap { display:grid; grid-template-columns:repeat(3,1fr); gap:14px; }
    .donut-card { display:flex; align-items:center; gap:16px; border:1px solid var(--line); border-radius:20px; background:white; padding:18px; }
    .donut-card strong { display:block; font-size:16px; margin-bottom:6px; }
    .donut-card p { margin:0; color:var(--muted); font-size:12px; font-weight:800; line-height:1.4; }
    .donut { --pct:0; width:82px; height:82px; flex:0 0 82px; border-radius:50%; display:grid; place-items:center; background:conic-gradient(#0f766e calc(var(--pct) * 1%), #e2e8f0 0); position:relative; }
    .donut:after { content:""; position:absolute; width:58px; height:58px; border-radius:50%; background:white; }
    .donut span { position:relative; z-index:1; font-weight:1000; font-size:17px; }
    .donut.amber { background:conic-gradient(#d97706 calc(var(--pct) * 1%), #e2e8f0 0); }
    .donut.rose { background:conic-gradient(#e11d48 calc(var(--pct) * 1%), #e2e8f0 0); }
    .risk-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:14px; }
    .risk-card { border:1px solid #fecdd3; background:#fff7f8; border-radius:18px; padding:16px; }
    .risk-top, .risk-meta { display:flex; align-items:center; justify-content:space-between; gap:12px; }
    .risk-top span { color:#881337; font-size:12px; font-weight:900; text-transform:uppercase; letter-spacing:.06em; }
    .risk-top strong { color:#be123c; font-size:28px; }
    .risk-meta { margin-top:8px; color:#64748b; font-size:11px; font-weight:800; }
    .risk-meta b { color:#be123c; }
    .wilayah-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:12px; }
    .wilayah-card { display:flex; gap:14px; align-items:center; border:1px solid #ccfbf1; border-radius:18px; padding:14px; background:linear-gradient(90deg, rgba(20,184,166,.18), rgba(255,255,255,.92) var(--intensity)); }
    .wilayah-card .rank { width:34px; height:34px; border-radius:12px; background:#0f766e; color:white; display:grid; place-items:center; font-weight:1000; }
    .wilayah-card strong { display:block; font-size:15px; }
    .wilayah-card p { margin:3px 0 0; color:#475569; font-size:12px; font-weight:800; }
    .flow { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; }
    .flow-step { background:#f8fafc; border:1px solid var(--line); border-radius:18px; padding:14px; }
    .flow-step span { display:block; color:#64748b; font-size:11px; font-weight:900; text-transform:uppercase; letter-spacing:.08em; }
    .flow-step strong { display:block; font-size:26px; margin-top:8px; }
    .callout { border-radius:20px; padding:18px; background:#0f172a; color:white; }
    .callout h3 { margin:0 0 10px; font-size:16px; }
    .callout ul { margin:0; padding-left:18px; color:#dbeafe; line-height:1.7; font-weight:700; }
    table { width:100%; border-collapse:collapse; overflow:hidden; border-radius:16px; font-size:13px; }
    th, td { padding:12px 14px; border-bottom:1px solid #e2e8f0; text-align:left; }
    th { background:#0f172a; color:white; font-size:11px; text-transform:uppercase; letter-spacing:.08em; }
    tr:nth-child(even) td { background:#f8fafc; }
    .footer { color:#64748b; font-size:12px; text-align:center; padding:24px; }
    @media (max-width: 820px) { .metrics,.grid-2,.grid-3,.lead-panel,.risk-grid,.wilayah-grid,.flow,.donut-wrap { grid-template-columns:1fr; } .letter { align-items:flex-start; flex-direction:column; } .hero { padding:24px; } }
    @media print {
      @page {
        size:A4 portrait;
        margin:10mm;
        @bottom-right {
          content:"Halaman " counter(page) " dari " counter(pages);
          font-family: Inter, "Segoe UI", Arial, sans-serif;
          font-size:8px;
          font-weight:800;
          color:#64748b;
        }
      }
      body { background:white; margin:0; padding:0; -webkit-print-color-adjust:exact !important; print-color-adjust:exact !important; }
      .page { width:auto; margin:0; padding:0; background:white; }
      .toolbar, .hero { display:none; }
      .print-header {
        display:flex; position:static; height:26mm; margin:0 0 5mm;
        align-items:center; justify-content:space-between; padding:0 10mm;
        background:#10a892 !important; color:white !important; border-radius:0;
      }
      .print-footer {
        display:flex; position:static; min-height:16mm; margin:6mm 0 0;
        align-items:center; justify-content:space-between; gap:10mm; padding:0 10mm;
        background:#10a892 !important; color:white !important;
      }
      .print-brand { display:flex; align-items:center; gap:6mm; }
      .print-logo-box { width:14mm; height:14mm; border-radius:3mm; background:white; display:flex; align-items:center; justify-content:center; padding:1.5mm; }
      .print-logo-box img { width:100%; height:100%; object-fit:contain; }
      .print-title h1 { margin:0 0 1.5mm; color:white !important; font-size:18px; line-height:1; letter-spacing:.04em; text-transform:uppercase; }
      .print-title p, .print-office p, .print-footer p { margin:0; color:white !important; }
      .print-title p { font-size:8px; font-weight:800; letter-spacing:.12em; text-transform:uppercase; opacity:.9; }
      .print-office { text-align:right; font-size:8px; font-weight:900; letter-spacing:.1em; text-transform:uppercase; }
      .print-office p + p { margin-top:1.5mm; opacity:.82; }
      .print-footer p { font-size:8px; line-height:1.35; font-weight:700; opacity:.94; }
      .print-footer strong { display:block; font-size:8px; letter-spacing:.12em; text-transform:uppercase; white-space:nowrap; text-align:right; }
      .print-page-number { display:none; }
      .section { box-shadow:none; break-inside:auto; page-break-inside:auto; border-radius:5mm; margin-top:5mm; padding:5mm; background:white; }
      .section.compact-block { break-inside:avoid; page-break-inside:avoid; }
      .section h2 { font-size:11px; margin-bottom:4mm; }
      .diagnosis,.snapshot,.metric,.donut-card,.risk-card,.wilayah-card,.flow-step,.callout { break-inside:avoid; page-break-inside:avoid; }
      .diagnosis h2 { font-size:22px; }
      .diagnosis p { font-size:9px; }
      .snapshot strong { font-size:18px; }
      .metrics { grid-template-columns:repeat(4,1fr); gap:3mm; }
      .metric { min-height:25mm; border-radius:4mm; padding:4mm; }
      .metric span { font-size:6.5px; }
      .metric strong { font-size:22px; margin-top:3mm; }
      .metric small { font-size:7px; margin-top:2mm; }
      .grid-2,.grid-3 { grid-template-columns:1fr 1fr; gap:4mm; }
      .age-priority-section { display:block; break-inside:avoid; page-break-inside:avoid; }
      .age-priority-section > div + div { margin-top:4mm; }
      .donut-wrap,.risk-grid,.flow { grid-template-columns:1fr 1fr; gap:3mm; }
      .wilayah-grid { grid-template-columns:repeat(4, 1fr); gap:2.5mm; }
      .donut-card { padding:3mm; gap:3mm; }
      .donut { width:18mm; height:18mm; flex-basis:18mm; }
      .donut:after { width:12mm; height:12mm; }
      .donut span { font-size:8px; }
      .risk-card,.flow-step { padding:3mm; }
      .wilayah-card { padding:2.6mm; gap:2mm; align-items:flex-start; }
      .wilayah-card .rank { width:7mm; height:7mm; border-radius:2mm; font-size:9px; flex:0 0 7mm; }
      .wilayah-card strong { font-size:9px; line-height:1.12; }
      .wilayah-card p { font-size:7px; line-height:1.22; margin-top:1mm; }
      .risk-top strong,.flow-step strong { font-size:17px; }
      .insight { gap:2.5mm; }
      .insight div { border-left-width:3px; border-radius:3mm; padding:3mm; font-size:9px; line-height:1.35; }
      .bar-row { margin-bottom:3mm; }
      .bar-head { font-size:8px; margin-bottom:1.5mm; }
      .bar-track { height:2.4mm; }
      table { font-size:8px; page-break-inside:auto; }
      thead { display:table-header-group; }
      th, td { padding:2.2mm 2.5mm; }
      th { font-size:6.5px; background:#f8fafc !important; color:#475569 !important; }
      tr { break-inside:avoid; page-break-inside:avoid; }
      .footer { display:none; }
    }
  </style>
</head>
<body>
  <main class="page">
    <div class="print-header">
      <div class="print-brand">
        <div class="print-logo-box"><img src="${assetBase}/logo_malimpung.png" alt="Logo Puskesmas" /></div>
        <div class="print-title">
          <h1>Laporan CKG Terpadu</h1>
          <p>Tanggal diperbarui: ${escapeHtml(now.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase())}</p>
        </div>
      </div>
      <div class="print-office">
        <p>Puskesmas Malimpung</p>
        <p>CKG Terintegrasi</p>
      </div>
    </div>
    <div class="print-footer">
      <p>Hasil rekap merupakan ringkasan analitik dari data CKG terfilter pada dashboard TERSANJUNG.<br/>Gunakan bersama verifikasi klinis dan kebijakan pelaporan resmi Puskesmas.</p>
      <div><strong>TERSANJUNG</strong><div class="print-page-number"></div></div>
    </div>
    <section class="hero">
      <div class="letter">
        <div class="logos">
          <img src="${assetBase}/logo_pinrang.png" alt="Logo Pinrang" />
          <img src="${assetBase}/logo_malimpung.png" alt="Logo Puskesmas" />
        </div>
        <div><strong>TERSANJUNG</strong><br><small>Puskesmas Malimpung</small></div>
      </div>
      <h1>Laporan HTML Terpadu CKG</h1>
      <p>Ringkasan eksekutif, capaian pelayanan, sebaran peserta, indikator risiko, dan prioritas tindak lanjut berdasarkan data yang sedang terfilter di dashboard.</p>
      <div class="chips">
        <span class="chip">Dibuat: ${escapeHtml(now.toLocaleString('id-ID'))}</span>
        <span class="chip">Filter: ${escapeHtml(filterText)}</span>
        <span class="chip">Sumber: Data kunjungan CKG</span>
      </div>
    </section>
    <div class="toolbar"><button onclick="window.print()">Cetak / Simpan PDF</button></div>

    <section class="section lead-panel compact-block">
      <div class="diagnosis">
        <span>Jawaban Singkat Kondisi Kesehatan</span>
        <h2>Kondisi kesehatan masyarakat wilayah kerja Puskesmas Malimpung</h2>
        <p>${escapeHtml(healthConclusion)}</p>
      </div>
      <div class="snapshot-list">
        <div class="snapshot"><small>Cakupan hadir</small><strong>${percent(hadir, total)}%</strong></div>
        <div class="snapshot"><small>Pemeriksaan selesai</small><strong>${percent(selesai, total)}%</strong></div>
        <div class="snapshot"><small>Temuan risiko/peserta</small><strong>${total ? (riskTotal / total).toFixed(2) : '0.00'}</strong></div>
      </div>
    </section>

    <section class="section compact-block">
      <h2>Ringkasan Eksekutif</h2>
      <div class="metrics">
        ${metricCard('Pendaftar', formatNumber(total), 'Total data sesuai filter')}
        ${metricCard('Hadir', formatNumber(hadir), `${percent(hadir, total)}% dari pendaftar`, 'teal')}
        ${metricCard('Selesai', formatNumber(selesai), `${percent(selesai, total)}% tuntas pemeriksaan`, 'amber')}
        ${metricCard('Total Risiko', formatNumber(riskTotal), 'Akumulasi temuan indikator', 'rose')}
      </div>
    </section>

    <section class="section compact-block">
      <h2>Infografis Capaian Layanan</h2>
      <div class="donut-wrap">
        ${donutCard('Hadir', hadir, total, 'peserta terdaftar hadir', 'teal')}
        ${donutCard('Selesai', selesai, total, 'peserta tuntas pemeriksaan', 'amber')}
        ${donutCard('Belum Tuntas', Math.max(total - selesai, 0), total, 'peserta perlu diselesaikan', 'rose')}
      </div>
      <div class="flow" style="margin-top:14px">${serviceFlow(statusRows, total)}</div>
    </section>

    <section class="section grid-2">
      <div>
        <h2>Analisis Naratif</h2>
        <div class="insight">${insight.map((item) => `<div>${escapeHtml(item)}</div>`).join('')}</div>
      </div>
      <div>
        <h2>Sebaran Klaster</h2>
        ${barRows(clusterRows, total)}
      </div>
    </section>

    <section class="section grid-2">
      <div>
        <h2>Profil Demografi</h2>
        ${barRows(ageRows, total, 'amber')}
      </div>
      <div>
        <h2>Komposisi Jenis Kelamin</h2>
        ${barRows(genderRows, total)}
      </div>
    </section>

    <section class="section grid-2">
      <div>
        <h2>Profil Risiko Kesehatan</h2>
        <div class="risk-grid">${riskCards(riskRows, total)}</div>
      </div>
      <div>
        <h2>Prioritas Risiko</h2>
        <div class="callout">
          <h3>Interpretasi Cepat</h3>
          <ul>
            <li>${escapeHtml(topRisk?.value ? `${riskLabel[topRisk.name] || topRisk.name} adalah risiko terbanyak dan perlu menjadi fokus tindak lanjut.` : 'Belum ada risiko dominan yang muncul pada filter ini.')}</li>
            <li>Risiko PTM seperti hipertensi, hiperglikemia, dan obesitas perlu dihubungkan dengan edukasi gaya hidup dan kontrol ulang.</li>
            <li>Risiko paru, indera, dan mental perlu dikawal dengan rujukan internal atau kunjungan tindak lanjut sesuai indikasi.</li>
          </ul>
        </div>
      </div>
    </section>

    <section class="section grid-2">
      <div>
        <h2>Sebaran Desa/Kelurahan</h2>
        ${barRows(desaRows, total)}
      </div>
      <div>
        <h2>Tren Input Harian</h2>
        ${barRows(trendRows, Math.max(...trendRows.map((row) => row.value), 1), 'amber')}
      </div>
    </section>

    <section class="section grid-2 age-priority-section">
      <div>
        <h2>Komposisi Kelompok Umur</h2>
        <table>
          <thead><tr><th>No</th><th>Kelompok Umur</th><th>Jumlah</th><th>Proporsi</th><th>Catatan</th></tr></thead>
          <tbody>${ageRows.map((row, index) => `<tr><td>${index + 1}</td><td>${escapeHtml(row.name)}</td><td>${formatNumber(row.value)}</td><td>${percent(row.value, total)}%</td><td>${row.name.includes('Lansia') ? 'Prioritas pemantauan PTM' : row.name.includes('Balita') ? 'Pantau tumbuh kembang' : 'Skrining sesuai klaster'}</td></tr>`).join('')}</tbody>
        </table>
      </div>
      <div>
        <h2>Peta Prioritas Wilayah</h2>
        <div class="wilayah-grid">${wilayahCards(wilayahTable, maxWilayahSignal)}</div>
      </div>
    </section>

    <section class="section allow-break">
      <h2>Prioritas Wilayah Tindak Lanjut</h2>
      <table>
        <thead><tr><th>No</th><th>Wilayah</th><th>Pendaftar</th><th>Selesai</th><th>Akumulasi Risiko</th></tr></thead>
        <tbody>${tableRows(wilayahTable)}</tbody>
      </table>
    </section>

    <section class="section">
      <h2>Rekomendasi Operasional</h2>
      <div class="grid-3">
        <div class="callout">
          <h3>1. Tindak Lanjut Risiko</h3>
          <ul>
            <li>Susun daftar peserta risiko tinggi untuk kontrol ulang.</li>
            <li>Prioritaskan hipertensi, gula darah tinggi, dan obesitas pada edukasi PTM.</li>
          </ul>
        </div>
        <div class="callout">
          <h3>2. Intervensi Wilayah</h3>
          <ul>
            <li>Gunakan wilayah prioritas untuk kunjungan rumah dan koordinasi kader.</li>
            <li>Pastikan dusun dengan gap layanan masuk rencana sweeping.</li>
          </ul>
        </div>
        <div class="callout">
          <h3>3. Mutu Layanan</h3>
          <ul>
            <li>Perkuat penyelesaian alur pos agar data risiko lengkap.</li>
            <li>Evaluasi harian antrean belum tuntas dan laporan rujukan.</li>
          </ul>
        </div>
      </div>
    </section>
    <div class="footer">Laporan ini dibuat otomatis oleh TERSANJUNG. Gunakan bersama verifikasi klinis dan kebijakan pelaporan resmi Puskesmas.</div>
  </main>
</body>
</html>`;
};

export const openIntegratedHtmlReport = (visits, filters) => {
  const html = buildIntegratedHtmlReport(visits, filters);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const reportWindow = window.open(url, '_blank', 'noopener,noreferrer');
  if (!reportWindow) {
    const link = document.createElement('a');
    link.href = url;
    link.download = `Laporan_HTML_Terpadu_CKG_${new Date().toISOString().slice(0, 10)}.html`;
    link.click();
  }
  setTimeout(() => URL.revokeObjectURL(url), 60000);
};
