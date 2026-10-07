import { supabase, isSupabaseConfigured } from './supabase';
import { AppState, sanitizeAppState } from '../utils/storage';

export const SUPABASE_TABLE_NAME = 'app_data';
export const SUPABASE_RECORD_ID = 'main_class_data';

export interface SupabaseSyncStatus {
  isConfigured: boolean;
  isConnected: boolean;
  tableExists: boolean;
  lastSyncedAt: Date | null;
  isSyncing: boolean;
  error: string | null;
}

/**
 * Kiểm tra kết nối tới Supabase và xem bảng app_data đã được tạo hay chưa
 */
export async function testSupabaseConnection(): Promise<{
  connected: boolean;
  tableExists: boolean;
  error?: string;
}> {
  if (!isSupabaseConfigured) {
    return { connected: false, tableExists: false, error: 'Chưa cấu hình Supabase URL hoặc Key' };
  }

  try {
    const { data, error } = await supabase
      .from(SUPABASE_TABLE_NAME)
      .select('id, updated_at')
      .eq('id', SUPABASE_RECORD_ID)
      .maybeSingle();

    if (error) {
      // Mã lỗi PGRST205 hoặc message có 'Could not find the table' -> chưa tạo bảng
      if (
        error.code === 'PGRST205' ||
        error.message?.includes('Could not find the table') ||
        error.message?.includes('schema cache')
      ) {
        return { connected: true, tableExists: false, error: 'Bảng app_data chưa được tạo trên Supabase' };
      }
      return { connected: false, tableExists: false, error: error.message };
    }

    return { connected: true, tableExists: true };
  } catch (err: any) {
    return { connected: false, tableExists: false, error: err.message || 'Lỗi mạng khi kết nối Supabase' };
  }
}

/**
 * Tải toàn bộ dữ liệu từ Supabase về ứng dụng
 */
export async function fetchAppStateFromSupabase(): Promise<AppState | null> {
  if (!isSupabaseConfigured) return null;

  try {
    const { data, error } = await supabase
      .from(SUPABASE_TABLE_NAME)
      .select('data')
      .eq('id', SUPABASE_RECORD_ID)
      .maybeSingle();

    if (error || !data || !data.data) {
      return null;
    }

    const sanitized = sanitizeAppState(data.data as AppState);
    if (
      sanitized.settings?.schoolName !== data.data.settings?.schoolName ||
      sanitized.settings?.teacherName !== data.data.settings?.teacherName
    ) {
      saveAppStateToSupabase(sanitized).catch(() => {});
    }

    return sanitized;
  } catch (err) {
    console.warn('Lỗi khi tải dữ liệu từ Supabase:', err);
    return null;
  }
}

/**
 * Lưu toàn bộ dữ liệu AppState lên Supabase
 */
export async function saveAppStateToSupabase(state: AppState): Promise<{
  success: boolean;
  error?: string;
}> {
  if (!isSupabaseConfigured) {
    return { success: false, error: 'Chưa cấu hình Supabase' };
  }

  try {
    const payload = {
      id: SUPABASE_RECORD_ID,
      data: state,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from(SUPABASE_TABLE_NAME)
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Lỗi mạng khi lưu lên Supabase' };
  }
}

/**
 * Câu lệnh SQL mẫu để người dùng copy vào Supabase SQL Editor
 */
export const SUPABASE_SETUP_SQL = `-- 1. TẠO BẢNG LƯU TRỮ DỮ LIỆU TRỢ LÝ CHỦ NHIỆM TRÊN SUPABASE
create table if not exists public.app_data (
  id text primary key,
  data jsonb not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. BẬT BẢO MẬT HÀNG (ROW LEVEL SECURITY)
alter table public.app_data enable row level security;

-- 3. CẤP QUYỀN ĐỌC/GHI CHO NGƯỜI DÙNG CỦA ỨNG DỤNG (ANON KEY)
drop policy if exists "Cho phép đọc dữ liệu app_data" on public.app_data;
create policy "Cho phép đọc dữ liệu app_data"
on public.app_data for select
using (true);

drop policy if exists "Cho phép ghi/sửa dữ liệu app_data" on public.app_data;
create policy "Cho phép ghi/sửa dữ liệu app_data"
on public.app_data for all
using (true)
with check (true);
`;
