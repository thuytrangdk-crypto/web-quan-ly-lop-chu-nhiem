import React, { useState } from 'react';
import {
  BookMarked,
  Plus,
  Search,
  Filter,
  Calendar,
  Clock,
  Trash2,
  Edit3,
  CheckCircle,
  HelpCircle,
  AlertCircle,
  X,
  User,
} from 'lucide-react';
import { DiaryEntry, Student } from '../types';
import { getTodayDateString, formatDateVN } from '../utils/storage';

interface DiaryViewProps {
  diary: DiaryEntry[];
  students: Student[];
  onAddDiaryEntry: (entry: Omit<DiaryEntry, 'id'>) => void;
  onUpdateDiaryEntry: (entry: DiaryEntry) => void;
  onDeleteDiaryEntry: (id: string) => void;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onOpenStudentProfile: (studentId: string) => void;
}

export const DiaryView: React.FC<DiaryViewProps> = ({
  diary,
  students,
  onAddDiaryEntry,
  onUpdateDiaryEntry,
  onDeleteDiaryEntry,
  onShowToast,
  onOpenStudentProfile,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterStudent, setFilterStudent] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<DiaryEntry | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    date: string;
    title: string;
    content: string;
    studentIds: string[];
    category: DiaryEntry['category'];
    actionTaken: string;
    note: string;
    status: DiaryEntry['status'];
  }>({
    date: getTodayDateString(),
    title: '',
    content: '',
    studentIds: [],
    category: 'Nề nếp / Kỷ luật',
    actionTaken: '',
    note: '',
    status: 'Đang theo dõi',
  });

  const openAddModal = () => {
    setEditingEntry(null);
    setFormData({
      date: getTodayDateString(),
      title: '',
      content: '',
      studentIds: [],
      category: 'Nề nếp / Kỷ luật',
      actionTaken: '',
      note: '',
      status: 'Đang theo dõi',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (entry: DiaryEntry) => {
    setEditingEntry(entry);
    setFormData({
      date: entry.date,
      title: entry.title,
      content: entry.content,
      studentIds: entry.studentIds || [],
      category: entry.category,
      actionTaken: entry.actionTaken,
      note: entry.note || '',
      status: entry.status,
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      onShowToast('Vui lòng nhập tiêu đề và nội dung sự việc', 'error');
      return;
    }

    if (editingEntry) {
      onUpdateDiaryEntry({
        ...editingEntry,
        ...formData,
      });
      onShowToast('Đã cập nhật nhật ký chủ nhiệm!');
    } else {
      onAddDiaryEntry(formData);
      onShowToast('Đã lưu nhật ký chủ nhiệm mới!');
    }
    setIsModalOpen(false);
  };

  const handleToggleStudent = (studentId: string) => {
    if (formData.studentIds.includes(studentId)) {
      setFormData({
        ...formData,
        studentIds: formData.studentIds.filter((id) => id !== studentId),
      });
    } else {
      setFormData({
        ...formData,
        studentIds: [...formData.studentIds, studentId],
      });
    }
  };

  // Filter diary entries
  const filteredDiary = diary
    .filter((entry) => {
      const matchesSearch =
        entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.actionTaken.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCat = filterCategory === 'all' || entry.category === filterCategory;
      const matchesStat = filterStatus === 'all' || entry.status === filterStatus;
      const matchesStud =
        filterStudent === 'all' || (entry.studentIds && entry.studentIds.includes(filterStudent));

      return matchesSearch && matchesCat && matchesStat && matchesStud;
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Top action bar: Search, Filters, Add Button */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm kiếm nội dung nhật ký, hướng xử lý..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        {/* Filters and Add button */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Nhóm vấn đề */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden"
          >
            <option value="all">Tất cả nhóm vấn đề</option>
            <option value="Học tập">Học tập</option>
            <option value="Nề nếp / Kỷ luật">Nề nếp / Kỷ luật</option>
            <option value="Liên hệ phụ huynh">Liên hệ phụ huynh</option>
            <option value="Tâm lý / Sức khỏe">Tâm lý / Sức khỏe</option>
            <option value="Phong trào / Hoạt động">Phong trào / Hoạt động</option>
            <option value="Khác">Khác</option>
          </select>

          {/* Trạng thái */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-hidden"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="Chưa xử lý">Chưa xử lý</option>
            <option value="Đang theo dõi">Đang theo dõi</option>
            <option value="Đã hoàn thành">Đã hoàn thành</option>
          </select>

          {/* Nút Thêm nhật ký */}
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Ghi nhật ký mới
          </button>
        </div>
      </div>

      {/* Danh sách bản ghi nhật ký */}
      <div className="space-y-4">
        {filteredDiary.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-400 text-sm">
            Không tìm thấy bản ghi nhật ký nào. Cô có thể bấm nút &quot;Ghi nhật ký mới&quot; để thêm sự việc.
          </div>
        ) : (
          filteredDiary.map((entry) => {
            const relatedStudents = students.filter(
              (s) => entry.studentIds && entry.studentIds.includes(s.id)
            );

            return (
              <div
                key={entry.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 hover:border-blue-300 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-teal-50 text-teal-700 rounded-xl shrink-0 mt-0.5">
                      <BookMarked className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-md">
                          {formatDateVN(entry.date)}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          {entry.category}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 rounded-md text-xs font-bold ${
                            entry.status === 'Đã hoàn thành'
                              ? 'bg-emerald-100 text-emerald-800'
                              : entry.status === 'Đang theo dõi'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {entry.status}
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-900 text-base sm:text-lg mt-2">
                        {entry.title}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 shrink-0 self-end sm:self-auto">
                    <button
                      onClick={() => openEditModal(entry)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      title="Sửa bản ghi"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteDiaryEntry(entry.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Xóa bản ghi"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Nội dung sự việc */}
                <div className="mt-4 text-xs sm:text-sm text-slate-700 leading-relaxed font-normal whitespace-pre-wrap">
                  {entry.content}
                </div>

                {/* Hướng xử lý & Ghi chú */}
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-teal-50/60 rounded-xl border border-teal-100">
                    <div className="font-bold text-teal-900 mb-1">Hướng xử lý / Biện pháp:</div>
                    <div className="text-teal-950 font-medium">{entry.actionTaken || 'Chưa ghi nhận'}</div>
                  </div>
                  {entry.note && (
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="font-bold text-slate-700 mb-1">Ghi chú thêm:</div>
                      <div className="text-slate-600">{entry.note}</div>
                    </div>
                  )}
                </div>

                {/* Học sinh liên quan */}
                {relatedStudents.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center flex-wrap gap-2 text-xs">
                    <span className="text-slate-400 font-medium">Học sinh liên quan:</span>
                    {relatedStudents.map((s) => (
                      <span
                        key={s.id}
                        onClick={() => onOpenStudentProfile(s.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold cursor-pointer transition-colors"
                      >
                        <User className="w-3 h-3" />
                        {s.name} (Tổ {s.group})
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* MODAL THÊM / SỬA NHẬT KÝ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-5 sm:p-6 shadow-2xl border border-slate-100 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                {editingEntry ? 'Chỉnh sửa nhật ký chủ nhiệm' : 'Ghi nhật ký chủ nhiệm mới'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="mt-4 space-y-3.5 text-xs max-h-[75vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Ngày ghi *</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nhóm vấn đề</label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value as DiaryEntry['category'] })
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                  >
                    <option value="Học tập">Học tập</option>
                    <option value="Nề nếp / Kỷ luật">Nề nếp / Kỷ luật</option>
                    <option value="Liên hệ phụ huynh">Liên hệ phụ huynh</option>
                    <option value="Tâm lý / Sức khỏe">Tâm lý / Sức khỏe</option>
                    <option value="Phong trào / Hoạt động">Phong trào / Hoạt động</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tiêu đề bản ghi *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="VD: Họp phụ huynh đột xuất em Hoàng Anh Tuấn..."
                  required
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nội dung chi tiết sự việc *</label>
                <textarea
                  rows={3}
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Ghi lại diễn biến cụ thể sự việc trong ngày..."
                  required
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Hướng xử lý / Biện pháp</label>
                <textarea
                  rows={2}
                  value={formData.actionTaken}
                  onChange={(e) => setFormData({ ...formData, actionTaken: e.target.value })}
                  placeholder="Cô đã giải quyết như thế nào hoặc phân công ai hỗ trợ..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                />
              </div>

              {/* Học sinh liên quan */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Chọn học sinh liên quan (nếu có)
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
                  {students.map((s) => {
                    const isSelected = formData.studentIds.includes(s.id);
                    return (
                      <button
                        type="button"
                        key={s.id}
                        onClick={() => handleToggleStudent(s.id)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {s.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Trạng thái giải quyết</label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value as DiaryEntry['status'] })
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                  >
                    <option value="Chưa xử lý">Chưa xử lý</option>
                    <option value="Đang theo dõi">Đang theo dõi</option>
                    <option value="Đã hoàn thành">Đã hoàn thành</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Ghi chú thêm</label>
                  <input
                    type="text"
                    value={formData.note}
                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                    placeholder="Lưu ý riêng..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs"
                >
                  {editingEntry ? 'Lưu thay đổi' : 'Lưu nhật ký'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
