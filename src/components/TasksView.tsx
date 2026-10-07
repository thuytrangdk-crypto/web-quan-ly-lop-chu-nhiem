import React, { useState } from 'react';
import {
  CheckSquare,
  Plus,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Circle,
  Trash2,
  Edit2,
  X,
  Filter,
} from 'lucide-react';
import { TaskItem } from '../types';
import { getTodayDateString, formatDateVN } from '../utils/storage';

interface TasksViewProps {
  tasks: TaskItem[];
  onAddTask: (task: Omit<TaskItem, 'id'>) => void;
  onUpdateTask: (task: TaskItem) => void;
  onDeleteTask: (taskId: string) => void;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const TasksView: React.FC<TasksViewProps> = ({
  tasks,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onShowToast,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);

  // Quick add input
  const [quickTitle, setQuickTitle] = useState('');

  // Form State
  const [formData, setFormData] = useState<{
    title: string;
    dueDate: string;
    priority: TaskItem['priority'];
    status: TaskItem['status'];
    note: string;
  }>({
    title: '',
    dueDate: getTodayDateString(),
    priority: 'Quan trọng',
    status: 'Chưa làm',
    note: '',
  });

  const todayStr = getTodayDateString();

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;

    onAddTask({
      title: quickTitle.trim(),
      createdAt: todayStr,
      dueDate: todayStr,
      priority: 'Bình thường',
      status: 'Chưa làm',
      note: '',
    });

    onShowToast(`Đã thêm việc "${quickTitle.trim()}"!`);
    setQuickTitle('');
  };

  const openAddModal = () => {
    setEditingTask(null);
    setFormData({
      title: '',
      dueDate: todayStr,
      priority: 'Quan trọng',
      status: 'Chưa làm',
      note: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (task: TaskItem) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      dueDate: task.dueDate,
      priority: task.priority,
      status: task.status,
      note: task.note || '',
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      onShowToast('Vui lòng nhập tên công việc', 'error');
      return;
    }

    if (editingTask) {
      onUpdateTask({
        ...editingTask,
        ...formData,
      });
      onShowToast('Đã cập nhật công việc!');
    } else {
      onAddTask({
        ...formData,
        createdAt: todayStr,
      });
      onShowToast('Đã thêm công việc mới!');
    }
    setIsModalOpen(false);
  };

  const toggleTaskStatus = (task: TaskItem) => {
    let nextStatus: TaskItem['status'] = 'Đang làm';
    if (task.status === 'Chưa làm') nextStatus = 'Đang làm';
    else if (task.status === 'Đang làm') nextStatus = 'Hoàn thành';
    else if (task.status === 'Hoàn thành') nextStatus = 'Chưa làm';

    onUpdateTask({
      ...task,
      status: nextStatus,
    });
    onShowToast(`Đã chuyển trạng thái: ${nextStatus}`);
  };

  // Lọc danh sách công việc
  const filteredTasks = tasks.filter((t) => {
    if (filterStatus === 'all') return true;
    return t.status === filterStatus;
  });

  // Đếm theo trạng thái
  const pendingCount = tasks.filter((t) => t.status === 'Chưa làm').length;
  const inProgressCount = tasks.filter((t) => t.status === 'Đang làm').length;
  const completedCount = tasks.filter((t) => t.status === 'Hoàn thành').length;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* 3 Thẻ Trạng thái Công việc */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div
          onClick={() => setFilterStatus(filterStatus === 'Chưa làm' ? 'all' : 'Chưa làm')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            filterStatus === 'Chưa làm'
              ? 'bg-rose-50 border-rose-300 ring-2 ring-rose-500/20'
              : 'bg-white border-slate-200/80 hover:border-rose-200'
          }`}
        >
          <div className="flex items-center justify-between text-rose-800 text-xs font-bold">
            <span>Chưa làm</span>
            <Circle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-rose-700">{pendingCount}</div>
          <p className="text-[11px] text-rose-600/80 mt-0.5">Việc cần chuẩn bị</p>
        </div>

        <div
          onClick={() => setFilterStatus(filterStatus === 'Đang làm' ? 'all' : 'Đang làm')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            filterStatus === 'Đang làm'
              ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-500/20'
              : 'bg-white border-slate-200/80 hover:border-amber-200'
          }`}
        >
          <div className="flex items-center justify-between text-amber-800 text-xs font-bold">
            <span>Đang thực hiện</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-amber-700">{inProgressCount}</div>
          <p className="text-[11px] text-amber-600/80 mt-0.5">Đang tiến hành xử lý</p>
        </div>

