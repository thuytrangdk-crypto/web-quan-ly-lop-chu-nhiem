import React, { useState } from 'react';
import {
  User,
  CalendarCheck2,
  Award,
  BookOpen,
  Phone,
  Copy,
  Check,
  Edit2,
  X,
  AlertTriangle,
  HeartHandshake,
  Calendar,
  Sparkles,
  TrendingUp,
  Clock,
  Filter,
  ShieldCheck,
  Plus,
  Trash2,
  CheckCircle2,
  HelpCircle,
  XCircle,
  FileText,
  Lock,
} from 'lucide-react';
import {
  Student,
  AttendanceRecord,
  ConductRecord,
  ConductRating,
  ConductCriterion,
  ConductRatingThresholds,
  UserSession,
} from '../types';
import { formatDateVN } from '../utils/storage';

interface StudentProfileModalProps {
  isOpen: boolean;
  student: Student | null;
  attendance: AttendanceRecord[];
  conduct: ConductRecord[];
  criteria: ConductCriterion[];
  currentUser?: UserSession | null;
  isTeacherRole?: boolean;
  ratingThresholds?: ConductRatingThresholds;
  onClose: () => void;
  onOpenOwnProfile?: () => void;
  onEditStudent: (student: Student) => void;
  onAddConductRecord: (record: Omit<ConductRecord, 'id'>) => void;
  onDeleteConductRecord?: (recordId: string) => void;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export function calculateConductRating(
  score: number,
  ratingThresholds?: ConductRatingThresholds
): {
  rating: ConductRating;
  color: string;
  badgeBg: string;
  badgeText: string;
  desc: string;
} {
  const totMin = ratingThresholds?.year?.totMin ?? 90;
  const khaMin = ratingThresholds?.year?.khaMin ?? 75;
  const datMin = ratingThresholds?.year?.datMin ?? 50;

  if (score >= totMin) {
    return {
      rating: 'Tốt',
      color: 'emerald',
      badgeBg: 'bg-emerald-100 border-emerald-300',
      badgeText: 'text-emerald-800',
      desc: 'Rèn luyện xuất sắc, gương mẫu chấp hành tốt nội quy lớp và nhà trường.',
    };
  }
  if (score >= khaMin) {
    return {
      rating: 'Khá',
      color: 'blue',
      badgeBg: 'bg-blue-100 border-blue-300',
      badgeText: 'text-blue-800',
      desc: 'Ý thức nề nếp tốt, hoàn thành các nhiệm vụ được giao.',
    };
  }
  if (score >= datMin) {
    return {
      rating: 'Đạt',
      color: 'amber',
      badgeBg: 'bg-amber-100 border-amber-300',
      badgeText: 'text-amber-800',
      desc: 'Cần nâng cao ý thức rèn luyện, còn vi phạm một số nội quy nề nếp.',
    };
  }
  return {
    rating: 'Chưa đạt',
    color: 'rose',
    badgeBg: 'bg-rose-100 border-rose-300',
    badgeText: 'text-rose-800',
    desc: 'Vi phạm nhiều lần nề nếp kỷ luật, cần giáo viên và gia đình phối hợp theo dõi.',
  };
}

export const StudentProfileModal: React.FC<StudentProfileModalProps> = ({
  isOpen,
  student,
  attendance,
  conduct,
  criteria,
  currentUser,
  isTeacherRole = true,
  ratingThresholds,
  onClose,
  onOpenOwnProfile,
  onEditStudent,
  onAddConductRecord,
  onDeleteConductRecord,
  onShowToast,
}) => {
  // Tabs: Thông tin | Điểm danh | Học tập | Thi đua & Kỷ luật | Sổ tay & Liên hệ
  const [activeTab, setActiveTab] = useState<'info' | 'attendance' | 'academic' | 'conduct' | 'contact'>('conduct');
  const [copiedPhone, setCopiedPhone] = useState(false);

  // Form Ghi nhận Sự việc (như ảnh mẫu)
  const [eventDate, setEventDate] = useState<string>(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  });
  const [selectedEventCriterion, setSelectedEventCriterion] = useState<string>('Đi học muộn (-1đ)');
  const [eventDetails, setEventDetails] = useState<string>('');
  const [customEventName, setCustomEventName] = useState<string>('');
  const [customEventPoints, setCustomEventPoints] = useState<number>(-1);

