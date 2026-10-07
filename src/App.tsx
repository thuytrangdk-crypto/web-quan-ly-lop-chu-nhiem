import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar, NavTab } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { StudentsView } from './components/StudentsView';
import { AttendanceView } from './components/AttendanceView';
import { ConductView } from './components/ConductView';
import { AcademicView } from './components/AcademicView';
import { DiaryView } from './components/DiaryView';
import { TasksView } from './components/TasksView';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import { Toast, ToastMessage } from './components/Toast';
import { ConfirmModal } from './components/ConfirmModal';
import { ExcelImportModal } from './components/ExcelImportModal';
import { ClassSwitchModal } from './components/ClassSwitchModal';
import { TeacherAuthModal } from './components/TeacherAuthModal';
import { LoginPortal } from './components/LoginPortal';
import { SupabaseModal } from './components/SupabaseModal';
import { saveAppStateToSupabase, fetchAppStateFromSupabase } from './lib/supabaseSync';
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
  UserSession,
} from './types';
import {
  AppState,
  loadAppState,
  saveAppState,
  resetToSampleData,
  sanitizeAppState,
} from './utils/storage';

export default function App() {
  // Load initial state from LocalStorage or Default Sample Data
  const [appState, setAppState] = useState<AppState>(() => loadAppState());
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Modals state
  const [activeStudentModalId, setActiveStudentModalId] = useState<string | null>(null);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [isClassSwitchModalOpen, setIsClassSwitchModalOpen] = useState(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);

  // Authentication State: Bắt đầu trang ai cũng cần mật khẩu (GVCN hoặc Học sinh)
  const [currentUser, setCurrentUser] = useState<UserSession | null>(() => {
    try {
      const saved = localStorage.getItem('troly_user_session');
      if (saved) return JSON.parse(saved);
      return null; // Bắt buộc đăng nhập
    } catch {
      return null;
    }
  });

  const isTeacherLoggedIn = currentUser?.role === 'teacher';
  const [isTeacherAuthModalOpen, setIsTeacherAuthModalOpen] = useState(false);
  const [teacherAuthMode, setTeacherAuthMode] = useState<'login' | 'change_password'>('login');

  // Confirm Modal state
  const [confirmModalConfig, setConfirmModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    isDangerous?: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmLabel: 'Xác nhận',
    isDangerous: false,
    onConfirm: () => {},
  });

  // Tự động tải dữ liệu đám mây từ Supabase khi mở ứng dụng (nếu đã tạo bảng)
  useEffect(() => {
    let isMounted = true;
    fetchAppStateFromSupabase()
      .then((remoteState) => {
        if (!isMounted) return;
        if (remoteState && remoteState.students && remoteState.students.length > 0) {
          const sanitized = sanitizeAppState(remoteState);
          setAppState(sanitized);
        } else {
          // Nếu Supabase chưa có bản ghi, lưu bản ghi khởi tạo lên
          saveAppStateToSupabase(appState).catch(() => {});
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  // Tự động lưu LocalStorage và đồng bộ lên Supabase mỗi khi state thay đổi
  useEffect(() => {
    saveAppState(appState);
    const timer = setTimeout(() => {
      saveAppStateToSupabase(appState).catch(() => {});
    }, 2000);
    return () => clearTimeout(timer);
  }, [appState]);

  // Lưu trạng thái đăng nhập của giáo viên
  useEffect(() => {
    try {
      localStorage.setItem('troly_gvcn_logged_in', String(isTeacherLoggedIn));
    } catch {}
  }, [isTeacherLoggedIn]);

  // Lớp chủ nhiệm hiện tại
  const currentClass =
    appState.classes?.find((c) => c.id === appState.activeClassId) ||
    appState.classes?.[0] || {
      id: 'class-9a5',
      name: appState.settings.className || 'Lớp 9A5',
      grade: 9,
    };

  // Học sinh thuộc lớp chủ nhiệm hiện tại
  const activeStudents = appState.students.filter(
    (s) => (s.classId || 'class-9a5') === currentClass.id
  );

  // Toast Helper
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // ===============================
  // CÁC HÀM XỬ LÝ PHÂN QUYỀN & TÀI KHOẢN (GVCN / HỌC SINH)
  // ===============================
  const handleLoginAsTeacher = () => {
    const session: UserSession = { role: 'teacher' };
    setCurrentUser(session);
    try {
      localStorage.setItem('troly_user_session', JSON.stringify(session));
      localStorage.setItem('troly_gvcn_logged_in', 'true');
    } catch {}
    showToast(`Chào mừng ${appState.settings.teacherName}! Bạn có toàn quyền quản trị và chỉnh sửa tất cả học sinh.`);
  };

  const handleLoginAsStudent = (student: Student) => {
    const session: UserSession = {
      role: 'student',
      studentId: student.id,
      studentName: student.name,
      studentCode: student.code,
    };
    setCurrentUser(session);
    try {
      localStorage.setItem('troly_user_session', JSON.stringify(session));
      localStorage.setItem('troly_gvcn_logged_in', 'false');
    } catch {}
    showToast(`Chào em ${student.name}! Em có thể xem thông tin cá nhân và thông tin lớp học.`);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveStudentModalId(null);
    try {
      localStorage.removeItem('troly_user_session');
      localStorage.setItem('troly_gvcn_logged_in', 'false');
    } catch {}
    showToast('Đã đăng xuất. Vui lòng đăng nhập lại.', 'info');
  };

  const handleTeacherLoginSuccess = () => {
    handleLoginAsTeacher();
  };

  const handleChangeTeacherPassword = (newPassword: string) => {
    setAppState((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        teacherPassword: newPassword,
      },
    }));
    showToast('Đã lưu mật khẩu mới cho Giáo viên chủ nhiệm!');
  };

  // ===============================
  // CÁC HÀM XỬ LÝ LỚP CHỦ NHIỆM
  // ===============================
  const handleSelectClass = (classId: string) => {
    const selectedClass = appState.classes.find((c) => c.id === classId);
    if (!selectedClass) return;

    setAppState((prev) => ({
      ...prev,
      activeClassId: classId,
      settings: {
        ...prev.settings,
        className: selectedClass.name,
      },
    }));
  };

  const handleAddClass = (newClassData: Omit<ClassProfile, 'id'>) => {
    const newId = `class-${Date.now()}`;
    const newClass: ClassProfile = {
      ...newClassData,
      id: newId,
    };

    setAppState((prev) => ({
      ...prev,
      classes: [...prev.classes, newClass],
      activeClassId: newId,
      settings: {
        ...prev.settings,
        className: newClass.name,
      },
    }));
  };

  const handleRenameClass = (classId: string, newName: string) => {
    setAppState((prev) => {
      const updatedClasses = prev.classes.map((c) =>
        c.id === classId ? { ...c, name: newName } : c
      );
      const isCurrent = prev.activeClassId === classId;
      return {
        ...prev,
        classes: updatedClasses,
        settings: isCurrent
          ? { ...prev.settings, className: newName }
          : prev.settings,
      };
    });
  };

  const handleDeleteClass = (classId: string) => {
    if (appState.classes.length <= 1) {
      showToast('Không thể xóa lớp duy nhất còn lại!', 'error');
      return;
    }

    const cls = appState.classes.find((c) => c.id === classId);
    setConfirmModalConfig({
      isOpen: true,
      title: `Xóa lớp ${cls?.name || ''}?`,
      message: `Cô có chắc muốn xóa lớp này và toàn bộ danh sách học sinh của lớp? Thao tác không thể khôi phục.`,
      confirmLabel: 'Xóa lớp',
      isDangerous: true,
      onConfirm: () => {
        setAppState((prev) => {
          const remainingClasses = prev.classes.filter((c) => c.id !== classId);
          const nextActiveId =
            prev.activeClassId === classId
              ? remainingClasses[0]?.id || 'class-8a1'
              : prev.activeClassId;
          const nextClass = remainingClasses.find((c) => c.id === nextActiveId);

          return {
            ...prev,
            classes: remainingClasses,
            activeClassId: nextActiveId,
            settings: {
              ...prev.settings,
              className: nextClass?.name || prev.settings.className,
            },
            students: prev.students.filter((s) => (s.classId || 'class-8a1') !== classId),
          };
        });
        showToast(`Đã xóa lớp thành công`);
        setConfirmModalConfig((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // ===============================
  // CÁC HÀM XỬ LÝ HỌC SINH
  // ===============================
  const handleAddStudent = (studentData: Omit<Student, 'id'>) => {
    const newStudent: Student = {
      ...studentData,
      id: `hs-${Date.now()}`,
      classId: currentClass.id,
    };
    setAppState((prev) => ({
      ...prev,
      students: [...prev.students, newStudent],
    }));
  };

  const handleUpdateStudent = (updatedStudent: Student) => {
    setAppState((prev) => ({
      ...prev,
      students: prev.students.map((s) => (s.id === updatedStudent.id ? updatedStudent : s)),
    }));
  };

  const handleDeleteStudent = (studentId: string) => {
    const target = appState.students.find((s) => s.id === studentId);
    setConfirmModalConfig({
      isOpen: true,
      title: 'Xóa học sinh khỏi danh sách?',
      message: `Cô có chắc chắn muốn xóa học sinh "${target?.name || ''}"? Toàn bộ thông tin hồ sơ của em sẽ bị xóa.`,
      confirmLabel: 'Xóa học sinh',
      isDangerous: true,
      onConfirm: () => {
        setAppState((prev) => ({
          ...prev,
          students: prev.students.filter((s) => s.id !== studentId),
          attendance: prev.attendance.filter((a) => a.studentId !== studentId),
          conduct: prev.conduct.filter((c) => c.studentId !== studentId),
        }));
        showToast(`Đã xóa học sinh ${target?.name} khỏi danh sách`);
        setConfirmModalConfig((prev) => ({ ...prev, isOpen: false }));
        if (activeStudentModalId === studentId) setActiveStudentModalId(null);
      },
    });
  };

  // Xử lý nhập học sinh từ Excel
  const handleConfirmExcelImport = (
    newStudentsData: Omit<Student, 'id'>[],
    mode: 'append' | 'replace'
  ) => {
    const newStudents: Student[] = newStudentsData.map((s, idx) => ({
      ...s,
      id: `hs-${Date.now()}-${idx}`,
      classId: currentClass.id,
    }));

    setAppState((prev) => {
      let updatedStudents: Student[];
      if (mode === 'replace') {
        // Giữ lại học sinh của các lớp khác, chỉ thay thế học sinh của lớp hiện tại
        updatedStudents = [
          ...prev.students.filter((s) => (s.classId || 'class-8a1') !== currentClass.id),
          ...newStudents,
        ];
      } else {
        // Thêm vào danh sách hiện tại
        updatedStudents = [...prev.students, ...newStudents];
      }

      return {
        ...prev,
        students: updatedStudents,
      };
    });
  };

  // ===============================
  // CHUYÊN CẦN, THI ĐUA, NHẬT KÝ, VIỆC
  // ===============================
  const handleUpdateAttendance = (newAttendance: AttendanceRecord[]) => {
    setAppState((prev) => ({
      ...prev,
      attendance: newAttendance,
    }));
  };

  const handleAddConductRecord = (recordData: Omit<ConductRecord, 'id'>) => {
    const newRecord: ConductRecord = {
      ...recordData,
      id: `cd-${Date.now()}`,
    };
    setAppState((prev) => ({
      ...prev,
      conduct: [newRecord, ...prev.conduct],
    }));
  };

  const handleDeleteConductRecord = (recordId: string) => {
    setAppState((prev) => ({
      ...prev,
      conduct: prev.conduct.filter((c) => c.id !== recordId),
    }));
    showToast('Đã xóa lượt ghi nhận thi đua');
  };

  const handleUpdateCriteria = (newCriteria: ConductCriterion[]) => {
    setAppState((prev) => ({
      ...prev,
      criteria: newCriteria,
    }));
  };

  const handleAddDiaryEntry = (entryData: Omit<DiaryEntry, 'id'>) => {
    const newEntry: DiaryEntry = {
      ...entryData,
      id: `diary-${Date.now()}`,
    };
    setAppState((prev) => ({
      ...prev,
      diary: [newEntry, ...prev.diary],
    }));
  };

  const handleUpdateDiaryEntry = (updatedEntry: DiaryEntry) => {
    setAppState((prev) => ({
      ...prev,
      diary: prev.diary.map((d) => (d.id === updatedEntry.id ? updatedEntry : d)),
    }));
  };

  const handleDeleteDiaryEntry = (id: string) => {
    setConfirmModalConfig({
      isOpen: true,
      title: 'Xóa nhật ký chủ nhiệm?',
      message: 'Cô có chắc chắn muốn xóa bản ghi nhật ký này?',
      confirmLabel: 'Xóa nhật ký',
      isDangerous: true,
      onConfirm: () => {
        setAppState((prev) => ({
          ...prev,
          diary: prev.diary.filter((d) => d.id !== id),
        }));
        showToast('Đã xóa bản ghi nhật ký');
        setConfirmModalConfig((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleAddTask = (taskData: Omit<TaskItem, 'id'>) => {
    const newTask: TaskItem = {
      ...taskData,
      id: `task-${Date.now()}`,
    };
    setAppState((prev) => ({
      ...prev,
      tasks: [newTask, ...prev.tasks],
    }));
  };

  const handleUpdateTask = (updatedTask: TaskItem) => {
    setAppState((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => (t.id === updatedTask.id ? updatedTask : t)),
    }));
  };

  const handleDeleteTask = (taskId: string) => {
    setAppState((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((t) => t.id !== taskId),
    }));
    showToast('Đã xóa công việc');
  };

  const handleAddQuickNote = (content: string) => {
    const newNote: QuickNote = {
      id: `qn-${Date.now()}`,
      content,
      createdAt: new Date().toISOString().slice(0, 10),
      pinned: false,
    };
    setAppState((prev) => ({
      ...prev,
      quickNotes: [newNote, ...prev.quickNotes],
    }));
    showToast('Đã lưu ghi chú nhanh!');
  };

  const handleDeleteQuickNote = (id: string) => {
    setAppState((prev) => ({
      ...prev,
      quickNotes: prev.quickNotes.filter((n) => n.id !== id),
    }));
    showToast('Đã xóa ghi chú');
  };

  const handleTogglePinQuickNote = (id: string) => {
    setAppState((prev) => ({
      ...prev,
      quickNotes: prev.quickNotes.map((n) => (n.id === id ? { ...n, pinned: !n.pinned } : n)),
    }));
  };

  const handleUpdateSettings = (newSettings: ClassSettings) => {
    setAppState((prev) => {
      // Cập nhật tên lớp trong danh sách classes nếu thay đổi
      const updatedClasses = prev.classes.map((c) =>
        c.id === prev.activeClassId ? { ...c, name: newSettings.className } : c
      );
      return {
        ...prev,
        settings: newSettings,
        classes: updatedClasses,
      };
    });
  };

  const handleRestoreState = (restoredState: AppState) => {
    setAppState(restoredState);
  };

  const handleConfirmResetToSample = () => {
    setConfirmModalConfig({
      isOpen: true,
      title: 'Khôi phục về dữ liệu mẫu ban đầu?',
      message:
        'Thao tác này sẽ tải lại 10 học sinh mẫu Lớp 9A5 và các thiết lập mặc định của Cô Nguyễn Thị Diểm Hương. Dữ liệu đang có sẽ được thay thế.',
      confirmLabel: 'Khôi phục mẫu',
      isDangerous: false,
      onConfirm: () => {
        const fresh = resetToSampleData();
        setAppState(fresh);
        showToast('Đã khôi phục thành công 10 học sinh mẫu!');
        setConfirmModalConfig((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleConfirmClearAll = () => {
    setConfirmModalConfig({
      isOpen: true,
      title: 'Xóa toàn bộ dữ liệu hiện tại?',
      message:
        'Bạn có chắc chắn muốn xóa TOÀN BỘ học sinh, điểm danh, thi đua và nhật ký? Thao tác này không thể hoàn tác nếu chưa sao lưu file!',
      confirmLabel: 'Xóa tất cả',
      isDangerous: true,
      onConfirm: () => {
        const emptyState: AppState = {
          settings: appState.settings,
          classes: appState.classes,
          activeClassId: appState.activeClassId,
          students: [],
          criteria: appState.criteria,
          attendance: [],
          conduct: [],
          diary: [],
          tasks: [],
          quickNotes: [],
        };
        setAppState(emptyState);
        showToast('Đã xóa toàn bộ dữ liệu của lớp');
        setConfirmModalConfig((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  // Thống kê nhanh trên Header
  const todayStr = new Date().toISOString().slice(0, 10);
  const presentToday = appState.attendance.filter((a) => {
    const isToday = a.date === todayStr && a.status === 'present';
    const isCurrentClass = activeStudents.some((s) => s.id === a.studentId);
    return isToday && isCurrentClass;
  }).length;

  const pendingTasksCount = appState.tasks.filter((t) => t.status !== 'Hoàn thành').length;
  const attentionStudentsCount = activeStudents.filter(
    (s) => s.academicStatus === 'Cần hỗ trợ'
  ).length;

  // Điều hướng xem hồ sơ học sinh an toàn (bảo vệ riêng tư học sinh)
  const handleOpenStudentProfile = (id: string) => {
    if (currentUser?.role === 'student' && currentUser.studentId !== id) {
      showToast('Hồ sơ riêng tư của bạn học. Em chỉ có thể xem chi tiết hồ sơ của chính mình!', 'info');
      return;
    }
    setActiveStudentModalId(id);
    setCurrentTab('students');
  };

  // Nếu chưa đăng nhập: Mọi người đều bắt đầu bằng màn hình đăng nhập mật khẩu
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-900 font-sans antialiased text-slate-800 flex flex-col justify-center">
        <LoginPortal
          students={activeStudents}
          teacherName={appState.settings.teacherName}
          teacherPassword={appState.settings.teacherPassword || '123456'}
          classNameTitle={currentClass.name}
          schoolName={appState.settings.schoolName}
          onLoginAsTeacher={handleLoginAsTeacher}
          onLoginAsStudent={handleLoginAsStudent}
          onShowToast={showToast}
        />
        {toasts.length > 0 && <Toast toasts={toasts} onDismiss={dismissToast} />}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Toast Notification Container */}
      <Toast toasts={toasts} onDismiss={dismissToast} />

      {/* Reusable Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModalConfig.isOpen}
        title={confirmModalConfig.title}
        message={confirmModalConfig.message}
        confirmLabel={confirmModalConfig.confirmLabel}
        isDangerous={confirmModalConfig.isDangerous}
        onConfirm={confirmModalConfig.onConfirm}
        onCancel={() => setConfirmModalConfig((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Modal Nhập Excel */}
      <ExcelImportModal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
        classNameTitle={currentClass.name}
        onConfirmImport={handleConfirmExcelImport}
        onShowToast={showToast}
      />

      {/* Modal Thay Đổi Lớp Chủ Nhiệm */}
      <ClassSwitchModal
        isOpen={isClassSwitchModalOpen}
        onClose={() => setIsClassSwitchModalOpen(false)}
        classes={appState.classes || []}
        activeClassId={currentClass.id}
        students={appState.students}
        onSelectClass={handleSelectClass}
        onAddClass={handleAddClass}
        onRenameClass={handleRenameClass}
        onDeleteClass={handleDeleteClass}
        onShowToast={showToast}
      />

      {/* Modal Cấu Hình & Đồng Bộ Supabase */}
      <SupabaseModal
        isOpen={isSupabaseModalOpen}
        appState={appState}
        onClose={() => setIsSupabaseModalOpen(false)}
        onApplyRemoteState={(remote) => setAppState(remote)}
        onShowToast={showToast}
      />

      {/* Header Bar */}
      <Header
        settings={appState.settings}
        currentUser={currentUser}
        totalStudents={activeStudents.length}
        presentToday={presentToday}
        pendingTasksCount={pendingTasksCount}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        onNavigate={(tab) => {
          if (currentUser?.role === 'student' && tab === 'settings') {
            showToast('Chỉ Giáo viên chủ nhiệm mới có quyền vào Cài đặt!', 'info');
            return;
          }
          setCurrentTab(tab as NavTab);
        }}
        onOpenClassSwitchModal={() => setIsClassSwitchModalOpen(true)}
        onOpenChangePasswordModal={() => {
          setTeacherAuthMode('change_password');
          setIsTeacherAuthModalOpen(true);
        }}
        onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
        onLogout={handleLogout}
        onOpenOwnProfile={() => {
          if (currentUser?.studentId) {
            setActiveStudentModalId(currentUser.studentId);
            setCurrentTab('students');
          }
        }}
      />

      {/* Main Layout Container */}
      <div className="flex-1 flex w-full">
        {/* Left Sidebar Menu */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={(tab) => {
            if (currentUser?.role === 'student' && tab === 'settings') {
              showToast('Chỉ Giáo viên chủ nhiệm mới có quyền vào Cài đặt!', 'info');
              return;
            }
            setCurrentTab(tab);
          }}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          pendingTasksCount={pendingTasksCount}
          attentionStudentsCount={attentionStudentsCount}
          totalStudents={activeStudents.length}
          currentUser={currentUser}
        />

        {/* Content View Area */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {currentTab === 'dashboard' && (
            <Dashboard
              students={activeStudents}
              attendance={appState.attendance}
              conduct={appState.conduct}
              tasks={appState.tasks}
              quickNotes={appState.quickNotes}
              diary={appState.diary}
              teacherName={appState.settings.teacherName}
              onNavigate={setCurrentTab}
              onAddQuickNote={handleAddQuickNote}
              onDeleteQuickNote={handleDeleteQuickNote}
              onTogglePinQuickNote={handleTogglePinQuickNote}
              onOpenStudentProfile={handleOpenStudentProfile}
            />
          )}

          {currentTab === 'students' && (
            <StudentsView
              students={activeStudents}
              attendance={appState.attendance}
              conduct={appState.conduct}
              criteria={appState.criteria}
              currentUser={currentUser}
              ratingThresholds={appState.settings.ratingThresholds}
              onAddStudent={handleAddStudent}
              onUpdateStudent={handleUpdateStudent}
              onDeleteStudent={handleDeleteStudent}
              activeStudentModalId={activeStudentModalId}
              onCloseStudentModal={() => setActiveStudentModalId(null)}
              onOpenStudentModal={(id) => {
                if (currentUser?.role === 'student' && currentUser.studentId !== id) {
                  showToast('Hồ sơ riêng tư của bạn học. Em chỉ có thể xem chi tiết hồ sơ của chính mình!', 'info');
                  return;
                }
                setActiveStudentModalId(id);
              }}
              onAddConductRecord={handleAddConductRecord}
              onDeleteConductRecord={handleDeleteConductRecord}
              onShowToast={showToast}
              onOpenExcelImport={() => setIsExcelModalOpen(true)}
              classNameTitle={currentClass.name}
              isTeacherLoggedIn={isTeacherLoggedIn}
              teacherPassword={appState.settings.teacherPassword || '123456'}
              onTeacherLoginSuccess={handleTeacherLoginSuccess}
            />
          )}

          {currentTab === 'attendance' && (
            <AttendanceView
              students={activeStudents}
              attendance={appState.attendance}
              onUpdateAttendance={handleUpdateAttendance}
              onShowToast={showToast}
              onOpenStudentProfile={handleOpenStudentProfile}
            />
          )}

          {currentTab === 'conduct' && (
            <ConductView
              students={activeStudents}
              criteria={appState.criteria}
              conduct={appState.conduct}
              onAddConductRecord={handleAddConductRecord}
              onDeleteConductRecord={handleDeleteConductRecord}
              onUpdateCriteria={handleUpdateCriteria}
              onShowToast={showToast}
              onOpenStudentProfile={handleOpenStudentProfile}
            />
          )}

          {currentTab === 'academics' && (
            <AcademicView
              students={activeStudents}
              onUpdateStudent={handleUpdateStudent}
              onOpenStudentProfile={handleOpenStudentProfile}
              onShowToast={showToast}
            />
          )}

          {currentTab === 'diary' && (
            <DiaryView
              diary={appState.diary}
              students={activeStudents}
              onAddDiaryEntry={handleAddDiaryEntry}
              onUpdateDiaryEntry={handleUpdateDiaryEntry}
              onDeleteDiaryEntry={handleDeleteDiaryEntry}
              onShowToast={showToast}
              onOpenStudentProfile={handleOpenStudentProfile}
            />
          )}

          {currentTab === 'tasks' && (
            <TasksView
              tasks={appState.tasks}
              onAddTask={handleAddTask}
              onUpdateTask={handleUpdateTask}
              onDeleteTask={handleDeleteTask}
              onShowToast={showToast}
            />
          )}

          {currentTab === 'reports' && (
            <ReportsView
              settings={appState.settings}
              students={activeStudents}
              attendance={appState.attendance}
              conduct={appState.conduct}
              tasks={appState.tasks}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsView
              settings={appState.settings}
              criteria={appState.criteria}
              fullState={appState}
              isTeacherLoggedIn={isTeacherLoggedIn}
              onUpdateSettings={handleUpdateSettings}
              onUpdateCriteria={handleUpdateCriteria}
              onRestoreState={handleRestoreState}
              onResetToSampleData={resetToSampleData}
              onRequestConfirmReset={handleConfirmResetToSample}
              onRequestConfirmClear={handleConfirmClearAll}
              onShowToast={showToast}
              onOpenClassSwitchModal={() => setIsClassSwitchModalOpen(true)}
              onOpenExcelImport={() => setIsExcelModalOpen(true)}
              onOpenTeacherLoginModal={() => {
                setTeacherAuthMode('login');
                setIsTeacherAuthModalOpen(true);
              }}
              onOpenChangePasswordModal={() => {
                setTeacherAuthMode('change_password');
                setIsTeacherAuthModalOpen(true);
              }}
              onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
              onTeacherLogout={handleLogout}
            />
          )}
        </main>
      </div>

      {/* MODAL ĐĂNG NHẬP / ĐỔI MẬT KHẨU GIÁO VIÊN CHỦ NHIỆM */}
      <TeacherAuthModal
        isOpen={isTeacherAuthModalOpen}
        mode={teacherAuthMode}
        teacherName={appState.settings.teacherName}
        currentSavedPassword={appState.settings.teacherPassword || '123456'}
        onClose={() => setIsTeacherAuthModalOpen(false)}
        onLoginSuccess={handleTeacherLoginSuccess}
        onChangePasswordSuccess={handleChangeTeacherPassword}
        onShowToast={showToast}
      />
    </div>
  );
}
