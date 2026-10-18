import * as XLSX from 'xlsx';
import { Student, ConductRecord, ClassSettings, ConductRatingThresholds } from '../types';
import { calculateConductRating } from '../components/StudentProfileModal';
import { formatDateVN } from './storage';

export interface ConductExcelExportParams {
  students: Student[];
  conduct: ConductRecord[];
  settings: ClassSettings;
  classNameTitle: string;
  periodLabel: string;
  startDateStr: string; // YYYY-MM-DD
  endDateStr: string;   // YYYY-MM-DD
  exportTimestamp: string;
}

export interface StudentConductSummary {
  student: Student;
  baseScore: number;
  praisePoints: number;
  reminderPoints: number; // Positive number
  totalScore: number;
  ratingText: string;
  rank: number;
  praiseCount: number;
  reminderCount: number;
  note: string;
}

/**
 * Ngăn chặn lỗi Excel Formula Injection (CSV/Excel Formula Execution)
 * Nếu chuỗi bắt đầu bằng =, +, -, @, \t, \r thì thêm dấu nháy đơn ' ở đầu
 */
export function sanitizeExcelText(val: any): string {
  if (val === null || val === undefined) return '';
  const str = String(val).trim();
  if (/^[=+\-@\t\r]/.test(str)) {
    return `'${str}`;
  }
  return str;
}

/**
 * Lấy thời gian hiện tại theo múi giờ Việt Nam (UTC+7)
 */
export function getVietnamNow(): Date {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utc + 3600000 * 7);
}