  // Kỳ đánh giá (Tháng)
  const [selectedEvaluationMonth, setSelectedEvaluationMonth] = useState<string>('10/2026');

  // Danh sách các tùy chọn sự việc động từ criteria (TOÀN BỘ HOOKS PHẢI NẰM TRƯỚC EARLY RETURN)
  const eventOptions = React.useMemo(() => {
    if (criteria && criteria.length > 0) {
      const mapped = criteria.map((c) => ({
        label: `${c.name} (${c.points > 0 ? `+${c.points}` : c.points}đ)`,
        name: c.name,
        points: c.points,
        type: c.type,
        category: c.category || (c.type === 'praise' ? 'Tuyên dương' : 'Nhắc nhở'),
      }));
      return [
        ...mapped,
        { label: 'Sự việc khác (Tùy chỉnh)', name: 'Sự việc khác (Tùy chỉnh)', points: 0, type: 'custom' as const, category: 'Khác' },
      ];
    }
    return [
      { label: 'Đi học muộn (-1đ)', name: 'Đi học muộn', points: -1, type: 'reminder' as const, category: 'Nhắc nhở' },
      { label: 'Không làm bài tập về nhà (-2đ)', name: 'Không làm bài tập về nhà', points: -2, type: 'reminder' as const, category: 'Nhắc nhở' },
      { label: 'Mất trật tự / Nói chuyện riêng (-2đ)', name: 'Mất trật tự / Nói chuyện riêng', points: -2, type: 'reminder' as const, category: 'Nhắc nhở' },
      { label: 'Quên sách vở / Đồ dùng học tập (-1đ)', name: 'Quên sách vở / Đồ dùng học tập', points: -1, type: 'reminder' as const, category: 'Nhắc nhở' },
      { label: 'Vi phạm đồng phục / Tác phong (-1đ)', name: 'Vi phạm đồng phục / Tác phong', points: -1, type: 'reminder' as const, category: 'Nhắc nhở' },
      { label: 'Phát biểu xây dựng bài sôi nổi (+2đ)', name: 'Phát biểu xây dựng bài sôi nổi', points: 2, type: 'praise' as const, category: 'Tuyên dương' },
      { label: 'Đạt điểm tốt (9-10) kiểm tra (+3đ)', name: 'Đạt điểm tốt (9-10) kiểm tra', points: 3, type: 'praise' as const, category: 'Tuyên dương' },
      { label: 'Việc tốt / Nhặt được của rơi (+5đ)', name: 'Việc tốt / Nhặt được của rơi', points: 5, type: 'praise' as const, category: 'Tuyên dương' },
      { label: 'Sự việc khác (Tùy chỉnh)', name: 'Sự việc khác (Tùy chỉnh)', points: 0, type: 'custom' as const, category: 'Khác' },
    ];
  }, [criteria]);

  // NẾU MODAL ĐÓNG HOẶC CHƯA CÓ HỌC SINH -> THOÁT RA (TẤT CẢ HOOKS ĐÃ ĐƯỢC GỌI AN TOÀN TRÊN ĐÂY)
  if (!isOpen || !student) return null;

