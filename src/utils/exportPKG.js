import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getPkgValue } from './pkgMapper';
import formSchemas from '../formSchemas.json';

const SCHOOL_FORMS = ['SD', 'SMP', 'SMA'];
const STANDARD_HEADERS = ["NO", "DESA/KELURAHAN", "DUSUN/LINGKUNGAN", "TANGGAL PEMERIKSAAN", "NIK", "NAMA LENGKAP", "TANGGAL LAHIR", "JENIS KELAMIN", "NO WA", "STATUS PERKAWINAN"];
const loadExcelJS = async () => {
    const module = await import('exceljs');
    return module.default || module;
};

const normalizeText = (value) => String(value || '').trim().toLowerCase();

const calculateAgeFromBirthDate = (value) => {
    if (!value) return null;
    const birthDate = value?.toDate ? value.toDate() : new Date(value);
    if (Number.isNaN(birthDate.getTime())) return null;

    const today = new Date();
    let years = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) years--;
    return years >= 0 ? years : null;
};

const getVisitAge = (visit) => {
    const explicitAge = parseInt(visit.umur_saat_periksa ?? visit.pasien_snapshot?.umur, 10);
    if (!Number.isNaN(explicitAge)) return explicitAge;
    return calculateAgeFromBirthDate(visit.pasien_snapshot?.tgl_lahir);
};

const getSchoolFormByAge = (age) => {
    if (age >= 6 && age <= 12) return 'SD';
    if (age >= 13 && age <= 15) return 'SMP';
    if (age >= 16 && age <= 18) return 'SMA';
    return null;
};

const getSchoolFormForVisit = (visit) => {
    const kategori = normalizeText(visit.kategori_usia_satusehat);
    const directCategory = SCHOOL_FORMS.find(form => normalizeText(form) === kategori);
    if (directCategory) return directCategory;

    const age = getVisitAge(visit);
    return getSchoolFormByAge(age);
};

const safeSheetName = (sheetName) => sheetName.replace(/[\\/[*?\]]/g, '-').substring(0, 31);

const createWorkbook = async () => {
    const ExcelJS = await loadExcelJS();
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'TERSANJUNG PKM Malimpung';
    workbook.created = new Date();
    return workbook;
};

