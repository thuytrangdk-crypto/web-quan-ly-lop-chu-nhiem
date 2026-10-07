import {
  Student,
  ConductCriterion,
  AttendanceRecord,
  ConductRecord,
  DiaryEntry,
  TaskItem,
  QuickNote,
  ClassSettings,
  ClassProfile,
} from '../types';
import {
  DEFAULT_SETTINGS,
  DEFAULT_CLASSES,
  INITIAL_STUDENTS,
  DEFAULT_CRITERIA,
  INITIAL_ATTENDANCE,
  INITIAL_CONDUCT_RECORDS,
  INITIAL_DIARY_ENTRIES,
  INITIAL_TASKS,
  INITIAL_QUICK_NOTES,
  getTodayDateString,
} from '../data/sampleData';

export { getTodayDateString };

const STORAGE_KEYS = {
  SETTINGS: 'troly_lop8_settings_v1',
  CLASSES: 'troly_lop8_classes_v1',
  ACTIVE_CLASS: 'troly_lop8_active_class_v1',
  STUDENTS: 'troly_lop8_students_v1',
  CRITERIA: 'troly_lop8_criteria_v1',
  ATTENDANCE: 'troly_lop8_attendance_v1',
  CONDUCT: 'troly_lop8_conduct_v1',
  DIARY: 'troly_lop8_diary_v1',
  TASKS: 'troly_lop8_tasks_v1',
  QUICK_NOTES: 'troly_lop8_quicknotes_v1',
};

export interface AppState {
  settings: ClassSettings;
  classes: ClassProfile[];
  activeClassId: string;
  students: Student[];
  criteria: ConductCriterion[];
  attendance: AttendanceRecord[];
  conduct: ConductRecord[];
  diary: DiaryEntry[];
  tasks: TaskItem[];
  quickNotes: QuickNote[];
}

export function loadAppState(): AppState {
  try {
    const settingsStr = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    const classesStr = localStorage.getItem(STORAGE_KEYS.CLASSES);
    const activeClassStr = localStorage.getItem(STORAGE_KEYS.ACTIVE_CLASS);
    const studentsStr = localStorage.getItem(STORAGE_KEYS.STUDENTS);
    const criteriaStr = localStorage.getItem(STORAGE_KEYS.CRITERIA);
    const attendanceStr = localStorage.getItem(STORAGE_KEYS.ATTENDANCE);
    const conductStr = localStorage.getItem(STORAGE_KEYS.CONDUCT);
    const diaryStr = localStorage.getItem(STORAGE_KEYS.DIARY);
    const tasksStr = localStorage.getItem(STORAGE_KEYS.TASKS);
    const quickNotesStr = localStorage.getItem(STORAGE_KEYS.QUICK_NOTES);

    const parsedClasses = classesStr ? JSON.parse(classesStr) : null;
    let classes: ClassProfile[] = Array.isArray(parsedClasses) && parsedClasses.length > 0 ? parsedClasses : DEFAULT_CLASSES;

    // Tự động nâng cấp nếu còn lưu lớp cũ class-8a1 / Lớp 8A3
    classes = classes.map((c) => {
      if (c.id === 'class-8a1' || c.name === 'Lớp 8A1' || c.name === 'Lớp 8A3') {
        return { ...c, id: 'class-9a5', name: 'Lớp 9A5', grade: 9 };
      }
      return c;
    });

    const activeClassId = activeClassStr === 'class-8a1' ? 'class-9a5' : (activeClassStr || (classes[0] ? classes[0].id : 'class-9a5'));
    
    const parsedSettings = settingsStr ? JSON.parse(settingsStr) : null;
    const settings: ClassSettings = {
      ...DEFAULT_SETTINGS,
      ...(parsedSettings && typeof parsedSettings === 'object' ? parsedSettings : {}),
    };

    // Tự động cập nhật từ gốc nếu còn lưu tên GVCN cũ, lớp cũ hoặc trường cũ
    if (
      !settings.teacherName ||
      settings.teacherName === 'Cô Thùy Trang' ||
      settings.teacherName.includes('Thùy Trang') ||
      settings.teacherName === 'Cô Diễm Hương' ||
      settings.teacherName === 'Diễm Hương' ||
      settings.teacherName === 'GVCN'
    ) {
      settings.teacherName = 'Nguyễn Thị Diểm Hương';
    }
    if (settings.className === 'Lớp 8A1' || settings.className === 'Lớp 8A3') {
      settings.className = 'Lớp 9A5';
    }
    if (!settings.schoolName || settings.schoolName === 'THCS Lê Quý Đôn' || settings.schoolName.includes('Lê Quý Đôn')) {
      settings.schoolName = 'THCS Nguyễn Huệ - Phường Phú Thọ Hòa';
    }

    const parsedStudents = studentsStr ? JSON.parse(studentsStr) : null;
    const rawStudents: Student[] = Array.isArray(parsedStudents) ? parsedStudents : INITIAL_STUDENTS;
    // Đảm bảo mỗi học sinh có classId chuẩn
    const students = rawStudents.map((s) => ({
      ...s,
      classId: s.classId === 'class-8a1' || !s.classId ? 'class-9a5' : s.classId,
    }));

    const parsedCriteria = criteriaStr ? JSON.parse(criteriaStr) : null;
    const parsedAttendance = attendanceStr ? JSON.parse(attendanceStr) : null;
    const parsedConduct = conductStr ? JSON.parse(conductStr) : null;
    const parsedDiary = diaryStr ? JSON.parse(diaryStr) : null;
    const parsedTasks = tasksStr ? JSON.parse(tasksStr) : null;
    const parsedQuickNotes = quickNotesStr ? JSON.parse(quickNotesStr) : null;

    return {
      settings,
      classes,
      activeClassId,
      students,
      criteria: Array.isArray(parsedCriteria) ? parsedCriteria : DEFAULT_CRITERIA,
      attendance: Array.isArray(parsedAttendance) ? parsedAttendance : INITIAL_ATTENDANCE,
      conduct: Array.isArray(parsedConduct) ? parsedConduct : INITIAL_CONDUCT_RECORDS,
      diary: Array.isArray(parsedDiary) ? parsedDiary : INITIAL_DIARY_ENTRIES,
      tasks: Array.isArray(parsedTasks) ? parsedTasks : INITIAL_TASKS,
      quickNotes: Array.isArray(parsedQuickNotes) ? parsedQuickNotes : INITIAL_QUICK_NOTES,
    };
  } catch (err) {
    console.error('Lỗi khi đọc dữ liệu từ LocalStorage, dùng dữ liệu mẫu:', err);
    return {
      settings: DEFAULT_SETTINGS,
      classes: DEFAULT_CLASSES,
      activeClassId: 'class-9a5',
      students: INITIAL_STUDENTS,
      criteria: DEFAULT_CRITERIA,
      attendance: INITIAL_ATTENDANCE,
      conduct: INITIAL_CONDUCT_RECORDS,
      diary: INITIAL_DIARY_ENTRIES,
      tasks: INITIAL_TASKS,
      quickNotes: INITIAL_QUICK_NOTES,
    };
  }
}