        <div
          onClick={() => setFilterStatus(filterStatus === 'Hoàn thành' ? 'all' : 'Hoàn thành')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            filterStatus === 'Hoàn thành'
              ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-500/20'
              : 'bg-white border-slate-200/80 hover:border-emerald-200'
          }`}
        >
          <div className="flex items-center justify-between text-emerald-800 text-xs font-bold">
            <span>Đã hoàn thành</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-700">{completedCount}</div>
          <p className="text-[11px] text-emerald-600/80 mt-0.5">Đã giải quyết xong</p>
        </div>
      </div>

      {/* Thêm nhanh công việc */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3 items-center">
        <form onSubmit={handleQuickAdd} className="flex-1 w-full flex items-center gap-2">
          <input
            type="text"
            value={quickTitle}
            onChange={(e) => setQuickTitle(e.target.value)}
            placeholder="Nhập nhanh tên công việc rồi ấn Enter (VD: Nhắc học sinh đóng bảo hiểm)..."
            className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
          />
          <button
            type="submit"
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm rounded-xl shrink-0 cursor-pointer"
          >
            + Thêm nhanh
          </button>
        </form>

        <button
          onClick={openAddModal}
          className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-xs shrink-0 cursor-pointer"
        >
          Thêm chi tiết có hạn chót
        </button>
      </div>

      {/* Danh sách công việc */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50/70 border-b border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckSquare className="w-4 h-4 text-indigo-600" />
            <span className="font-bold text-slate-800 text-sm">
              DANH SÁCH CÔNG VIỆC CHỦ NHIỆM ({filteredTasks.length})
            </span>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            {filterStatus !== 'all' && (
              <button
                onClick={() => setFilterStatus('all')}
                className="text-blue-600 hover:underline font-semibold"
              >
                Hiện tất cả
              </button>
            )}
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredTasks.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs italic">
              Không có công việc nào trong danh mục này.
            </div>
          ) : (
            filteredTasks.map((task) => {
              const isOverdue = task.dueDate < todayStr && task.status !== 'Hoàn thành';
              const isDueToday = task.dueDate === todayStr && task.status !== 'Hoàn thành';

              return (
                <div
                  key={task.id}
                  className={`p-4 hover:bg-slate-50/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 group ${
                    isOverdue
                      ? 'bg-rose-50/40'
                      : isDueToday
                      ? 'bg-amber-50/30'
                      : ''
                  }`}
                >
                  <div className="flex items-start space-x-3 min-w-0">
                    <button
                      type="button"
                      onClick={() => toggleTaskStatus(task)}
                      className="mt-0.5 shrink-0 transition-transform hover:scale-110 cursor-pointer"
                      title="Bấm để đổi trạng thái: Chưa làm -> Đang làm -> Hoàn thành"
                    >
                      {task.status === 'Hoàn thành' ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      ) : task.status === 'Đang làm' ? (
                        <Clock className="w-5 h-5 text-amber-500" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-300 hover:text-blue-500" />
                      )}
                    </button>

                    <div className="min-w-0">
                      <div
                        className={`font-bold text-sm ${
                          task.status === 'Hoàn thành'
                            ? 'line-through text-slate-400'
                            : 'text-slate-800'
                        }`}
                      >
                        {task.title}
                      </div>

                      <div className="mt-1 flex items-center flex-wrap gap-2 text-[11px] text-slate-500">
                        <span className="flex items-center gap-1 font-mono">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          Hạn: {formatDateVN(task.dueDate)}
                        </span>
                        {isOverdue && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-700">
                            ⚠️ Đã quá hạn!
                          </span>
                        )}
                        {isDueToday && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                            ⏰ Hạn hôm nay!
                          </span>
                        )}
                        {task.note && <span className="text-slate-400 truncate max-w-xs">({task.note})</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 shrink-0 self-end sm:self-center">
                    {/* Badge Mức độ ưu tiên */}
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                        task.priority === 'Gấp'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : task.priority === 'Quan trọng'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {task.priority}
                    </span>

                    {/* Badge Trạng thái */}
                    <span
                      onClick={() => toggleTaskStatus(task)}
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-lg cursor-pointer ${
                        task.status === 'Hoàn thành'
                          ? 'bg-emerald-100 text-emerald-800'
                          : task.status === 'Đang làm'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {task.status}
                    </span>

                    <button
                      onClick={() => openEditModal(task)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Sửa công việc"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => onDeleteTask(task.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Xóa công việc"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* MODAL THÊM / SỬA CÔNG VIỆC */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                {editingTask ? 'Chỉnh sửa công việc' : 'Thêm công việc mới'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tên công việc *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="VD: Kiểm tra chữ ký sổ đầu bài..."
                  required
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Hạn hoàn thành</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mức độ ưu tiên</label>
                  <select
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData({ ...formData, priority: e.target.value as TaskItem['priority'] })
                    }
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                  >
                    <option value="Bình thường">Bình thường</option>
                    <option value="Quan trọng">Quan trọng</option>
                    <option value="Gấp">Gấp</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Trạng thái</label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value as TaskItem['status'] })
                  }
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                >
                  <option value="Chưa làm">Chưa làm</option>
                  <option value="Đang làm">Đang làm</option>
                  <option value="Hoàn thành">Hoàn thành</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ghi chú thêm</label>
                <textarea
                  rows={2}
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  placeholder="Chi tiết yêu cầu..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                />
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
                  className="px-5 py-2 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl"
                >
                  {editingTask ? 'Lưu thay đổi' : 'Thêm việc'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