const downloadWorkbook = async (workbook, fileName) => {
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

const appendArraySheet = (workbook, sheetName, sheetData, {
    colWidths = [],
    tabColor = null,
    autoFilter = null,
    titleRows = true,
    headerRowIndex = 4
} = {}) => {
    const worksheet = workbook.addWorksheet(safeSheetName(sheetName), {
        properties: tabColor ? { tabColor: { argb: `FF${tabColor}` } } : undefined
    });
    worksheet.addRows(sheetData);

    if (colWidths.length > 0) {
        worksheet.columns = colWidths.map((column) => ({ width: column.wch || column.width || 12 }));
    }

    if (titleRows) {
        worksheet.getRow(1).font = { bold: true, size: 14 };
        worksheet.getRow(2).font = { bold: true, italic: true };
    }

    const headerRow = worksheet.getRow(headerRowIndex);
    headerRow.font = { bold: true };

    if (autoFilter) {
        worksheet.autoFilter = {
            from: { row: autoFilter.fromRow, column: 1 },
            to: { row: autoFilter.toRow, column: autoFilter.toColumn }
        };
    }

    return worksheet;
};

const buildRowsForSheet = (sheetVisits, headers) => sheetVisits.map((v, index) => (
    headers.map(h => {
        if (h === 'NO') return index + 1;
        return getPkgValue(v, h);
    })
));

const appendRecapSheet = (workbook, visits, forms, allowedForms = Object.keys(forms), title = 'REKAP KESELURUHAN') => {
    const rows = allowedForms
        .filter(sheetName => forms[sheetName])
        .map((sheetName, index) => {
            const count = visits.filter(v => isVisitForSheet(v, sheetName)).length;
            return [index + 1, sheetName, count];
        });

    const total = rows.reduce((sum, row) => sum + row[2], 0);
    const sheetData = [
        [title],
        [`DICETAK PADA: ${new Date().toLocaleDateString('id-ID')}`],
        [],
        ['NO', 'KATEGORI/SHEET', 'JUMLAH DATA'],
        ...rows,
        [],
        ['', 'TOTAL', total]
    ];

    appendArraySheet(workbook, 'Rekap Keseluruhan', sheetData, {
        colWidths: [{ wch: 6 }, { wch: 32 }, { wch: 14 }],
        autoFilter: { fromRow: 4, toRow: rows.length + 4, toColumn: 3 }
    });
};

export const isVisitForSheet = (visit, sheetName) => {
    const u = getVisitAge(visit);
    const hasAge = typeof u === 'number' && !Number.isNaN(u);
    const jk = visit.pasien_snapshot?.j_kelamin || 'P';
    const s = sheetName.toLowerCase();
    const kategori = normalizeText(visit.kategori_usia_satusehat);
    const hasKategori = kategori && kategori !== '-';

    if (SCHOOL_FORMS.some(form => normalizeText(form) === s)) {
        return getSchoolFormForVisit(visit) === sheetName;
    }

    if (hasKategori) {
        if ((kategori === 'bayi' || kategori === 'bbl') && s.includes('bbl')) return true;
        if (kategori === 'balita') {
            if (s.includes('balita 1') && hasAge && u === 1) return true;
            if (s.includes('balita 2') && hasAge && u === 2) return true;
            if (s.includes('balita 3') && hasAge && u >= 3 && u <= 5) return true;
            return false;
        }
        if (['dewasa', 'lansia'].includes(kategori)) {
            if (s.includes('sd') || s.includes('smp') || s.includes('sma') || s.includes('balita') || s.includes('bbl')) return false;
        }
    }
    
    if (s.includes('bbl') && hasAge && u < 1) return true;
    if (s.includes('balita 1') && hasAge && u === 1) return true;
    if (s.includes('balita 2') && hasAge && u === 2) return true;
    if (s.includes('balita 3') && hasAge && u >= 3 && u <= 5) return true;
    if (s.includes('sd') && hasAge && u >= 6 && u <= 12) return true;
    if (s.includes('smp') && hasAge && u >= 13 && u <= 15) return true;
    if (s.includes('sma') && hasAge && u >= 16 && u <= 18) return true;
    
    const isSheetLaki = s.includes('laki-laki') || s.includes('laki - laki') || s.includes('laki');
    const isSheetPr = s.includes('perempuan');
    
    let min = 0, max = 200;
    const match = s.match(/(\d+)\s*-\s*(\d+)/);
    if (match) {
        min = parseInt(match[1]);
        max = parseInt(match[2]);
    } else if (s.includes('>=60')) { min = 60; }
    else if (s.includes('>=70')) { min = 70; }
    
    if (isSheetLaki && jk === 'L' && hasAge && u >= min && u <= max) return true;
    if (isSheetPr && jk === 'P' && hasAge && u >= min && u <= max) return true;
    
    return false;
};

export const exportToPKGExcel = async (visits) => {
    try {
        const workbook = await createWorkbook();
        const forms = formSchemas.forms || {};
        
        const colors = ["FF99CC", "FFCC99", "FFFF99", "CCFF99", "99FFCC", "99CCFF", "CC99FF", "FF99FF", "C0C0C0", "FF6666", "66FF66", "6666FF", "FFFF66", "66FFFF", "FF66FF", "E0E0E0", "FFDAB9", "E6E6FA"];
        
        appendRecapSheet(workbook, visits, forms);

        Object.keys(forms).forEach((sheetName, sIndex) => {
            const formConfig = forms[sheetName];
            const questions = formConfig.questions || [];
            if (questions.length === 0) return;
            
            const sheetVisits = visits.filter(v => isVisitForSheet(v, sheetName));
            if (sheetVisits.length === 0) return;
            
            const sortedQuestions = [...questions].sort((a, b) => (a.sequence_number || 0) - (b.sequence_number || 0));
            const questionHeaders = sortedQuestions.map(q => q.question_text);
            const allHeaders = [...STANDARD_HEADERS, ...questionHeaders];
            
            const rows = buildRowsForSheet(sheetVisits, allHeaders);
            
            const titleData = [
                [`REKAPITULASI DATA KOLEKTIF - KLASTER ${sheetName.toUpperCase()}`],
                [`DICETAK PADA: ${new Date().toLocaleDateString('id-ID')}`],
                []
            ];
            
            const sheetData = [...titleData, allHeaders, ...rows];
            
            const colWidths = allHeaders.map(h => ({ wch: Math.min(Math.max(String(h).length, 12), 40) }));
            colWidths[0] = { wch: 5 }; // NO
            colWidths[1] = { wch: 20 }; // DESA
            colWidths[2] = { wch: 20 }; // DUSUN
            colWidths[3] = { wch: 15 }; // TANGGAL
            colWidths[4] = { wch: 20 }; // NIK
            colWidths[5] = { wch: 25 }; // NAMA

            appendArraySheet(workbook, sheetName, sheetData, {
                colWidths,
                tabColor: colors[sIndex % colors.length],
                autoFilter: { fromRow: 4, toRow: sheetData.length, toColumn: allHeaders.length }
            });
        });
        
        if (workbook.worksheets.length <= 1) {
            alert("Tidak ada data yang tersedia untuk diekspor ke semua kelompok umur.");
            return false;
        }
        
        const tanggal = new Date().toISOString().split('T')[0];
        await downloadWorkbook(workbook, `Rekap_CKG_Kolektif_PKM_Malimpung_${tanggal}.xlsx`);
        return true;
    } catch (error) {
        console.error("Error exporting to PKG Excel:", error);
        alert("Gagal mengekspor data Excel.");
        return false;
    }
};

const shortenPdfHeader = (text, maxLength = 24) => {
    let t = String(text || '').toUpperCase().trim();
    t = t.replace(/APAKAH ANDA /gi, '')
         .replace(/APAKAH /gi, '')
         .replace(/BERDASARKAN /gi, '')
         .replace(/BERAT BADAN/gi, 'BB')
         .replace(/TINGGI BADAN/gi, 'TB')
         .replace(/PANJANG BADAN/gi, 'PB')
         .replace(/LINGKAR LENGAN ATAS/gi, 'LILA')
         .replace(/LINGKAR LENGAN/gi, 'LILA')
         .replace(/LINGKAR KEPALA/gi, 'LK')
         .replace(/LINGKAR PERUT/gi, 'LP')
         .replace(/TEKANAN DARAH/gi, 'TD')
         .replace(/GULA DARAH PUASA/gi, 'GDP')
         .replace(/GULA DARAH SEWAKTU/gi, 'GDS')
         .replace(/GULA DARAH/gi, 'GD')
         .replace(/HEMOGLOBIN/gi, 'HB')
         .replace(/INDEKS MASSA TUBUH/gi, 'IMT')
         .replace(/STATUS GIZI/gi, 'GIZI')
         .replace(/PULSE OKSIMETRI/gi, 'SPO2')
         .replace(/HIPOTIROID KONGENITAL/gi, 'HK')
         .replace(/HIPERPLASIA ADRENAL KONGENITAL/gi, 'HAK')
         .replace(/TUBERKULOSIS/gi, 'TB PARU')
         .replace(/PENYAKIT PARU OBSTRUKTIF KRONIS/gi, 'PPOK')
         .replace(/PENYAKIT JANTUNG BAWAAN/gi, 'PJB')
         .replace(/KESEHATAN JIWA/gi, 'KESWA')
         .replace(/KESEHATAN INDERA/gi, 'INDERA')
         .replace(/FAKTOR RISIKO/gi, 'FR')
         .replace(/AKTIVITAS FISIK/gi, 'AKT. FISIK')
         .replace(/RIWAYAT PENYAKIT/gi, 'RIW. PENYAKIT')
         .replace(/HASIL PEMERIKSAAN/gi, 'HASIL')
         .replace(/PEMERIKSAAN LABORATORIUM/gi, 'LAB')
         .replace(/PEMERIKSAAN /gi, 'PERIKSA ')
         .replace(/KESEHATAN /gi, 'KES. ')
         .replace(/DILAKUKAN /gi, '')
         .replace(/TANGGAL /gi, 'TGL ')
         .replace(/PENGUKURAN /gi, 'UKUR ')
         .replace(/LINGKUNGAN /gi, 'LINGK. ')
         .replace(/\(DD\/MM\/YYYY\)/gi, '')
         .replace(/\bATAU\b/gi, '/')
         .replace(/\bDAN\b/gi, '&')
         .replace(/\s+/g, ' ')
         .trim();
    return t.length <= maxLength ? t : `${t.substring(0, maxLength - 3).trim()}...`;
};

const getAssetUrl = (path) => {
    if (typeof window === 'undefined') return path;
    return new URL(path, window.location.origin).href;
};

const loadImageDataUrl = async (url) => {
    try {
        const response = await fetch(url);
        if (!response.ok) return null;
        const blob = await response.blob();
        return await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.warn('Gagal memuat logo PDF:', error);
        return null;
    }
};

const addClusterPageNumbers = (doc, clusterRanges) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    clusterRanges.forEach(({ name, start, end }) => {
        const total = end - start + 1;
        for (let page = start; page <= end; page += 1) {
            doc.setPage(page);
            doc.setFontSize(8);
            doc.setTextColor(100, 116, 139);
            doc.text(`Klaster ${name}: Halaman ${page - start + 1} / ${total}`, pageWidth - 40, pageHeight - 18, { align: 'right' });
            doc.text('Rekap CKG Kolektif TERSANJUNG', 40, pageHeight - 18);
        }
    });

    doc.setTextColor(0, 0, 0);
};

