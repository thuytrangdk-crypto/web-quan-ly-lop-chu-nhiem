import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Menu, Bell, UserCheck, ShieldCheck, ChevronDown, Home, Settings, LogOut, User, GraduationCap, School, Database } from 'lucide-react';
import { ClassSettings, UserSession } from '../types';
import { getFullVietnameseDate } from '../utils/storage';

interface HeaderProps {
  settings: ClassSettings;
  currentUser: UserSession | null;
  totalStudents: number;
  presentToday: number;
  pendingTasksCount: number;
  onToggleSidebar: () => void;
  onNavigate: (tab: string) => void;
  onOpenClassSwitchModal: () => void;
  onOpenChangePasswordModal: () => void;
  onLogout: () => void;
  onOpenOwnProfile?: () => void;
  onOpenSupabaseModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  settings,
  currentUser,
  totalStudents,
  presentToday,
  pendingTasksCount,
  onToggleSidebar,
  onNavigate,
  onOpenClassSwitchModal,
  onOpenChangePasswordModal,
  onLogout,
  onOpenOwnProfile,
  onOpenSupabaseModal,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [isTeacherMenuOpen, setIsTeacherMenuOpen] = useState(false);

  const isTeacher = currentUser?.role === 'teacher';
  const isStudent = currentUser?.role === 'student';

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 px-4 sm:px-6 py-3.5 shadow-xs transition-all">
      <div className="flex items-center justify-between gap-3">
        {/* Left: Mobile hamburger & App Branding */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          <button
            onClick={onToggleSidebar}
            aria-label="Mở menu"
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-3">
            {/* Logo bấm về Trang chủ */}
            <button
              type="button"
              onClick={() => onNavigate('dashboard')}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr from-blue-600 via-teal-500 to-emerald-400 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0 hover:scale-105 active:scale-95 transition-transform cursor-pointer"
              title="Bấm để quay về Trang chủ (Tổng quan)"
            >
              <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </button>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                {/* Tiêu đề bấm về Trang chủ */}
                <button
                  type="button"
                  onClick={() => onNavigate('dashboard')}
                  className="text-base sm:text-lg font-bold text-slate-800 hover:text-blue-600 tracking-tight leading-tight transition-colors text-left cursor-pointer"
                  title="Bấm để quay về Trang chủ (Tổng quan)"
                >
                  TRỢ LÝ CHỦ NHIỆM
                </button>

                {isTeacher && (
                  <button
                    type="button"
                    onClick={onOpenClassSwitchModal}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-md transition-all cursor-pointer shadow-2xs group"
                    title="Bấm để thay đổi hoặc chuyển lớp chủ nhiệm"
                  >
                    <span>{settings.className}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-blue-500 group-hover:translate-y-0.5 transition-transform" />
                  </button>
                )}
                {!isTeacher && (
                  <span className="inline-flex items-center px-2 py-0.5 text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200 rounded-md">
                    {settings.className}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <p className="text-xs sm:text-sm font-medium text-teal-700 flex items-center gap-1.5 whitespace-nowrap">
                  <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse shrink-0"></span>
                  GVCN: <span className="font-bold text-slate-800">{settings.teacherName}</span>
                </p>

                {/* Nút Về Trang Chủ trực tiếp */}
                <button
                  type="button"
                  onClick={() => onNavigate('dashboard')}
                  className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-300 transition-colors cursor-pointer"
                  title="Bấm để trở lại Trang chủ bất cứ lúc nào"
                >
                  <Home className="w-3 h-3 text-blue-600" />
                  <span>Trang chủ</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Center/Right: Live Date & Time + Quick indicators */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Calendar & Clock Widget */}
          <div className="hidden md:flex items-center bg-slate-50 border border-slate-200/80 rounded-xl px-3.5 py-1.5 text-xs text-slate-700 space-x-3">
            <div className="flex items-center space-x-1.5 text-slate-600 font-medium">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>{getFullVietnameseDate()}</span>
            </div>
            <div className="w-px h-3.5 bg-slate-300"></div>
            <div className="flex items-center space-x-1.5 font-semibold text-slate-800">
              <Clock className="w-3.5 h-3.5 text-teal-600" />
              <span>{currentTime}</span>
            </div>
          </div>

          {/* Quick Stats Badges */}
          <div className="hidden sm:flex items-center space-x-2">
            <button
              onClick={() => onNavigate('attendance')}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-semibold hover:bg-emerald-100 transition-colors cursor-pointer"
              title="Có mặt hôm nay"
            >
              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Sĩ số: {presentToday}/{totalStudents}</span>
            </button>

            {pendingTasksCount > 0 && (
              <button
                onClick={() => onNavigate('tasks')}
                className="flex items-center space-x-1 px-2.5 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-xs font-semibold hover:bg-amber-100 transition-colors cursor-pointer"
                title="Công việc cần làm"
              >
                <Bell className="w-3.5 h-3.5 text-amber-600" />
                <span>{pendingTasksCount} việc</span>
              </button>
            )}
          </div>

          {/* NÚT CÀI ĐẶT TRÊN THANH CÔNG CỤ (DÀNH CHO GVCN) */}
          {isTeacher && (
            <button
              type="button"
              onClick={() => onNavigate('settings')}
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors cursor-pointer shadow-2xs"
              title="Mở Cài đặt sự việc, điểm cộng trừ và xếp loại"
            >
              <Settings className="w-3.5 h-3.5 text-indigo-600" />
              <span>Cài đặt</span>
            </button>
          )}

          {/* NÚT SUPABASE CLOUD (DÀNH CHO GVCN) */}
          {isTeacher && onOpenSupabaseModal && (
            <button
              type="button"
              onClick={onOpenSupabaseModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 transition-colors cursor-pointer shadow-2xs"
              title="Quản lý và đồng bộ dữ liệu đám mây Supabase"
            >
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Supabase</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </button>
          )}

          {/* HỌC SINH: NÚT HỒ SƠ CỦA TÔI */}
          {isStudent && onOpenOwnProfile && (
            <button
              type="button"
              onClick={onOpenOwnProfile}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer shadow-xs"
              title="Mở hồ sơ cá nhân của em"
            >
              <User className="w-3.5 h-3.5" />
              <span>Hồ sơ của tôi</span>
            </button>
          )}

          {/* User Account / Status Badge */}
          <div className="relative">
            {isTeacher ? (
              <div>
                <button
                  type="button"
                  onClick={() => setIsTeacherMenuOpen(!isTeacherMenuOpen)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 transition-colors cursor-pointer shadow-2xs"
                  title="Tài khoản GVCN - Bấm để xem tùy chọn"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="hidden sm:inline">GVCN</span>
                  <ChevronDown className="w-3 h-3 text-emerald-600" />
                </button>

                {isTeacherMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsTeacherMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-50 text-xs">
                      <div className="px-3.5 py-2.5 border-b border-slate-100 bg-slate-50/70 rounded-t-2xl">
                        <div className="font-bold text-slate-800">{settings.teacherName}</div>
                        <div className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1 mt-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Toàn quyền quản lý & chỉnh sửa
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setIsTeacherMenuOpen(false);
                          onNavigate('settings');
                        }}
                        className="w-full text-left px-3.5 py-2 hover:bg-slate-50 text-slate-700 font-medium flex items-center gap-2 cursor-pointer"
                      >
                        <Settings className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Cài đặt sự việc & xếp loại</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsTeacherMenuOpen(false);
                          onOpenChangePasswordModal();
                        }}
                        className="w-full text-left px-3.5 py-2 hover:bg-slate-50 text-slate-700 font-medium flex items-center gap-2 cursor-pointer"
                      >
                        <span>🔑</span>
                        <span>Đổi mật khẩu GVCN</span>
                      </button>

                      <div className="my-1 border-t border-slate-100" />

                      <button
                        type="button"
                        onClick={() => {
                          setIsTeacherMenuOpen(false);
                          onLogout();
                        }}
                        className="w-full text-left px-3.5 py-2 hover:bg-rose-50 text-rose-600 font-bold flex items-center gap-2 cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5 text-rose-500" />
                        <span>Đăng xuất hệ thống</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : isStudent ? (
              <div className="flex items-center gap-1.5">
                <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200 hidden sm:inline-block">
                  HS: {currentUser?.studentName}
                </span>
                <button
                  type="button"
                  onClick={onLogout}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors cursor-pointer"
                  title="Đăng xuất khỏi tài khoản học sinh"
                >
                  <LogOut className="w-3 h-3 text-rose-500" />
                  <span className="hidden sm:inline">Đăng xuất</span>
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
};