export function toDateStringVN(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Tính toán tổng hợp thi đua cho toàn bộ học sinh trong lớp theo kỳ đã chọn
 */
export function computeConductSummary(
  students: Student[],
  conduct: ConductRecord[],
  startDateStr: string,
  endDateStr: string,
  ratingThresholds?: ConductRatingThresholds
): {
  summaries: StudentConductSummary[];
  periodRecords: ConductRecord[];
} {
  if (!Array.isArray(students) || students.length === 0) {
    throw new Error('Chưa có dữ liệu học sinh của lớp đang chọn. Không thể xuất file!');
  }

  const studentIdSet = new Set(students.map((s) => s.id));

  // Lọc các bản ghi thi đua trong khoảng ngày trọn vẹn (startDateStr <= date <= endDateStr)
  // và thuộc về học sinh trong lớp đang chọn, loại trừ trùng lặp ID
  const seenIds = new Set<string>();
  const periodRecords: ConductRecord[] = [];

  const safeConduct = Array.isArray(conduct) ? conduct : [];
  for (const record of safeConduct) {
    if (!record || !record.date || !record.studentId) continue;
    if (!studentIdSet.has(record.studentId)) continue;

    // Loại trừ trùng lặp ID
    if (seenIds.has(record.id)) continue;
    seenIds.add(record.id);

    // So sánh ngày theo chuỗi YYYY-MM-DD (bao gồm trọn vẹn ngày bắt đầu và ngày kết thúc)
    if (record.date >= startDateStr && record.date <= endDateStr) {
      periodRecords.push(record);
    }
  }

  // Sắp xếp các bản ghi theo ngày giảm dần (mới nhất lên đầu)
  periodRecords.sort((a, b) => b.date.localeCompare(a.date));

  // Tính điểm cho từng học sinh (bao gồm toàn bộ học sinh, kể cả học sinh chưa có ghi nhận)
  const baseScore = 100; // Điểm nền chuẩn của hệ thống

  const rawSummaries = students.map((student) => {
    const studentRecords = periodRecords.filter((r) => r.studentId === student.id);
    const praises = studentRecords.filter((r) => r.type === 'praise');
    const reminders = studentRecords.filter((r) => r.type === 'reminder');

    const praisePoints = praises.reduce((sum, r) => sum + Math.abs(r.points || 0), 0);
    const reminderPoints = reminders.reduce((sum, r) => sum + Math.abs(r.points || 0), 0);

    const totalScore = baseScore + praisePoints - reminderPoints;
    const ratingInfo = calculateConductRating(totalScore, ratingThresholds);

    return {
      student,
      baseScore,
      praisePoints,
      reminderPoints, // Hiển thị số dương theo yêu cầu
      totalScore,
      ratingText: ratingInfo.rating,
      rank: 1,
      praiseCount: praises.length,
      reminderCount: reminders.length,
      note: student.note || '',
    };
  });

  // Xếp hạng theo tổng điểm giảm dần; học sinh bằng điểm có cùng hạng
  const sortedSummaries = [...rawSummaries].sort((a, b) => {
    if (b.totalScore !== a.totalScore) {
      return b.totalScore - a.totalScore;
    }
    // Nếu bằng điểm, giữ thứ tự theo tên tiếng Việt
    return a.student.name.localeCompare(b.student.name, 'vi');
  });

  // Gán xếp hạng theo nguyên tắc bằng điểm thì cùng hạng (Competition Rank)
  let currentRank = 1;
  for (let i = 0; i < sortedSummaries.length; i++) {
    if (i > 0 && sortedSummaries[i].totalScore === sortedSummaries[i - 1].totalScore) {
      sortedSummaries[i].rank = sortedSummaries[i - 1].rank;
    } else {
      sortedSummaries[i].rank = i + 1;
    }
  }

  return {
    summaries: sortedSummaries,
    periodRecords,
  };
}

/**
 * Xuất file Excel thi đua (.xlsx) gồm 2 sheet: "Tổng hợp thi đua" và "Chi tiết ghi nhận"
 */
export function exportConductToExcel(params: ConductExcelExportParams) {
  const {
    students,
    conduct,
    settings,
    classNameTitle,
    periodLabel,
    startDateStr,
    endDateStr,
    exportTimestamp,
  } = params;

  if (!students || students.length === 0) {
    throw new Error('Dữ liệu danh sách học sinh rỗng. Vui lòng kiểm tra lại lớp đang chọn!');
  }

  const schoolName = settings.schoolName || 'THCS Nguyễn Huệ - Phường Phú Thọ Hòa';
  const className = classNameTitle || settings.className || 'Lớp 9A5';
  const teacherName = settings.teacherName || 'Nguyễn Thị Diểm Hương';
  const academicYear = settings.academicYear || '2026 - 2027';

  // Tính toán số liệu
  const { summaries, periodRecords } = computeConductSummary(
    students,
    conduct,
    startDateStr,
    endDateStr,
    settings.ratingThresholds
  );

  // Tạo workbook mới
  const workbook = XLSX.utils.book_new();

  // ==========================================
  // SHEET 1: “Tổng hợp thi đua”
  // ==========================================
  const sheet1Data: any[][] = [
    [`TRƯỜNG: ${schoolName.toUpperCase()}`],
    ['BẢNG TỔNG HỢP THI ĐUA - NỀ NẾP HỌC SINH'],
    [`Lớp: ${className}   |   Giáo viên chủ nhiệm: ${teacherName}   |   Năm học: ${academicYear}`],
    [
      `Kỳ báo cáo: ${periodLabel} (Từ ngày ${formatDateVN(startDateStr)} đến ngày ${formatDateVN(
        endDateStr
      )})   |   Thời gian xuất: ${exportTimestamp}`,
    ],
    [], // Dòng trống
    // Dòng tiêu đề bảng (Row 6 - Index 5 trong 0-based)
    [
      'STT',
      'Mã hồ sơ học sinh',
      'Họ và tên',
      'Lớp',
      'Điểm ban đầu',
      'Tổng điểm cộng',
      'Tổng điểm trừ',
      'Tổng điểm thi đua',
      'Xếp loại thi đua',
      'Xếp hạng',
      'Số lượt ghi nhận tích cực',
      'Số lượt ghi nhận vi phạm',
      'Ghi chú',
    ],
  ];

  // Thêm dữ liệu học sinh
  summaries.forEach((item, idx) => {
    sheet1Data.push([
      idx + 1, // STT: số
      item.student.code, // Mã hồ sơ: văn bản giữ số 0
      sanitizeExcelText(item.student.name),
      className,
      item.baseScore, // Điểm ban đầu: số (100)
      item.praisePoints, // Tổng điểm cộng: số
      item.reminderPoints, // Tổng điểm trừ: số dương
      item.totalScore, // Tổng điểm thi đua: số
      item.ratingText, // Xếp loại
      item.rank, // Xếp hạng: số
      item.praiseCount, // Số lượt tích cực: số
      item.reminderCount, // Số lượt vi phạm: số
      sanitizeExcelText(item.note),
    ]);
  });

  const ws1 = XLSX.utils.aoa_to_sheet(sheet1Data);

  // Định dạng lại kiểu ô để đảm bảo: Mã hồ sơ là văn bản 's', điểm và số lượt là kiểu số 'n'
  const sheet1HeaderRowIndex = 5; // 0-based (hàng 6 trong Excel)
  const range1 = XLSX.utils.decode_range(ws1['!ref'] || 'A1:M6');

  for (let R = sheet1HeaderRowIndex + 1; R <= range1.e.r; ++R) {
    // Cột B (col 1): Mã hồ sơ học sinh -> kiểu chuỗi 's'
    const cellB = ws1[XLSX.utils.encode_cell({ r: R, c: 1 })];
    if (cellB) {
      cellB.t = 's';
      cellB.z = '@';
    }
    // Cột A, E, F, G, H, J, K, L -> kiểu số 'n'
    [0, 4, 5, 6, 7, 9, 10, 11].forEach((colIdx) => {
      const cell = ws1[XLSX.utils.encode_cell({ r: R, c: colIdx })];
      if (cell && typeof cell.v === 'number') {
        cell.t = 'n';
      }
    });
  }

  // Đặt độ rộng các cột cho Sheet 1
  ws1['!cols'] = [
    { wch: 6 },  // STT
    { wch: 18 }, // Mã hồ sơ học sinh
    { wch: 25 }, // Họ và tên
    { wch: 12 }, // Lớp
    { wch: 14 }, // Điểm ban đầu
    { wch: 16 }, // Tổng điểm cộng
    { wch: 16 }, // Tổng điểm trừ
    { wch: 18 }, // Tổng điểm thi đua
    { wch: 18 }, // Xếp loại thi đua
    { wch: 12 }, // Xếp hạng
    { wch: 24 }, // Số lượt ghi nhận tích cực
    { wch: 24 }, // Số lượt ghi nhận vi phạm
    { wch: 32 }, // Ghi chú
  ];

  // Bật bộ lọc (AutoFilter) tại hàng tiêu đề (Hàng 6)
  ws1['!autofilter'] = {
    ref: `A6:M${range1.e.r + 1}`,
  };

  // Cố định hàng tiêu đề bảng (Freeze Panes ở hàng 6)
  ws1['!freeze'] = {
    xSplit: 0,
    ySplit: 6,
    topLeftCell: 'A7',
    activePane: 'bottomLeft',
    state: 'frozen',
  };
  ws1['!views'] = [
    {
      state: 'frozen',
      ySplit: 6,
      activePane: 'bottomLeft',
      topLeftCell: 'A7',
    },
  ];

  // ==========================================
  // SHEET 2: “Chi tiết ghi nhận”
  // ==========================================
  const sheet2Data: any[][] = [
    [`TRƯỜNG: ${schoolName.toUpperCase()}`],
    ['BẢNG CHI TIẾT GHI NHẬN THI ĐUA - NỀ NẾP HỌC SINH'],
    [`Lớp: ${className}   |   Giáo viên chủ nhiệm: ${teacherName}   |   Năm học: ${academicYear}`],
    [
      `Kỳ báo cáo: ${periodLabel} (Từ ngày ${formatDateVN(startDateStr)} đến ngày ${formatDateVN(
        endDateStr
      )})   |   Thời gian xuất: ${exportTimestamp}`,
    ],
    [], // Dòng trống
    // Dòng tiêu đề bảng (Row 6 - Index 5 trong 0-based)
    [
      'STT',
      'Thời gian',
      'Mã hồ sơ học sinh',
      'Họ và tên',
      'Nội dung sự việc',
      'Loại ghi nhận',
      'Điểm cộng/trừ',
      'Người ghi nhận',
      'Ghi chú',
    ],
  ];

  if (periodRecords.length === 0) {
    sheet2Data.push([
      1,
      formatDateVN(startDateStr),
      '-',
      'Toàn lớp',
      'Không có lượt ghi nhận sự việc nào trong khoảng thời gian này',
      '-',
      0,
      teacherName,
      'Không có vi phạm hoặc tuyên dương phát sinh',
    ]);
  } else {
    periodRecords.forEach((rec, idx) => {
      const student = students.find((s) => s.id === rec.studentId);
      const studentCode = student?.code || '-';
      const studentName = student?.name || 'Học sinh';
      const eventName = sanitizeExcelText(rec.criterionName || 'Ghi nhận sự việc');
      const eventType = rec.type === 'praise' ? 'Tích cực' : 'Vi phạm';
      const pointsFormatted = rec.points > 0 ? `+${rec.points}` : `${rec.points}`;
      const recorder = sanitizeExcelText((rec as any).recordedBy || teacherName || 'GVCN');
      const note = sanitizeExcelText(rec.note || '');

      sheet2Data.push([
        idx + 1,
        formatDateVN(rec.date),
        studentCode,
        sanitizeExcelText(studentName),
        eventName,
        eventType,
        pointsFormatted,
        recorder,
        note,
      ]);
    });
  }

  const ws2 = XLSX.utils.aoa_to_sheet(sheet2Data);
  const sheet2HeaderRowIndex = 5;
  const range2 = XLSX.utils.decode_range(ws2['!ref'] || 'A1:I6');

  // Đảm bảo mã hồ sơ là kiểu văn bản 's'
  for (let R = sheet2HeaderRowIndex + 1; R <= range2.e.r; ++R) {
    const cellCode = ws2[XLSX.utils.encode_cell({ r: R, c: 2 })];
    if (cellCode) {
      cellCode.t = 's';
      cellCode.z = '@';
    }
  }

  // Đặt độ rộng các cột cho Sheet 2
  ws2['!cols'] = [
    { wch: 6 },  // STT
    { wch: 14 }, // Thời gian
    { wch: 18 }, // Mã hồ sơ học sinh
    { wch: 25 }, // Họ và tên
    { wch: 38 }, // Nội dung sự việc
    { wch: 16 }, // Loại ghi nhận
    { wch: 15 }, // Điểm cộng/trừ có dấu
    { wch: 24 }, // Người ghi nhận
    { wch: 32 }, // Ghi chú
  ];

  // Bật bộ lọc (AutoFilter) tại hàng tiêu đề (Hàng 6)
  ws2['!autofilter'] = {
    ref: `A6:I${range2.e.r + 1}`,
  };

  // Cố định hàng tiêu đề bảng
  ws2['!freeze'] = {
    xSplit: 0,
    ySplit: 6,
    topLeftCell: 'A7',
    activePane: 'bottomLeft',
    state: 'frozen',
  };
  ws2['!views'] = [
    {
      state: 'frozen',
      ySplit: 6,
      activePane: 'bottomLeft',
      topLeftCell: 'A7',
    },
  ];

  // Thêm 2 sheet vào workbook
  XLSX.utils.book_append_sheet(workbook, ws1, 'Tổng hợp thi đua');
  XLSX.utils.book_append_sheet(workbook, ws2, 'Chi tiết ghi nhận');

  // Định dạng tên file: Thi_dua_[TenLop]_[TuNgay]_[DenNgay].xlsx
  const safeClassName = className
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9_\u00C0-\u1EF9]/g, '');
  const fileName = `Thi_dua_${safeClassName}_${startDateStr}_${endDateStr}.xlsx`;

  // Ghi và tải file Excel về máy
  XLSX.writeFile(workbook, fileName);

  return {
    fileName,
    totalStudents: summaries.length,
    totalRecords: periodRecords.length,
  };
}
