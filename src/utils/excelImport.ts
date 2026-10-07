import * as XLSX from 'xlsx';
import { Student, Gender, StudentRole, StudentStatus, AcademicStatus } from '../types';

export interface ParsedStudentRow {
  code: string;
  name: string;
  gender: Gender;
  dob: string;
  group: number;
  role: StudentRole;
  parentName: string;
  parentPhone: string;
  address: string;
  note: string;
  isValid: boolean;
  error?: string;
}

// Chuẩn hóa ngày sinh từ Excel (có thể là số serial Excel, hoặc DD/MM/YYYY, hoặc YYYY-MM-DD)
export function parseExcelDate(val: any): string {
  if (!val) return '2012-01-01';

  if (typeof val === 'number') {
    // Excel serial date to JS Date
    const date = new Date(Math.round((val - 25569) * 86400 * 1000));
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  const str = String(val).trim();
  // Case DD/MM/YYYY
  const partsSlash = str.split('/');
  if (partsSlash.length === 3) {
    const day = partsSlash[0].padStart(2, '0');
    const month = partsSlash[1].padStart(2, '0');
    const year = partsSlash[2].length === 2 ? `20${partsSlash[2]}` : partsSlash[2];
    return `${year}-${month}-${day}`;
  }

  // Case DD-MM-YYYY
  const partsDash = str.split('-');
  if (partsDash.length === 3) {
    if (partsDash[0].length === 4) {
      return str; // Already YYYY-MM-DD
    }
    const day = partsDash[0].padStart(2, '0');
    const month = partsDash[1].padStart(2, '0');
    const year = partsDash[2];
    return `${year}-${month}-${day}`;
  }

  return '2012-01-01';
}

// Chuẩn hóa giới tính
export function parseGender(val: any): Gender {
  if (!val) return 'Nam';
  const s = String(val).trim().toLowerCase();
  if (s.includes('nữ') || s === 'nu' || s === 'female' || s === 'f') {
    return 'Nữ';
  }
  return 'Nam';
}

// Chuẩn hóa Tổ
export function parseGroup(val: any, index: number): number {
  if (!val) return ((index % 4) + 1);
  const num = parseInt(String(val).replace(/\D/g, ''), 10);
  if (num >= 1 && num <= 4) return num;
  return ((index % 4) + 1);
}

// Chuẩn hóa Chức vụ
export function parseRole(val: any): StudentRole {
  if (!val) return 'Thành viên';
  const s = String(val).trim().toLowerCase();
  if (s.includes('lớp trưởng')) return 'Lớp trưởng';
  if (s.includes('phó học tập')) return 'Lớp phó học tập';
  if (s.includes('phó lao động')) return 'Lớp phó lao động';
  if (s.includes('tổ trưởng')) return 'Tổ trưởng';
  if (s.includes('tổ phó')) return 'Tổ phó';
  if (s.includes('cờ đỏ')) return 'Cờ đỏ';
  return 'Thành viên';
}

// Đọc file Excel / CSV và trả về danh sách học sinh đã chuẩn hóa
export function parseExcelFile(file: File): Promise<ParsedStudentRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Đọc dữ liệu dạng mảng 2 chiều (header: 1)
        const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (!rawRows || rawRows.length === 0) {
          throw new Error('Tệp không có dữ liệu');
        }

        // Tìm dòng tiêu đề (chứa "họ và tên" hoặc "họ tên" hoặc "tên")
        let headerRowIndex = -1;
        for (let i = 0; i < Math.min(rawRows.length, 10); i++) {
          const rowStr = (rawRows[i] || []).map((c) => String(c || '').toLowerCase()).join(' ');
          if (rowStr.includes('họ') || rowStr.includes('tên') || rowStr.includes('mã hs')) {
            headerRowIndex = i;
            break;
          }
        }

        if (headerRowIndex === -1) {
          headerRowIndex = 0; // Mặc định dòng đầu tiên nếu không thấy
        }

        const headers = (rawRows[headerRowIndex] || []).map((h) =>
          String(h || '').trim().toLowerCase()
        );

        // Tìm chỉ số các cột
        const colMap = {
          code: headers.findIndex((h) => h.includes('mã')),
          name: headers.findIndex((h) => h.includes('họ và tên') || h.includes('họ tên') || h.includes('tên') || h.includes('học sinh')),
          gender: headers.findIndex((h) => h.includes('giới tính') || h.includes('phái')),
          dob: headers.findIndex((h) => h.includes('ngày sinh') || h.includes('năm sinh') || h.includes('sinh')),
          group: headers.findIndex((h) => h.includes('tổ')),
          role: headers.findIndex((h) => h.includes('chức vụ') || h.includes('nhiệm vụ')),
          parentName: headers.findIndex((h) => h.includes('phụ huynh') || h.includes('cha') || h.includes('mẹ')),
          parentPhone: headers.findIndex((h) => h.includes('sđt') || h.includes('điện thoại') || h.includes('phone') || h.includes('liên hệ')),
          address: headers.findIndex((h) => h.includes('địa chỉ') || h.includes('nơi ở')),
          note: headers.findIndex((h) => h.includes('ghi chú') || h.includes('nhận xét')),
        };

        const result: ParsedStudentRow[] = [];

        for (let r = headerRowIndex + 1; r < rawRows.length; r++) {
          const row = rawRows[r];
          if (!row || row.length === 0) continue;

          // Lấy họ tên
          const nameVal = colMap.name >= 0 ? row[colMap.name] : row[1] || row[0];
          const name = String(nameVal || '').trim();

          // Bỏ qua dòng trống hoặc dòng tổng cộng
          if (!name || name.toLowerCase().includes('tổng số') || name.toLowerCase().includes('sĩ số')) {
            continue;
          }

          const codeVal = colMap.code >= 0 ? row[colMap.code] : `HS08${String(result.length + 1).padStart(2, '0')}`;
          const code = String(codeVal || `HS08${String(result.length + 1).padStart(2, '0')}`).trim();

          const gender = parseGender(colMap.gender >= 0 ? row[colMap.gender] : undefined);
          const dob = parseExcelDate(colMap.dob >= 0 ? row[colMap.dob] : undefined);
          const group = parseGroup(colMap.group >= 0 ? row[colMap.group] : undefined, result.length);
          const role = parseRole(colMap.role >= 0 ? row[colMap.role] : undefined);
          const parentName = colMap.parentName >= 0 ? String(row[colMap.parentName] || '').trim() : '';
          const parentPhone = colMap.parentPhone >= 0 ? String(row[colMap.parentPhone] || '').trim() : '';
          const address = colMap.address >= 0 ? String(row[colMap.address] || '').trim() : '';
          const note = colMap.note >= 0 ? String(row[colMap.note] || '').trim() : '';

          result.push({
            code,
            name,
            gender,
            dob,
            group,
            role,
            parentName,
            parentPhone: parentPhone || 'Chưa cập nhật',
            address,
            note,
            isValid: true,
          });
        }

        resolve(result);
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = () => reject(new Error('Lỗi khi đọc tệp Excel'));
    reader.readAsArrayBuffer(file);
  });
}

