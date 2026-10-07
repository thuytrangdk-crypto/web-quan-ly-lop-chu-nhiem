import React from 'react';
import {
  LayoutDashboard,
  Users,
  CalendarCheck2,
  Award,
  BookOpen,
  BookMarked,
  CheckSquare,
  BarChart3,
  Settings,
  X,
  Sparkles,
  GraduationCap,
} from 'lucide-react';

import { UserSession } from '../types';

export type NavTab =
  | 'dashboard'
  | 'students'
  | 'attendance'
  | 'conduct'
  | 'academics'
  | 'diary'
  | 'tasks'
  | 'reports'
  | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isOpen: boolean;
  onClose: () => void;
  pendingTasksCount: number;
  attentionStudentsCount: number;
  totalStudents: number;
  currentUser?: UserSession | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpen,
  onClose,
  pendingTasksCount,
  attentionStudentsCount,
  totalStudents,
  currentUser,
}) => {
  const isTeacher = currentUser?.role === 'teacher';

  const allNavItems = [
    {
      id: 'dashboard' as NavTab,
      label: 'Tổng quan',
      icon: LayoutDashboard,
      badge: null,
      desc: 'Bức tranh chung',
    },
    {
      id: 'students' as NavTab,
      label: 'Học sinh',
      icon: Users,
      badge: `${totalStudents}`,
      desc: 'Hồ sơ & danh sách',
    },
    {
      id: 'attendance' as NavTab,
      label: 'Chuyên cần',
      icon: CalendarCheck2,
      badge: null,
      desc: 'Điểm danh hằng ngày',
    },
    {
      id: 'conduct' as NavTab,
      label: 'Thi đua – Nề nếp',
      icon: Award,
      badge: null,
      desc: 'Tuyên dương & nhắc nhở',
    },
    {
      id: 'academics' as NavTab,
      label: 'Học tập',
      icon: BookOpen,
      badge: attentionStudentsCount > 0 ? `${attentionStudentsCount} cần chú ý` : null,
      badgeColor: 'amber',
      desc: 'Theo dõi năng lực',
    },
    {
      id: 'diary' as NavTab,
      label: 'Nhật ký chủ nhiệm',
      icon: BookMarked,
      badge: null,
      desc: 'Sổ tay công tác',
    },
    {
      id: 'tasks' as NavTab,
      label: 'Công việc',
      icon: CheckSquare,
      badge: pendingTasksCount > 0 ? `${pendingTasksCount}` : null,
      badgeColor: 'rose',
      desc: 'Việc cần làm',
    },
    {
      id: 'reports' as NavTab,
      label: 'Báo cáo',
      icon: BarChart3,
      badge: null,
      desc: 'Thống kê & in ấn',
    },
    {
      id: 'settings' as NavTab,
      label: 'Cài đặt',
      icon: Settings,
      badge: null,
      desc: 'Dữ liệu & tiêu chí',
    },
  ];

  const navItems = isTeacher
    ? allNavItems
    : allNavItems.filter((item) => item.id !== 'settings');

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:shadow-none'
        }`}
      >
        {/* Mobile Header in Sidebar */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 lg:hidden">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-teal-500 text-white font-bold flex items-center justify-center text-sm shadow-sm">
              <GraduationCap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-800 text-sm">Trợ Lý Chủ Nhiệm</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Menu Chủ Nhiệm
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  if (window.innerWidth < 1024) onClose();
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-teal-600 text-white shadow-sm shadow-blue-500/25'
                    : 'text-slate-700 hover:bg-slate-100/80 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center space-x-3 text-left min-w-0">
                  <div
                    className={`p-1.5 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'text-slate-500 group-hover:text-blue-600 group-hover:bg-blue-50'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                  </div>
                  <div className="truncate">
                    <div className="font-semibold leading-tight">{item.label}</div>
                    <div
                      className={`text-[11px] truncate ${
                        isActive ? 'text-blue-100' : 'text-slate-400'
                      }`}
                    >
                      {item.desc}
                    </div>
                  </div>
                </div>

                {item.badge && (
                  <span
                    className={`ml-2 px-2 py-0.5 text-[11px] font-bold rounded-full shrink-0 ${
                      isActive
                        ? 'bg-white text-blue-700'
                        : item.badgeColor === 'rose'
                        ? 'bg-rose-100 text-rose-700'
                        : item.badgeColor === 'amber'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Sidebar Footer: Motivational card */}
        <div className="p-4 border-t border-slate-100 bg-gradient-to-br from-blue-50/60 to-teal-50/50">
          <div className="flex items-start space-x-2.5">
            <div className="p-2 bg-teal-100 text-teal-700 rounded-xl shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="text-xs">
              <p className="font-bold text-slate-800">Đồng hành cùng học sinh</p>
              <p className="text-slate-500 mt-0.5 leading-snug">
                Mỗi ngày một niềm vui cùng tập thể lớp thân yêu!
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
