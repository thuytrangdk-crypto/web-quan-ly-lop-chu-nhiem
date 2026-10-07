import React, { useState, useRef } from 'react';
import {
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  X,
  FileCheck,
  Users,
} from 'lucide-react';
import { Student } from '../types';
import { parseExcelFile, downloadExcelTemplate, ParsedStudentRow } from '../utils/excelImport';
import { formatDateVN } from '../utils/storage';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  classNameTitle: string;
  onConfirmImport: (newStudents: Omit<Student, 'id'>[], mode: 'append' | 'replace') => void;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  classNameTitle,
  onConfirmImport,
  onShowToast,
}) => {
  const [parsedRows, setParsedRows] = useState<ParsedStudentRow[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setErrorMessage(null);
    setFileName(file.name);

    try {
      const rows = await parseExcelFile(file);
      if (rows.length === 0) {
        setErrorMessage('Không tìm thấy học sinh nào trong tệp. Vui lòng kiểm tra lại cấu trúc cột.');
        setParsedRows([]);
      } else {
        setParsedRows(rows);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Lỗi khi đọc tệp Excel. Vui lòng đảm bảo đúng định dạng .xlsx, .xls hoặc .csv.');
      setParsedRows([]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirm = () => {
    if (parsedRows.length === 0) {
      onShowToast('Chưa có danh sách học sinh hợp lệ để nhập', 'error');
      return;
    }

    const studentsToImport: Omit<Student, 'id'>[] = parsedRows.map((r) => ({
      code: r.code,
      name: r.name,
      gender: r.gender,
      dob: r.dob,
      group: r.group,
      role: r.role,
      parentName: r.parentName || 'Chưa cập nhật',
      parentPhone: r.parentPhone || 'Chưa cập nhật',
      address: r.address || '',
      note: r.note || '',
      status: 'Đang học',
      academicStatus: 'Ổn định',
      academicNote: '',
      strengthSubjects: '',
      needsAttentionSubjects: '',
    }));

    onConfirmImport(studentsToImport, importMode);
    onShowToast(
      `Đã ${importMode === 'replace' ? 'thay thế' : 'thêm'} thành công ${studentsToImport.length} học sinh từ file Excel!`
    );
    onClose();
  };

  const resetSelection = () => {
    setParsedRows([]);
    setFileName('');
    setErrorMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full p-5 sm:p-6 shadow-2xl border border-slate-100 my-8">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                Nhập danh sách học sinh từ Excel / CSV
              </h3>
              <p className="text-xs text-slate-500">
                Áp dụng cho <span className="font-bold text-blue-600">{classNameTitle}</span> • Hỗ trợ tệp .xlsx, .xls, .csv
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-4 space-y-4">
          {/* Step 1: Download Template or Upload */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <div className="text-xs font-bold text-slate-800">
                1. Tải mẫu Excel chuẩn danh sách học sinh
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Chứa sẵn các cột STT, Mã HS, Họ tên, Giới tính, Ngày sinh, Tổ, SĐT phụ huynh...
              </p>
            </div>
            <button
              type="button"
              onClick={() => downloadExcelTemplate(classNameTitle)}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold shrink-0 cursor-pointer transition-colors"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              Tải file mẫu Excel (.xlsx)
            </button>
          </div>

          {/* Upload Drop Area */}
          <div className="p-6 border-2 border-dashed border-slate-200 hover:border-emerald-400 rounded-2xl text-center bg-white transition-colors">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileChange}
              className="hidden"
              id="excel-file-upload"
            />
            <label
              htmlFor="excel-file-upload"
              className="cursor-pointer flex flex-col items-center justify-center space-y-2"
            >
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl shadow-xs">
                <Upload className="w-6 h-6" />
              </div>
              <div className="text-xs sm:text-sm font-bold text-slate-800">
                {fileName ? fileName : 'Bấm vào đây để chọn tệp Excel hoặc kéo thả tệp vào'}
              </div>
              <p className="text-[11px] text-slate-400">
                Chấp nhận các định dạng Microsoft Excel (.xlsx, .xls) hoặc Google Sheets (.csv)
              </p>
            </label>
          </div>

          {/* Loading Indicator */}
          {isProcessing && (
            <div className="text-center py-3 text-xs text-slate-500 animate-pulse">
              Đang phân tích dữ liệu tệp Excel...
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Step 2: Preview Parsed Students */}
          {parsedRows.length > 0 && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-slate-100">
                <div className="flex items-center space-x-2 text-xs font-bold text-slate-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>
                    Đã đọc được {parsedRows.length} học sinh từ tệp &quot;{fileName}&quot;
                  </span>
                </div>
                <button
                  onClick={resetSelection}
                  className="text-xs text-slate-500 hover:text-slate-800 underline"
                >
                  Chọn tệp khác
                </button>
              </div>

              {/* Mode Selection */}
              <div className="flex flex-col sm:flex-row gap-3 p-3 bg-blue-50/60 border border-blue-200/80 rounded-xl text-xs">
                <span className="font-bold text-blue-900 shrink-0">Chế độ nhập:</span>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2 cursor-pointer font-medium text-slate-800">
                    <input
                      type="radio"
                      name="importMode"
                      value="append"
                      checked={importMode === 'append'}
                      onChange={() => setImportMode('append')}
                      className="text-blue-600"
                    />
                    <span>Thêm vào danh sách hiện tại (giữ các em cũ)</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer font-medium text-rose-800">
                    <input
                      type="radio"
                      name="importMode"
                      value="replace"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                      className="text-rose-600"
                    />
                    <span>Thay thế toàn bộ lớp bằng danh sách này</span>
                  </label>
                </div>
              </div>

              {/* Preview Table */}
              <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 sticky top-0">
                    <tr>
                      <th className="py-2 px-3 text-center w-10">#</th>
                      <th className="py-2 px-3">Mã HS</th>
                      <th className="py-2 px-3">Họ và tên</th>
                      <th className="py-2 px-3">Giới tính</th>
                      <th className="py-2 px-3">Ngày sinh</th>
                      <th className="py-2 px-3 text-center">Tổ</th>
                      <th className="py-2 px-3">Chức vụ</th>
                      <th className="py-2 px-3">SĐT Phụ huynh</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedRows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80">
                        <td className="py-2 px-3 text-center text-slate-400 font-mono">
                          {idx + 1}
                        </td>
                        <td className="py-2 px-3 font-semibold text-blue-700">{row.code}</td>
                        <td className="py-2 px-3 font-bold text-slate-800">{row.name}</td>
                        <td className="py-2 px-3">{row.gender}</td>
                        <td className="py-2 px-3 font-mono">{formatDateVN(row.dob)}</td>
                        <td className="py-2 px-3 text-center font-bold">Tổ {row.group}</td>
                        <td className="py-2 px-3 text-slate-600">{row.role}</td>
                        <td className="py-2 px-3 font-mono text-slate-600">{row.parentPhone}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="mt-6 pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            Đóng
          </button>
          <button
            type="button"
            disabled={parsedRows.length === 0}
            onClick={handleConfirm}
            className="px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <FileCheck className="w-4 h-4" />
            Xác nhận nhập {parsedRows.length > 0 ? `(${parsedRows.length} học sinh)` : ''}
          </button>
        </div>
      </div>
    </div>
  );
};