const drawCollectivePdfHeader = (doc, subtitle = '', logoDataUrl = null) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.setFillColor(20, 184, 166);
    doc.rect(28, 24, pageWidth - 56, 48, 'F');
    if (logoDataUrl) {
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(42, 31, 34, 34, 6, 6, 'F');
        doc.addImage(logoDataUrl, 'PNG', 47, 35, 24, 26);
    }
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('LAPORAN DATA KOLEKTIF CKG TERSANJUNG', pageWidth / 2, 44, { align: 'center' });
    doc.setFontSize(8);
    doc.text(subtitle, pageWidth / 2, 59, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
};

const getClusterPdfQuestions = (forms, allowedForms) => {
    const seen = new Set();
    const blocked = new Set([
        'nik',
        'nama lengkap',
        'tanggal lahir (dd/mm/yyyy)',
        'tanggal lahir',
        'jenis kelamin',
        'tanggal pemeriksaan (dd/mm/yyyy)',
        'tanggal pemeriksaan',
        'nama faskes'
    ]);

    return allowedForms.flatMap((sheetName) => {
        const questions = forms[sheetName]?.questions || [];
        return [...questions]
            .sort((a, b) => (a.sequence_number || 0) - (b.sequence_number || 0))
            .map((question) => ({ ...question, sheetName }));
    }).filter((question) => {
        const label = String(question.question_text || '').trim();
        const key = normalizeText(label);
        if (!label || blocked.has(key)) return false;
        if (key.includes('provinsi') || key.includes('kabupaten') || key.includes('faskes')) return false;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
};

const getVisitSheetName = (visit, allowedForms) => (
    allowedForms.find((sheetName) => isVisitForSheet(visit, sheetName)) || ''
);

const drawClusterSummary = (doc, clusterName, total, startY) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.setFillColor(240, 253, 250);
    doc.setDrawColor(153, 246, 228);
    doc.roundedRect(28, startY, pageWidth - 56, 34, 8, 8, 'FD');
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 118, 110);
    doc.text(`KLASTER ${clusterName.toUpperCase()}`, 42, startY + 21);
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text(`${total} peserta sesuai filter`, pageWidth - 42, startY + 21, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
};

const CLUSTER_TARGET_PAGES = {
    Balita: 3,
    'Anak/Siswa': 4,
    Dewasa: 5,
    Lansia: 6
};

const chunkByTargetPages = (items, targetPages) => {
    if (items.length === 0) return [[]];
    const chunkSize = Math.max(1, Math.ceil(items.length / targetPages));
    const chunks = [];
    for (let index = 0; index < items.length; index += chunkSize) {
        chunks.push(items.slice(index, index + chunkSize));
    }
    while (chunks.length < targetPages) chunks.push([]);
    return chunks.slice(0, targetPages);
};

const getQuestionColumnWidth = (questionCount, pageWidth) => {
    if (questionCount <= 0) return 24;
    const fixedColumnsWidth = 72 + 82 + 48;
    const horizontalMargins = 56;
    const availableForQuestions = pageWidth - fixedColumnsWidth - horizontalMargins - 12;
    return Math.max(16, Math.min(42, Math.floor(availableForQuestions / questionCount)));
};

export const exportToPKG_PDF = async (visits) => {
    try {
        const forms = formSchemas.forms || {};
        const doc = new jsPDF('landscape', 'pt', [612, 936]);
        const pageWidth = doc.internal.pageSize.getWidth();
        doc.setProperties({ title: 'Rekap CKG Kolektif TERSANJUNG' });
        const logoPinrangUrl = getAssetUrl('/logo_pinrang.png');
        const logoPinrangDataUrl = await loadImageDataUrl(logoPinrangUrl);
        const headerSubtitle = `Puskesmas Malimpung | Dicetak ${new Date().toLocaleDateString('id-ID')} | Logo: ${logoPinrangUrl}`;
        drawCollectivePdfHeader(doc, headerSubtitle, logoPinrangDataUrl);
        
        const clusters = ['Balita', 'Anak/Siswa', 'Dewasa', 'Lansia'];
        let hasData = false;
        const clusterRanges = [];
        
        clusters.forEach((clusterName) => {
            const allowedForms = getFormsForCluster(clusterName).filter((sheetName) => forms[sheetName]);
            if (allowedForms.length === 0) return;

            const clusterVisits = visits.filter((visit) => allowedForms.some((sheetName) => isVisitForSheet(visit, sheetName)));
            if (clusterVisits.length === 0) return;
            const hasPreviousData = hasData;

            if (hasPreviousData) {
                doc.addPage();
                drawCollectivePdfHeader(doc, headerSubtitle, logoPinrangDataUrl);
            }
            hasData = true;
            const clusterStartPage = doc.internal.getNumberOfPages();

            const questions = getClusterPdfQuestions(forms, allowedForms);
            const targetPages = CLUSTER_TARGET_PAGES[clusterName] || 3;
            const questionChunks = chunkByTargetPages(questions, targetPages);

            questionChunks.forEach((questionChunk, chunkIndex) => {
                if (chunkIndex > 0) {
                    doc.addPage();
                    drawCollectivePdfHeader(doc, headerSubtitle, logoPinrangDataUrl);
                }

                const startY = 96;
                drawClusterSummary(doc, `${clusterName} (${chunkIndex + 1}/${questionChunks.length})`, clusterVisits.length, startY);

                const questionColumnWidth = getQuestionColumnWidth(questionChunk.length, pageWidth);
                const pdfHeaders = [
                    'NIK',
                    'NAMA',
                    'FORM',
                    ...questionChunk.map((question) => shortenPdfHeader(question.question_text, 18))
                ];

                const pdfRows = clusterVisits.map((visit) => {
                    const sheetName = getVisitSheetName(visit, allowedForms);
                    return [
                        getPkgValue(visit, 'NIK'),
                        getPkgValue(visit, 'NAMA LENGKAP'),
                        sheetName,
                        ...questionChunk.map((question) => getPkgValue(visit, question.question_text))
                    ];
                });

                const columnStyles = {
                    0: { cellWidth: 72 },
                    1: { cellWidth: 82 },
                    2: { cellWidth: 48 }
                };
                questionChunk.forEach((question, index) => {
                    const header = shortenPdfHeader(question.question_text, 18);
                    columnStyles[index + 3] = {
                        cellWidth: questionColumnWidth,
                        overflow: 'linebreak'
                    };
                    if (header.length <= 4) columnStyles[index + 3].halign = 'center';
                });

                autoTable(doc, {
                    startY: startY + 44,
                    head: [pdfHeaders],
                    body: pdfRows,
                    theme: 'grid',
                    styles: { fontSize: 5.7, cellPadding: 1.4, overflow: 'linebreak', valign: 'middle', minCellWidth: 14 },
                    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontSize: 5.4, halign: 'center', valign: 'middle', cellPadding: 1.2 },
                    alternateRowStyles: { fillColor: [248, 250, 252] },
                    columnStyles,
                    margin: { top: 88, right: 28, bottom: 34, left: 28 },
                    didDrawPage: () => {
                        drawCollectivePdfHeader(doc, headerSubtitle, logoPinrangDataUrl);
                    }
                });
            });
            clusterRanges.push({
                name: clusterName,
                start: clusterStartPage,
                end: doc.internal.getNumberOfPages()
            });
        });
        
        if (!hasData) {
            alert("Tidak ada data yang tersedia untuk diekspor PDF.");
            return false;
        }
        
        addClusterPageNumbers(doc, clusterRanges);
        const tanggal = new Date().toISOString().split('T')[0];
        doc.save(`Rekap_CKG_Kolektif_PKM_Malimpung_${tanggal}.pdf`);
        return true;
    } catch (error) {
        console.error("Error exporting to PKG PDF:", error);
        alert("Gagal mengekspor PDF.");
        return false;
    }
};