// Xuất file mẫu Excel (.xlsx) chuẩn cho giáo viên điền
export function downloadExcelTemplate(className: string = '8A1') {
  const templateData = [
    {
      'STT': 1,
      'Mã học sinh': 'HS0801',
      'Họ và tên': 'Nguyễn Văn An',
      'Giới tính': 'Nam',
      'Ngày sinh': '15/03/2012',
      'Tổ': 1,
      'Chức vụ': 'Lớp trưởng',
      'Họ tên phụ huynh': 'Nguyễn Văn Ba',
      'Số điện thoại phụ huynh': '0912 345 678',
      'Địa chỉ': '12 Nguyễn Trãi, Q.5',
      'Ghi chú': 'Nhiệt tình, có trách nhiệm',
    },
    {
      'STT': 2,
      'Mã học sinh': 'HS0802',
      'Họ và tên': 'Trần Thảo Linh',
      'Giới tính': 'Nữ',
      'Ngày sinh': '20/05/2012',
      'Tổ': 1,
      'Chức vụ': 'Lớp phó học tập',
      'Họ tên phụ huynh': 'Lê Thị Thu',
      'Số điện thoại phụ huynh': '0903 888 123',
      'Địa chỉ': '45 Lê Lợi, Q.1',
      'Ghi chú': 'Chăm chỉ, chữ đẹp',
    },
    {
      'STT': 3,
      'Mã học sinh': 'HS0803',
      'Họ và tên': 'Lê Hoàng Long',
      'Giới tính': 'Nam',
      'Ngày sinh': '10/08/2012',
      'Tổ': 2,
      'Chức vụ': 'Tổ trưởng',
      'Họ tên phụ huynh': 'Lê Quốc Hùng',
      'Số điện thoại phụ huynh': '0988 765 432',
      'Địa chỉ': '88 Hai Bà Trưng, Q.3',
      'Ghi chú': 'Nhanh nhẹn, sôi nổi',
    },
    {
      'STT': 4,
      'Mã học sinh': 'HS0804',
      'Họ và tên': 'Phạm Quỳnh Anh',
      'Giới tính': 'Nữ',
      'Ngày sinh': '28/01/2012',
      'Tổ': 2,
      'Chức vụ': 'Thành viên',
      'Họ tên phụ huynh': 'Phạm Văn Nam',
      'Số điện thoại phụ huynh': '0977 123 456',
      'Địa chỉ': '15 Cách Mạng Tháng 8',
      'Ghi chú': 'Ngoan, ít nói',
    },
    {
      'STT': 5,
      'Mã học sinh': 'HS0805',
      'Họ và tên': 'Vũ Đức Duy',
      'Giới tính': 'Nam',
      'Ngày sinh': '04/11/2012',
      'Tổ': 3,
      'Chức vụ': 'Thành viên',
      'Họ tên phụ huynh': 'Trịnh Mai Lan',
      'Số điện thoại phụ huynh': '0934 567 890',
      'Địa chỉ': '102 Trần Phú, Q.5',
      'Ghi chú': 'Cần nhắc nhở bài tập về nhà',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(templateData);

  // Set column widths
  worksheet['!cols'] = [
    { wch: 6 },  // STT
    { wch: 14 }, // Mã học sinh
    { wch: 22 }, // Họ và tên
    { wch: 10 }, // Giới tính
    { wch: 14 }, // Ngày sinh
    { wch: 8 },  // Tổ
    { wch: 18 }, // Chức vụ
    { wch: 20 }, // Họ tên phụ huynh
    { wch: 18 }, // SĐT
    { wch: 25 }, // Địa chỉ
    { wch: 30 }, // Ghi chú
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, `DanhSach_${className}`);

  XLSX.writeFile(workbook, `Mau_Danh_Sach_Hoc_Sinh_${className}.xlsx`);
}
