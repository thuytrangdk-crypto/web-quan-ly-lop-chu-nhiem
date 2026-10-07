import React, { useState } from 'react';
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  AlertCircle,
  CheckSquare,
  Award,
  AlertTriangle,
  Plus,
  Trash2,
  Pin,
  CalendarCheck2,
  BookMarked,
  ArrowRight,
  Send,
  MessageSquare,
} from 'lucide-react';
import {
  Student,
  AttendanceRecord,
  ConductRecord,
  TaskItem,
  QuickNote,
  DiaryEntry,
} from '../types';
import { getTodayDateString, formatDateVN } from '../utils/storage';
import { NavTab } from './Sidebar';

interface DashboardProps {
  students: Student[];
  attendance: AttendanceRecord[];
  conduct: ConductRecord[];
  tasks: TaskItem[];
  quickNotes: QuickNote[];
  diary: DiaryEntry[];
  onNavigate: (tab: NavTab) => void;
  onAddQuickNote: (content: string) => void;
  onDeleteQuickNote: (id: string) => void;
  onTogglePinQuickNote: (id: string) => void;
  onOpenStudentProfile: (studentId: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  students,
  attendance,
  conduct,
  tasks,
  quickNotes,
  onNavigate,
  onAddQuickNote,
  onDeleteQuickNote,
  onTogglePinQuickNote,
  onOpenStudentProfile,
}) => {
  const [newNoteText, setNewNoteText] = useState('');
  const todayStr = getTodayDateString();

  // Thống kê hôm nay
  const todayAttendance = attendance.filter((a) => a.date === todayStr);

  const presentCount = todayAttendance.filter((a) => a.status === 'present').length;
  const absentCount = todayAttendance.filter(
    (a) => a.status === 'absent_excused' || a.status === 'absent_unexcused'
  ).length;
  const lateCount = todayAttendance.filter((a) => a.status === 'late').length;

  const absentStudents = todayAttendance
    .filter((a) => a.status === 'absent_excused' || a.status === 'absent_unexcused')
    .map((a) => ({
      ...a,
      student: students.find((s) => s.id === a.studentId),
    }));

  const lateStudents = todayAttendance
    .filter((a) => a.status === 'late')
    .map((a) => ({
      ...a,
      student: students.find((s) => s.id === a.studentId),
    }));

  // Học sinh cần chú ý
  const attentionStudents = students.filter(
    (s) => s.academicStatus === 'Cần hỗ trợ' || s.note.toLowerCase().includes('nhắc nhở')
  );

  // Tuyên dương & nhắc nhở hôm nay
  const todayPraiseRecords = conduct
    .filter((c) => c.date === todayStr && c.type === 'praise')
    .map((c) => ({
      ...c,
      student: students.find((s) => s.id === c.studentId),
    }));

  const todayReminderRecords = conduct
    .filter((c) => c.date === todayStr && c.type === 'reminder')
    .map((c) => ({
      ...c,
      student: students.find((s) => s.id === c.studentId),
    }));

  // Công việc chưa hoàn thành
  const pendingTasks = tasks.filter((t) => t.status !== 'Hoàn thành');
  const urgentTasks = pendingTasks.filter((t) => t.priority === 'Gấp' || t.priority === 'Quan trọng');

  const handleCreateNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;
    onAddQuickNote(newNoteText.trim());
    setNewNoteText('');
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-700 via-teal-600 to-emerald-500 p-6 sm:p-8 text-white shadow-lg shadow-blue-500/10">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-md mb-3 border border-white/30">
            👋 Chào Cô Thùy Trang
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Chúc cô một ngày giảng dạy tràn đầy năng lượng!
          </h2>
          <p className="mt-2 text-blue-100 text-sm sm:text-base leading-relaxed">
            Dưới đây là tổng quan tình hình lớp học hôm nay. Cô có thể bấm vào từng học sinh để xem hồ sơ hoặc chuyển nhanh các mục quản lý.
          </p>

          <div className="mt-5 flex flex-wrap gap-2.5">
            <button
              onClick={() => onNavigate('attendance')}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-blue-700 hover:bg-blue-50 font-semibold text-xs sm:text-sm rounded-xl transition-all shadow-sm cursor-pointer"
            >
              <CalendarCheck2 className="w-4 h-4" />
              Điểm danh ngay
            </button>
            <button
              onClick={() => onNavigate('conduct')}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white/20 hover:bg-white/30 text-white font-semibold text-xs sm:text-sm rounded-xl transition-all backdrop-blur-xs cursor-pointer"
            >
              <Award className="w-4 h-4" />
              Ghi điểm thi đua
            </button>
            <button
              onClick={() => onNavigate('diary')}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white/20 hover:bg-white/30 text-white font-semibold text-xs sm:text-sm rounded-xl transition-all backdrop-blur-xs cursor-pointer"
            >
              <BookMarked className="w-4 h-4" />
              Viết nhật ký
            </button>
          </div>
        </div>

        {/* Decorative background shapes */}
        <div className="absolute right-0 -bottom-10 w-80 h-80 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute right-32 top-0 w-48 h-48 bg-teal-300/20 rounded-full blur-xl pointer-events-none" />
      </div>

      {/* 6 Thẻ Thống Kê Lớn */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Tổng số học sinh */}
        <div
          onClick={() => onNavigate('students')}
          className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold text-slate-500">Tổng học sinh</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-800">
              {students.length}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Đầy đủ 4 tổ</p>
          </div>
        </div>

        {/* Có mặt hôm nay */}
        <div
          onClick={() => onNavigate('attendance')}
          className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold text-slate-500">Có mặt hôm nay</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600">
              {presentCount}
            </div>
            <p className="text-[11px] text-emerald-600/80 mt-1 font-medium">
              {students.length > 0 ? Math.round((presentCount / students.length) * 100) : 0}% sĩ số
            </p>
          </div>
        </div>

        {/* Vắng */}
        <div
          onClick={() => onNavigate('attendance')}
          className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-rose-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold text-slate-500">Vắng hôm nay</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl group-hover:bg-rose-600 group-hover:text-white transition-colors">
              <UserX className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-rose-600">
              {absentCount}
            </div>
            <p className="text-[11px] text-rose-500 mt-1">
              {absentCount > 0 ? 'Cần kiểm tra lý do' : 'Sĩ số đầy đủ'}
            </p>
          </div>
        </div>

        {/* Đi muộn */}
        <div
          onClick={() => onNavigate('attendance')}
          className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-amber-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold text-slate-500">Đi muộn</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-600">
              {lateCount}
            </div>
            <p className="text-[11px] text-amber-600/80 mt-1">
              {lateCount > 0 ? 'Cần nhắc nhở' : 'Đúng giờ'}
            </p>
          </div>
        </div>

        {/* Số học sinh cần chú ý */}
        <div
          onClick={() => onNavigate('academics')}
          className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-orange-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold text-slate-500">Cần chú ý</span>
            <div className="p-2 bg-orange-50 text-orange-600 rounded-xl group-hover:bg-orange-600 group-hover:text-white transition-colors">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-orange-600">
              {attentionStudents.length}
            </div>
            <p className="text-[11px] text-orange-600/80 mt-1">Đồng hành & hỗ trợ</p>
          </div>
        </div>

        {/* Công việc chưa hoàn thành */}
        <div
          onClick={() => onNavigate('tasks')}
          className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold text-slate-500">Việc chưa xong</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <CheckSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-extrabold text-indigo-600">
              {pendingTasks.length}
            </div>
            <p className="text-[11px] text-indigo-500 mt-1">
              {urgentTasks.length > 0 ? `${urgentTasks.length} việc gấp` : 'Tiến độ tốt'}
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: Tình Hình Lớp Hôm Nay & Ghi Chú Nhanh */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tình hình lớp hôm nay (2 cột) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-teal-500"></span>
                <h3 className="text-base sm:text-lg font-bold text-slate-800">
                  TÌNH HÌNH LỚP HÔM NAY ({formatDateVN(todayStr)})
                </h3>
              </div>
              <button
                onClick={() => onNavigate('attendance')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
              >
                Chi tiết chuyên cần <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
              {/* Vắng & Đi muộn */}
              <div className="p-4 rounded-xl bg-rose-50/50 border border-rose-100">
                <div className="flex items-center justify-between text-rose-800 font-bold text-sm mb-2.5">
                  <span className="flex items-center gap-1.5">
                    <UserX className="w-4 h-4 text-rose-600" />
                    Học sinh vắng ({absentStudents.length})
                  </span>
                </div>
                {absentStudents.length === 0 ? (
                  <p className="text-xs text-rose-600/80 italic">Hôm nay không có học sinh vắng</p>
                ) : (
                  <div className="space-y-2">
                    {absentStudents.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => item.student && onOpenStudentProfile(item.student.id)}
                        className="bg-white p-2.5 rounded-lg border border-rose-200/60 shadow-2xs flex items-center justify-between text-xs cursor-pointer hover:border-rose-400"
                      >
                        <div>
                          <span className="font-bold text-slate-800">
                            {item.student?.name}
                          </span>
                          <span className="text-[11px] text-slate-500 ml-1.5">
                            (Tổ {item.student?.group})
                          </span>
                          {item.note && (
                            <p className="text-[11px] text-rose-600 mt-0.5">{item.note}</p>
                          )}
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            item.status === 'absent_excused'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {item.status === 'absent_excused' ? 'Có phép' : 'Không phép'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Đi muộn */}
              <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-100">
                <div className="flex items-center justify-between text-amber-800 font-bold text-sm mb-2.5">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-600" />
                    Học sinh đi muộn ({lateStudents.length})
                  </span>
                </div>
                {lateStudents.length === 0 ? (
                  <p className="text-xs text-amber-700/80 italic">Không có học sinh nào đi muộn</p>
                ) : (
                  <div className="space-y-2">
                    {lateStudents.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => item.student && onOpenStudentProfile(item.student.id)}
                        className="bg-white p-2.5 rounded-lg border border-amber-200/60 shadow-2xs flex items-center justify-between text-xs cursor-pointer hover:border-amber-400"
                      >
                        <div>
                          <span className="font-bold text-slate-800">
                            {item.student?.name}
                          </span>
                          <span className="text-[11px] text-slate-500 ml-1.5">
                            (Tổ {item.student?.group})
                          </span>
                          {item.note && (
                            <p className="text-[11px] text-amber-700 mt-0.5">{item.note}</p>
                          )}
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                          Đi muộn
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Tuyên dương */}
              <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100">
                <div className="flex items-center justify-between text-emerald-800 font-bold text-sm mb-2.5">
                  <span className="flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-emerald-600" />
                    Được tuyên dương hôm nay ({todayPraiseRecords.length})
                  </span>
                  <button
                    onClick={() => onNavigate('conduct')}
                    className="text-[11px] text-emerald-700 hover:underline cursor-pointer"
                  >
                    + Thêm
                  </button>
                </div>
                {todayPraiseRecords.length === 0 ? (
                  <p className="text-xs text-emerald-700/80 italic">Chưa có tuyên dương mới hôm nay</p>
                ) : (
                  <div className="space-y-2">
                    {todayPraiseRecords.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => item.student && onOpenStudentProfile(item.student.id)}
                        className="bg-white p-2.5 rounded-lg border border-emerald-200/60 shadow-2xs flex items-center justify-between text-xs cursor-pointer hover:border-emerald-400"
                      >
                        <div className="min-w-0 pr-2">
                          <span className="font-bold text-slate-800">
                            {item.student?.name}
                          </span>
                          <p className="text-[11px] text-emerald-700 truncate mt-0.5">
                            {item.criterionName}
                          </p>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[11px] font-extrabold bg-emerald-100 text-emerald-800 shrink-0">
                          +{item.points}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Nhắc nhở */}
              <div className="p-4 rounded-xl bg-rose-50/40 border border-rose-100">
                <div className="flex items-center justify-between text-rose-800 font-bold text-sm mb-2.5">
                  <span className="flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-500" />
                    Cần nhắc nhở / vi phạm ({todayReminderRecords.length})
                  </span>
                  <button
                    onClick={() => onNavigate('conduct')}
                    className="text-[11px] text-rose-700 hover:underline cursor-pointer"
                  >
                    + Thêm
                  </button>
                </div>
                {todayReminderRecords.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">Không có vi phạm hay nhắc nhở nào</p>
                ) : (
                  <div className="space-y-2">
                    {todayReminderRecords.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => item.student && onOpenStudentProfile(item.student.id)}
                        className="bg-white p-2.5 rounded-lg border border-rose-200/60 shadow-2xs flex items-center justify-between text-xs cursor-pointer hover:border-rose-400"
                      >
                        <div className="min-w-0 pr-2">
                          <span className="font-bold text-slate-800">
                            {item.student?.name}
                          </span>
                          <p className="text-[11px] text-rose-600 truncate mt-0.5">
                            {item.criterionName}
                          </p>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[11px] font-extrabold bg-rose-100 text-rose-800 shrink-0">
                          {item.points}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Công việc cần xử lý hôm nay */}
            <div className="mt-5 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-indigo-600" />
                  Công việc trọng tâm cần xử lý ({pendingTasks.length})
                </h4>
                <button
                  onClick={() => onNavigate('tasks')}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                >
                  Xem toàn bộ danh sách &rarr;
                </button>
              </div>

              {pendingTasks.length === 0 ? (
                <div className="text-center py-4 bg-slate-50 rounded-xl text-slate-500 text-xs">
                  🎉 Tuyệt vời! Cô đã hoàn thành toàn bộ công việc.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {pendingTasks.slice(0, 4).map((task) => (
                    <div
                      key={task.id}
                      onClick={() => onNavigate('tasks')}
                      className="bg-slate-50 hover:bg-white p-3 rounded-xl border border-slate-200/80 transition-all cursor-pointer flex items-start justify-between"
                    >
                      <div className="min-w-0 pr-2">
                        <div className="text-xs font-bold text-slate-800 truncate">
                          {task.title}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                          <span>Hạn: {formatDateVN(task.dueDate)}</span>
                        </div>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded shrink-0 ${
                          task.priority === 'Gấp'
                            ? 'bg-rose-100 text-rose-700'
                            : task.priority === 'Quan trọng'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {task.priority}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Cột phải: Ghi Chú Nhanh */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col h-full">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-800">GHI CHÚ NHANH</h3>
              </div>
              <span className="text-xs text-slate-400">{quickNotes.length} ghi chú</span>
            </div>

            {/* Form thêm ghi chú nhanh */}
            <form onSubmit={handleCreateNote} className="mt-4">
              <div className="relative">
                <textarea
                  rows={2}
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  placeholder="Ghi chú nhanh việc cô cần lưu ý..."
                  className="w-full text-xs sm:text-sm p-3 pr-10 rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                />
                <button
                  type="submit"
                  disabled={!newNoteText.trim()}
                  className="absolute right-2.5 bottom-3.5 p-1.5 rounded-lg bg-blue-600 text-white disabled:opacity-30 hover:bg-blue-700 transition-colors cursor-pointer"
                  title="Lưu ghi chú"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>

            {/* Danh sách ghi chú */}
            <div className="mt-4 space-y-2.5 flex-1 max-h-[380px] overflow-y-auto pr-1">
              {quickNotes.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs italic">
                  Chưa có ghi chú nào. Cô có thể nhập nhanh ở trên và ấn gửi để lưu lại.
                </div>
              ) : (
                quickNotes.map((note) => (
                  <div
                    key={note.id}
                    className={`p-3 rounded-xl border transition-all text-xs group relative ${
                      note.pinned
                        ? 'bg-amber-50/60 border-amber-200/80 shadow-2xs'
                        : 'bg-slate-50/70 border-slate-200/70 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-slate-700 leading-relaxed font-medium whitespace-pre-wrap">
                        {note.content}
                      </p>
                      <div className="flex items-center space-x-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => onTogglePinQuickNote(note.id)}
                          className={`p-1 rounded hover:bg-slate-200/60 transition-colors cursor-pointer ${
                            note.pinned ? 'text-amber-600' : 'text-slate-400'
                          }`}
                          title={note.pinned ? 'Bỏ ghim' : 'Ghim lên đầu'}
                        >
                          <Pin className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteQuickNote(note.id)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Xóa ghi chú"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="mt-2 text-[10px] text-slate-400 flex items-center justify-between">
                      <span>{formatDateVN(note.createdAt)}</span>
                      {note.pinned && (
                        <span className="text-[10px] font-bold text-amber-700">Đã ghim</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
