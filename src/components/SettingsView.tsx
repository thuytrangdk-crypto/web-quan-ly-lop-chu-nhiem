import React, { useState } from 'react';
import {
  Settings,
  Download,
  Upload,
  RotateCcw,
  Trash2,
  FileCode,
  ShieldCheck,
  Save,
  Check,
  Copy,
  Info,
  FileSpreadsheet,
  Award,
  Plus,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  Sliders,
} from 'lucide-react';
import { ClassSettings, ConductCriterion, ConductRatingThresholds } from '../types';
import { AppState, exportBackupJSON, importBackupJSON } from '../utils/storage';
import { generateStandaloneHtml } from '../utils/generateStandaloneHtml';
import { DEFAULT_CRITERIA } from '../data/sampleData';

interface SettingsViewProps {
  settings: ClassSettings;
  criteria: ConductCriterion[];
  fullState: AppState;
  isTeacherLoggedIn?: boolean;
  onUpdateSettings: (settings: ClassSettings) => void;
  onUpdateCriteria: (criteria: ConductCriterion[]) => void;
  onRestoreState: (state: AppState) => void;
  onResetToSampleData: () => void;
  onRequestConfirmReset: () => void;
  onRequestConfirmClear: () => void;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onOpenClassSwitchModal: () => void;
  onOpenExcelImport: () => void;
  onOpenTeacherLoginModal?: () => void;
  onOpenChangePasswordModal?: () => void;
  onTeacherLogout?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  criteria,
  fullState,
  isTeacherLoggedIn = true,
  onUpdateSettings,
  onUpdateCriteria,
  onRestoreState,
  onRequestConfirmReset,
  onRequestConfirmClear,
  onShowToast,
  onOpenClassSwitchModal,
  onOpenExcelImport,
  onOpenTeacherLoginModal,
  onOpenChangePasswordModal,
  onTeacherLogout,
}) => {
  const [formData, setFormData] = useState<ClassSettings>(settings);
  const [isCopiedHtml, setIsCopiedHtml] = useState(false);
  const [showCodePreview, setShowCodePreview] = useState(false);

  // Criteria State
  const [criteriaList, setCriteriaList] = useState<ConductCriterion[]>(criteria || DEFAULT_CRITERIA);
  const [isAddingCriterion, setIsAddingCriterion] = useState(false);
  const [newCritName, setNewCritName] = useState('');
  const [newCritType, setNewCritType] = useState<'praise' | 'reminder'>('reminder');
  const [newCritPoints, setNewCritPoints] = useState<number>(-1);
  const [newCritCategory, setNewCritCategory] = useState('Chuyên cần');

  // Rating Thresholds State
  const [ratingThresholds, setRatingThresholds] = useState<ConductRatingThresholds>(
    settings.ratingThresholds || {
      month: { totMin: 0, khaMin: -3, datMin: -7 },
      year: { totMin: 90, khaMin: 75, datMin: 50 },
    }
  );

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedSettings = {
      ...formData,
      ratingThresholds,
    };
    onUpdateSettings(updatedSettings);
    onShowToast('Đã lưu thông tin lớp và giáo viên thành công!');
  };

  const handleSaveCriteriaAndRatings = () => {
    onUpdateCriteria(criteriaList);
    const updatedSettings = {
      ...formData,
      ratingThresholds,
    };
    onUpdateSettings(updatedSettings);
    onShowToast('Đã lưu cài đặt tiêu chí sự việc và khung điểm xếp loại!');
  };

  const handleAddCriterionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCritName.trim()) {
      onShowToast('Vui lòng nhập tên sự việc', 'error');
      return;
    }

    const calculatedPoints =
      newCritType === 'praise'
        ? Math.abs(newCritPoints) || 2
        : -Math.abs(newCritPoints) || -1;

    const newCrit: ConductCriterion = {
      id: `crit-${Date.now()}`,
      name: newCritName.trim(),
      points: calculatedPoints,
      type: newCritType,
      category: newCritCategory,
    };

    const updated = [...criteriaList, newCrit];
    setCriteriaList(updated);
    onUpdateCriteria(updated);
    onShowToast(`Đã thêm sự việc: "${newCrit.name}" (${calculatedPoints > 0 ? `+${calculatedPoints}` : calculatedPoints}đ)!`);

    setNewCritName('');
    setIsAddingCriterion(false);
  };

  const handleDeleteCriterion = (id: string, name: string) => {
    if (confirm(`Cô có chắc chắn muốn xóa sự việc "${name}"?`)) {
      const updated = criteriaList.filter((c) => c.id !== id);
      setCriteriaList(updated);
      onUpdateCriteria(updated);
      onShowToast(`Đã xóa sự việc: "${name}"`);
    }
  };

  const handleUpdateCriterionPoint = (id: string, points: number) => {
    const updated = criteriaList.map((c) => {
      if (c.id === id) {
        return {
          ...c,
          points,
          type: points >= 0 ? ('praise' as const) : ('reminder' as const),
        };
      }
      return c;
    });
    setCriteriaList(updated);
  };

  const handleResetCriteriaToDefault = () => {
    if (confirm('Khôi phục danh sách tiêu chí sự việc về mặc định chuẩn của lớp 8?')) {
      setCriteriaList(DEFAULT_CRITERIA);
      onUpdateCriteria(DEFAULT_CRITERIA);
      onShowToast('Đã khôi phục danh sách tiêu chí mặc định!');
    }
  };

  const handleExportJSON = () => {
    exportBackupJSON(fullState);
    onShowToast('Đã xuất file sao lưu JSON thành công!');
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    importBackupJSON(file)
      .then((restored) => {
        onRestoreState(restored);
        setFormData(restored.settings);
        onShowToast('Đã khôi phục dữ liệu từ tệp thành công!');
      })
      .catch((err) => {
        onShowToast('Tệp sao lưu không hợp lệ hoặc bị lỗi!', 'error');
        console.error(err);
      });
  };

  const handleDownloadStandaloneHtml = () => {
    const htmlContent = generateStandaloneHtml(fullState);
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TroLyChuNhiemLop8_CoThuyTrang_DocLap.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onShowToast('Đã tạo và tải xuống file HTML độc lập hoàn chỉnh!');
  };

  const handleCopyStandaloneHtml = () => {
    const htmlContent = generateStandaloneHtml(fullState);
    navigator.clipboard.writeText(htmlContent);
    setIsCopiedHtml(true);
    onShowToast('Đã sao chép toàn bộ mã nguồn file HTML vào clipboard!');
    setTimeout(() => setIsCopiedHtml(false), 3000);
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* ======================================================== */}
      {/* KHỐI 0: CÀI ĐẶT SỰ VIỆC THI ĐUA & KHUNG ĐIỂM XẾP LOẠI     */}
      {/* (THEO YÊU CẦU CỦA CÔ: THÊM BỚT SỰ VIỆC, ĐIỂM CỘNG/TRỪ,   */}
      {/* VÀ ĐIỂM TỔNG XẾP LOẠI TƯƠNG ỨNG)                         */}
      {/* ======================================================== */}
      <div className="bg-white rounded-2xl border-2 border-indigo-200 shadow-md p-5 sm:p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-indigo-100 gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-100">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                  CÀI ĐẶT SỰ VIỆC THI ĐUA & KHUNG ĐIỂM XẾP LOẠI
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800">
                  {criteriaList.length} sự việc
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Cô có thể thêm bớt sự việc, chỉnh sửa mức điểm cộng/trừ và điều chỉnh khung điểm xếp loại tháng - năm
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsAddingCriterion(!isAddingCriterion)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>{isAddingCriterion ? 'Đóng form thêm' : '+ Thêm sự việc mới'}</span>
            </button>
            <button
              type="button"
              onClick={handleSaveCriteriaAndRatings}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
            >
              <Save className="w-4 h-4" />
              <span>Lưu cài đặt</span>
            </button>
          </div>
        </div>

        {/* PHẦN 1: CÀI ĐẶT KHUNG ĐIỂM XẾP LOẠI HẠNH KIỂM (THÁNG & NĂM) */}
        <div className="bg-slate-50/80 rounded-2xl p-4 sm:p-5 border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-indigo-600" />
              <h4 className="font-bold text-slate-800 text-xs sm:text-sm">
                1. Khung điểm tổng xếp loại hạnh kiểm tương ứng
              </h4>
            </div>
            <span className="text-[11px] text-slate-500 italic">
              (Tự động xếp loại Tốt / Khá / Đạt / Chưa đạt)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Cột 1: Xếp loại theo Tháng */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="font-bold text-indigo-900 border-b border-slate-100 pb-1.5 flex items-center justify-between">
                <span>🗓️ Xếp loại Tháng (Tính theo điểm +/-)</span>
                <span className="text-[11px] font-normal text-slate-500">Mức điểm tối thiểu</span>
              </div>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-700">Xếp loại TỐT:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500">Tổng điểm ≥</span>
                    <input
                      type="number"
                      value={ratingThresholds.month.totMin}
                      onChange={(e) =>
                        setRatingThresholds({
                          ...ratingThresholds,
                          month: { ...ratingThresholds.month, totMin: Number(e.target.value) },
                        })
                      }
                      className="w-16 p-1.5 text-center font-mono font-bold bg-slate-50 border border-slate-300 rounded-lg text-xs"
                    />
                    <span className="text-slate-500">điểm</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-700">Xếp loại KHÁ:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500">Tổng điểm ≥</span>
                    <input
                      type="number"
                      value={ratingThresholds.month.khaMin}
                      onChange={(e) =>
                        setRatingThresholds({
                          ...ratingThresholds,
                          month: { ...ratingThresholds.month, khaMin: Number(e.target.value) },
                        })
                      }
                      className="w-16 p-1.5 text-center font-mono font-bold bg-slate-50 border border-slate-300 rounded-lg text-xs"
                    />
                    <span className="text-slate-500">điểm</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-700">Xếp loại ĐẠT:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500">Tổng điểm ≥</span>
                    <input
                      type="number"
                      value={ratingThresholds.month.datMin}
                      onChange={(e) =>
                        setRatingThresholds({
                          ...ratingThresholds,
                          month: { ...ratingThresholds.month, datMin: Number(e.target.value) },
                        })
                      }
                      className="w-16 p-1.5 text-center font-mono font-bold bg-slate-50 border border-slate-300 rounded-lg text-xs"
                    />
                    <span className="text-slate-500">điểm</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-slate-500 pt-1 border-t border-slate-100 text-[11px]">
                  <span className="font-semibold text-rose-700">CHƯA ĐẠT:</span>
                  <span>Dưới mức Đạt (&lt; {ratingThresholds.month.datMin} điểm)</span>
                </div>
              </div>
            </div>

            {/* Cột 2: Xếp loại cả Năm (Lũy kế 100 điểm) */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
              <div className="font-bold text-teal-900 border-b border-slate-100 pb-1.5 flex items-center justify-between">
                <span>🏆 Xếp loại Cả Năm (Chuẩn 100 điểm)</span>
                <span className="text-[11px] font-normal text-slate-500">Mức điểm tối thiểu</span>
              </div>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-700">Hạnh kiểm TỐT:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500">Điểm tổng ≥</span>
                    <input
                      type="number"
                      value={ratingThresholds.year.totMin}
                      onChange={(e) =>
                        setRatingThresholds({
                          ...ratingThresholds,
                          year: { ...ratingThresholds.year, totMin: Number(e.target.value) },
                        })
                      }
                      className="w-16 p-1.5 text-center font-mono font-bold bg-slate-50 border border-slate-300 rounded-lg text-xs"
                    />
                    <span className="text-slate-500">điểm</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-700">Hạnh kiểm KHÁ:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500">Điểm tổng ≥</span>
                    <input
                      type="number"
                      value={ratingThresholds.year.khaMin}
                      onChange={(e) =>
                        setRatingThresholds({
                          ...ratingThresholds,
                          year: { ...ratingThresholds.year, khaMin: Number(e.target.value) },
                        })
                      }
                      className="w-16 p-1.5 text-center font-mono font-bold bg-slate-50 border border-slate-300 rounded-lg text-xs"
                    />
                    <span className="text-slate-500">điểm</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-700">Hạnh kiểm ĐẠT:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500">Điểm tổng ≥</span>
                    <input
                      type="number"
                      value={ratingThresholds.year.datMin}
                      onChange={(e) =>
                        setRatingThresholds({
                          ...ratingThresholds,
                          year: { ...ratingThresholds.year, datMin: Number(e.target.value) },
                        })
                      }
                      className="w-16 p-1.5 text-center font-mono font-bold bg-slate-50 border border-slate-300 rounded-lg text-xs"
                    />
                    <span className="text-slate-500">điểm</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-slate-500 pt-1 border-t border-slate-100 text-[11px]">
                  <span className="font-semibold text-rose-700">CHƯA ĐẠT:</span>
                  <span>Dưới mức Đạt (&lt; {ratingThresholds.year.datMin} điểm)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* PHẦN 2: FORM THÊM SỰ VIỆC MỚI (NẾU MỞ) */}
        {isAddingCriterion && (
          <form
            onSubmit={handleAddCriterionSubmit}
            className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-2xl space-y-3 animate-in fade-in duration-150 text-xs"
          >
            <div className="font-bold text-indigo-950 text-sm flex items-center gap-2">
              <Plus className="w-4 h-4 text-indigo-600" />
              <span>Thêm sự việc thi đua mới</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-6">
                <label className="block font-semibold text-slate-700 mb-1">
                  Tên sự việc *
                </label>
                <input
                  type="text"
                  required
                  value={newCritName}
                  onChange={(e) => setNewCritName(e.target.value)}
                  placeholder="VD: Không chuẩn bị bài, Điểm 10 kiểm tra..."
                  className="w-full p-2 bg-white border border-slate-300 rounded-xl font-medium"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block font-semibold text-slate-700 mb-1">
                  Loại ghi nhận
                </label>
                <select
                  value={newCritType}
                  onChange={(e) => {
                    const t = e.target.value as 'praise' | 'reminder';
                    setNewCritType(t);
                    if (t === 'praise' && newCritPoints < 0) setNewCritPoints(2);
                    if (t === 'reminder' && newCritPoints > 0) setNewCritPoints(-1);
                  }}
                  className="w-full p-2 bg-white border border-slate-300 rounded-xl font-medium"
                >
                  <option value="reminder">⚠️ Vi phạm / Nhắc nhở (-)</option>
                  <option value="praise">⭐ Tuyên dương / Khen (+)</option>
                </select>
              </div>

              <div className="sm:col-span-3">
                <label className="block font-semibold text-slate-700 mb-1">
                  Số điểm {newCritType === 'praise' ? 'cộng (+)' : 'trừ (-)'}
                </label>
                <input
                  type="number"
                  required
                  value={newCritPoints}
                  onChange={(e) => setNewCritPoints(Number(e.target.value))}
                  placeholder="-1 hoặc 2"
                  className="w-full p-2 bg-white border border-slate-300 rounded-xl font-mono font-bold"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddingCriterion(false)}
                className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl font-semibold cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold cursor-pointer shadow-xs"
              >
                Lưu sự việc vào danh sách
              </button>
            </div>
          </form>
        )}

        {/* PHẦN 3: DANH SÁCH TOÀN BỘ SỰ VIỆC VÀ ĐIỂM CỘNG/TRỪ */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-slate-800 text-xs sm:text-sm">
              2. Danh sách các sự việc & Mức điểm cộng - trừ tương ứng
            </h4>
            <button
              type="button"
              onClick={handleResetCriteriaToDefault}
              className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 underline cursor-pointer"
            >
              Khôi phục danh sách mặc định
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">STT</th>
                  <th className="py-2.5 px-3">Tên sự việc</th>
                  <th className="py-2.5 px-3">Phân loại</th>
                  <th className="py-2.5 px-3 text-center">Mức điểm (+ / -)</th>
                  <th className="py-2.5 px-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {criteriaList.map((crit, idx) => (
                  <tr key={crit.id} className="hover:bg-slate-50/60">
                    <td className="py-2 px-3 text-slate-400 font-bold text-center w-10">
                      {idx + 1}
                    </td>
                    <td className="py-2 px-3 font-semibold text-slate-800">
                      {crit.name}
                    </td>
                    <td className="py-2 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                          crit.type === 'praise'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {crit.type === 'praise' ? 'Tuyên dương (+)' : 'Nhắc nhở (-)'}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-center">
                      <div className="inline-flex items-center gap-1">
                        <input
                          type="number"
                          value={crit.points}
                          onChange={(e) => handleUpdateCriterionPoint(crit.id, Number(e.target.value))}
                          className={`w-16 p-1 text-center font-mono font-bold rounded-lg border text-xs ${
                            crit.points > 0
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : 'bg-rose-50 text-rose-800 border-rose-300'
                          }`}
                        />
                        <span className="text-slate-400 font-mono">đ</span>
                      </div>
                    </td>
                    <td className="py-2 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeleteCriterion(crit.id, crit.name)}
                        className="text-rose-600 hover:text-rose-800 hover:underline p-1 cursor-pointer font-semibold"
                        title="Xóa sự việc này"
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={handleSaveCriteriaAndRatings}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-sm transition-all cursor-pointer text-xs sm:text-sm"
          >
            <CheckCircle2 className="w-4 h-4" />
            Lưu toàn bộ cài đặt sự việc & điểm xếp loại
          </button>
        </div>
      </div>

      {/* KHỐI 1: CÀI ĐẶT THÔNG TIN LỚP HỌC & GIÁO VIÊN */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6">
        <div className="flex items-center space-x-2.5 pb-4 border-b border-slate-100">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm sm:text-base">
              THÔNG TIN LỚP HỌC & GIÁO VIÊN CHỦ NHIỆM
            </h3>
            <p className="text-xs text-slate-400">
              Cô có thể dễ dàng thay đổi tên lớp, trường hoặc niên khóa bất cứ lúc nào
            </p>
          </div>
        </div>

        <form onSubmit={handleSaveSettings} className="mt-5 space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Tên trường học
              </label>
              <input
                type="text"
                value={formData.schoolName}
                onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-xs sm:text-sm font-semibold text-slate-800"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-semibold text-slate-700">
                  Tên lớp chủ nhiệm
                </label>
                <button
                  type="button"
                  onClick={onOpenClassSwitchModal}
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-800 underline cursor-pointer"
                >
                  Đổi / Quản lý lớp &rarr;
                </button>
              </div>
              <input
                type="text"
                value={formData.className}
                onChange={(e) => setFormData({ ...formData, className: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-xs sm:text-sm font-semibold text-slate-800"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Tên giáo viên chủ nhiệm
              </label>
              <input
                type="text"
                value={formData.teacherName}
                onChange={(e) => setFormData({ ...formData, teacherName: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-xs sm:text-sm font-semibold text-slate-800"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Năm học
              </label>
              <input
                type="text"
                value={formData.academicYear}
                onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-xs sm:text-sm font-semibold text-slate-800"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Học kỳ áp dụng
              </label>
              <select
                value={formData.semester}
                onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white text-xs sm:text-sm font-semibold text-slate-800"
              >
                <option value="Học kỳ I">Học kỳ I</option>
                <option value="Học kỳ II">Học kỳ II</option>
                <option value="Cả năm học">Cả năm học</option>
              </select>
            </div>
          </div>

          <div className="pt-3 flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-xs transition-colors cursor-pointer text-xs sm:text-sm"
            >
              <Save className="w-4 h-4" />
              Lưu thay đổi thông tin
            </button>
          </div>
        </form>
      </div>

      {/* KHỐI 1.5: BẢO MẬT & MẬT KHẨU GIÁO VIÊN CHỦ NHIỆM */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6">
        <div className="flex items-center space-x-2.5 pb-4 border-b border-slate-100">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm sm:text-base">
              BẢO MẬT & MẬT KHẨU GIÁO VIÊN CHỦ NHIỆM
            </h3>
            <p className="text-xs text-slate-400">
              Mật khẩu riêng của giáo viên để mở khóa toàn bộ hồ sơ học sinh và ghi nhận sự việc
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div className="space-y-1">
            <div className="text-xs font-bold text-slate-800 flex items-center gap-2">
              <span>Trạng thái:</span>
              {isTeacherLoggedIn ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Đang đăng nhập (Toàn quyền quản lý)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                  🔒 Đã khóa (Chế độ riêng tư học sinh)
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500">
              Mật khẩu mặc định là: <b className="font-mono text-slate-700">123456</b>. Cô có thể đổi sang mật khẩu riêng bất cứ lúc nào.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onOpenChangePasswordModal && (
              <button
                type="button"
                onClick={onOpenChangePasswordModal}
                className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                🔑 Đổi mật khẩu GVCN
              </button>
            )}

            {isTeacherLoggedIn ? (
              onTeacherLogout && (
                <button
                  type="button"
                  onClick={onTeacherLogout}
                  className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  🔒 Khóa / Đăng xuất
                </button>
              )
            ) : (
              onOpenTeacherLoginModal && (
                <button
                  type="button"
                  onClick={onOpenTeacherLoginModal}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
                >
                  Đăng nhập GVCN
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* KHỐI 2: XUẤT FILE HTML ĐỘC LẬP (THEO YÊU CẦU MỘT FILE HTML DUY NHẤT) */}
      <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-2xl border border-teal-200/80 shadow-xs p-5 sm:p-6">
        <div className="flex items-center space-x-2.5 pb-3 border-b border-teal-200/60">
          <div className="p-2 bg-teal-600 text-white rounded-xl shadow-xs">
            <FileCode className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-teal-950 text-sm sm:text-base">
              XUẤT SẢN PHẨM MỘT FILE HTML ĐỘC LẬP DUY NHẤT
            </h3>
            <p className="text-xs text-teal-800">
              Tạo một tệp HTML trọn gói (.html) chứa toàn bộ CSS, JS và dữ liệu lớp 8 hiện tại để mở trên bất kỳ máy tính nào mà không cần cài đặt hay internet!
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            onClick={handleDownloadStandaloneHtml}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Tải về tệp .html độc lập
          </button>

          <button
            onClick={handleCopyStandaloneHtml}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-teal-300 text-teal-900 hover:bg-teal-100 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer"
          >
            {isCopiedHtml ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                Đã sao chép mã nguồn HTML!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Sao chép mã nguồn HTML
              </>
            )}
          </button>

          <button
            onClick={() => setShowCodePreview(!showCodePreview)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-teal-800 hover:underline text-xs font-semibold cursor-pointer"
          >
            {showCodePreview ? 'Ẩn xem trước mã' : 'Xem trước cấu trúc file HTML'}
          </button>
        </div>

        {showCodePreview && (
          <div className="mt-4 p-3 bg-slate-900 text-slate-200 rounded-xl text-[11px] font-mono max-h-48 overflow-y-auto">
            <pre className="whitespace-pre-wrap">
              {generateStandaloneHtml(fullState).slice(0, 1000)}
              {'\n... [Mã nguồn hoàn chỉnh sẵn sàng tải về hoặc sao chép]'}
            </pre>
          </div>
        )}
      </div>

      {/* KHỐI 3: SAO LƯU & KHÔI PHỤC DỮ LIỆU */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6">
        <div className="flex items-center space-x-2.5 pb-4 border-b border-slate-100">
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm sm:text-base">
              SAO LƯU VÀ KHÔI PHỤC DỮ LIỆU (JSON)
            </h3>
            <p className="text-xs text-slate-400">
              Lưu trữ danh sách học sinh, điểm danh, thi đua và nhật ký ra máy tính cá nhân
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="font-bold text-slate-800 text-xs sm:text-sm">Xuất tệp sao lưu dữ liệu</div>
              <p className="text-xs text-slate-500 mt-1">
                Tải về tệp .json chứa toàn bộ thông tin lớp hiện tại để lưu trữ định kỳ.
              </p>
            </div>
            <button
              onClick={handleExportJSON}
              className="mt-4 inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4 text-blue-600" />
              Tải file sao lưu (.json)
            </button>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="font-bold text-slate-800 text-xs sm:text-sm">Khôi phục từ tệp sao lưu</div>
              <p className="text-xs text-slate-500 mt-1">
                Tải lên tệp .json đã lưu trước đó để phục hồi lại dữ liệu lớp học.
              </p>
            </div>
            <label className="mt-4 inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer">
              <Upload className="w-4 h-4 text-emerald-600" />
              Chọn tệp sao lưu để khôi phục
              <input
                type="file"
                accept=".json"
                onChange={handleImportJSON}
                className="hidden"
              />
            </label>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200/80 flex flex-col justify-between sm:col-span-2">
            <div>
              <div className="font-bold text-slate-800 text-xs sm:text-sm flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                Nhập danh sách học sinh từ file Excel / CSV
              </div>
              <p className="text-xs text-slate-600 mt-1">
                Tải lên tệp danh sách lớp học hoặc tải mẫu Excel về để điền rồi đưa học sinh vào lớp {formData.className}.
              </p>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onOpenExcelImport}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Mở giao diện nhập danh sách Excel
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* KHỐI 4: BẢO VỆ DỮ LIỆU CÁ NHÂN & ĐẶT LẠI */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6">
        <div className="flex items-center space-x-2.5 pb-4 border-b border-slate-100">
          <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm sm:text-base">
              BẢO MẬT DỮ LIỆU & QUẢN TRỊ HỆ THỐNG
            </h3>
            <p className="text-xs text-slate-400">
              Toàn bộ dữ liệu được lưu cục bộ trên trình duyệt (LocalStorage)
            </p>
          </div>
        </div>

        <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 space-y-2">
          <p className="flex items-center gap-1.5 font-bold text-slate-800">
            <ShieldCheck className="w-4 h-4 text-teal-600" />
            Nguyên tắc bảo vệ dữ liệu cá nhân học sinh:
          </p>
          <ul className="list-disc list-inside space-y-1 text-slate-600">
            <li>Không truyền dữ liệu ra bất kỳ máy chủ bên ngoài nào.</li>
            <li>Không yêu cầu tài khoản, mật khẩu hay internet để ứng dụng hoạt động.</li>
            <li>Khi đóng trình duyệt hoặc tắt máy, dữ liệu vẫn được lưu nguyên vẹn trong máy cô.</li>
          </ul>
        </div>

        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={onRequestConfirmReset}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            Khôi phục về dữ liệu mẫu (10 học sinh)
          </button>

          <button
            onClick={onRequestConfirmClear}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            Xóa toàn bộ dữ liệu hiện tại
          </button>
        </div>
      </div>
    </div>
  );
};
