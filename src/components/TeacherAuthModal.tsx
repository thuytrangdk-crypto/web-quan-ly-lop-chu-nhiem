import React, { useState } from 'react';
import { ShieldCheck, KeyRound, Lock, Eye, EyeOff, X, CheckCircle2, AlertCircle } from 'lucide-react';

interface TeacherAuthModalProps {
  isOpen: boolean;
  mode: 'login' | 'change_password';
  teacherName: string;
  currentSavedPassword?: string;
  onClose: () => void;
  onLoginSuccess: () => void;
  onChangePasswordSuccess: (newPassword: string) => void;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const TeacherAuthModal: React.FC<TeacherAuthModalProps> = ({
  isOpen,
  mode,
  teacherName,
  currentSavedPassword = '123456',
  onClose,
  onLoginSuccess,
  onChangePasswordSuccess,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'login' | 'change_password'>(mode);
  const [loginPassword, setLoginPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  React.useEffect(() => {
    setActiveTab(mode);
    setLoginPassword('');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setErrorMsg(null);
  }, [isOpen, mode]);

  if (!isOpen) return null;

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginPassword.trim()) {
      setErrorMsg('Vui lòng nhập mật khẩu giáo viên');
      return;
    }

    if (loginPassword.trim() === currentSavedPassword) {
      setErrorMsg(null);
      onShowToast(`Đăng nhập thành công! Quyền GVCN: ${teacherName}.`);
      onLoginSuccess();
      onClose();
    } else {
      setErrorMsg('Mật khẩu không chính xác! Vui lòng thử lại (mật khẩu mặc định ban đầu là: 123456)');
    }
  };

  const handleChangePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword.trim()) {
      setErrorMsg('Vui lòng nhập mật khẩu hiện tại');
      return;
    }
    if (currentPassword.trim() !== currentSavedPassword) {
      setErrorMsg('Mật khẩu hiện tại không đúng!');
      return;
    }
    if (!newPassword.trim()) {
      setErrorMsg('Vui lòng nhập mật khẩu mới');
      return;
    }
    if (newPassword.length < 4) {
      setErrorMsg('Mật khẩu mới phải có ít nhất 4 ký tự');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Mật khẩu xác nhận không khớp');
      return;
    }

    onChangePasswordSuccess(newPassword.trim());
    onShowToast('Đã đổi mật khẩu giáo viên chủ nhiệm thành công!');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                Tài Khoản Giáo Viên Chủ Nhiệm
              </h3>
              <p className="text-xs text-slate-500">
                {teacherName} • Truy cập quản lý không giới hạn
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="mt-4 flex rounded-xl bg-slate-100 p-1 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setActiveTab('login');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
              activeTab === 'login'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Đăng nhập GVCN
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('change_password');
              setErrorMsg(null);
            }}
            className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
              activeTab === 'change_password'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Đổi mật khẩu GVCN
          </button>
        </div>

        {/* TAB 1: ĐĂNG NHẬP */}
        {activeTab === 'login' && (
          <form onSubmit={handleLoginSubmit} className="mt-4 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Mật khẩu Giáo viên chủ nhiệm
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={loginPassword}
                  onChange={(e) => {
                    setLoginPassword(e.target.value);
                    setErrorMsg(null);
                  }}
                  placeholder="Nhập mật khẩu GVCN (mặc định: 123456)"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:border-blue-500 focus:bg-white pr-10 font-mono"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Khi đăng nhập, cô có thể mở hồ sơ bất kỳ học sinh nào mà không cần ngày sinh.
              </p>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer"
              >
                Đăng nhập ngay
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: ĐỔI MẬT KHẨU */}
        {activeTab === 'change_password' && (
          <form onSubmit={handleChangePasswordSubmit} className="mt-4 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mật khẩu hiện tại
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => {
                  setCurrentPassword(e.target.value);
                  setErrorMsg(null);
                }}
                placeholder="Nhập mật khẩu đang dùng"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-blue-500 focus:bg-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mật khẩu mới
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setErrorMsg(null);
                }}
                placeholder="Tối thiểu 4 ký tự"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-blue-500 focus:bg-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Xác nhận mật khẩu mới
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setErrorMsg(null);
                }}
                placeholder="Nhập lại mật khẩu mới"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-blue-500 focus:bg-white font-mono"
              />
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => {
                  onChangePasswordSuccess('123456');
                  onShowToast('Đã đặt lại mật khẩu về mặc định: 123456');
                  onClose();
                }}
                className="text-[11px] text-slate-500 hover:text-blue-600 underline cursor-pointer"
              >
                Đặt lại về 123456
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
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  Lưu mật khẩu
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
