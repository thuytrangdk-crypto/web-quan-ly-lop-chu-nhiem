import React, { useState } from 'react';
import {
  BookOpen,
  AlertCircle,
  TrendingUp,
  CheckCircle,
  HelpCircle,
  Search,
  Edit2,
  HeartHandshake,
  Sparkles,
  Save,
} from 'lucide-react';
import { Student, AcademicStatus } from '../types';

interface AcademicViewProps {
  students: Student[];
  onUpdateStudent: (student: Student) => void;
  onOpenStudentProfile: (studentId: string) => void;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const AcademicView: React.FC<AcademicViewProps> = ({
  students,
  onUpdateStudent,
  onOpenStudentProfile,
  onShowToast,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);

  // Edit fields
  const [editStatus, setEditStatus] = useState<AcademicStatus>('Ổn định');
  const [editStrengths, setEditStrengths] = useState('');
  const [editNeedsAttention, setEditNeedsAttention] = useState('');
  const [editNote, setEditNote] = useState('');

  const startEdit = (student: Student) => {
    setEditingStudentId(student.id);
    setEditStatus(student.academicStatus);
    setEditStrengths(student.strengthSubjects || '');
    setEditNeedsAttention(student.needsAttentionSubjects || '');
    setEditNote(student.academicNote || '');
  };

  const saveEdit = (student: Student) => {
    onUpdateStudent({
      ...student,
      academicStatus: editStatus,
      strengthSubjects: editStrengths,
      needsAttentionSubjects: editNeedsAttention,
      academicNote: editNote,
    });
    setEditingStudentId(null);
    onShowToast(`Đã lưu cập nhật theo dõi học tập cho ${student.name}!`);
  };

  // Thống kê phân loại
  const goodCount = students.filter((s) => s.academicStatus === 'Tốt').length;
  const stableCount = students.filter((s) => s.academicStatus === 'Ổn định').length;
  const progressCount = students.filter((s) => s.academicStatus === 'Có tiến bộ').length;
  const needsSupportCount = students.filter((s) => s.academicStatus === 'Cần hỗ trợ').length;

  // Danh sách học sinh cần quan tâm hỗ trợ
  const studentsNeedingCare = students.filter((s) => s.academicStatus === 'Cần hỗ trợ');

  // Lọc học sinh
  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || s.academicStatus === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* 4 Thẻ Phân loại Tình hình Học tập */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div
          onClick={() => setFilterStatus(filterStatus === 'Tốt' ? 'all' : 'Tốt')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            filterStatus === 'Tốt'
              ? 'bg-emerald-100/70 border-emerald-400 ring-2 ring-emerald-500/20'
              : 'bg-white border-slate-200/80 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between text-emerald-800 text-xs font-bold">
            <span>Tốt / Giỏi</span>
            <div className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-700">{goodCount}</div>
          <p className="text-[11px] text-emerald-600/80 mt-0.5">Tiếp thu bài nhanh</p>
        </div>

        <div
          onClick={() => setFilterStatus(filterStatus === 'Ổn định' ? 'all' : 'Ổn định')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            filterStatus === 'Ổn định'
              ? 'bg-sky-100/70 border-sky-400 ring-2 ring-sky-500/20'
              : 'bg-white border-slate-200/80 hover:border-sky-300'
          }`}
        >
          <div className="flex items-center justify-between text-sky-800 text-xs font-bold">
            <span>Ổn định / Khá</span>
            <div className="p-1.5 bg-sky-50 text-sky-700 rounded-lg">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-sky-700">{stableCount}</div>
          <p className="text-[11px] text-sky-600/80 mt-0.5">Duy trì lực học tốt</p>
        </div>

        <div
          onClick={() => setFilterStatus(filterStatus === 'Có tiến bộ' ? 'all' : 'Có tiến bộ')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            filterStatus === 'Có tiến bộ'
              ? 'bg-teal-100/70 border-teal-400 ring-2 ring-teal-500/20'
              : 'bg-white border-slate-200/80 hover:border-teal-300'
          }`}
        >
          <div className="flex items-center justify-between text-teal-800 text-xs font-bold">
            <span>Có tiến bộ</span>
            <div className="p-1.5 bg-teal-50 text-teal-700 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-teal-700">{progressCount}</div>
          <p className="text-[11px] text-teal-600/80 mt-0.5">Đáng khen ngợi</p>
        </div>

        <div
          onClick={() => setFilterStatus(filterStatus === 'Cần hỗ trợ' ? 'all' : 'Cần hỗ trợ')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            filterStatus === 'Cần hỗ trợ'
              ? 'bg-orange-100/80 border-orange-400 ring-2 ring-orange-500/20'
              : 'bg-white border-slate-200/80 hover:border-orange-300'
          }`}
        >
          <div className="flex items-center justify-between text-orange-800 text-xs font-bold">
            <span>Cần hỗ trợ</span>
            <div className="p-1.5 bg-orange-50 text-orange-700 rounded-lg">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-orange-700">{needsSupportCount}</div>
          <p className="text-[11px] text-orange-600/80 mt-0.5">Cần cô & bạn kèm thêm</p>
        </div>
      </div>

      {/* KHU VỰC ĐẶC BIỆT: "HỌC SINH CẦN QUAN TÂM" */}
      {studentsNeedingCare.length > 0 && (
        <div className="bg-gradient-to-br from-amber-50/90 to-orange-50/70 rounded-2xl p-5 border border-amber-200 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-amber-200/60">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-amber-500 text-white rounded-xl shadow-xs">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-amber-950 text-sm sm:text-base">
                  HỌC SINH CẦN QUAN TÂM & ĐỒNG HÀNH ({studentsNeedingCare.length} em)
                </h3>
                <p className="text-xs text-amber-800">
                  Ghi chú riêng để giáo viên chủ nhiệm nắm bắt và phối hợp giáo viên bộ môn / gia đình
                </p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-amber-900 bg-amber-200/70 px-2.5 py-1 rounded-full">
              Ưu tiên hỗ trợ
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mt-4">
            {studentsNeedingCare.map((student) => (
              <div
                key={student.id}
                onClick={() => onOpenStudentProfile(student.id)}
                className="bg-white p-4 rounded-xl border border-amber-200/80 shadow-2xs hover:border-amber-400 transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-700 font-bold flex items-center justify-center text-xs">
                      {student.name.charAt(student.name.lastIndexOf(' ') + 1)}
                    </div>
                    <div>
                      <div className="font-bold text-slate-800 text-sm">{student.name}</div>
                      <div className="text-[11px] text-slate-400">
                        {student.code} • Tổ {student.group}
                      </div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-800">
                    Cần hỗ trợ
                  </span>
                </div>

                <div className="mt-3 text-xs space-y-1.5">
                  {student.needsAttentionSubjects && (
                    <div className="text-rose-700">
                      <span className="font-semibold">Môn cần chú ý:</span>{' '}
                      {student.needsAttentionSubjects}
                    </div>
                  )}
                  {student.strengthSubjects && (
                    <div className="text-teal-700">
                      <span className="font-semibold">Điểm mạnh / môn thích:</span>{' '}
                      {student.strengthSubjects}
                    </div>
                  )}
                  <p className="text-slate-600 bg-slate-50 p-2 rounded-lg text-[11px] leading-relaxed">
                    {student.academicNote || student.note || 'Cần động viên ngồi bàn đầu và giao bài tập vừa sức.'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DANH SÁCH THEO DÕI HỌC TẬP TOÀN LỚP */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/60">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-4 h-4 text-teal-600" />
            <h3 className="font-bold text-slate-800 text-sm sm:text-base">
              THEO DÕI HỌC TẬP CÁC HỌC SINH ({filteredStudents.length} em)
            </h3>
          </div>

          <div className="flex items-center space-x-3">
            <div className="relative w-full sm:w-60">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm kiếm học sinh..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-hidden"
              />
            </div>
            {filterStatus !== 'all' && (
              <button
                onClick={() => setFilterStatus('all')}
                className="text-xs text-blue-600 hover:underline shrink-0"
              >
                Xóa lọc
              </button>
            )}
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredStudents.map((student) => {
            const isEditing = editingStudentId === student.id;

            return (
              <div key={student.id} className="p-4 sm:p-5 hover:bg-slate-50/60 transition-colors">
                {!isEditing ? (
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start space-x-3 min-w-0">
                      <div
                        onClick={() => onOpenStudentProfile(student.id)}
                        className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs text-white shrink-0 cursor-pointer ${
                          student.gender === 'Nữ'
                            ? 'bg-gradient-to-tr from-pink-400 to-rose-400'
                            : 'bg-gradient-to-tr from-blue-500 to-teal-400'
                        }`}
                      >
                        {student.name.charAt(student.name.lastIndexOf(' ') + 1)}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            onClick={() => onOpenStudentProfile(student.id)}
                            className="font-bold text-slate-900 text-sm hover:text-blue-600 cursor-pointer"
                          >
                            {student.name}
                          </span>
                          <span className="text-xs text-slate-400">({student.code})</span>
                          <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                            Tổ {student.group}
                          </span>
                        </div>