export function saveAppState(state: AppState) {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(state.settings));
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(state.classes));
    localStorage.setItem(STORAGE_KEYS.ACTIVE_CLASS, state.activeClassId);
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(state.students));
    localStorage.setItem(STORAGE_KEYS.CRITERIA, JSON.stringify(state.criteria));
    localStorage.setItem(STORAGE_KEYS.ATTENDANCE, JSON.stringify(state.attendance));
    localStorage.setItem(STORAGE_KEYS.CONDUCT, JSON.stringify(state.conduct));
    localStorage.setItem(STORAGE_KEYS.DIARY, JSON.stringify(state.diary));
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(state.tasks));
    localStorage.setItem(STORAGE_KEYS.QUICK_NOTES, JSON.stringify(state.quickNotes));
  } catch (err) {
    console.error('Lỗi khi lưu vào LocalStorage:', err);
  }
}

export function resetToSampleData(): AppState {
  const sampleState: AppState = {
    settings: DEFAULT_SETTINGS,
    classes: DEFAULT_CLASSES,
    activeClassId: 'class-8a1',
    students: INITIAL_STUDENTS.map((s) => ({ ...s, classId: 'class-8a1' })),
    criteria: DEFAULT_CRITERIA,
    attendance: INITIAL_ATTENDANCE,
    conduct: INITIAL_CONDUCT_RECORDS,
    diary: INITIAL_DIARY_ENTRIES,
    tasks: INITIAL_TASKS,
    quickNotes: INITIAL_QUICK_NOTES,
  };
  saveAppState(sampleState);
  return sampleState;
}

export function exportBackupJSON(state: AppState) {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state, null, 2));
  const downloadAnchor = document.createElement('a');
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `SaoLuu_TroLyChuNhiemLop8_${dateStr}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export function importBackupJSON(file: File): Promise<AppState> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);
        if (!parsed.students || !parsed.settings) {
          throw new Error('Định dạng tệp sao lưu không hợp lệ!');
        }
        const fullState: AppState = {
          settings: parsed.settings || DEFAULT_SETTINGS,
          classes: parsed.classes || DEFAULT_CLASSES,
          activeClassId: parsed.activeClassId || 'class-8a1',
          students: parsed.students || INITIAL_STUDENTS,
          criteria: parsed.criteria || DEFAULT_CRITERIA,
          attendance: parsed.attendance || [],
          conduct: parsed.conduct || [],
          diary: parsed.diary || [],
          tasks: parsed.tasks || [],
          quickNotes: parsed.quickNotes || [],
        };
        saveAppState(fullState);
        resolve(fullState);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Không thể đọc file'));
    reader.readAsText(file);
  });
}

// Format ngày tháng tiếng Việt thân thiện
export function formatDateVN(dateString: string): string {
  if (!dateString) return '';
  const parts = dateString.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateString;
}

export function getDayOfWeekVN(dateObj: Date = new Date()): string {
  const days = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  return days[dateObj.getDay()];
}

export function getFullVietnameseDate(dateObj: Date = new Date()): string {
  const dow = getDayOfWeekVN(dateObj);
  const day = String(dateObj.getDate()).padStart(2, '0');
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const year = dateObj.getFullYear();
  return `${dow}, ngày ${day}/${month}/${year}`;
}
