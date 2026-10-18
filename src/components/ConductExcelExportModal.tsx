import React, { useState, useMemo, useEffect } from 'react';
import {
  FileSpreadsheet,
  Calendar,
  X,
  Clock,
  School,
  UserCheck,
  Award,
  AlertTriangle,
  Download,
  Info,
  CheckCircle2,
  CalendarRange,
} from 'lucide-react';
import { Student, ConductRecord, ClassSettings } from '../types';
import {
  exportConductToExcel,
  getVietnamNow,
  toDateStringVN,
  computeConductSummary,
} from '../utils/conductExcelExport';
import { formatDateVN } from '../utils/storage';

interface ConductExcelExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  conduct: ConductRecord[];
  settings: ClassSettings;
  classNameTitle: string;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

type PeriodType = 'week' | 'month' | 'semester' | 'year' | 'custom';

export const ConductExcelExportModal: React.FC<ConductExcelExportModalProps> = ({
  isOpen,
  onClose,
  students,
  conduct,
  settings,
  classNameTitle,
  onShowToast,
}) => {
  const [periodType, setPeriodType] = useState<PeriodType>('month');

  // Sub-options
  const [weekSubOption, setWeekSubOption] = useState<'this_week' | 'last_week' | 'last_7_days'>('this_week');
  const [monthSubOption, setMonthSubOption] = useState<'this_month' | 'last_month' | 'custom_month'>('this_month');
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number>(() => getVietnamNow().getMonth()); // 0-11
  const [semesterSubOption, setSemesterSubOption] = useState<'semester_1' | 'semester_2'>('semester_1');

  // Custom date range
  const [customStartDate, setCustomStartDate] = useState<string>(() => {
    const vn = getVietnamNow();
    const firstDay = new Date(vn.getFullYear(), vn.getMonth(), 1);
    return toDateStringVN(firstDay);
  });
  const [customEndDate, setCustomEndDate] = useState<string>(() => {
    return toDateStringVN(getVietnamNow());
  });

  const [isExporting, setIsExporting] = useState(false);
  const [exportTimeStr, setExportTimeStr] = useState<string>('');

  // Cập nhật thời gian xuất thời gian thực
  useEffect(() => {
    const updateTime = () => {
      const now = getVietnamNow();
      const hours = String(now.getHours()).padStart(2, '0');
      const mins = String(now.getMinutes()).padStart(2, '0');
      const secs = String(now.getSeconds()).padStart(2, '0');
      const dateVN = formatDateVN(toDateStringVN(now));
      setExportTimeStr(`${hours}:${mins}:${secs}, ngày ${dateVN}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Tính toán khoảng ngày [startDateStr, endDateStr] và tên nhãn theo kỳ
  const { startDateStr, endDateStr, periodLabel } = useMemo(() => {
    const vnNow = getVietnamNow();
    const currentYear = vnNow.getFullYear();

    if (periodType === 'week') {
      if (weekSubOption === 'this_week') {
        const day = vnNow.getDay();
        const diffToMonday = day === 0 ? -6 : 1 - day;
        const monday = new Date(vnNow);
        monday.setDate(vnNow.getDate() + diffToMonday);
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        return {
          startDateStr: toDateStringVN(monday),
          endDateStr: toDateStringVN(sunday),
          periodLabel: 'Tuần này',
        };
      }
      if (weekSubOption === 'last_week') {
        const day = vnNow.getDay();
        const diffToMonday = day === 0 ? -6 : 1 - day;
        const lastMonday = new Date(vnNow);
        lastMonday.setDate(vnNow.getDate() + diffToMonday - 7);
        const lastSunday = new Date(lastMonday);
        lastSunday.setDate(lastMonday.getDate() + 6);
        return {
          startDateStr: toDateStringVN(lastMonday),
          endDateStr: toDateStringVN(lastSunday),
          periodLabel: 'Tuần trước',
        };
      }
      // 7 ngày gần nhất
      const past7 = new Date(vnNow);
      past7.setDate(vnNow.getDate() - 6);
      return {
        startDateStr: toDateStringVN(past7),
        endDateStr: toDateStringVN(vnNow),
        periodLabel: '7 ngày gần nhất',
      };
    }

    if (periodType === 'month') {
      if (monthSubOption === 'this_month') {
        const firstDay = new Date(vnNow.getFullYear(), vnNow.getMonth(), 1);
        const lastDay = new Date(vnNow.getFullYear(), vnNow.getMonth() + 1, 0);
        return {
          startDateStr: toDateStringVN(firstDay),
          endDateStr: toDateStringVN(lastDay),
          periodLabel: `Tháng ${vnNow.getMonth() + 1}/${vnNow.getFullYear()}`,
        };
      }
      if (monthSubOption === 'last_month') {
        const firstDay = new Date(vnNow.getFullYear(), vnNow.getMonth() - 1, 1);
        const lastDay = new Date(vnNow.getFullYear(), vnNow.getMonth(), 0);
        return {
          startDateStr: toDateStringVN(firstDay),
          endDateStr: toDateStringVN(lastDay),
          periodLabel: `Tháng ${firstDay.getMonth() + 1}/${firstDay.getFullYear()}`,
        };
      }
      // Tháng cụ thể được chọn
      const targetYear = selectedMonthIndex >= 8 ? currentYear : currentYear;
      const firstDay = new Date(targetYear, selectedMonthIndex, 1);
      const lastDay = new Date(targetYear, selectedMonthIndex + 1, 0);
      return {
        startDateStr: toDateStringVN(firstDay),
        endDateStr: toDateStringVN(lastDay),
        periodLabel: `Tháng ${selectedMonthIndex + 1}/${targetYear}`,
      };
    }

    if (periodType === 'semester') {
      if (semesterSubOption === 'semester_1') {
        // Học kỳ 1: từ 01/09 đến 15/01 năm sau
        const sYear = vnNow.getMonth() >= 7 ? currentYear : currentYear - 1;
        const start = `${sYear}-09-01`;
        const end = `${sYear + 1}-01-15`;
        return {
          startDateStr: start,
          endDateStr: end,
          periodLabel: 'Học kỳ 1',
        };
      } else {
        // Học kỳ 2: từ 16/01 đến 31/05
        const sYear = vnNow.getMonth() >= 7 ? currentYear + 1 : currentYear;
        const start = `${sYear}-01-16`;
        const end = `${sYear}-05-31`;
        return {
          startDateStr: start,
          endDateStr: end,
          periodLabel: 'Học kỳ 2',
        };
      }
    }

    if (periodType === 'year') {
      // Cả năm học: từ 01/09 đến 31/05 năm sau
      const sYear = vnNow.getMonth() >= 7 ? currentYear : currentYear - 1;
      const start = `${sYear}-09-01`;
      const end = `${sYear + 1}-05-31`;
      return {
        startDateStr: start,
        endDateStr: end,
        periodLabel: `Cả năm học ${settings.academicYear || `${sYear} - ${sYear + 1}`}`,
      };
    }

    // Khoảng ngày tùy chọn
    return {
      startDateStr: customStartDate,
      endDateStr: customEndDate,
      periodLabel: `Tùy chọn (${formatDateVN(customStartDate)} - ${formatDateVN(customEndDate)})`,
    };
  }, [
    periodType,
    weekSubOption,
    monthSubOption,
    selectedMonthIndex,
    semesterSubOption,
    customStartDate,
    customEndDate,
    settings.academicYear,
  ]);

  // Kiểm tra tính hợp lệ của khoảng ngày
  const isDateRangeValid = useMemo(() => {
    if (!startDateStr || !endDateStr) return false;
    return startDateStr <= endDateStr;
  }, [startDateStr, endDateStr]);

  // Xem trước số liệu thi đua theo kỳ đã chọn
  const previewData = useMemo(() => {
    if (!isOpen || !students || students.length === 0 || !isDateRangeValid) {
      return null;
    }
    try {
      return computeConductSummary(
        students,
        conduct,
        startDateStr,
        endDateStr,
        settings.ratingThresholds
      );
    } catch {
      return null;
    }
  }, [isOpen, students, conduct, startDateStr, endDateStr, isDateRangeValid, settings.ratingThresholds]);

  if (!isOpen) return null;

  const handleExport = () => {
    if (!isDateRangeValid) {
      onShowToast('Khoảng ngày không hợp lệ! Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.', 'error');
      return;
    }

    if (!students || students.length === 0) {
      onShowToast('Không có dữ liệu học sinh trong lớp đang chọn để xuất file!', 'error');
      return;
    }

    setIsExporting(true);
    try {
      const result = exportConductToExcel({
        students,
        conduct,
        settings,
        classNameTitle: classNameTitle || settings.className || 'Lớp 9A5',
        periodLabel,
        startDateStr,
        endDateStr,
        exportTimestamp: exportTimeStr,
      });

      onShowToast(
        `Đã xuất thành công tệp "${result.fileName}" gồm ${result.totalStudents} học sinh và ${result.totalRecords} ghi nhận thi đua!`,
        'success'
      );
      onClose();
    } catch (err: any) {
      console.error(err);
      onShowToast(err.message || 'Lỗi khi xuất file Excel thi đua. Vui lòng thử lại!', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const totMin = settings.ratingThresholds?.year?.totMin ?? 90;
  const khaMin = settings.ratingThresholds?.year?.khaMin ?? 75;
  const datMin = settings.ratingThresholds?.year?.datMin ?? 50;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-blue-700 via-indigo-700 to-teal-600 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-white/15 rounded-2xl backdrop-blur-md shadow-inner">
              <FileSpreadsheet className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-black text-lg sm:text-xl tracking-tight leading-tight">
                Xuất Excel Thi Đua Toàn Bộ Học Sinh
              </h3>
              <p className="text-xs text-blue-100/90 font-medium mt-0.5">
                {classNameTitle || settings.className} • Trường {settings.schoolName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
            title="Đóng hộp thoại"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-slate-700">
          {/* Thông tin lớp & Thời gian xuất */}
          <div className="bg-gradient-to-br from-blue-50/80 via-indigo-50/50 to-slate-50 p-4 rounded-2xl border border-blue-100/80 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="flex items-center space-x-2.5">
              <School className="w-4 h-4 text-blue-600 shrink-0" />
              <div className="truncate">
                <span className="text-slate-400 font-medium">Lớp đang chọn:</span>{' '}
                <strong className="text-slate-800 font-bold">{classNameTitle || settings.className}</strong>
                <span className="ml-1 text-blue-700 font-semibold">({students.length} học sinh)</span>
              </div>
            </div>

            <div className="flex items-center space-x-2.5">
              <UserCheck className="w-4 h-4 text-teal-600 shrink-0" />
              <div className="truncate">
                <span className="text-slate-400 font-medium">Giáo viên chủ nhiệm:</span>{' '}
                <strong className="text-slate-800 font-bold">{settings.teacherName}</strong>
              </div>
            </div>

            <div className="flex items-center space-x-2.5">
              <Calendar className="w-4 h-4 text-indigo-600 shrink-0" />
              <div>
                <span className="text-slate-400 font-medium">Năm học:</span>{' '}
                <strong className="text-slate-800 font-bold">{settings.academicYear}</strong>
              </div>
            </div>

            <div className="flex items-center space-x-2.5">
              <Clock className="w-4 h-4 text-amber-600 shrink-0" />
              <div>
                <span className="text-slate-400 font-medium">Thời gian xuất:</span>{' '}
                <strong className="text-slate-800 font-bold">{exportTimeStr || 'Đang cập nhật...'}</strong>
              </div>
            </div>
          </div>

          {/* Chọn kỳ báo cáo */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <CalendarRange className="w-4 h-4 text-blue-600" />
              <span>1. Chọn kỳ báo cáo thi đua:</span>
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { id: 'week', label: 'Theo Tuần' },
                { id: 'month', label: 'Theo Tháng' },
                { id: 'semester', label: 'Học kỳ' },
                { id: 'year', label: 'Cả năm' },
                { id: 'custom', label: 'Tùy chọn' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setPeriodType(tab.id as PeriodType)}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                    periodType === tab.id
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Chi tiết tùy chọn theo từng kỳ */}
            <div className="p-3.5 bg-slate-50 border border-slate-200/90 rounded-2xl text-xs">
              {periodType === 'week' && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-slate-600">Chọn tuần:</span>
                  {[
                    { id: 'this_week', label: 'Tuần này' },
                    { id: 'last_week', label: 'Tuần trước' },
                    { id: 'last_7_days', label: '7 ngày gần nhất' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setWeekSubOption(opt.id as any)}
                      className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                        weekSubOption === opt.id
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}

              {periodType === 'month' && (
                <div className="space-y-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-slate-600">Chọn tháng:</span>
                    {[
                      { id: 'this_month', label: 'Tháng này' },
                      { id: 'last_month', label: 'Tháng trước' },
                      { id: 'custom_month', label: 'Chọn tháng khác' },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setMonthSubOption(opt.id as any)}
                        className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                          monthSubOption === opt.id
                            ? 'bg-blue-600 text-white shadow-2xs'
                            : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  {monthSubOption === 'custom_month' && (
                    <div className="pt-2 border-t border-slate-200/80 flex items-center gap-2">
                      <span className="text-slate-600">Tháng:</span>
                      <select
                        value={selectedMonthIndex}
                        onChange={(e) => setSelectedMonthIndex(Number(e.target.value))}
                        className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                      >
                        {Array.from({ length: 12 }, (_, i) => (
                          <option key={i} value={i}>
                            Tháng {i + 1}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              {periodType === 'semester' && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-slate-600">Chọn học kỳ:</span>
                  {[
                    { id: 'semester_1', label: 'Học kỳ 1 (Tháng 9 – Tháng 1)' },
                    { id: 'semester_2', label: 'Học kỳ 2 (Tháng 1 – Tháng 5)' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSemesterSubOption(opt.id as any)}
                      className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                        semesterSubOption === opt.id
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}

              {periodType === 'year' && (
                <div className="text-slate-600">
                  Xuất dữ liệu thi đua trọn vẹn trong toàn bộ năm học <b>{settings.academicYear}</b>.
                </div>
              )}

              {periodType === 'custom' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                      Từ ngày (Bao gồm):
                    </label>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                      Đến ngày (Bao gồm):
                    </label>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}

              {/* Tóm tắt khoảng ngày thực tế sẽ lấy */}
              <div className="mt-3 pt-2.5 border-t border-slate-200 flex items-center justify-between font-medium">
                <span className="text-slate-500">Khoảng thời gian xuất:</span>
                <span className="font-bold text-blue-700">
                  Từ ngày {formatDateVN(startDateStr)} đến ngày {formatDateVN(endDateStr)}
                </span>
              </div>
            </div>
          </div>

          {/* Quy tắc tính điểm & Xếp loại của ứng dụng */}
          <div className="bg-amber-50/70 p-3.5 rounded-2xl border border-amber-200/80 text-xs space-y-1.5">
            <div className="font-bold text-amber-900 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-600" />
              <span>Quy tắc tính điểm & xếp loại thi đua của ứng dụng:</span>
            </div>
            <ul className="text-amber-800/90 list-disc list-inside space-y-0.5 pl-1 leading-relaxed">
              <li>
                <b>Điểm nền ban đầu:</b> 100 điểm. <b>Tổng điểm thi đua</b> = 100 + Điểm cộng - Điểm trừ (dương).
              </li>
              <li>
                <b>Xếp loại hạnh kiểm/thi đua:</b> Tốt (≥ {totMin}đ), Khá (≥ {khaMin}đ), Đạt (≥ {datMin}đ), Chưa đạt (&lt; {datMin}đ).
              </li>
              <li>
                <b>Xếp hạng:</b> Sắp xếp theo tổng điểm giảm dần. Học sinh bằng điểm được xếp cùng một thứ hạng.
              </li>
              <li>
                <b>Học sinh chưa có ghi nhận:</b> Giữ nguyên điểm nền 100 điểm, điểm cộng = 0, điểm trừ = 0, xếp loại Tốt.
              </li>
            </ul>
          </div>

          {/* Thống kê dữ liệu thực tế trước khi xuất */}
          {previewData ? (
            <div className="bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-200/80 text-xs">
              <div className="font-bold text-emerald-900 flex items-center gap-1.5 mb-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Số liệu thực tế sẽ được xuất vào file Excel:</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                <div className="bg-white p-2 rounded-xl border border-emerald-100 shadow-2xs">
                  <div className="text-base font-black text-slate-800">{previewData.summaries.length}</div>
                  <div className="text-[11px] text-slate-500 font-medium">Học sinh (Đầy đủ 100%)</div>
                </div>
                <div className="bg-white p-2 rounded-xl border border-emerald-100 shadow-2xs">
                  <div className="text-base font-black text-blue-600">{previewData.periodRecords.length}</div>
                  <div className="text-[11px] text-slate-500 font-medium">Sự việc trong kỳ</div>
                </div>
                <div className="bg-white p-2 rounded-xl border border-emerald-100 shadow-2xs">
                  <div className="text-base font-black text-emerald-600">
                    {previewData.periodRecords.filter((r) => r.type === 'praise').length}
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium">Lượt tích cực (+)</div>
                </div>
                <div className="bg-white p-2 rounded-xl border border-emerald-100 shadow-2xs">
                  <div className="text-base font-black text-rose-600">
                    {previewData.periodRecords.filter((r) => r.type === 'reminder').length}
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium">Lượt vi phạm (-)</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-rose-50 p-3 rounded-2xl border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>Khoảng thời gian không hợp lệ hoặc không có dữ liệu học sinh trong lớp đang chọn.</span>
            </div>
          )}

          {/* Cấu trúc 2 sheet của file Excel */}
          <div className="text-[11px] text-slate-500 bg-slate-50 p-3 rounded-2xl border border-slate-200 flex items-start gap-2">
            <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              Tệp <b>.xlsx</b> xuất ra gồm 2 sheet chuẩn hóa: <b>“Tổng hợp thi đua”</b> (bảng điểm, xếp loại, thứ hạng, cố định tiêu đề và bật lọc) và <b>“Chi tiết ghi nhận”</b> (tất cả từng sự việc tích cực / vi phạm kèm thời gian và người ghi nhận).
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting || !isDateRangeValid}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? 'Đang xuất Excel...' : 'Tải file Excel thi đua (.xlsx)'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
