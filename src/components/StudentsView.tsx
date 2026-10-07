import React, { useState } from 'react';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Phone,
  User,
  Award,
  CalendarCheck2,
  BookOpen,
  Filter,
  X,
  Copy,
  Check,
  CheckCircle2,
  Clock,
  Sparkles,
  HeartHandshake,
  FileSpreadsheet,
  Lock,
  ShieldCheck,
} from 'lucide-react';
import {
  Student,
  Gender,
  StudentRole,
  StudentStatus,
  AcademicStatus,
  AttendanceRecord,
  ConductRecord,
  ConductCriterion,
  UserSession,
  ConductRatingThresholds,
} from '../types';
import { formatDateVN } from '../utils/storage';
import { StudentAuthModal } from './StudentAuthModal';
import { StudentProfileModal, calculateConductRating } from './StudentProfileModal';

interface StudentsViewProps {
  students: Student[];
  attendance: AttendanceRecord[];
  conduct: ConductRecord[];
  criteria?: ConductCriterion[];
  currentUser?: UserSession | null;
  ratingThresholds?: ConductRatingThresholds;
  onAddStudent: (student: Omit<Student, 'id'>) => void;
  onUpdateStudent: (student: Student) => void;
  onDeleteStudent: (studentId: string) => void;
  activeStudentModalId: string | null;
  onCloseStudentModal: () => void;
  onOpenStudentModal: (studentId: string) => void;
  onAddConductRecord?: (record: Omit<ConductRecord, 'id'>) => void;
  onDeleteConductRecord?: (recordId: string) => void;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onOpenExcelImport: () => void;
  classNameTitle?: string;
  isTeacherLoggedIn?: boolean;
  teacherPassword?: string;
  onTeacherLoginSuccess?: () => void;
}

