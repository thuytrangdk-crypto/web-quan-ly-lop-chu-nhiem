import React, { useState } from 'react';
import {
  Lock,
  GraduationCap,
  ShieldCheck,
  Eye,
  EyeOff,
  User,
  Sparkles,
  Calendar,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  School,
} from 'lucide-react';
import { Student } from '../types';
import { formatDateVN } from '../utils/storage';

interface LoginPortalProps {
  students: Student[];
  teacherName: string;
  teacherPassword?: string;
  classNameTitle?: string;
  schoolName?: string;
  onLoginAsTeacher: () => void;
  onLoginAsStudent: (student: Student) => void;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const LoginPortal: React.FC<LoginPortalProps> = ({
  students,
  teacherName,
  teacherPassword = '123456',
  classNameTitle = 'Lớp 8A1',
  schoolName = 'THCS Lê Quý Đôn',
  onLoginAsTeacher,
  onLoginAsStudent,
  onShowToast,
}) => {
  const [activeRole, setActiveRole] = useState<'student' | 'teacher'>('student');

  // Học sinh state
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    students[0]?.id || ''
  );
  const [studentPassword, setStudentPassword] = useState('');
  const [showStudentPassword, setShowStudentPassword] = useState(false);
  const [studentError, setStudentError] = useState<string | null>(null);

  // Giáo viên state
  const [teacherPasswordInput, setTeacherPasswordInput] = useState('');
  const [showTeacherPassword, setShowTeacherPassword] = useState(false);
  const [teacherError, setTeacherError] = useState<string | null>(null);

  // Kiểm tra mật khẩu học sinh (ngày sinh)
  const verifyStudentDob = (input: string, dobString: string): boolean => {
    if (!input.trim() || !dobString) return false;
    const parts = dobString.split('-'); // YYYY-MM-DD
    if (parts.length !== 3) return false;
    const y = parts[0];
    const m = parts[1];
    const d = parts[2];

    const cleanInput = input.replace(/\D/g, ''); // chỉ lấy chữ số
    const ddmmyyyy = `${d}${m}${y}`;
    const yyyymmdd = `${y}${m}${d}`;
    const ddmmyy = `${d}${m}${y.slice(2)}`;

    // Nếu người dùng nhập DD/MM/YYYY
    if (input.trim() === `${d}/${m}/${y}`) return true;
    if (cleanInput === ddmmyyyy || cleanInput === yyyymmdd || cleanInput === ddmmyy) return true;

    // Trường hợp ngày hoặc tháng không có số 0 ở đầu (ví dụ 5/3/2012)
    const dInt = parseInt(d, 10).toString();
    const mInt = parseInt(m, 10).toString();
    if (cleanInput === `${dInt}${mInt}${y}`) return true;

    return false;
  };

  const handleStudentLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setStudentError(null);

    const student = students.find((s) => s.id === selectedStudentId);
    if (!student) {
      setStudentError('Vui lòng chọn học sinh.');
      return;
    }

    if (!studentPassword.trim()) {
      setStudentError('Vui lòng nhập mật khẩu (ngày sinh của em).');
      return;
    }

