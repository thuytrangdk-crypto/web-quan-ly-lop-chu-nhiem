import React, { useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  HelpCircle,
  CheckCheck,
  CalendarCheck2,
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  FileText,
} from 'lucide-react';
import { Student, AttendanceRecord, AttendanceStatus } from '../types';
import { getTodayDateString, formatDateVN } from '../utils/storage';

interface AttendanceViewProps {
  students: Student[];
  attendance: AttendanceRecord[];
  onUpdateAttendance: (records: AttendanceRecord[]) => void;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onOpenStudentProfile: (studentId: string) => void;
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({
  students,
  attendance,
  onUpdateAttendance,
  onShowToast,
  onOpenStudentProfile,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString());
  const [activeTab, setActiveTab] = useState<'daily' | 'history'>('daily');
  const [searchTerm, setSearchTerm] = useState('');
  const [studentHistoryId, setStudentHistoryId] = useState<string>('all');

  // Bản ghi điểm danh ngày đã chọn
  const dayRecords = attendance.filter((a) => a.date === selectedDate);

  // Tạo map id học sinh -> record của ngày đó
  const recordMap = new Map<string, AttendanceRecord>();
  dayRecords.forEach((r) => recordMap.set(r.studentId, r));

  // Thống kê ngày được chọn
  let presentCount = 0;
  let absentExcusedCount = 0;
  let absentUnexcusedCount = 0;
  let lateCount = 0;

  students.forEach((s) => {
    const rec = recordMap.get(s.id);
    const status = rec ? rec.status : 'present'; // Mặc định là có mặt nếu chưa đánh dấu
    if (status === 'present') presentCount++;
    else if (status === 'absent_excused') absentExcusedCount++;
    else if (status === 'absent_unexcused') absentUnexcusedCount++;
    else if (status === 'late') lateCount++;
  });

  const totalAbsents = absentExcusedCount + absentUnexcusedCount;

  // Xử lý đổi trạng thái điểm danh cho 1 học sinh
  const handleSetStatus = (studentId: string, newStatus: AttendanceStatus, note?: string) => {
    const updated = [...attendance];
    const existingIndex = updated.findIndex(
      (a) => a.studentId === studentId && a.date === selectedDate
    );

    if (existingIndex >= 0) {
      updated[existingIndex] = {
        ...updated[existingIndex],
        status: newStatus,
        note: note !== undefined ? note : updated[existingIndex].note,
      };
    } else {
      updated.push({
        id: `att-${Date.now()}-${studentId}`,
        date: selectedDate,
        studentId,
        status: newStatus,
        note: note || '',
      });
    }

    onUpdateAttendance(updated);
  };

  // Đánh dấu tất cả có mặt
  const handleMarkAllPresent = () => {
    let updated = attendance.filter((a) => a.date !== selectedDate);
    const newRecords: AttendanceRecord[] = students.map((s) => ({
      id: `att-${Date.now()}-${s.id}`,
      date: selectedDate,
      studentId: s.id,
      status: 'present',
    }));
    updated = [...updated, ...newRecords];
    onUpdateAttendance(updated);
    onShowToast(`Đã đánh dấu tất cả ${students.length} học sinh có mặt ngày ${formatDateVN(selectedDate)}!`);
  };

  // Thay đổi ngày (tiến/lùi)
  const shiftDate = (days: number) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + days);
    const y = current.getFullYear();
    const m = String(current.getMonth() + 1).padStart(2, '0');
    const d = String(current.getDate()).padStart(2, '0');
    setSelectedDate(`${y}-${m}-${d}`);
  };

  // Lọc học sinh
  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Top Controls: Chuyển tab Điểm danh ngày / Lịch sử, Chọn ngày */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Toggle View */}
        <div className="flex items-center space-x-1.5 p-1 bg-slate-100 rounded-xl">
          <button
            onClick={() => setActiveTab('daily')}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'daily'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Điểm danh theo ngày
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Lịch sử chuyên cần
          </button>
        </div>

        {/* Date Selector & Quick Mark All */}
        {activeTab === 'daily' && (
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1">
              <button
                type="button"
                onClick={() => shiftDate(-1)}
                className="p-1 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-colors"
                title="Ngày trước"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center space-x-2 px-2 text-xs sm:text-sm font-semibold text-slate-700">
                <Calendar className="w-4 h-4 text-blue-600" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent font-bold focus:outline-hidden text-slate-800 cursor-pointer"
                />
              </div>

              <button
                type="button"
                onClick={() => shiftDate(1)}
                className="p-1 rounded text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-colors"
                title="Ngày sau"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={() => setSelectedDate(getTodayDateString())}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
            >
              Hôm nay
            </button>

            <button
              onClick={handleMarkAllPresent}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors shadow-xs cursor-pointer"
            >
              <CheckCheck className="w-4 h-4" />
              Đánh dấu tất cả có mặt
            </button>
          </div>
        )}
      </div>

      {/* VIEW 1: ĐIỂM DANH THEO NGÀY */}
      {activeTab === 'daily' && (
        <div className="space-y-6">
          {/* Thẻ Thống kê Chuyên cần trong ngày */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-emerald-50 border border-emerald-200/80 p-4 rounded-2xl">
              <div className="flex items-center justify-between text-emerald-800 text-xs font-bold">
                <span>🟢 Có mặt</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="mt-2 text-2xl font-black text-emerald-700">{presentCount}</div>
              <p className="text-[11px] text-emerald-600/80 mt-0.5">
                {students.length > 0 ? Math.round((presentCount / students.length) * 100) : 0}% sĩ số
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200/80 p-4 rounded-2xl">
              <div className="flex items-center justify-between text-blue-800 text-xs font-bold">
                <span>🔵 Có phép</span>
                <HelpCircle className="w-4 h-4 text-blue-600" />
              </div>
              <div className="mt-2 text-2xl font-black text-blue-700">{absentExcusedCount}</div>
              <p className="text-[11px] text-blue-600/80 mt-0.5">Có đơn báo trước</p>
            </div>

            <div className="bg-rose-50 border border-rose-200/80 p-4 rounded-2xl">
              <div className="flex items-center justify-between text-rose-800 text-xs font-bold">
                <span>🔴 Không phép</span>
                <XCircle className="w-4 h-4 text-rose-600" />
              </div>
              <div className="mt-2 text-2xl font-black text-rose-700">{absentUnexcusedCount}</div>
              <p className="text-[11px] text-rose-600/80 mt-0.5">Cần liên hệ gia đình</p>
            </div>

            <div className="bg-amber-50 border border-amber-200/80 p-4 rounded-2xl">
              <div className="flex items-center justify-between text-amber-800 text-xs font-bold">
                <span>🟡 Đi muộn</span>
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <div className="mt-2 text-2xl font-black text-amber-700">{lateCount}</div>
              <p className="text-[11px] text-amber-700/80 mt-0.5">Cần nhắc nhở</p>
            </div>

            <div className="bg-slate-100 border border-slate-200 p-4 rounded-2xl col-span-2 sm:col-span-1">
              <div className="flex items-center justify-between text-slate-700 text-xs font-bold">
                <span>Tổng sĩ số</span>
                <Users className="w-4 h-4 text-slate-500" />
              </div>
              <div className="mt-2 text-2xl font-black text-slate-800">{students.length}</div>
              <p className="text-[11px] text-slate-500 mt-0.5">Học sinh trong lớp</p>
            </div>
          </div>

          {/* Bảng Danh sách Học sinh & 4 Nút Điểm Danh Nhanh */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <CalendarCheck2 className="w-4 h-4 text-teal-600" />
                <span className="font-bold text-slate-800 text-sm">
                  ĐIỂM DANH NGÀY: {formatDateVN(selectedDate)}
                </span>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Lọc tên học sinh..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {filteredStudents.map((student, idx) => {
                const rec = recordMap.get(student.id);
                const currentStatus: AttendanceStatus = rec ? rec.status : 'present';

                return (
                  <div
                    key={student.id}
                    className="p-4 hover:bg-slate-50/70 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    {/* Thông tin học sinh */}
                    <div className="flex items-center space-x-3 min-w-0">
                      <span className="text-xs font-bold text-slate-400 w-6 text-center">
                        {idx + 1}
                      </span>
                      <div
                        onClick={() => onOpenStudentProfile(student.id)}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs text-white shrink-0 cursor-pointer shadow-xs ${
                          student.gender === 'Nữ'
                            ? 'bg-gradient-to-tr from-pink-400 to-rose-400'
                            : 'bg-gradient-to-tr from-blue-500 to-teal-400'
                        }`}
                      >
                        {student.name.charAt(student.name.lastIndexOf(' ') + 1)}
                      </div>
                      <div className="min-w-0">
                        <div
                          onClick={() => onOpenStudentProfile(student.id)}
                          className="font-bold text-slate-800 text-sm hover:text-blue-600 cursor-pointer transition-colors"
                        >
                          {student.name}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-2">
                          <span>{student.code}</span>
                          <span>•</span>
                          <span>Tổ {student.group}</span>
                          <span>•</span>
                          <span className="font-medium text-slate-500">{student.role}</span>
                        </div>
                      </div>
                    </div>

                    {/* 4 Nút bấm điểm danh thao tác 1 chạm */}
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      {/* Nút Có mặt */}
                      <button
                        type="button"
                        onClick={() => handleSetStatus(student.id, 'present')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                          currentStatus === 'present'
                            ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-600/30'
                            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Có mặt
                      </button>

                      {/* Nút Có phép */}
                      <button
                        type="button"
                        onClick={() => handleSetStatus(student.id, 'absent_excused')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                          currentStatus === 'absent_excused'
                            ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-600/30'
                            : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                        }`}
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                        Có phép
                      </button>

                      {/* Nút Không phép */}
                      <button
                        type="button"
                        onClick={() => handleSetStatus(student.id, 'absent_unexcused')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                          currentStatus === 'absent_unexcused'
                            ? 'bg-rose-600 text-white shadow-sm ring-2 ring-rose-600/30'
                            : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                        }`}
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Vắng
                      </button>

                      {/* Nút Đi muộn */}
                      <button
                        type="button"
                        onClick={() => handleSetStatus(student.id, 'late')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                          currentStatus === 'late'
                            ? 'bg-amber-500 text-white shadow-sm ring-2 ring-amber-500/30'
                            : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        Đi muộn
                      </button>
                    </div>

                    {/* Ghi chú điểm danh (ví dụ: lý do nghỉ / muộn bao nhiêu phút) */}
                    <div className="w-full md:w-56">
                      <input
                        type="text"
                        value={rec?.note || ''}
                        onChange={(e) =>
                          handleSetStatus(student.id, currentStatus, e.target.value)
                        }
                        placeholder="Ghi chú lý do nếu có..."
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: LỊCH SỬ CHUYÊN CẦN */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <h3 className="font-bold text-slate-800 text-sm sm:text-base">
              LỊCH SỬ CHUYÊN CẦN CỦA LỚP
            </h3>

            <div className="flex items-center space-x-2 text-xs">
              <span className="text-slate-500">Xem theo học sinh:</span>
              <select
                value={studentHistoryId}
                onChange={(e) => setStudentHistoryId(e.target.value)}
                className="p-1.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 focus:outline-hidden"
              >
                <option value="all">Tất cả học sinh</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Danh sách các lần ghi nhận chuyên cần */}
          <div className="space-y-3">
            {attendance
              .filter((rec) => studentHistoryId === 'all' || rec.studentId === studentHistoryId)
              .sort((a, b) => b.date.localeCompare(a.date))
              .map((rec) => {
                const student = students.find((s) => s.id === rec.studentId);
                if (!student) return null;

                return (
                  <div
                    key={rec.id}
                    className="p-3 rounded-xl border border-slate-200/70 bg-slate-50/50 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="font-bold text-slate-600 font-mono">
                        {formatDateVN(rec.date)}
                      </span>
                      <span className="font-bold text-slate-900">{student.name}</span>
                      <span className="text-slate-400">Tổ {student.group}</span>
                      {rec.note && <span className="text-slate-500 italic">({rec.note})</span>}
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full font-bold text-[11px] ${
                        rec.status === 'present'
                          ? 'bg-emerald-100 text-emerald-800'
                          : rec.status === 'absent_excused'
                          ? 'bg-blue-100 text-blue-800'
                          : rec.status === 'absent_unexcused'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {rec.status === 'present'
                        ? 'Có mặt'
                        : rec.status === 'absent_excused'
                        ? 'Có phép'
                        : rec.status === 'absent_unexcused'
                        ? 'Không phép'
                        : 'Đi muộn'}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
};