  const handleCopyPhone = (phone: string) => {
    if (!phone) return;
    navigator.clipboard.writeText(phone);
    setCopiedPhone(true);
    onShowToast(`Đã sao chép số điện thoại: ${phone}`);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  // Dữ liệu chuyên cần của học sinh này
  const safeAttendance = Array.isArray(attendance) ? attendance : [];
  const safeConduct = Array.isArray(conduct) ? conduct : [];
  const studentAttendance = safeAttendance.filter((a) => a && a.studentId === student.id);
  const presentCount = studentAttendance.filter((a) => a.status === 'present').length;
  const absentExcusedCount = studentAttendance.filter((a) => a.status === 'absent_excused').length;
  const absentUnexcusedCount = studentAttendance.filter((a) => a.status === 'absent_unexcused').length;
  const lateCount = studentAttendance.filter((a) => a.status === 'late').length;
  const totalDaysRecorded = studentAttendance.length;
  const attendanceRate = totalDaysRecorded > 0 ? Math.round(((presentCount + lateCount) / totalDaysRecorded) * 100) : 100;

  // Dữ liệu thi đua của học sinh này
  const studentConductRecords = safeConduct.filter((c) => c && c.studentId === student.id);

  // Lọc sự việc theo Kỳ đánh giá (Tháng)
  const filteredConductRecords = studentConductRecords.filter((rec) => {
    if (!rec || !rec.date) return false;
    if (selectedEvaluationMonth === 'all') return true;
    const parts = rec.date.split('-'); // YYYY-MM-DD
    if (parts.length >= 2) {
      const year = parts[0];
      const month = parts[1];
      const key = `${month}/${year}`;
      return key === selectedEvaluationMonth;
    }
    return true;
  });

  // Tính tổng điểm trong tháng đã chọn
  // (Nếu tổng điểm cộng - trừ = 0, hiển thị 0; nếu có điểm, hiển thị số điểm cộng/trừ)
  const monthTotalDelta = filteredConductRecords.reduce((sum, c) => sum + (c.points || 0), 0);

  // Tính điểm tổng kết cả năm của học sinh (Điểm chuẩn 100 + cộng - trừ)
  const cumulativePraises = studentConductRecords
    .filter((c) => c.type === 'praise')
    .reduce((sum, c) => sum + Math.abs(c.points || 0), 0);
  const cumulativeReminders = studentConductRecords
    .filter((c) => c.type === 'reminder')
    .reduce((sum, c) => sum + Math.abs(c.points || 0), 0);
  const cumulativeFinalScore = 100 + cumulativePraises - cumulativeReminders;

  // Xếp loại dựa vào điểm tháng và điểm lũy kế
  const monthThresh = {
    totMin: ratingThresholds?.month?.totMin ?? 0,
    khaMin: ratingThresholds?.month?.khaMin ?? -3,
    datMin: ratingThresholds?.month?.datMin ?? -7,
  };
  let monthRating = 'Tốt';
  if (monthTotalDelta >= monthThresh.totMin) monthRating = 'Tốt';
  else if (monthTotalDelta >= monthThresh.khaMin) monthRating = 'Khá';
  else if (monthTotalDelta >= monthThresh.datMin) monthRating = 'Đạt';
  else monthRating = 'Chưa đạt';

  const currentSelectedOption = eventOptions.find((o) => o.label === selectedEventCriterion);
  const currentDisplayPoints =
    selectedEventCriterion === 'Sự việc khác (Tùy chỉnh)'
      ? customEventPoints
      : currentSelectedOption
      ? currentSelectedOption.points
      : -1;

  // Xử lý Lưu ghi nhận Sự việc trực tiếp
  const handleSaveEvent = (e: React.FormEvent) => {
    e.preventDefault();

    let recordName = selectedEventCriterion;
    let points = -1;
    let type: 'praise' | 'reminder' = 'reminder';

    if (selectedEventCriterion === 'Sự việc khác (Tùy chỉnh)') {
      if (!customEventName.trim()) {
        onShowToast('Vui lòng nhập tên sự việc', 'error');
        return;
      }
      recordName = customEventName.trim();
      points = customEventPoints;
      type = customEventPoints >= 0 ? 'praise' : 'reminder';
    } else {
      const match = eventOptions.find((o) => o.label === selectedEventCriterion);
      if (match) {
        points = match.points;
        type = match.type === 'praise' ? 'praise' : 'reminder';
      }
    }

    onAddConductRecord({
      date: eventDate,
      studentId: student.id,
      criterionName: recordName,
      points: points,
      type: type,
      note: eventDetails.trim() || undefined,
    });

    onShowToast(`Đã lưu ghi nhận sự việc cho ${student.name}!`);
    setEventDetails('');
    if (selectedEventCriterion === 'Sự việc khác (Tùy chỉnh)') {
      setCustomEventName('');
    }
  };

  // Nếu là tài khoản học sinh nhưng đang bấm vào học sinh khác: Bảo vệ riêng tư
  if (!isTeacherRole && currentUser?.role === 'student' && currentUser.studentId !== student.id) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
        <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-100 text-center animate-in zoom-in-95 duration-150">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 border border-amber-200">
            <Lock className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">
            Bảo Mật Hồ Sơ Học Sinh
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">
            Hồ sơ chi tiết và lịch sử thi đua của từng bạn được bảo mật riêng tư. Em chỉ có thể xem chi tiết hồ sơ cá nhân của chính mình.
          </p>
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Đóng
            </button>
            {onOpenOwnProfile && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenOwnProfile();
                }}
                className="flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-xs cursor-pointer"
              >
                Xem hồ sơ của em
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-5xl w-full shadow-2xl border border-slate-100 my-4 flex flex-col max-h-[95vh] overflow-hidden">
        {/* TOP BAR / MODAL HEADER */}
        <div className="px-5 pt-4 pb-0 border-b border-slate-200 shrink-0 bg-white">
          <div className="flex items-center justify-between pb-3">
            <div className="flex items-center space-x-3">
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-lg text-white shadow-xs shrink-0 ${
                  student.gender === 'Nữ'
                    ? 'bg-gradient-to-tr from-pink-500 to-rose-500'
                    : 'bg-gradient-to-tr from-blue-600 to-teal-500'
                }`}
              >
                {(student.name || '').trim().charAt((student.name || '').trim().lastIndexOf(' ') + 1) || 'H'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900 leading-tight">
                    {student.name}
                  </h3>
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    {student.code}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700">
                    Tổ {student.group}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                  <span className="font-semibold text-teal-700">{student.role}</span>
                  <span>•</span>
                  <span>Sinh ngày: <b className="text-slate-700">{formatDateVN(student.dob)}</b></span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {isTeacherRole && (
                <button
                  type="button"
                  onClick={() => onEditStudent(student)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5 text-slate-600" />
                  Sửa hồ sơ
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* THANH MENU TABS THEO ĐÚNG ẢNH MẪU */}
          {/* Thông tin | Điểm danh | Học tập | Thi đua & Kỷ luật | Sổ tay & Liên hệ */}
          <div className="flex items-center space-x-6 text-sm font-semibold overflow-x-auto no-scrollbar pt-1">
            <button
              type="button"
              onClick={() => setActiveTab('info')}
              className={`pb-3 px-1 transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
                activeTab === 'info'
                  ? 'border-indigo-600 text-indigo-600 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Thông tin
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('attendance')}
              className={`pb-3 px-1 transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
                activeTab === 'attendance'
                  ? 'border-indigo-600 text-indigo-600 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Điểm danh
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('academic')}
              className={`pb-3 px-1 transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
                activeTab === 'academic'
                  ? 'border-indigo-600 text-indigo-600 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Học tập
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('conduct')}
              className={`pb-3 px-1 transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
                activeTab === 'conduct'
                  ? 'border-indigo-600 text-indigo-600 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Thi đua & Kỷ luật
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('contact')}
              className={`pb-3 px-1 transition-colors cursor-pointer border-b-2 whitespace-nowrap ${
                activeTab === 'contact'
                  ? 'border-indigo-600 text-indigo-600 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Sổ tay & Liên hệ
            </button>
          </div>
        </div>

        {/* NỘI DUNG CHÍNH CÁC TAB */}
        <div className={`flex-1 p-5 sm:p-6 bg-slate-50/50 ${activeTab === 'conduct' ? 'overflow-y-auto lg:overflow-hidden' : 'overflow-y-auto'}`}>
          {/* ======================================================== */}
          {/* TAB 4: THI ĐUA & KỶ LUẬT (CHÍNH XÁC 100% THEO ẢNH MẪU)    */}
          {/* ======================================================== */}
          {activeTab === 'conduct' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* CỘT TRÁI (Khoảng 4-5 cols): FORM GHI NHẬN SỰ VIỆC */}
              <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-4 lg:sticky lg:top-1 self-start">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center space-x-2 text-base font-bold text-slate-900">
                    <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-lg leading-none">+</span>
                    <span>Ghi nhận Sự việc</span>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                    {student.name}
                  </span>
                </div>

                <form onSubmit={handleSaveEvent} className="space-y-4 text-xs">
                  {/* Trường: Ngày * */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-slate-700">
                        Ngày *
                      </label>
                      {isTeacherRole && (
                        <button
                          type="button"
                          onClick={() => {
                            const today = new Date();
                            const y = today.getFullYear();
                            const m = String(today.getMonth() + 1).padStart(2, '0');
                            const d = String(today.getDate()).padStart(2, '0');
                            setEventDate(`${y}-${m}-${d}`);
                          }}
                          className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer hover:underline"
                        >
                          Hôm nay
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type="date"
                        required
                        disabled={!isTeacherRole}
                        value={eventDate}
                        onChange={(e) => setEventDate(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all cursor-pointer shadow-2xs disabled:bg-slate-50 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>

                  {/* Trường: Sự việc * */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-slate-700">
                        Sự việc *
                      </label>
                      <span
                        className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-md ${
                          currentDisplayPoints > 0
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : currentDisplayPoints < 0
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {currentDisplayPoints > 0 ? `+${currentDisplayPoints}đ` : `${currentDisplayPoints}đ`}
                      </span>
                    </div>
                    <select
                      value={selectedEventCriterion}
                      disabled={!isTeacherRole}
                      onChange={(e) => setSelectedEventCriterion(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all cursor-pointer shadow-2xs disabled:bg-slate-50 disabled:cursor-not-allowed"
                    >
                      <optgroup label="⚠️ Vi phạm & Nhắc nhở (-)">
                        {eventOptions.filter((o) => o.type === 'reminder').map((opt) => (
                          <option key={opt.label} value={opt.label}>
                            {opt.label}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="⭐ Tuyên dương & Khen thưởng (+)">
                        {eventOptions.filter((o) => o.type === 'praise').map((opt) => (
                          <option key={opt.label} value={opt.label}>
                            {opt.label}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="✨ Khác">
                        <option value="Sự việc khác (Tùy chỉnh)">Sự việc khác (Tùy chỉnh)</option>
                      </optgroup>
                    </select>

                    {/* Phím bấm chọn nhanh các sự việc phổ biến */}
                    {isTeacherRole && (
                      <div className="mt-2.5">
                        <div className="text-[11px] font-semibold text-slate-500 mb-1.5">Chọn nhanh:</div>
                        <div className="flex flex-wrap gap-1.5">
                          {eventOptions.slice(0, 6).map((chip) => {
                            const isSelected = selectedEventCriterion === chip.label;
                            const isPraise = chip.type === 'praise';
                            return (
                              <button
                                key={chip.label}
                                type="button"
                                onClick={() => setSelectedEventCriterion(chip.label)}
                                className={`px-2 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer border ${
                                  isSelected
                                    ? isPraise
                                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs font-bold'
                                      : 'bg-rose-600 text-white border-rose-600 shadow-2xs font-bold'
                                    : isPraise
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                                    : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                                }`}
                              >
                                {(chip.label || '').replace(/\s\([^)]+\)/, '')} {isPraise ? '(+)' : '(-)'}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Nhập tùy chỉnh nếu chọn Khác */}
                  {selectedEventCriterion === 'Sự việc khác (Tùy chỉnh)' && (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 animate-in fade-in duration-150">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Tên sự việc cụ thể
                        </label>
                        <input
                          type="text"
                          disabled={!isTeacherRole}
                          value={customEventName}
                          onChange={(e) => setCustomEventName(e.target.value)}
                          placeholder="VD: Tham gia văn nghệ, Đi ủng hộ bạn..."
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs disabled:bg-slate-50"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Điểm (+ hoặc -)
                        </label>
                        <input
                          type="number"
                          disabled={!isTeacherRole}
                          value={customEventPoints}
                          onChange={(e) => setCustomEventPoints(Number(e.target.value))}
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs font-mono disabled:bg-slate-50"
                        />
                      </div>
                    </div>
                  )}

                  {/* Trường: Chi tiết (Tùy chọn) */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Chi tiết (Tùy chọn)
                    </label>
                    <textarea
                      rows={3}
                      disabled={!isTeacherRole}
                      value={eventDetails}
                      onChange={(e) => setEventDetails(e.target.value)}
                      placeholder="Nhập thêm chi tiết..."
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none shadow-2xs disabled:bg-slate-50 disabled:cursor-not-allowed"
                    />
                  </div>

                  {/* Nút: Lưu ghi nhận (Chỉ cho GVCN) */}
                  {isTeacherRole ? (
                    <button
                      type="submit"
                      className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-sm font-bold shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Lưu ghi nhận</span>
                    </button>
                  ) : (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs font-semibold text-center flex items-center justify-center gap-2">
                      <Lock className="w-4 h-4 text-amber-600" />
                      <span>Chế độ học sinh xem hồ sơ cá nhân</span>
                    </div>
                  )}
                </form>
              </div>

              {/* CỘT PHẢI (Khoảng 7-8 cols): THỐNG KÊ THÁNG CỐ ĐỊNH & BẢNG LỊCH SỬ CÓ THANH CUỘN */}
              <div className="lg:col-span-7 flex flex-col space-y-4">
                {/* THẺ ĐÁNH GIÁ (THÁNG) - TỔNG ĐIỂM - XẾP LOẠI (CỐ ĐỊNH HOÀN TOÀN, KHÔNG BỊ CUỘN MẤT) */}
                <div className="shrink-0 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      KỲ ĐÁNH GIÁ (THÁNG)
                    </div>
                    <select
                      value={selectedEvaluationMonth}
                      onChange={(e) => setSelectedEvaluationMonth(e.target.value)}
                      className="px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-800 focus:outline-hidden focus:border-indigo-500 cursor-pointer shadow-2xs"
                    >
                      <option value="10/2026">Tháng 10/2026</option>
                      <option value="09/2026">Tháng 09/2026</option>
                      <option value="11/2026">Tháng 11/2026</option>
                      <option value="12/2026">Tháng 12/2026</option>
                      <option value="01/2027">Tháng 01/2027</option>
                      <option value="02/2027">Tháng 02/2027</option>
                      <option value="03/2027">Tháng 03/2027</option>
                      <option value="04/2027">Tháng 04/2027</option>
                      <option value="05/2027">Tháng 05/2027</option>
                      <option value="all">Tất cả các tháng</option>
                    </select>
                  </div>

                  <div className="flex items-center space-x-6 sm:space-x-8">
                    {/* TỔNG ĐIỂM */}
                    <div className="text-right">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">
                        TỔNG ĐIỂM
                      </div>
                      <div
                        className={`text-2xl sm:text-3xl font-black ${
                          monthTotalDelta >= 0 ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {monthTotalDelta > 0 ? `+${monthTotalDelta}` : monthTotalDelta}
                      </div>
                    </div>

                    {/* Dải phân cách dọc | */}
                    <div className="h-8 w-px bg-slate-200"></div>

                    {/* XẾP LOẠI */}
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-0.5">
                        XẾP LOẠI
                      </div>
                      <div
                        className={`text-xl sm:text-2xl font-black ${
                          monthRating === 'Tốt'
                            ? 'text-emerald-600'
                            : monthRating === 'Khá'
                            ? 'text-blue-600'
                            : monthRating === 'Đạt'
                            ? 'text-amber-600'
                            : 'text-rose-600'
                        }`}
                      >
                        {monthRating}
                      </div>
                    </div>
                  </div>
                </div>

                {/* THẺ BẢNG LỊCH SỬ SỰ VIỆC (THANH CUỘN CHỈ XUẤT HIỆN Ở BẢNG NÀY) */}
                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col space-y-3">
                  <div className="shrink-0 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm sm:text-base font-bold text-slate-900">
                        Lịch sử sự việc ({selectedEvaluationMonth === 'all' ? 'Tất cả' : `Tháng ${selectedEvaluationMonth}`})
                      </h4>
                    </div>
                    <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                      {filteredConductRecords.length} sự việc
                    </span>
                  </div>

                  {/* KHUNG CUỘN CHO BẢNG SỰ VIỆC (CHỈ DUY NHẤT BẢNG NÀY CÓ THANH CUỘN MƯỢT MÀ) */}
                  <div className="max-h-[260px] sm:max-h-[300px] lg:max-h-[340px] overflow-y-auto overflow-x-auto rounded-xl border border-slate-200/90 shadow-2xs divide-y divide-slate-100 custom-scrollbar scroll-smooth">
                    <table className="w-full text-left text-xs">
                      <thead className="sticky top-0 bg-slate-100/95 backdrop-blur-xs z-10 border-b border-slate-200 text-slate-600 font-bold shadow-2xs">
                        <tr>
                          <th className="py-2.5 px-3">Ngày</th>
                          <th className="py-2.5 px-3">Sự việc</th>
                          <th className="py-2.5 px-3 text-center">Điểm</th>
                          {isTeacherRole && <th className="py-2.5 px-3 text-right">Xóa</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {filteredConductRecords.length === 0 ? (
                          <tr>
                            <td colSpan={isTeacherRole ? 4 : 3} className="py-10 text-center text-slate-400">
                              Chưa có sự việc nào được ghi nhận trong {selectedEvaluationMonth === 'all' ? 'năm học này' : `Tháng ${selectedEvaluationMonth}`}.
                            </td>
                          </tr>
                        ) : (
                          filteredConductRecords.map((rec) => (
                            <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                              {/* Ngày */}
                              <td className="py-3 px-3 font-medium text-slate-600 whitespace-nowrap">
                                {formatDateVN(rec.date)}
                              </td>

                              {/* Sự việc & Chi tiết */}
                              <td className="py-3 px-3">
                                <div className="font-semibold text-slate-800">
                                  {rec.criterionName}
                                </div>
                                {rec.note && (
                                  <div className="text-[11px] text-slate-500 italic mt-0.5">
                                    {rec.note}
                                  </div>
                                )}
                              </td>

                              {/* Điểm */}
                              <td className="py-3 px-3 text-center whitespace-nowrap">
                                <span
                                  className={`inline-block px-2 py-0.5 rounded text-xs font-bold font-mono ${
                                    rec.points > 0
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                                  }`}
                                >
                                  {rec.points > 0 ? `+${rec.points}đ` : `${rec.points}đ`}
                                </span>
                              </td>

                              {/* Nút Xóa (Chỉ cho GVCN) */}
                              {isTeacherRole && (
                                <td className="py-3 px-3 text-right whitespace-nowrap">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (onDeleteConductRecord) {
                                        onDeleteConductRecord(rec.id);
                                      }
                                    }}
                                    className="text-xs font-semibold text-rose-600 hover:text-rose-800 hover:underline p-1 cursor-pointer"
                                    title="Xóa sự việc này"
                                  >
                                    Xóa
                                  </button>
                                </td>
                              )}
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Tổng kết lũy kế cả năm học */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span>
                      Điểm thi đua toàn năm: <b className="text-slate-800 font-mono">{cumulativeFinalScore}đ</b> (Chuẩn 100 | +{cumulativePraises} | -{cumulativeReminders})
                    </span>
                    <span className="font-semibold text-teal-700">
                      Hạnh kiểm năm: {calculateConductRating(cumulativeFinalScore, ratingThresholds).rating}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 1: THÔNG TIN                                         */}
          {/* ======================================================== */}
          {activeTab === 'info' && (
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                <h4 className="font-bold text-slate-900 text-sm mb-3">
                  Thông tin học sinh
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block font-semibold">Họ và tên</span>
                    <span className="font-bold text-slate-800 text-sm">{student.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">Mã học sinh</span>
                    <span className="font-bold text-blue-600 font-mono">{student.code}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">Giới tính</span>
                    <span className="font-semibold text-slate-800">{student.gender}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">Ngày sinh</span>
                    <span className="font-semibold text-slate-800">{formatDateVN(student.dob)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">Tổ</span>
                    <span className="font-semibold text-slate-800">Tổ {student.group}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">Chức vụ trong lớp</span>
                    <span className="font-bold text-teal-700">{student.role}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-semibold">Trạng thái</span>
                    <span className="font-semibold text-emerald-700">{student.status}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-slate-400 block font-semibold">Địa chỉ</span>
                    <span className="font-semibold text-slate-800">{student.address || 'Chưa cập nhật'}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100">
                  <span className="text-slate-400 block text-xs font-semibold mb-1">
                    Ghi chú của Giáo viên chủ nhiệm
                  </span>
                  <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    {student.note || 'Không có ghi chú đặc biệt.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: ĐIỂM DANH                                         */}
          {/* ======================================================== */}
          {activeTab === 'attendance' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-center">
                  <span className="text-[11px] text-slate-500 font-semibold block">Tỷ lệ có mặt</span>
                  <div className="text-xl font-black text-emerald-600 mt-1">{attendanceRate}%</div>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-center">
                  <span className="text-[11px] text-slate-500 font-semibold block">Có mặt</span>
                  <div className="text-xl font-black text-slate-800 mt-1">{presentCount} ngày</div>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-center">
                  <span className="text-[11px] text-slate-500 font-semibold block">Vắng có phép</span>
                  <div className="text-xl font-black text-blue-600 mt-1">{absentExcusedCount}</div>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-center">
                  <span className="text-[11px] text-slate-500 font-semibold block">Vắng không phép / Muộn</span>
                  <div className="text-xl font-black text-rose-600 mt-1">{absentUnexcusedCount + lateCount}</div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200">
                <h4 className="text-xs font-bold text-slate-800 mb-3">
                  Lịch sử điểm danh chi tiết ({studentAttendance.length} buổi ghi nhận)
                </h4>
                {studentAttendance.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center">Chưa có bản ghi điểm danh nào.</p>
                ) : (
                  <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
                    {studentAttendance.map((a) => (
                      <div key={a.id} className="py-2.5 flex items-center justify-between text-xs">
                        <span className="font-mono text-slate-700">{formatDateVN(a.date)}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            a.status === 'present'
                              ? 'bg-emerald-50 text-emerald-700'
                              : a.status === 'late'
                              ? 'bg-amber-50 text-amber-700'
                              : a.status === 'absent_excused'
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {a.status === 'present'
                            ? '🟢 Có mặt'
                            : a.status === 'late'
                            ? '🟡 Đi muộn'
                            : a.status === 'absent_excused'
                            ? '🔵 Có phép'
                            : '🔴 Không phép'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: HỌC TẬP                                           */}
          {/* ======================================================== */}
          {activeTab === 'academic' && (
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-sm">
                    Tình hình học tập
                  </h4>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      student.academicStatus === 'Tốt'
                        ? 'bg-emerald-50 text-emerald-700'
                        : student.academicStatus === 'Có tiến bộ'
                        ? 'bg-sky-50 text-sky-700'
                        : student.academicStatus === 'Ổn định'
                        ? 'bg-slate-100 text-slate-700'
                        : 'bg-rose-50 text-rose-700'
                    }`}
                  >
                    Đánh giá: {student.academicStatus}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="font-semibold text-slate-500 block mb-1">Môn thế mạnh</span>
                    <span className="font-bold text-emerald-800 text-sm">
                      {student.strengthSubjects || 'Chưa ghi nhận'}
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="font-semibold text-slate-500 block mb-1">Môn cần quan tâm / Hỗ trợ</span>
                    <span className="font-bold text-amber-800 text-sm">
                      {student.needsAttentionSubjects || 'Không có'}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-slate-500 font-semibold text-xs block mb-1">
                    Nhận xét học tập của GVCN
                  </span>
                  <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    {student.academicNote || 'Chưa có nhận xét riêng.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 5: SỔ TAY & LIÊN HỆ                                    */}
          {/* ======================================================== */}
          {activeTab === 'contact' && (
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
                <h4 className="font-bold text-slate-900 text-sm">
                  Thông tin phụ huynh & Liên hệ
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block font-semibold">Họ tên phụ huynh</span>
                    <span className="font-bold text-slate-800 text-sm">{student.parentName}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block font-semibold">Số điện thoại liên hệ</span>
                    {student.parentPhone ? (
                      <div className="flex items-center space-x-2 mt-0.5">
                        <span className="font-mono font-bold text-blue-600 text-sm">{student.parentPhone}</span>
                        <button
                          type="button"
                          onClick={() => handleCopyPhone(student.parentPhone || '')}
                          className="p-1 hover:bg-slate-100 rounded text-slate-500 cursor-pointer"
                          title="Sao chép số điện thoại"
                        >
                          {copiedPhone ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <a
                          href={`tel:${(student.parentPhone || '').replace(/\s+/g, '')}`}
                          className="px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded text-[11px] font-bold flex items-center gap-1"
                        >
                          <Phone className="w-3 h-3" /> Gọi
                        </a>
                      </div>
                    ) : (
                      <div className="text-slate-400 italic text-xs mt-1">Chưa cập nhật</div>
                    )}
                  </div>

                  <div className="sm:col-span-2">
                    <span className="text-slate-400 block font-semibold">Địa chỉ gia đình</span>
                    <span className="font-semibold text-slate-800">{student.address || 'Chưa cập nhật'}</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100">
                  <span className="text-slate-400 block text-xs font-semibold mb-1">
                    Nhật ký trao đổi với phụ huynh
                  </span>
                  <p className="text-xs text-slate-600 italic bg-slate-50 p-3 rounded-xl border border-slate-200">
                    Phối hợp thường xuyên qua Zalo/Điện thoại. Khi có sự việc thi đua cần thông báo kịp thời.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
