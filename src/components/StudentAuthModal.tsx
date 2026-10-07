import React, { useState, useEffect } from 'react';
import { Lock, KeyRound, ShieldCheck, User, X, AlertCircle, Eye, EyeOff, Sparkles } from 'lucide-react';
import { Student } from '../types';

interface StudentAuthModalProps {
  isOpen: boolean;
  student: Student | null;
  teacherPassword?: string;
  onSuccess: () => void;
  onTeacherLoginSuccess: () => void;
  onClose: () => void;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const StudentAuthModal: React.FC<StudentAuthModalProps> = ({
  isOpen,
  student,
  teacherPassword = '123456',
  onSuccess,
  onTeacherLoginSuccess,
  onClose,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'student' | 'teacher'>('student');
  const [passwordInput, setPasswordInput] = useState('');
  const [teacherPassInput, setTeacherPassInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPasswordInput('');
      setTeacherPassInput('');
      setErrorMsg(null);
      setShowPassword(false);
      setActiveTab('student');
    }
  }, [isOpen, student]);

  if (!isOpen || !student) return null;

  // Kiểm tra mật khẩu (ngày sinh)
  const verifyStudentPassword = (input: string, dobString: string): boolean => {
    if (!input.trim() || !dobString) return false;

    // dob format: YYYY-MM-DD (e.g. 2012-03-15)
    const dobParts = dobString.split('-');
    if (dobParts.length !== 3) return false;

    const y = dobParts[0];
    const m = dobParts[1];
    const d = dobParts[2];

    const cleanInput = input.replace(/\D/g, ''); // chỉ lấy chữ số

    // Chấp nhận các kiểu nhập:
    // 1. DDMMYYYY (ví dụ: 15032012)
    const ddmmyyyy = `${d}${m}${y}`;
    // 2. YYYYMMDD (ví dụ: 20120315)
    const yyyymmdd = `${y}${m}${d}`;
    // 3. DDMM (ví dụ: 1503)
    const ddmm = `${d}${m}`;
    // 4. Input với ngày/tháng không có số 0 (ví dụ: 532012 thay vì 05032012)
    const shortD = parseInt(d, 10).toString();
    const shortM = parseInt(m, 10).toString();
    const shortFormat = `${shortD}${shortM}${y}`;

    return (
      cleanInput === ddmmyyyy ||
      cleanInput === yyyymmdd ||
      cleanInput === ddmm ||
      cleanInput === shortFormat ||
      input.trim() === `${d}/${m}/${y}` ||
      input.trim() === `${d}-${m}-${y}` ||
      input.trim() === dobString
    );
  };

  const handleStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordInput.trim()) {
      setErrorMsg('Vui lòng nhập ngày sinh của bạn');
      return;
    }

    if (verifyStudentPassword(passwordInput, student.dob)) {
      setErrorMsg(null);
      onShowToast(`Xác thực thành công! Đang mở hồ sơ em ${student.name}.`);
      onSuccess();
    } else {
      setErrorMsg('Mật khẩu không chính xác! Vui lòng nhập đúng ngày sinh của bạn (Ví dụ: 15/03/2012 hoặc 15032012).');
    }
  };

  const handleTeacherSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherPassInput.trim()) {
      setErrorMsg('Vui lòng nhập mật khẩu giáo viên');
      return;
    }

    if (teacherPassInput.trim() === teacherPassword) {
      setErrorMsg(null);
      onShowToast(`Đăng nhập GVCN thành công! Cô có thể truy cập bất kỳ học sinh nào.`);
      onTeacherLoginSuccess();
      onSuccess();
    } else {
      setErrorMsg('Mật khẩu giáo viên không chính xác (mặc định: 123456).');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 transform transition-all">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                Bảo Mật Hồ Sơ Học Sinh
              </h3>
              <p className="text-xs text-slate-500">
                Chế độ riêng tư: Học sinh xem bằng ngày sinh, GVCN có mật khẩu riêng
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Thông tin học sinh đang bấm */}
        <div className="mt-4 p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-teal-500 text-white font-bold flex items-center justify-center text-sm">
            {student.name.charAt(student.name.lastIndexOf(' ') + 1)}
          </div>
          <div>
            <div className="font-bold text-slate-800 text-sm">{student.name}</div>
            <div className="text-xs text-slate-500">
              Mã HS: <span className="font-semibold text-blue-600">{student.code}</span> • Tổ {student.group}
            </div>
          </div>
        </div>

        {/* Tab switch giữa Học sinh và Giáo viên */}
        <div className="mt-4 flex rounded-xl bg-slate-100 p-1 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setActiveTab('student');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'student'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Học sinh (Ngày sinh)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('teacher');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'teacher'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Giáo viên chủ nhiệm</span>
          </button>
        </div>

        {/* FORM HỌC SINH */}
        {activeTab === 'student' && (
          <form onSubmit={handleStudentSubmit} className="mt-4 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-blue-600" />
                  Mật khẩu của em (Ngày sinh)
                </span>
                <span className="text-[11px] text-slate-400">Định dạng: NgàyThángNăm</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    setErrorMsg(null);
                  }}
                  placeholder="VD: 15/03/2012 hoặc 15032012"
                  autoFocus
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:border-blue-500 focus:bg-white transition-all pr-10 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">
                Bảo vệ thông tin riêng tư, tránh tình trạng học sinh này xem vi phạm của học sinh khác.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center space-x-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('teacher');
                  setErrorMsg(null);
                }}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer underline"
              >
                Cô là GVCN? Bấm vào đây
              </button>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Mở hồ sơ
                </button>
              </div>
            </div>
          </form>
        )}

        {/* FORM GIÁO VIÊN */}
        {activeTab === 'teacher' && (
          <form onSubmit={handleTeacherSubmit} className="mt-4 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                  Mật khẩu Giáo viên chủ nhiệm
                </span>
                <span className="text-[11px] text-slate-400">Mặc định: 123456</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={teacherPassInput}
                  onChange={(e) => {
                    setTeacherPassInput(e.target.value);
                    setErrorMsg(null);
                  }}
                  placeholder="Nhập mật khẩu GVCN"
                  autoFocus
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:border-blue-500 focus:bg-white transition-all pr-10 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">
                Đăng nhập GVCN sẽ mở khóa toàn quyền: Cô có thể xem và ghi nhận sự việc cho bất kỳ học sinh nào.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center space-x-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
              >
                Đăng nhập & Mở hồ sơ
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
