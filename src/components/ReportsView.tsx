import React, { useState } from 'react';
import {
  BarChart3,
  Printer,
  Calendar,
  Users,
  Award,
  CheckCircle2,
  AlertTriangle,
  Clock,
  BookOpen,
  CheckSquare,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import {
  Student,
  AttendanceRecord,
  ConductRecord,
  TaskItem,
  ClassSettings,
} from '../types';
import { formatDateVN, getFullVietnameseDate } from '../utils/storage';

interface ReportsViewProps {
  settings: ClassSettings;
  students: Student[];
  attendance: AttendanceRecord[];
  conduct: ConductRecord[];
  tasks: TaskItem[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  settings,
  students,
  attendance,
  conduct,
  tasks,
}) => {
  const [period, setPeriod] = useState<'week' | 'month' | 'semester'>('week');

  // Lọc dữ liệu theo kỳ
  const now = new Date();
  const filterByDate = (dateStr: string) => {
    if (period === 'semester') return true;
    const d = new Date(dateStr);
    const diffDays = (now.getTime() - d.getTime()) / (1000 * 3600 * 24);
    if (period === 'week') return diffDays <= 7 && diffDays >= -1;
    if (period === 'month') return diffDays <= 30 && diffDays >= -1;
    return true;
  };

  const periodAttendance = attendance.filter((a) => filterByDate(a.date));
  const periodConduct = conduct.filter((c) => filterByDate(c.date));

  // Thống kê chuyên cần
  const totalAttendanceLogs = periodAttendance.length;
  const presentCount = periodAttendance.filter((a) => a.status === 'present').length;
  const absentExcusedCount = periodAttendance.filter((a) => a.status === 'absent_excused').length;
  const absentUnexcusedCount = periodAttendance.filter((a) => a.status === 'absent_unexcused').length;
  const lateCount = periodAttendance.filter((a) => a.status === 'late').length;

  const attendanceRate =
    totalAttendanceLogs > 0
      ? Math.round(((presentCount + lateCount) / totalAttendanceLogs) * 100)
      : 100;

  // Thống kê thi đua
  const praises = periodConduct.filter((c) => c.type === 'praise');
  const reminders = periodConduct.filter((c) => c.type === 'reminder');
  const totalPoints = periodConduct.reduce((sum, c) => sum + c.points, 0);

  // Thống kê học tập
  const goodStudents = students.filter((s) => s.academicStatus === 'Tốt').length;
  const stableStudents = students.filter((s) => s.academicStatus === 'Ổn định').length;
  const progressStudents = students.filter((s) => s.academicStatus === 'Có tiến bộ').length;
  const supportStudents = students.filter((s) => s.academicStatus === 'Cần hỗ trợ').length;

  // Thống kê công việc
  const completedTasks = tasks.filter((t) => t.status === 'Hoàn thành').length;
  const totalTasks = tasks.length;
  const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 100;

  // Top 3 học sinh xuất sắc
  const studentScores = students.map((s) => {
    const sRecords = periodConduct.filter((c) => c.studentId === s.id);
    const score = sRecords.reduce((sum, r) => sum + r.points, 0);
    return { student: s, score };
  });
  const topStudents = [...studentScores].sort((a, b) => b.score - a.score).slice(0, 3);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Top Bar: Selector & Print Button */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm sm:text-base">
              BÁO CÁO TỔNG KẾT TÌNH HÌNH LỚP
            </h3>
            <p className="text-xs text-slate-400">Chọn khoảng thời gian để phân tích và in ấn</p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <div className="flex items-center space-x-1 p-1 bg-slate-100 rounded-xl text-xs font-bold">
            <button
              onClick={() => setPeriod('week')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                period === 'week' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600'
              }`}
            >
              Tuần
            </button>
            <button
              onClick={() => setPeriod('month')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                period === 'month' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600'
              }`}
            >
              Tháng
            </button>
            <button
              onClick={() => setPeriod('semester')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                period === 'semester' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600'
              }`}
            >
              Học kỳ I
            </button>
          </div>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-xs cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            In báo cáo / Xuất PDF
          </button>
        </div>
      </div>

      {/* KHUNG NỘI DUNG BÁO CÁO (TỐI ƯU CHO CẢ MÀN HÌNH VÀ BẢN IN) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 sm:p-8 space-y-6 print:border-none print:shadow-none print:p-0">
        {/* Header Bản In (Chỉ hiện rõ tiêu chuẩn khi in hoặc xem trang) */}
        <div className="border-b border-slate-200 pb-5 text-center">
          <div className="flex justify-between text-xs text-slate-500 mb-2 print:flex">
            <div className="text-left">
              <p className="font-bold text-slate-800 uppercase">{settings.schoolName}</p>
              <p>Lớp: {settings.className}</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-slate-800">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
              <p className="italic">Độc lập - Tự do - Hạnh phúc</p>
            </div>
          </div>

          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 mt-4 tracking-tight uppercase">
            BÁO CÁO CÔNG TÁC CHỦ NHIỆM {period === 'week' ? 'TUẦN' : period === 'month' ? 'THÁNG' : 'HỌC KỲ I'}
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            Giáo viên chủ nhiệm: <span className="font-bold">{settings.teacherName}</span> • Năm học: {settings.academicYear}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Ngày lập: {getFullVietnameseDate()}</p>
        </div>

        {/* PHẦN 1: TỔNG HỢP NHANH */}
        <div className="bg-blue-50/60 p-4 sm:p-5 rounded-2xl border border-blue-100">
          <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900 mb-2 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-blue-600" />
            TỔNG HỢP NHANH TÌNH HÌNH CHUNG CỦA LỚP
          </h4>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
            Tập thể lớp <span className="font-bold text-blue-800">{settings.className}</span> duy trì sĩ số tốt với{' '}
            <span className="font-bold text-emerald-700">{attendanceRate}%</span> tỷ lệ chuyên cần. Trong đợt thi đua vừa qua, lớp đã có{' '}
            <span className="font-bold text-emerald-700">{praises.length}</span> lượt tuyên dương gương người tốt việc tốt và thành tích học tập; ghi nhận{' '}
            <span className="font-bold text-rose-600">{reminders.length}</span> lượt nhắc nhở về nề nếp tác phong. Về phía học tập, đa số các em có ý thức học đều và tiến bộ, trong đó có{' '}
            <span className="font-bold text-orange-700">{supportStudents}</span> em cần sự đồng hành hỗ trợ thêm của cô và bạn bè.
          </p>
        </div>

        {/* PHẦN 2: 4 THỐNG KÊ TRỌNG TÂM */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {/* Chuyên cần */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Chuyên cần</span>
            <div className="mt-2 text-2xl font-black text-emerald-600">{attendanceRate}%</div>
            <div className="mt-2 text-[11px] text-slate-500 space-y-0.5">
              <div>Có mặt: {presentCount}</div>
              <div>Có phép: {absentExcusedCount} | Không phép: {absentUnexcusedCount}</div>
              <div>Đi muộn: {lateCount}</div>
            </div>
          </div>

          {/* Thi đua */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Thi đua nề nếp</span>
            <div className="mt-2 text-2xl font-black text-blue-600">
              {totalPoints > 0 ? `+${totalPoints}` : totalPoints} đ
            </div>
            <div className="mt-2 text-[11px] text-slate-500 space-y-0.5">
              <div className="text-emerald-700 font-medium">Tuyên dương: +{praises.length} lượt</div>
              <div className="text-rose-600 font-medium">Nhắc nhở: -{reminders.length} lượt</div>
            </div>
          </div>

          {/* Học tập */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Học tập</span>
            <div className="mt-2 text-2xl font-black text-teal-600">
              {Math.round(((goodStudents + progressStudents) / (students.length || 1)) * 100)}%
            </div>
            <div className="mt-2 text-[11px] text-slate-500 space-y-0.5">
              <div>Tốt: {goodStudents} em</div>
              <div>Ổn định: {stableStudents} | Tiến bộ: {progressStudents}</div>
              <div className="text-orange-700 font-bold">Cần hỗ trợ: {supportStudents} em</div>
            </div>
          </div>

          {/* Công việc chủ nhiệm */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Việc chủ nhiệm</span>
            <div className="mt-2 text-2xl font-black text-indigo-600">{taskCompletionRate}%</div>
            <div className="mt-2 text-[11px] text-slate-500 space-y-0.5">
              <div>Đã xong: {completedTasks}/{totalTasks}</div>
              <div>Còn tồn: {totalTasks - completedTasks} việc</div>
            </div>
          </div>
        </div>

        {/* PHẦN 3: BIỂU ĐỒ TRỰC QUAN & XẾP HẠNG TOP HỌC SINH */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
          {/* Biểu đồ phân bố học tập */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-teal-600" />
              Tỷ lệ phân loại học tập của học sinh
            </h4>

            <div className="space-y-2.5">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-emerald-700">Tốt / Giỏi ({goodStudents} học sinh)</span>
                  <span>{Math.round((goodStudents / (students.length || 1)) * 100)}%</span>
                </div>
                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{ width: `${(goodStudents / (students.length || 1)) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-sky-700">Ổn định / Khá ({stableStudents} học sinh)</span>
                  <span>{Math.round((stableStudents / (students.length || 1)) * 100)}%</span>
                </div>
                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-sky-500 rounded-full transition-all"
                    style={{ width: `${(stableStudents / (students.length || 1)) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-teal-700">Có tiến bộ ({progressStudents} học sinh)</span>
                  <span>{Math.round((progressStudents / (students.length || 1)) * 100)}%</span>
                </div>
                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-teal-500 rounded-full transition-all"
                    style={{ width: `${(progressStudents / (students.length || 1)) * 100}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-orange-700">Cần hỗ trợ ({supportStudents} học sinh)</span>
                  <span>{Math.round((supportStudents / (students.length || 1)) * 100)}%</span>
                </div>
                <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-500 rounded-full transition-all"
                    style={{ width: `${(supportStudents / (students.length || 1)) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Top 3 Học sinh nổi bật */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-500" />
              Cá nhân nổi bật trong đợt thi đua
            </h4>

            <div className="space-y-2">
              {topStudents.map((item, idx) => (
                <div
                  key={item.student.id}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center space-x-2.5">
                    <span className="font-bold text-amber-700 text-sm">
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}
                    </span>
                    <div>
                      <div className="font-bold text-slate-900">{item.student.name}</div>
                      <div className="text-[11px] text-slate-500">
                        {item.student.role} - Tổ {item.student.group}
                      </div>
                    </div>
                  </div>
                  <span className="font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
                    +{item.score} điểm
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Chữ ký Giáo viên Chủ nhiệm (khi in) */}
        <div className="pt-10 flex justify-end print:block">
          <div className="text-center w-60">
            <p className="text-xs text-slate-500 italic">Ngày ... tháng ... năm ...</p>
            <p className="text-xs font-bold text-slate-800 uppercase mt-1">Giáo viên chủ nhiệm</p>
            <div className="h-16"></div>
            <p className="text-xs font-bold text-slate-900">{settings.teacherName}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
