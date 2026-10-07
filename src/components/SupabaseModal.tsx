import React, { useState } from 'react';
import {
  Database,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  Cloud,
  CloudUpload,
  CloudDownload,
  X,
  Code2,
} from 'lucide-react';
import {
  testSupabaseConnection,
  saveAppStateToSupabase,
  fetchAppStateFromSupabase,
  SUPABASE_SETUP_SQL,
} from '../lib/supabaseSync';
import { AppState } from '../utils/storage';

interface SupabaseModalProps {
  isOpen: boolean;
  appState: AppState;
  onClose: () => void;
  onApplyRemoteState: (state: AppState) => void;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const SupabaseModal: React.FC<SupabaseModalProps> = ({
  isOpen,
  appState,
  onClose,
  onApplyRemoteState,
  onShowToast,
}) => {
  const [copied, setCopied] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{
    tested: boolean;
    connected: boolean;
    tableExists: boolean;
    error?: string;
  }>({
    tested: false,
    connected: true,
    tableExists: false,
  });

  if (!isOpen) return null;

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SETUP_SQL);
    setCopied(true);
    onShowToast('Đã sao chép mã SQL tạo bảng Supabase vào bộ nhớ tạm!', 'success');
    setTimeout(() => setCopied(false), 3000);
  };

  const handleCheckConnection = async () => {
    setIsChecking(true);
    const result = await testSupabaseConnection();
    setConnectionStatus({
      tested: true,
      connected: result.connected,
      tableExists: result.tableExists,
      error: result.error,
    });
    setIsChecking(false);

    if (result.connected && result.tableExists) {
      onShowToast('Kết nối Supabase và bảng app_data thành công 100%!', 'success');
    } else if (result.connected && !result.tableExists) {
      onShowToast('Đã kết nối Supabase, nhưng cần chạy câu lệnh SQL để tạo bảng!', 'info');
    } else {
      onShowToast(result.error || 'Chưa thể kết nối tới Supabase!', 'error');
    }
  };

  const handleUploadToCloud = async () => {
    setIsSyncing(true);
    const res = await saveAppStateToSupabase(appState);
    setIsSyncing(false);
    if (res.success) {
      onShowToast('Đã đẩy toàn bộ dữ liệu lớp học lên Supabase thành công!', 'success');
    } else {
      onShowToast(`Lỗi lưu lên Supabase: ${res.error}`, 'error');
    }
  };

  const handleDownloadFromCloud = async () => {
    setIsSyncing(true);
    const remote = await fetchAppStateFromSupabase();
    setIsSyncing(false);
    if (remote) {
      onApplyRemoteState(remote);
      onShowToast('Đã tải và áp dụng dữ liệu từ Supabase thành công!', 'success');
    } else {
      onShowToast('Chưa có dữ liệu nào trên Supabase hoặc chưa tạo bảng!', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 my-8 overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-700 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shadow-inner">
              <Database className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold">
                Kết Nối Cơ Sở Dữ Liệu Supabase
              </h3>
              <p className="text-xs text-emerald-100">
                Đồng bộ dữ liệu lớp học vĩnh viễn trên đám mây
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 text-xs sm:text-sm max-h-[80vh] overflow-y-auto custom-scrollbar">
          {/* Thông tin URL & Key đã cấu hình */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Cloud className="w-4 h-4 text-emerald-600" />
                Dự án Supabase đang kết nối:
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                <CheckCircle2 className="w-3 h-3" /> Đã nhận API Key
              </span>
            </div>
            <div className="text-xs font-mono bg-white p-2.5 rounded-xl border border-slate-200 text-slate-600 break-all">
              https://sohuavueougdlsqerwuk.supabase.co
            </div>
          </div>

          {/* Hướng dẫn tạo bảng 1 lần trên Supabase */}
          <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-3">
            <div className="flex items-start gap-2.5 text-amber-900 font-bold text-xs sm:text-sm">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>Chỉ cần 1 bước đơn giản trên Supabase (Khoảng 30 giây):</span>
            </div>
            <ol className="list-decimal list-inside space-y-1.5 text-xs text-amber-800 leading-relaxed font-medium">
              <li>
                Đăng nhập vào{' '}
                <a
                  href="https://supabase.com/dashboard/project/sohuavueougdlsqerwuk/sql"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold underline text-blue-700 hover:text-blue-900 inline-flex items-center gap-0.5"
                >
                  Supabase SQL Editor <ExternalLink className="w-3 h-3 inline" />
                </a>
              </li>
              <li>Bấm nút <b>New query</b> (Tạo truy vấn mới).</li>
              <li>
                Bấm nút <b>"Sao chép mã SQL"</b> bên dưới, dán vào ô nhập rồi bấm <b>Run</b> (Chạy).
              </li>
            </ol>

            {/* Khung mã SQL */}
            <div className="relative mt-2">
              <pre className="p-3 bg-slate-900 text-emerald-300 font-mono text-[11px] rounded-xl overflow-x-auto max-h-36 custom-scrollbar">
                {SUPABASE_SETUP_SQL}
              </pre>
              <button
                type="button"
                onClick={handleCopySql}
                className="absolute top-2 right-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Đã sao chép!' : 'Sao chép mã SQL'}</span>
              </button>
            </div>
          </div>

          {/* Các nút thao tác đồng bộ */}
          <div className="pt-2 flex flex-wrap gap-2.5 items-center justify-between">
            <button
              type="button"
              disabled={isChecking}
              onClick={handleCheckConnection}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
              <span>{isChecking ? 'Đang kiểm tra...' : 'Kiểm tra kết nối lại'}</span>
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                disabled={isSyncing}
                onClick={handleUploadToCloud}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <CloudUpload className="w-4 h-4" />
                <span>Đẩy dữ liệu lên Cloud</span>
              </button>
              <button
                type="button"
                disabled={isSyncing}
                onClick={handleDownloadFromCloud}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <CloudDownload className="w-4 h-4" />
                <span>Tải dữ liệu từ Cloud về</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