export const getFormsForCluster = (cluster) => {
    switch(cluster) {
        case 'Balita': return ['BBL', 'Balita 1 tahun', 'Balita 2 tahun', 'Balita 3-6 tahun'];
        case 'Anak/Siswa': return ['SD', 'SMP', 'SMA'];
        case 'Dewasa': return ['Laki-laki 18-24 tahun', 'Laki-laki 25-39 tahun', 'Laki-laki 40-44 tahun', 'Laki-laki 45-59 tahun', 'Perempuan 18-24 tahun', 'Perempuan 25-29 tahun', 'Perempuan 30-39 tahun', 'Perempuan 40-59 tahun'];
        case 'Lansia': return ['Laki-laki >=60 tahun', 'Perempuan 60-69 tahun', 'Perempuan >=70 tahun'];
        default: return [];
    }
}

export const abbreviateHeader = (text) => {
    let t = String(text).toUpperCase();
    if (t.length <= 15) return t;
    t = t.replace(/APAKAH ANDA /gi, '')
         .replace(/APAKAH /gi, '')
         .replace(/DALAM KELUARGA/gi, 'KLG')
         .replace(/DALAM/gi, 'DLM')
         .replace(/TAHUN/gi, 'THN')
         .replace(/BULAN/gi, 'BLN')
         .replace(/KESEHATAN/gi, 'KES')
         .replace(/MEMILIKI /gi, '')
         .replace(/MENGALAMI /gi, '')
         .replace(/PEMERIKSAAN /gi, '')
         .replace(/TEKANAN DARAH/gi, 'TD')
         .replace(/BERAT BADAN/gi, 'BB')
         .replace(/TINGGI BADAN/gi, 'TB')
         .replace(/LINGKAR PERUT/gi, 'LP')
         .replace(/GULA DARAH/gi, 'GULA')
         .replace(/SEWAKTU/gi, 'GDS')
         .replace(/PUASA/gi, 'GDP')
         .trim();
    return t.substring(0, 25);
};