    if (verifyStudentDob(studentPassword, student.dob)) {
      onShowToast(`Chào mừng em ${student.name} đã đăng nhập!`, 'success');
      onLoginAsStudent(student);
    } else {
      setStudentError(
        'Mật khẩu không đúng! Mật khẩu là ngày sinh của em (VD: 15/03/2012 hoặc 15032012).'
      );
    }
  };

  const handleTeacherLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setTeacherError(null);

    if (!teacherPasswordInput.trim()) {
      setTeacherError('Vui lòng nhập mật khẩu Giáo viên.');
      return;
    }

    if (teacherPasswordInput.trim() === teacherPassword) {
      onShowToast(`Chào mừng ${teacherName} đã đăng nhập hệ thống!`, 'success');
      onLoginAsTeacher();
    } else {
      setTeacherError(
        'Mật khẩu không chính xác! Mật khẩu mặc định ban đầu là: 123456 (Cô có thể đổi trong phần Cài đặt).'
      );
    }
  };

  const currentSelectedStudent = students.find((s) => s.id === selectedStudentId);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-3 sm:p-6 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-lg w-full bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-200">
        {/* Banner Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-teal-700 px-6 py-6 sm:px-8 sm:py-7 text-white text-center relative">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-xs text-white shadow-inner mb-3">
            <School className="w-8 h-8 text-teal-200" />
          </div>
          <div className="inline-block px-3 py-1 rounded-full bg-white/10 text-xs font-semibold text-teal-100 backdrop-blur-xs mb-1.5">
            {schoolName} • {classNameTitle}
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            TRỢ LÝ CHỦ NHIỆM
          </h1>
          <p className="text-xs sm:text-sm text-teal-100 font-medium mt-1">
            GVCN: <b className="text-white">{teacherName}</b>
          </p>
        </div>

        {/* Tab Role Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs sm:text-sm font-bold">
          <button
            type="button"
            onClick={() => {
              setActiveRole('student');
              setStudentError(null);
            }}
            className={`flex-1 py-3.5 px-4 flex items-center justify-center gap-2 transition-all cursor-pointer border-b-2 ${
              activeRole === 'student'
                ? 'bg-white text-blue-700 border-blue-600 shadow-2xs font-bold'
                : 'text-slate-500 hover:text-slate-800 border-transparent hover:bg-slate-100/60'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Học sinh</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveRole('teacher');
              setTeacherError(null);
            }}
            className={`flex-1 py-3.5 px-4 flex items-center justify-center gap-2 transition-all cursor-pointer border-b-2 ${
              activeRole === 'teacher'
                ? 'bg-white text-indigo-700 border-indigo-600 shadow-2xs font-bold'
                : 'text-slate-500 hover:text-slate-800 border-transparent hover:bg-slate-100/60'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Giáo viên chủ nhiệm</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8">
          {/* ======================================================== */}
          {/* TAB 1: ĐĂNG NHẬP DÀNH CHO HỌC SINH                       */}
          {/* ======================================================== */}
          {activeRole === 'student' && (
            <form onSubmit={handleStudentLogin} className="space-y-4 text-xs sm:text-sm">
              <div className="bg-blue-50/80 border border-blue-200 rounded-2xl p-3.5 text-xs text-blue-900 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Bảo mật riêng tư cá nhân:</span> Mỗi học sinh có một mật khẩu riêng (là ngày sinh của mình) để tránh học sinh này xem vi phạm của học sinh khác.
                </div>
              </div>

              {/* Chọn học sinh */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  1. Chọn tên em trong danh sách {classNameTitle} *
                </label>
                <div className="relative">
                  <select
                    value={selectedStudentId}
                    onChange={(e) => {
                      setSelectedStudentId(e.target.value);
                      setStudentError(null);
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:bg-white focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 cursor-pointer transition-all"
                  >
                    {students.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.code} - {st.name} (Tổ {st.group} - {st.role})
                      </option>
                    ))}
                  </select>
                </div>
                {currentSelectedStudent && (
                  <div className="mt-1 text-[11px] text-slate-500 flex items-center justify-between">
                    <span>Mã: <b className="text-slate-700">{currentSelectedStudent.code}</b></span>
                    <span>Tổ {currentSelectedStudent.group} • {currentSelectedStudent.gender}</span>
                  </div>
                )}
              </div>

              {/* Mật khẩu ngày sinh */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    2. Mật khẩu của em (Ngày sinh) *
                  </label>
                  <span className="text-[11px] text-slate-400">
                    Định dạng: Ngày/Tháng/Năm
                  </span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <input
                    type={showStudentPassword ? 'text' : 'password'}
                    value={studentPassword}
                    onChange={(e) => {
                      setStudentPassword(e.target.value);
                      setStudentError(null);
                    }}
                    placeholder="VD: 15/03/2012 hoặc 15032012"
                    className="w-full pl-9 pr-10 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowStudentPassword(!showStudentPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showStudentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Ví dụ em sinh ngày 15/03/2012 thì gõ <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">15/03/2012</code> hoặc <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">15032012</code>
                </p>
              </div>

              {studentError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-2 animate-in fade-in duration-150">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{studentError}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <GraduationCap className="w-5 h-5" />
                <span>Đăng nhập với tư cách Học sinh</span>
              </button>
            </form>
          )}

          {/* ======================================================== */}
          {/* TAB 2: ĐĂNG NHẬP DÀNH CHO GIÁO VIÊN CHỦ NHIỆM            */}
          {/* ======================================================== */}
          {activeRole === 'teacher' && (
            <form onSubmit={handleTeacherLogin} className="space-y-4 text-xs sm:text-sm">
              <div className="bg-indigo-50/80 border border-indigo-200 rounded-2xl p-3.5 text-xs text-indigo-900 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Quyền hạn GVCN:</span> Giáo viên có thể truy cập, xem và chỉnh sửa tất cả học sinh, ghi nhận sự việc trực tiếp và cài đặt hệ thống.
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Tài khoản Giáo viên
                </label>
                <div className="px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-800 flex items-center justify-between">
                  <span>{teacherName}</span>
                  <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-md">
                    GVCN {classNameTitle}
                  </span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Mật khẩu GVCN *
                  </label>
                  <span className="text-[11px] text-slate-400">
                    Mặc định: 123456
                  </span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type={showTeacherPassword ? 'text' : 'password'}
                    value={teacherPasswordInput}
                    onChange={(e) => {
                      setTeacherPasswordInput(e.target.value);
                      setTeacherError(null);
                    }}
                    placeholder="Nhập mật khẩu GVCN..."
                    className="w-full pl-9 pr-10 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowTeacherPassword(!showTeacherPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showTeacherPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {teacherError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start gap-2 animate-in fade-in duration-150">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{teacherError}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <ShieldCheck className="w-5 h-5" />
                <span>Đăng nhập với quyền GVCN</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