                        <div className="mt-2 text-xs flex flex-wrap gap-x-4 gap-y-1 text-slate-600">
                          {student.strengthSubjects && (
                            <div>
                              <span className="text-slate-400">Thế mạnh:</span>{' '}
                              <span className="font-semibold text-emerald-700">
                                {student.strengthSubjects}
                              </span>
                            </div>
                          )}
                          {student.needsAttentionSubjects && (
                            <div>
                              <span className="text-slate-400">Cần chú ý:</span>{' '}
                              <span className="font-semibold text-rose-600">
                                {student.needsAttentionSubjects}
                              </span>
                            </div>
                          )}
                        </div>

                        {student.academicNote && (
                          <p className="mt-2 text-xs text-slate-600 italic bg-slate-50 p-2 rounded-lg border border-slate-200/50">
                            {student.academicNote}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 shrink-0 self-end md:self-center">
                      <span
                        className={`px-3 py-1 rounded-xl text-xs font-bold ${
                          student.academicStatus === 'Tốt'
                            ? 'bg-emerald-100 text-emerald-800'
                            : student.academicStatus === 'Có tiến bộ'
                            ? 'bg-teal-100 text-teal-800'
                            : student.academicStatus === 'Ổn định'
                            ? 'bg-sky-100 text-sky-800'
                            : 'bg-orange-100 text-orange-800 border border-orange-200'
                        }`}
                      >
                        {student.academicStatus}
                      </span>

                      <button
                        onClick={() => startEdit(student)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        title="Chỉnh sửa ghi nhận học tập"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Form chỉnh sửa inline */
                  <div className="bg-slate-50 p-4 rounded-xl border border-blue-200 space-y-3 text-xs">
                    <div className="font-bold text-blue-900 text-sm">
                      Cập nhật tình hình học tập: {student.name}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Trạng thái học tập
                        </label>
                        <select
                          value={editStatus}
                          onChange={(e) => setEditStatus(e.target.value as AcademicStatus)}
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg font-semibold"
                        >
                          <option value="Tốt">Tốt</option>
                          <option value="Ổn định">Ổn định</option>
                          <option value="Có tiến bộ">Có tiến bộ</option>
                          <option value="Cần hỗ trợ">Cần hỗ trợ</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Môn thế mạnh
                        </label>
                        <input
                          type="text"
                          value={editStrengths}
                          onChange={(e) => setEditStrengths(e.target.value)}
                          placeholder="VD: Toán, Ngữ văn..."
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Môn cần hỗ trợ
                        </label>
                        <input
                          type="text"
                          value={editNeedsAttention}
                          onChange={(e) => setEditNeedsAttention(e.target.value)}
                          placeholder="VD: Tiếng Anh, KHTN..."
                          className="w-full p-2 bg-white border border-slate-200 rounded-lg"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Ghi chú riêng của giáo viên
                      </label>
                      <textarea
                        rows={2}
                        value={editNote}
                        onChange={(e) => setEditNote(e.target.value)}
                        placeholder="Nhận xét cụ thể về phương pháp học, thái độ trên lớp..."
                        className="w-full p-2 bg-white border border-slate-200 rounded-lg"
                      />
                    </div>

                    <div className="flex items-center justify-end space-x-2 pt-2">
                      <button
                        onClick={() => setEditingStudentId(null)}
                        className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-semibold"
                      >
                        Hủy
                      </button>
                      <button
                        onClick={() => saveEdit(student)}
                        className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center gap-1.5"
                      >
                        <Save className="w-3.5 h-3.5" />
                        Lưu ghi nhận
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