export const exportClusterPDF = async (visits, clusterName) => {
    try {
        const forms = formSchemas.forms || {};
        const allowedForms = getFormsForCluster(clusterName);
        if (allowedForms.length === 0) return false;

        const doc = new jsPDF('landscape', 'pt', 'a4');
        doc.setFontSize(16);
        doc.text(`LAPORAN SKRINING KLASTER ${clusterName.toUpperCase()}`, 40, 40);
        doc.setFontSize(10);
        doc.text(`Dicetak pada: ${new Date().toLocaleDateString('id-ID')}`, 40, 55);
        
        let startY = 80;
        let hasData = false;
        
        allowedForms.forEach((sheetName, sIndex) => {
            if (!forms[sheetName]) return;
            const formConfig = forms[sheetName];
            const questions = formConfig.questions || [];
            if (questions.length === 0) return;
            
            const sheetVisits = visits.filter(v => isVisitForSheet(v, sheetName));
            if (sheetVisits.length === 0) return;
            hasData = true;
            
            const standardHeaders = ["NO", "DESA/KEL.", "DUSUN", "TGL PERIKSA", "NIK", "NAMA LENGKAP", "TGL LAHIR", "L/P", "NO WA", "STATUS"];
            const sortedQuestions = [...questions].sort((a, b) => (a.sequence_number || 0) - (b.sequence_number || 0));
            const originalHeaders = [...standardHeaders, ...sortedQuestions.map(q => q.question_text)];
            
            const validCols = [];
            originalHeaders.forEach((h, i) => {
                const hl = String(h).toLowerCase();
                if (!hl.includes('provinsi') && !hl.includes('kabupaten') && !hl.includes('faskes')) {
                    validCols.push({ idx: i, title: i < standardHeaders.length ? h : abbreviateHeader(h) });
                }
            });
            
            const pdfHeaders = validCols.map(c => c.title);
            const pdfRows = [];
            
            sheetVisits.forEach((v, index) => {
                const rawRow = originalHeaders.map((h, i) => {
                    if (i === 0) return index + 1;
                    return getPkgValue(v, h);
                });
                const filteredRow = validCols.map(c => rawRow[c.idx]);
                pdfRows.push(filteredRow);
            });
            
            if (startY > 400 && sIndex > 0) { doc.addPage(); startY = 40; }
            
            doc.setFontSize(12);
            doc.text(`Kategori: ${sheetName} (${sheetVisits.length} Pasien)`, 40, startY);
            
            autoTable(doc, {
                startY: startY + 10,
                head: [pdfHeaders],
                body: pdfRows,
                theme: 'grid',
                styles: { fontSize: 7, cellPadding: 1.5, minCellWidth: 15, overflow: 'linebreak' },
                headStyles: { fillColor: [0, 146, 136], textColor: [255, 255, 255], halign: 'center', valign: 'middle' },
                horizontalPageBreak: true,
                margin: { top: 40, right: 20, bottom: 40, left: 20 },
                didDrawPage: (data) => {
                    startY = data.cursor.y + 40;
                }
            });
            startY += 30;
        });
        
        if (!hasData) {
            alert(`Tidak ada data klaster ${clusterName} yang tersedia untuk diekspor.`);
            return false;
        }
        
        const tanggal = new Date().toISOString().split('T')[0];
        doc.save(`Laporan_CKG_Klaster_${clusterName.replace('/', '_')}_${tanggal}.pdf`);
        return true;
    } catch (error) {
        console.error("Error exporting to PKG PDF:", error);
        alert("Gagal mengekspor PDF.");
        return false;
    }
};

