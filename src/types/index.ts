// Định nghĩa toàn bộ kiểu dữ liệu cho Trợ lý chủ nhiệm (GVCN)

export type Gender = 'Nam' | 'Nữ';

export type StudentRole = 'Lớp trưởng' | 'Lớp phó học tập' | 'Lớp phó lao động' | 'Tổ trưởng' | 'Tổ phó' | 'Cờ đỏ' | 'Thành viên';

export type StudentStatus = 'Đang học' | 'Nghỉ học có phép dài ngày' | 'Chuyển trường';

export type AcademicStatus = 'Tốt' | 'Ổn định' | 'Có tiến bộ' | 'Cần hỗ trợ';

export type ConductRating = 'Tốt' | 'Khá' | 'Đạt' | 'Chưa đạt';

export type AttendanceStatus = 'present' | 'absent_unexcused' | 'absent_excused' | 'late';

export interface ClassProfile {
  id: string;
  name: string; // e.g. "Lớp 8A1", "Lớp 8A2"
  grade: number; // e.g. 8
  academicYear?: string;
  room?: string;
}

export interface Student {
  id: string;
  classId?: string; // ID của lớp học
  code: string; // Mã học sinh
  name: string;
  gender: Gender;
  dob: string; // YYYY-MM-DD
  group: number; // Tổ 1, 2, 3, 4
  role: StudentRole;
  parentName: string;
  parentPhone: string;
  address?: string;
  note: string;
  status: StudentStatus;
  academicStatus: AcademicStatus;
  academicNote?: string;
  strengthSubjects?: string;
  needsAttentionSubjects?: string;
  avatarSeed?: string;
}

export interface AttendanceRecord {
  id: string;
  classId?: string;
  date: string; // YYYY-MM-DD
  studentId: string;
  status: AttendanceStatus;
  note?: string;
}

export interface ConductCriterion {
  id: string;
  name: string;
  points: number; // positive for praise, negative for reminder
  type: 'praise' | 'reminder';
  category: string;
}

export interface ConductRecord {
  id: string;
  date: string; // YYYY-MM-DD
  studentId: string;
  criterionId?: string;
  criterionName: string;
  points: number;
  type: 'praise' | 'reminder';
  note?: string;
}

export interface DiaryEntry {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  content: string;
  studentIds: string[]; // ['all'] or specific student IDs
  category: 'Học tập' | 'Nề nếp / Kỷ luật' | 'Phong trào / Hoạt động' | 'Tâm lý / Sức khỏe' | 'Liên hệ phụ huynh' | 'Khác';
  actionTaken: string;
  note?: string;
  status: 'Chưa xử lý' | 'Đang theo dõi' | 'Đã hoàn thành';
}

export interface TaskItem {
  id: string;
  title: string;
  createdAt: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  priority: 'Bình thường' | 'Quan trọng' | 'Gấp';
  status: 'Chưa làm' | 'Đang làm' | 'Hoàn thành';
  note?: string;
}

export interface QuickNote {
  id: string;
  content: string;
  createdAt: string;
  pinned?: boolean;
}

export interface ConductRatingThresholds {
  month: {
    totMin: number; // e.g. 0
    khaMin: number; // e.g. -3
    datMin: number; // e.g. -7
  };
  year: {
    totMin: number; // e.g. 90
    khaMin: number; // e.g. 75
    datMin: number; // e.g. 50
  };
}

export interface ClassSettings {
  schoolName: string;
  className: string;
  teacherName: string;
  academicYear: string;
  semester: string;
  targetStudentsCount: number;
  teacherPassword?: string; // Mật khẩu đăng nhập của GVCN
  ratingThresholds?: ConductRatingThresholds;
}

export type UserRole = 'teacher' | 'student';

export interface UserSession {
  role: UserRole;
  studentId?: string;
  studentName?: string;
  studentCode?: string;
}