export const StudentsView: React.FC<StudentsViewProps> = ({
  students,
  attendance,
  conduct,
  criteria = [],
  currentUser,
  ratingThresholds,
  onAddStudent,
  onUpdateStudent,
  onDeleteStudent,
  activeStudentModalId,
  onCloseStudentModal,
  onOpenStudentModal,
  onAddConductRecord = () => {},
  onDeleteConductRecord,
  onShowToast,
  onOpenExcelImport,
  classNameTitle = 'Lớp 9A5',
  isTeacherLoggedIn = true,
  teacherPassword = '123456',
  onTeacherLoginSuccess,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);

  // Mật khẩu ngày sinh
  const [isPasswordProtectionEnabled, setIsPasswordProtectionEnabled] = useState(true);
  const [studentForAuth, setStudentForAuth] = useState<Student | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    code: string;
    name: string;
    gender: Gender;
    dob: string;
    group: number;
    role: StudentRole;
    parentName: string;
    parentPhone: string;
    address: string;
    note: string;
    status: StudentStatus;
    academicStatus: AcademicStatus;
    academicNote: string;
    strengthSubjects: string;
    needsAttentionSubjects: string;
  }>({
    code: '',
    name: '',
    gender: 'Nam',
    dob: '2012-01-01',
    group: 1,
    role: 'Thành viên',
    parentName: '',
    parentPhone: '',
    address: '',
    note: '',
    status: 'Đang học',
    academicStatus: 'Ổn định',
    academicNote: '',
    strengthSubjects: '',
    needsAttentionSubjects: '',
  });

  const openAddModal = () => {
    setEditingStudent(null);
    const nextCode = `HS09${String(students.length + 1).padStart(2, '0')}`;
    setFormData({
      code: nextCode,
      name: '',
      gender: 'Nam',
      dob: '2012-05-15',
      group: 1,
      role: 'Thành viên',
      parentName: '',
      parentPhone: '',
      address: '',
      note: '',
      status: 'Đang học',
      academicStatus: 'Ổn định',
      academicNote: '',
      strengthSubjects: '',
      needsAttentionSubjects: '',
    });
    setIsFormModalOpen(true);
  };

  const openEditModal = (student: Student, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingStudent(student);
    setFormData({
      code: student.code || '',
      name: student.name,
      gender: student.gender,
      dob: student.dob,
      group: student.group,
      role: student.role,
      parentName: student.parentName,
      parentPhone: student.parentPhone,
      address: student.address || '',
      note: student.note,
      status: student.status,
      academicStatus: student.academicStatus,
      academicNote: student.academicNote || '',
      strengthSubjects: student.strengthSubjects || '',
      needsAttentionSubjects: student.needsAttentionSubjects || '',
    });
    setIsFormModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      onShowToast('Vui lòng nhập họ và tên học sinh', 'error');
      return;
    }

    if (editingStudent) {
      onUpdateStudent({
        ...editingStudent,
        ...formData,
      });
      onShowToast(`Đã cập nhật thông tin học sinh ${formData.name}!`);
    } else {
      onAddStudent(formData);
      onShowToast(`Đã thêm học sinh ${formData.name} vào danh sách!`);
    }
    setIsFormModalOpen(false);
  };

  const handleCopyPhone = (phone: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(phone);
    setCopiedPhone(phone);
    onShowToast(`Đã sao chép số điện thoại: ${phone}`);
    setTimeout(() => setCopiedPhone(null), 2000);
  };

  // Filter students
  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.parentPhone.replace(/\s+/g, '').includes(searchTerm.replace(/\s+/g, ''));

    const matchesGroup =
      selectedGroup === 'all' || s.group.toString() === selectedGroup;

    const matchesStatus =
      selectedStatus === 'all' || s.status === selectedStatus;

    return matchesSearch && matchesGroup && matchesStatus;
  });

  // Tìm học sinh đang mở hồ sơ
  const activeStudent = activeStudentModalId
    ? (students.find((s) => s.id === activeStudentModalId) ?? null)
    : null;

  // Tính thống kê thi đua và hạnh kiểm cho từng học sinh
  const getStudentConductSummary = (studentId: string) => {
    const sRecords = conduct.filter((c) => c.studentId === studentId);
    const praises = sRecords
      .filter((c) => c.type === 'praise')
      .reduce((sum, c) => sum + Math.abs(c.points), 0);
    const reminders = sRecords
      .filter((c) => c.type === 'reminder')
      .reduce((sum, c) => sum + Math.abs(c.points), 0);
    const score = 100 + praises - reminders;
    return {
      score,
      rating: calculateConductRating(score),
    };
  };

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
            placeholder="Tìm kiếm theo tên, mã HS, số điện thoại..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filters and Add button */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Lọc Tổ */}
          <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="bg-transparent text-slate-700 font-semibold focus:outline-hidden cursor-pointer"
            >
              <option value="all">Tất cả các tổ</option>
              <option value="1">Tổ 1</option>
              <option value="2">Tổ 2</option>
              <option value="3">Tổ 3</option>
              <option value="4">Tổ 4</option>
            </select>
          </div>

          {/* Lọc Trạng thái */}
          <div className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="bg-transparent text-slate-700 font-semibold focus:outline-hidden cursor-pointer"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="Đang học">Đang học</option>
              <option value="Nghỉ học có phép dài ngày">Nghỉ phép dài hạn</option>
              <option value="Chuyển trường">Chuyển trường</option>
            </select>
          </div>

          {/* Nút Khóa mật khẩu ngày sinh (chỉ GVCN) */}
          {isTeacherLoggedIn && (
            <button
              type="button"
              onClick={() => {
                setIsPasswordProtectionEnabled(!isPasswordProtectionEnabled);
                onShowToast(
                  !isPasswordProtectionEnabled
                    ? 'Đã BẬT khóa bảo mật mật khẩu ngày sinh khi xem hồ sơ học sinh!'
                    : 'Đã TẮT bảo mật mật khẩu (cho phép mở trực tiếp)'
                );
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                isPasswordProtectionEnabled
                  ? 'bg-amber-50 text-amber-900 border-amber-300 shadow-2xs'
                  : 'bg-slate-50 text-slate-600 border-slate-200'
              }`}
              title="Bảo vệ hồ sơ bằng mật khẩu ngày sinh tránh học sinh xem vi phạm của nhau"
            >
              <Lock className={`w-3.5 h-3.5 ${isPasswordProtectionEnabled ? 'text-amber-600' : 'text-slate-400'}`} />
              <span>Khóa ngày sinh: <b>{isPasswordProtectionEnabled ? 'BẬT' : 'TẮT'}</b></span>
            </button>
          )}

          {/* Nút Nhập Excel (chỉ GVCN) */}
          {isTeacherLoggedIn && (
            <button
              type="button"
              onClick={onOpenExcelImport}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs sm:text-sm font-semibold transition-colors shadow-2xs cursor-pointer"
              title="Nhập danh sách học sinh từ tệp Excel (.xlsx / .csv)"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Nhập từ Excel</span>
            </button>
          )}

          {/* Nút Thêm học sinh (chỉ GVCN) */}
          {isTeacherLoggedIn && (
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Thêm học sinh
            </button>
          )}
        </div>
      </div>

      {/* Danh sách học sinh Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-50/70 border-b border-slate-200/80 flex items-center justify-between text-xs font-semibold text-slate-500">
          <span>
            DANH SÁCH {classNameTitle.toUpperCase()} ({filteredStudents.length} học sinh)
          </span>
          <span className="text-slate-400">
            {isTeacherLoggedIn
              ? 'Bấm vào học sinh bất kỳ để xem và ghi nhận sự việc'
              : 'Học sinh chỉ có thể xem chi tiết hồ sơ của chính mình'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-600 font-bold text-xs uppercase tracking-wider">
                <th className="py-3 px-4 text-center w-12">STT</th>
                <th className="py-3 px-4">Họ và tên</th>
                <th className="py-3 px-4">Giới tính</th>
                <th className="py-3 px-4">Ngày sinh</th>
                <th className="py-3 px-4 text-center">Tổ</th>
                <th className="py-3 px-4">Chức vụ</th>
                <th className="py-3 px-4">SĐT Phụ huynh</th>
                <th className="py-3 px-4">Học tập</th>
                <th className="py-3 px-4">Hạnh kiểm (Điểm)</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400 italic">
                    Không tìm thấy học sinh nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student, idx) => {
                  const condSummary = getStudentConductSummary(student.id);
                  const isCurrentStudentUser = currentUser?.role === 'student' && currentUser.studentId === student.id;
                  const isOtherStudent = currentUser?.role === 'student' && currentUser.studentId !== student.id;

                  return (
                    <tr
                      key={student.id}
                      onClick={() => {
                        if (currentUser?.role === 'student') {
                          if (student.id === currentUser.studentId) {
                            onOpenStudentModal(student.id);
                          } else {
                            onShowToast('Hồ sơ riêng tư của bạn học. Em chỉ có thể xem chi tiết hồ sơ của chính mình!', 'info');
                          }
                          return;
                        }

                        if (!isTeacherLoggedIn && isPasswordProtectionEnabled) {
                          setStudentForAuth(student);
                        } else {
                          onOpenStudentModal(student.id);
                        }
                      }}
                      className={`transition-colors cursor-pointer group ${
                        isCurrentStudentUser
                          ? 'bg-blue-50/70 hover:bg-blue-100/60 font-semibold'
                          : 'hover:bg-blue-50/40'
                      }`}
                    >
                      <td className="py-3.5 px-4 text-center font-bold text-slate-400 text-xs">
                        {idx + 1}
                      </td>

                      {/* Họ và tên + Mã */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-2.5">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white shrink-0 ${
                              student.gender === 'Nữ'
                                ? 'bg-gradient-to-tr from-pink-400 to-rose-400'
                                : 'bg-gradient-to-tr from-blue-500 to-teal-400'
                            }`}
                          >
                            {student.name.charAt(student.name.lastIndexOf(' ') + 1) || 'H'}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                              <span>{student.name}</span>
                              {isCurrentStudentUser && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white">
                                  Hồ sơ của tôi
                                </span>
                              )}
                              {isOtherStudent && (
                                <span title="Bảo mật hồ sơ riêng tư">
                                  <Lock className="w-3 h-3 text-slate-400" />
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {student.code}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Giới tính */}
                      <td className="py-3.5 px-4 text-slate-600">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                            student.gender === 'Nữ'
                              ? 'bg-pink-50 text-pink-700'
                              : 'bg-blue-50 text-blue-700'
                          }`}
                        >
                          {student.gender}
                        </span>
                      </td>

                      {/* Ngày sinh */}
                      <td className="py-3.5 px-4 text-slate-600 font-medium">
                        {formatDateVN(student.dob)}
                      </td>

                      {/* Tổ */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-block px-2.5 py-0.5 rounded-full font-bold text-xs bg-slate-100 text-slate-700">
                          Tổ {student.group}
                        </span>
                      </td>

                      {/* Chức vụ */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-semibold ${
                            student.role === 'Lớp trưởng' || student.role === 'Lớp phó học tập'
                              ? 'bg-amber-100 text-amber-900 border border-amber-200'
                              : student.role.includes('Tổ trưởng') || student.role.includes('Lớp phó')
                              ? 'bg-teal-50 text-teal-800 border border-teal-200'
                              : student.role === 'Cờ đỏ'
                              ? 'bg-rose-50 text-rose-800 border border-rose-200'
                              : 'text-slate-600'
                          }`}
                        >
                          {student.role}
                        </span>
                      </td>

                      {/* SĐT Phụ huynh */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-slate-700 font-mono text-xs">
                            {student.parentPhone}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => handleCopyPhone(student.parentPhone, e)}
                            className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Sao chép số điện thoại"
                          >
                            {copiedPhone === student.parentPhone ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                        <div className="text-[11px] text-slate-400 truncate max-w-[140px]">
                          {student.parentName}
                        </div>
                      </td>

                      {/* Tình hình học tập */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            student.academicStatus === 'Tốt'
                              ? 'bg-emerald-50 text-emerald-700'
                              : student.academicStatus === 'Có tiến bộ'
                              ? 'bg-sky-50 text-sky-700'
                              : student.academicStatus === 'Ổn định'
                              ? 'bg-slate-100 text-slate-700'
                              : 'bg-orange-50 text-orange-700 border border-orange-200'
                          }`}
                        >
                          {student.academicStatus}
                        </span>
                      </td>

                      {/* Hạnh kiểm và Điểm thi đua */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-1.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold border ${condSummary.rating.badgeBg} ${condSummary.rating.badgeText}`}
                          >
                            {condSummary.rating.rating}
                          </span>
                          <span className="text-xs font-semibold text-slate-700 font-mono">
                            {condSummary.score}đ
                          </span>
                        </div>
                      </td>

                      {/* Trạng thái */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${
                            student.status === 'Đang học'
                              ? 'text-emerald-700 bg-emerald-50/60'
                              : 'text-slate-500 bg-slate-100'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              student.status === 'Đang học' ? 'bg-emerald-500' : 'bg-slate-400'
                            }`}
                          ></span>
                          {student.status}
                        </span>
                      </td>

                      {/* Thao tác */}
                      <td className="py-3.5 px-4 text-right">
                        {isTeacherLoggedIn ? (
                          <div className="flex items-center justify-end space-x-1">
                            <button
                              type="button"
                              onClick={(e) => openEditModal(student, e)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                              title="Chỉnh sửa thông tin"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteStudent(student.id);
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Xóa học sinh"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ) : isCurrentStudentUser ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenStudentModal(student.id);
                            }}
                            className="px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer"
                          >
                            Xem hồ sơ
                          </button>
                        ) : (
                          <span className="text-slate-300 text-xs flex items-center justify-end gap-1">
                            <Lock className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL XÁC THỰC MẬT KHẨU NGÀY SINH CỦA HỌC SINH / ĐĂNG NHẬP GVCN */}
      <StudentAuthModal
        isOpen={!!studentForAuth}
        student={studentForAuth}
        teacherPassword={teacherPassword}
        onSuccess={() => {
          if (studentForAuth) {
            onOpenStudentModal(studentForAuth.id);
            setStudentForAuth(null);
          }
        }}
        onTeacherLoginSuccess={() => {
          if (onTeacherLoginSuccess) {
            onTeacherLoginSuccess();
          }
        }}
        onClose={() => setStudentForAuth(null)}
        onShowToast={onShowToast}
      />

      {/* MODAL 1: HỒ SƠ HỌC SINH CHI TIẾT (ĐẦY ĐỦ THI ĐUA, THÁNG & HẠNH KIỂM) */}
      <StudentProfileModal
        isOpen={!!activeStudent}
        student={activeStudent}
        attendance={attendance}
        conduct={conduct}
        criteria={criteria}
        currentUser={currentUser}
        ratingThresholds={ratingThresholds}
        isTeacherRole={isTeacherLoggedIn}
        onClose={onCloseStudentModal}
        onOpenOwnProfile={() => currentUser?.studentId && onOpenStudentModal(currentUser.studentId)}
        onEditStudent={(s) => openEditModal(s)}
        onAddConductRecord={onAddConductRecord}
        onDeleteConductRecord={onDeleteConductRecord}
        onShowToast={onShowToast}
      />

      {/* MODAL 2: THÊM / CHỈNH SỬA HỌC SINH */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-5 sm:p-6 shadow-2xl border border-slate-100 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                {editingStudent ? 'Chỉnh sửa thông tin học sinh' : 'Thêm học sinh mới vào lớp'}
              </h3>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="mt-4 space-y-4 max-h-[75vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Mã HS */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mã học sinh</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    required
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                {/* Họ và tên */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Họ và tên *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="VD: Nguyễn Văn An"
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                {/* Giới tính */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Giới tính</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as Gender })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                  </select>
                </div>

                {/* Ngày sinh */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Ngày sinh</label>
                  <input
                    type="date"
                    value={formData.dob}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                {/* Tổ */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tổ</label>
                  <select
                    value={formData.group}
                    onChange={(e) => setFormData({ ...formData, group: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value={1}>Tổ 1</option>
                    <option value={2}>Tổ 2</option>
                    <option value={3}>Tổ 3</option>
                    <option value={4}>Tổ 4</option>
                  </select>
                </div>

                {/* Chức vụ */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Chức vụ trong lớp</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as StudentRole })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="Thành viên">Thành viên</option>
                    <option value="Lớp trưởng">Lớp trưởng</option>
                    <option value="Lớp phó học tập">Lớp phó học tập</option>
                    <option value="Lớp phó lao động">Lớp phó lao động</option>
                    <option value="Tổ trưởng">Tổ trưởng</option>
                    <option value="Tổ phó">Tổ phó</option>
                    <option value="Cờ đỏ">Cờ đỏ</option>
                  </select>
                </div>

                {/* Họ tên phụ huynh */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Họ tên phụ huynh</label>
                  <input
                    type="text"
                    value={formData.parentName}
                    onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                    placeholder="VD: Nguyễn Văn Ba"
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                {/* Số điện thoại phụ huynh */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">SĐT Phụ huynh</label>
                  <input
                    type="text"
                    value={formData.parentPhone}
                    onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                    placeholder="VD: 0912 345 678"
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                {/* Địa chỉ */}
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Địa chỉ thường trú</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="VD: Số 10 đường Trần Hưng Đạo"
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                {/* Trạng thái học tập */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Đánh giá học tập</label>
                  <select
                    value={formData.academicStatus}
                    onChange={(e) => setFormData({ ...formData, academicStatus: e.target.value as AcademicStatus })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="Tốt">Tốt</option>
                    <option value="Ổn định">Ổn định</option>
                    <option value="Có tiến bộ">Có tiến bộ</option>
                    <option value="Cần hỗ trợ">Cần hỗ trợ</option>
                  </select>
                </div>

                {/* Trạng thái học sinh */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Trạng thái học sinh</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as StudentStatus })}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                  >
                    <option value="Đang học">Đang học</option>
                    <option value="Nghỉ học có phép dài ngày">Nghỉ phép dài hạn</option>
                    <option value="Chuyển trường">Chuyển trường</option>
                  </select>
                </div>

                {/* Môn thế mạnh */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Môn thế mạnh</label>
                  <input
                    type="text"
                    value={formData.strengthSubjects}
                    onChange={(e) => setFormData({ ...formData, strengthSubjects: e.target.value })}
                    placeholder="VD: Toán, Ngữ văn"
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                {/* Môn cần quan tâm */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Môn cần quan tâm hỗ trợ</label>
                  <input
                    type="text"
                    value={formData.needsAttentionSubjects}
                    onChange={(e) => setFormData({ ...formData, needsAttentionSubjects: e.target.value })}
                    placeholder="VD: Tiếng Anh, KHTN"
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                {/* Ghi chú của giáo viên */}
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Ghi chú của giáo viên chủ nhiệm
                  </label>
                  <textarea
                    rows={2}
                    value={formData.note}
                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                    placeholder="Nhận xét riêng về tính cách, thói quen, điểm cần lưu ý..."
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm cursor-pointer"
                >
                  {editingStudent ? 'Lưu thay đổi' : 'Thêm học sinh'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
