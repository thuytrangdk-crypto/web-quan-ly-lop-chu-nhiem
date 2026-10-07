import React, { useState } from 'react';
import {
  School,
  Check,
  Plus,
  Edit2,
  Trash2,
  X,
  Users,
  Sparkles,
} from 'lucide-react';
import { ClassProfile, Student } from '../types';

interface ClassSwitchModalProps {
  isOpen: boolean;
  onClose: () => void;
  classes: ClassProfile[];
  activeClassId: string;
  students: Student[];
  onSelectClass: (classId: string) => void;
  onAddClass: (newClass: Omit<ClassProfile, 'id'>) => void;
  onRenameClass: (classId: string, newName: string) => void;
  onDeleteClass: (classId: string) => void;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const ClassSwitchModal: React.FC<ClassSwitchModalProps> = ({
  isOpen,
  onClose,
  classes,
  activeClassId,
  students,
  onSelectClass,
  onAddClass,
  onRenameClass,
  onDeleteClass,
  onShowToast,
}) => {
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newClassRoom, setNewClassRoom] = useState('');
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [editingClassName, setEditingClassName] = useState('');

  if (!isOpen) return null;

  const handleAddNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) {
      onShowToast('Vui lòng nhập tên lớp', 'error');
      return;
    }

    onAddClass({
      name: newClassName.trim(),
      grade: 8,
      academicYear: '2026 - 2027',
      room: newClassRoom.trim() || undefined,
    });

    onShowToast(`Đã thêm lớp ${newClassName.trim()} thành công!`);
    setNewClassName('');
    setNewClassRoom('');
    setIsAddingNew(false);
  };

  const handleSaveRename = (classId: string) => {
    if (!editingClassName.trim()) return;
    onRenameClass(classId, editingClassName.trim());
    onShowToast('Đã đổi tên lớp thành công!');
    setEditingClassId(null);
  };

  const startRename = (cls: ClassProfile) => {
    setEditingClassId(cls.id);
    setEditingClassName(cls.name);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-100 my-8">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <School className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                Thay đổi lớp chủ nhiệm
              </h3>
              <p className="text-xs text-slate-500">
                Chọn lớp đang chủ nhiệm hoặc thêm lớp mới
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Danh sách các lớp */}
        <div className="mt-4 space-y-2.5 max-h-72 overflow-y-auto pr-1">
          {classes.map((cls) => {
            const isActive = cls.id === activeClassId;
            const isEditing = editingClassId === cls.id;
            const classStudentsCount = students.filter(
              (s) => (s.classId || 'class-8a1') === cls.id
            ).length;

            return (
              <div
                key={cls.id}
                className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                  isActive
                    ? 'bg-blue-50/70 border-blue-300 ring-2 ring-blue-500/20'
                    : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100/70'
                }`}
              >
                {!isEditing ? (
                  <div
                    onClick={() => {
                      if (!isActive) {
                        onSelectClass(cls.id);
                        onShowToast(`Đã chuyển sang ${cls.name}`);
                      }
                    }}
                    className="flex-1 cursor-pointer min-w-0"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-slate-800">{cls.name}</span>
                      {isActive && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white">
                          Đang chọn
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                      <span className="flex items-center gap-1 font-medium">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        {classStudentsCount} học sinh
                      </span>
                      {cls.room && <span>• {cls.room}</span>}
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center gap-2">
                    <input
                      type="text"
                      value={editingClassName}
                      onChange={(e) => setEditingClassName(e.target.value)}
                      className="flex-1 p-1.5 text-xs font-bold rounded-lg border border-blue-400 bg-white"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveRename(cls.id)}
                      className="px-2.5 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold"
                    >
                      Lưu
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingClassId(null)}
                      className="px-2 py-1.5 text-slate-500 hover:text-slate-800 text-xs"
                    >
                      Hủy
                    </button>
                  </div>
                )}

                {/* Actions */}
                {!isEditing && (
                  <div className="flex items-center space-x-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => startRename(cls)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-white rounded-lg transition-colors"
                      title="Đổi tên lớp"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {classes.length > 1 && (
                      <button
                        type="button"
                        onClick={() => onDeleteClass(cls.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition-colors"
                        title="Xóa lớp này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Thêm lớp mới Form */}
        {isAddingNew ? (
          <form onSubmit={handleAddNew} className="mt-4 p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs">
            <div className="font-bold text-slate-800 text-xs">Thêm lớp chủ nhiệm mới</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-600 font-medium mb-1">Tên lớp *</label>
                <input
                  type="text"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  placeholder="VD: Lớp 8A2, Lớp 8/2..."
                  required
                  className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-medium mb-1">Phòng học (tùy chọn)</label>
                <input
                  type="text"
                  value={newClassRoom}
                  onChange={(e) => setNewClassRoom(e.target.value)}
                  placeholder="VD: Phòng 205"
                  className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-1">
              <button
                type="button"
                onClick={() => setIsAddingNew(false)}
                className="px-3 py-1.5 text-slate-600 hover:bg-slate-200 rounded-lg font-medium"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
              >
                + Tạo lớp mới
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setIsAddingNew(true)}
              className="w-full py-2.5 border-2 border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 text-blue-700 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Thêm lớp chủ nhiệm khác
            </button>
          </div>
        )}

        <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs sm:text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