export const exportClusterExcel = async (visits, clusterName) => {
    try {
        const workbook = await createWorkbook();
        const forms = formSchemas.forms || {};
        const allowedForms = getFormsForCluster(clusterName);
        if (allowedForms.length === 0) return false;
        
        const colors = ["FF99CC", "FFCC99", "FFFF99", "CCFF99", "99FFCC", "99CCFF", "CC99FF", "FF99FF"];

        appendRecapSheet(workbook, visits, forms, allowedForms, `REKAP KESELURUHAN KLASTER ${clusterName.toUpperCase()}`);
        
        allowedForms.forEach((sheetName, sIndex) => {
            if (!forms[sheetName]) return;
            const formConfig = forms[sheetName];
            const questions = formConfig.questions || [];
            if (questions.length === 0) return;
            
            const sheetVisits = visits.filter(v => isVisitForSheet(v, sheetName));
            if (sheetVisits.length === 0) return;
            
            const sortedQuestions = [...questions].sort((a, b) => (a.sequence_number || 0) - (b.sequence_number || 0));
            const questionHeaders = sortedQuestions.map(q => q.question_text);
            const allHeaders = [...STANDARD_HEADERS, ...questionHeaders];
            
            const rows = buildRowsForSheet(sheetVisits, allHeaders);
            
            const titleData = [
                [`REKAPITULASI DATA KLASTER ${clusterName.toUpperCase()} - ${sheetName.toUpperCase()}`],
                [`DICETAK PADA: ${new Date().toLocaleDateString('id-ID')}`],
                []
            ];
            
            const sheetData = [...titleData, allHeaders, ...rows];
            
            const colWidths = allHeaders.map(h => ({ wch: Math.min(Math.max(String(h).length, 12), 40) }));
            colWidths[0] = { wch: 5 }; // NO
            colWidths[1] = { wch: 20 }; // DESA
            colWidths[2] = { wch: 20 }; // DUSUN
            colWidths[3] = { wch: 15 }; // TANGGAL
            colWidths[4] = { wch: 20 }; // NIK
            colWidths[5] = { wch: 25 }; // NAMA

            appendArraySheet(workbook, sheetName, sheetData, {
                colWidths,
                tabColor: colors[sIndex % colors.length],
                autoFilter: { fromRow: 4, toRow: sheetData.length, toColumn: allHeaders.length }
            });
        });
        
        if (workbook.worksheets.length <= 1) {
            alert(`Tidak ada data klaster ${clusterName} yang tersedia untuk diekspor.`);
            return false;
        }
        
        const tanggal = new Date().toISOString().split('T')[0];
        await downloadWorkbook(workbook, `Rekap_CKG_Klaster_${clusterName.replace('/', '_')}_PKM_Malimpung_${tanggal}.xlsx`);
        return true;
    } catch (error) {
        console.error("Error exporting to PKG Excel:", error);
        alert("Gagal mengekspor data Excel.");
        return false;
    }
};

export const exportJsonToExcel = async (data, sheetName, fileName) => {
    try {
        const rows = Array.isArray(data) ? data : [data];
        const headers = [...new Set(rows.flatMap((item) => Object.keys(item || {})))];
        const sheetData = [
            headers,
            ...rows.map((item) => headers.map((header) => item?.[header] ?? ''))
        ];
        const workbook = await createWorkbook();
        appendArraySheet(workbook, sheetName, sheetData, {
            colWidths: headers.map((header) => ({ wch: Math.min(Math.max(String(header).length, 12), 40) })),
            autoFilter: { fromRow: 1, toRow: sheetData.length, toColumn: headers.length },
            titleRows: false,
            headerRowIndex: 1
        });
        await downloadWorkbook(workbook, fileName);
    } catch (error) {
        console.error("Error exporting JSON to Excel:", error);
        alert("Gagal mengekspor data Excel.");
    }
};
