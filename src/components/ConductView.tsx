import React, { useState } from 'react';
import {
  Award,
  AlertTriangle,
  Plus,
  Trash2,
  Trophy,
  Users,
  Star,
  CheckCircle2,
  Calendar,
  Sparkles,
  TrendingUp,
  Sliders,
  Filter,
} from 'lucide-react';
import { Student, ConductCriterion, ConductRecord } from '../types';
import { getTodayDateString, formatDateVN } from '../utils/storage';

interface ConductViewProps {
  students: Student[];
  criteria: ConductCriterion[];
  conduct: ConductRecord[];
  onAddConductRecord: (record: Omit<ConductRecord, 'id'>) => void;
  onDeleteConductRecord: (recordId: string) => void;
  onUpdateCriteria: (criteria: ConductCriterion[]) => void;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onOpenStudentProfile: (studentId: string) => void;
}

export const ConductView: React.FC<ConductViewProps> = ({
  students,
  criteria,
  conduct,
  onAddConductRecord,
  onDeleteConductRecord,
  onUpdateCriteria,
  onShowToast,
  onOpenStudentProfile,
}) => {
  const [filterPeriod, setFilterPeriod] = useState<'week' | 'month' | 'semester'>('week');
  const [isCriteriaModalOpen, setIsCriteriaModalOpen] = useState(false);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);

  // Form Thêm Ghi nhận thi đua
  const [selectedStudentId, setSelectedStudentId] = useState<string>(students[0]?.id || '');
  const [selectedCriterionId, setSelectedCriterionId] = useState<string>(criteria[0]?.id || '');
  const [customPoints, setCustomPoints] = useState<number>(criteria[0]?.points || 2);
  const [recordNote, setRecordNote] = useState<string>('');
  const [recordDate, setRecordDate] = useState<string>(getTodayDateString());

  // Form Thêm Tiêu chí mới
  const [newCritName, setNewCritName] = useState('');
  const [newCritPoints, setNewCritPoints] = useState(2);
  const [newCritType, setNewCritType] = useState<'praise' | 'reminder'>('praise');
  const [newCritCategory, setNewCritCategory] = useState('Học tập');

  // Khi chọn tiêu chí thì tự động fill số điểm
  const handleCriterionChange = (critId: string) => {
    setSelectedCriterionId(critId);
    const found = criteria.find((c) => c.id === critId);
    if (found) {
      setCustomPoints(found.points);
    }
  };

  const handleSubmitRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) {
      onShowToast('Vui lòng chọn học sinh', 'error');
      return;
    }

    const crit = criteria.find((c) => c.id === selectedCriterionId);
    const critName = crit ? crit.name : 'Thi đua nề nếp';
    const type = customPoints >= 0 ? 'praise' : 'reminder';

    onAddConductRecord({
      date: recordDate,
      studentId: selectedStudentId,
      criterionId: selectedCriterionId,
      criterionName: critName,
      points: customPoints,
      type,
      note: recordNote,
    });

    const studentObj = students.find((s) => s.id === selectedStudentId);
    onShowToast(`Đã ghi nhận ${customPoints > 0 ? '+' : ''}${customPoints} điểm cho ${studentObj?.name}!`);
    setIsRecordModalOpen(false);
    setRecordNote('');
  };

  const handleAddCriterion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCritName.trim()) return;

    const pointsValue = newCritType === 'reminder' ? -Math.abs(newCritPoints) : Math.abs(newCritPoints);
    const newCrit: ConductCriterion = {
      id: `crit-${Date.now()}`,
      name: newCritName.trim(),
      points: pointsValue,
      type: newCritType,
      category: newCritCategory,
    };

    onUpdateCriteria([...criteria, newCrit]);
    onShowToast('Đã thêm tiêu chí mới vào hệ thống!');
    setNewCritName('');
  };

  const handleDeleteCriterion = (id: string) => {
    onUpdateCriteria(criteria.filter((c) => c.id !== id));
    onShowToast('Đã xóa tiêu chí khỏi danh sách');
  };

  // Tính điểm thi đua theo kỳ chọn (Tuần, Tháng, Học kỳ)
  // Để đơn giản và chính xác:
  // week: 7 ngày gần nhất
  // month: 30 ngày gần nhất
  // semester: toàn bộ
  const now = new Date();
  const filteredConduct = conduct.filter((c) => {
    if (filterPeriod === 'semester') return true;
    const cDate = new Date(c.date);
    const diffDays = (now.getTime() - cDate.getTime()) / (1000 * 3600 * 24);
    if (filterPeriod === 'week') return diffDays <= 7 && diffDays >= -1;
    if (filterPeriod === 'month') return diffDays <= 30 && diffDays >= -1;
    return true;
  });

  // Tính điểm từng học sinh
  const studentScores = students.map((s) => {
    const records = filteredConduct.filter((c) => c.studentId === s.id);
    const score = records.reduce((sum, r) => sum + r.points, 0);
    const praiseCount = records.filter((r) => r.type === 'praise').length;
    const reminderCount = records.filter((r) => r.type === 'reminder').length;
    return {
      student: s,
      score,
      praiseCount,
      reminderCount,
    };
  });

  // Xếp hạng cá nhân (Top điểm cao nhất)
  const rankedStudents = [...studentScores].sort((a, b) => b.score - a.score);

  // Xếp hạng Tổ (Tổ 1, 2, 3, 4)
  const groupScores = [1, 2, 3, 4].map((groupNum) => {
    const groupStudents = studentScores.filter((item) => item.student.group === groupNum);
    const totalScore = groupStudents.reduce((sum, item) => sum + item.score, 0);
    const avgScore = groupStudents.length > 0 ? (totalScore / groupStudents.length).toFixed(1) : '0';
    return {
      groupNum,
      studentCount: groupStudents.length,
      totalScore,
      avgScore,
    };
  });

  const rankedGroups = [...groupScores].sort((a, b) => b.totalScore - a.totalScore);

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Top Banner & Actions */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Filter Buttons */}
        <div className="flex items-center space-x-1.5 p-1 bg-slate-100 rounded-xl text-xs">
          <button
            onClick={() => setFilterPeriod('week')}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              filterPeriod === 'week' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tuần này
          </button>
          <button
            onClick={() => setFilterPeriod('month')}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              filterPeriod === 'month' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tháng này
          </button>
          <button
            onClick={() => setFilterPeriod('semester')}
            className={`px-3.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              filterPeriod === 'semester' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Cả Học kỳ I
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsCriteriaModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            <Sliders className="w-4 h-4 text-slate-500" />
            Tùy chỉnh tiêu chí ({criteria.length})
          </button>

          <button
            onClick={() => setIsRecordModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Ghi nhận thi đua
          </button>
        </div>
      </div>

      {/* Grid: 2 Bảng Xếp Hạng Lớn (Cá Nhân Nổi Bật & Tổ Nổi Bật) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cột 1 & 2: BẢNG XẾP HẠNG CÁ NHÂN */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-500/10 via-teal-500/10 to-blue-500/10 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-amber-500 text-white rounded-xl shadow-sm">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm sm:text-base">
                  BẢNG XẾP HẠNG CÁ NHÂN
                </h3>
                <p className="text-xs text-slate-500">
                  {filterPeriod === 'week' ? 'Thống kê theo 7 ngày qua' : filterPeriod === 'month' ? 'Thống kê theo 30 ngày qua' : 'Thống kê toàn học kỳ'}
                </p>
              </div>
            </div>
            <span className="text-xs font-bold text-amber-800 bg-amber-100 px-3 py-1 rounded-full">
              {students.length} học sinh
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {rankedStudents.map((item, idx) => {
              const medal =
                idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`;
              const isTop3 = idx < 3;

              return (
                <div
                  key={item.student.id}
                  onClick={() => onOpenStudentProfile(item.student.id)}
                  className={`p-3.5 sm:p-4 hover:bg-slate-50 transition-colors flex items-center justify-between cursor-pointer ${
                    isTop3 ? 'bg-amber-50/20' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3.5 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                        idx === 0
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : idx === 1
                          ? 'bg-slate-200 text-slate-800 border border-slate-300'
                          : idx === 2
                          ? 'bg-amber-200/60 text-amber-900 border border-amber-400'
                          : 'text-slate-400'
                      }`}
                    >
                      {medal}
                    </div>

                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs text-white shrink-0 ${
                        item.student.gender === 'Nữ'
                          ? 'bg-gradient-to-tr from-pink-400 to-rose-400'
                          : 'bg-gradient-to-tr from-blue-500 to-teal-400'
                      }`}
                    >
                      {item.student.name.charAt(item.student.name.lastIndexOf(' ') + 1)}
                    </div>

                    <div className="min-w-0">
                      <div className="font-bold text-slate-800 text-sm hover:text-blue-600 transition-colors truncate">
                        {item.student.name}
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2">
                        <span>Tổ {item.student.group}</span>
                        <span>•</span>
                        <span>{item.student.role}</span>
                        <span>•</span>
                        <span className="text-emerald-700 font-medium">+{item.praiseCount} khen</span>
                        <span>•</span>
                        <span className="text-rose-600 font-medium">-{item.reminderCount} nhắc</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0 pl-2">
                    <span
                      className={`px-3 py-1 rounded-xl font-extrabold text-sm ${
                        item.score > 0
                          ? 'bg-emerald-100 text-emerald-800'
                          : item.score < 0
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {item.score > 0 ? `+${item.score}` : item.score} điểm
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cột 3: BẢNG XẾP HẠNG TỔ */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 bg-gradient-to-r from-teal-500/10 to-blue-500/10 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-teal-600" />
                <h3 className="font-extrabold text-slate-800 text-sm sm:text-base">
                  THI ĐUA CÁC TỔ
                </h3>
              </div>
              <span className="text-xs text-slate-500 font-medium">4 Tổ thi đua</span>
            </div>

            <div className="p-4 space-y-3">
              {rankedGroups.map((group, idx) => (
                <div
                  key={group.groupNum}
                  className={`p-3.5 rounded-xl border transition-all ${
                    idx === 0
                      ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 shadow-xs'
                      : 'bg-slate-50 border-slate-200/80'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-xs ${
                          idx === 0
                            ? 'bg-amber-500 text-white'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <span className="font-extrabold text-slate-800 text-sm">
                        Tổ {group.groupNum}
                      </span>
                      {idx === 0 && (
                        <span className="text-[10px] bg-amber-200 text-amber-900 font-bold px-1.5 py-0.5 rounded">
                          Dẫn đầu
                        </span>
                      )}
                    </div>

                    <div className="text-right">
                      <span className="font-black text-base text-slate-800">
                        {group.totalScore > 0 ? `+${group.totalScore}` : group.totalScore}
                      </span>
                      <span className="text-[11px] text-slate-400 block">Tổng điểm</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-200/40">
                    <span>Sĩ số: {group.studentCount} bạn</span>
                    <span>Điểm TB/bạn: <b>{group.avgScore}</b></span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Lưu ý sư phạm */}
          <div className="p-4 bg-blue-50/70 border border-blue-200/80 rounded-2xl text-xs text-blue-900 leading-relaxed">
            <p className="font-bold flex items-center gap-1.5 mb-1 text-blue-800">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              Lưu ý chủ nhiệm:
            </p>
            Hệ thống điểm thi đua nhằm mục đích khích lệ sự nỗ lực và tương trợ giữa các học sinh. Cô có thể linh hoạt điều chỉnh điểm số và tiêu chí cho phù hợp với từng hoạt động cụ thể của lớp.
          </div>
        </div>
      </div>

      {/* Lịch sử ghi nhận thi đua gần đây */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
        <h4 className="font-bold text-slate-800 text-sm sm:text-base mb-4 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-600" />
          LỊCH SỬ GHI NHẬN THI ĐUA GẦN ĐÂY ({filteredConduct.length} lượt)
        </h4>

        {filteredConduct.length === 0 ? (
          <p className="text-xs text-slate-400 italic py-4">Chưa có lượt ghi nhận nào trong giai đoạn này.</p>
        ) : (
          <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto pr-1">
            {filteredConduct.map((rec) => {
              const student = students.find((s) => s.id === rec.studentId);
              if (!student) return null;

              return (
                <div
                  key={rec.id}
                  className="py-3 flex items-center justify-between text-xs hover:bg-slate-50/80 px-2 rounded-lg transition-colors group"
                >
                  <div className="flex items-center space-x-3 min-w-0 pr-3">
                    <span className="font-mono text-slate-400 shrink-0">
                      {formatDateVN(rec.date)}
                    </span>
                    <span
                      onClick={() => onOpenStudentProfile(student.id)}
                      className="font-bold text-slate-800 hover:text-blue-600 cursor-pointer shrink-0"
                    >
                      {student.name}
                    </span>
                    <span className="text-slate-400 shrink-0">Tổ {student.group}</span>
                    <span className="text-slate-700 truncate font-medium">
                      {rec.criterionName}
                    </span>
                    {rec.note && <span className="text-slate-400 italic truncate">({rec.note})</span>}
                  </div>

                  <div className="flex items-center space-x-3 shrink-0">
                    <span
                      className={`font-black px-2.5 py-0.5 rounded-lg text-xs ${
                        rec.points > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {rec.points > 0 ? `+${rec.points}` : rec.points}
                    </span>
                    <button
                      onClick={() => onDeleteConductRecord(rec.id)}
                      className="text-slate-300 hover:text-rose-600 p-1 rounded transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                      title="Xóa lượt ghi này nếu ghi nhầm"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL GHI NHẬN THI ĐUA */}
      {isRecordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
              <Award className="w-5 h-5 text-blue-600" />
              Ghi nhận thi đua cho học sinh
            </h3>

            <form onSubmit={handleSubmitRecord} className="mt-4 space-y-4 text-xs">
              {/* Chọn học sinh */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Chọn học sinh *</label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden"
                >
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} - Tổ {s.group} ({s.role})
                    </option>
                  ))}
                </select>
              </div>

              {/* Chọn ngày */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ngày ghi nhận</label>
                <input
                  type="date"
                  value={recordDate}
                  onChange={(e) => setRecordDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden"
                />
              </div>

              {/* Chọn tiêu chí */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tiêu chí thi đua</label>
                <select
                  value={selectedCriterionId}
                  onChange={(e) => handleCriterionChange(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden"
                >
                  <optgroup label="🌟 Tuyên dương (+)">
                    {criteria
                      .filter((c) => c.type === 'praise')
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} (+{c.points} điểm)
                        </option>
                      ))}
                  </optgroup>
                  <optgroup label="⚠️ Nhắc nhở (-)">
                    {criteria
                      .filter((c) => c.type === 'reminder')
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.points} điểm)
                        </option>
                      ))}
                  </optgroup>
                </select>
              </div>

              {/* Số điểm cộng/trừ (cho phép điều chỉnh) */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Số điểm (dương là cộng, âm là trừ)
                </label>
                <input
                  type="number"
                  value={customPoints}
                  onChange={(e) => setCustomPoints(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden font-bold text-sm"
                />
              </div>

              {/* Ghi chú chi tiết */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Ghi chú chi tiết lý do (tùy chọn)
                </label>
                <input
                  type="text"
                  value={recordNote}
                  onChange={(e) => setRecordNote(e.target.value)}
                  placeholder="VD: Tiết học môn Toán, giúp bạn lau bảng..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsRecordModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs cursor-pointer"
                >
                  Lưu ghi nhận
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL QUẢN LÝ TIÊU CHÍ */}
      {isCriteriaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-5 sm:p-6 shadow-2xl border border-slate-100 my-8">
            <h3 className="text-lg font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-teal-600" />
              Tùy chỉnh tiêu chí thi đua
            </h3>

            {/* Form thêm tiêu chí mới */}
            <form onSubmit={handleAddCriterion} className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs">
              <div className="font-bold text-slate-800">Thêm tiêu chí mới</div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    value={newCritName}
                    onChange={(e) => setNewCritName(e.target.value)}
                    placeholder="Tên tiêu chí (VD: Tham gia phát biểu bài...)"
                    className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                  />
                </div>
                <div>
                  <select
                    value={newCritType}
                    onChange={(e) => setNewCritType(e.target.value as 'praise' | 'reminder')}
                    className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                  >
                    <option value="praise">Tuyên dương (+)</option>
                    <option value="reminder">Nhắc nhở (-)</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span>Điểm:</span>
                  <input
                    type="number"
                    value={newCritPoints}
                    onChange={(e) => setNewCritPoints(Number(e.target.value))}
                    min={1}
                    max={20}
                    className="w-16 p-1.5 rounded-lg border border-slate-200 bg-white text-center font-bold"
                  />
                </div>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold cursor-pointer"
                >
                  + Thêm tiêu chí
                </button>
              </div>
            </form>

            {/* Danh sách tiêu chí hiện có */}
            <div className="mt-5 space-y-2 max-h-72 overflow-y-auto pr-1 text-xs">
              {criteria.map((crit) => (
                <div
                  key={crit.id}
                  className="p-2.5 rounded-xl border border-slate-200 flex items-center justify-between bg-white"
                >
                  <div>
                    <span className="font-bold text-slate-800">{crit.name}</span>
                    <span className="text-[11px] text-slate-400 ml-2">({crit.category})</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`font-bold px-2 py-0.5 rounded text-xs ${
                        crit.type === 'praise' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {crit.points > 0 ? `+${crit.points}` : crit.points}
                    </span>
                    <button
                      onClick={() => handleDeleteCriterion(crit.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                      title="Xóa tiêu chí"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setIsCriteriaModalOpen(false)}
                className="px-5 py-2 font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer text-xs sm:text-sm"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
