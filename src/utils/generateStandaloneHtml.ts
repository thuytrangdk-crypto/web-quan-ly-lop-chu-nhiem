import { AppState } from './storage';

export function generateStandaloneHtml(state: AppState): string {
  const jsonState = JSON.stringify(state).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TRỢ LÝ CHỦ NHIỆM – ${state.settings.teacherName || 'GVCN'}</title>
  <meta name="description" content="Ứng dụng trợ lý chủ nhiệm dành cho ${state.settings.teacherName || 'GVCN'}">
  <!-- Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <!-- Google Font -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Plus Jakarta Sans', sans-serif; }
    @media print {
      .no-print { display: none !important; }
      body { background: white !important; }
    }
  </style>
</head>
<body class="bg-slate-50 text-slate-800 antialiased min-h-screen">
  <div id="app"></div>

  <!-- Single-File React Bundle -->
  <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>

  <script type="text/babel">
    const INITIAL_EMBEDDED_DATA = ${jsonState};
    const STORAGE_KEY = 'troly_lop8_standalone_data';

    function getLocalData() {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : INITIAL_EMBEDDED_DATA;
      } catch(e) {
        return INITIAL_EMBEDDED_DATA;
      }
    }

    function saveLocalData(data) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } catch(e) {}
    }

    function calculateRating(score) {
      if (score >= 90) return { rating: 'Tốt', badge: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
      if (score >= 75) return { rating: 'Khá', badge: 'bg-blue-100 text-blue-800 border-blue-300' };
      if (score >= 50) return { rating: 'Đạt', badge: 'bg-amber-100 text-amber-800 border-amber-300' };
      return { rating: 'Chưa đạt', badge: 'bg-rose-100 text-rose-800 border-rose-300' };
    }

    function formatDateVN(dStr) {
      if (!dStr) return '';
      const p = dStr.split('-');
      return p.length === 3 ? (p[2] + '/' + p[1] + '/' + p[0]) : dStr;
    }

    function StandaloneApp() {
      const [data, setData] = React.useState(getLocalData);
      const [currentTab, setCurrentTab] = React.useState('dashboard');
      const [toast, setToast] = React.useState('');
      const [searchStudent, setSearchStudent] = React.useState('');
      
      // Mật khẩu & Hồ sơ học sinh
      const [authStudent, setAuthStudent] = React.useState(null);
      const [authPassword, setAuthPassword] = React.useState('');
      const [authError, setAuthError] = React.useState('');
      const [activeProfileStudent, setActiveProfileStudent] = React.useState(null);
      const [profileMonth, setProfileMonth] = React.useState('all');
      const [profileTab, setProfileTab] = React.useState('conduct');
      
      // Form ghi lỗi vi phạm nhanh trong hồ sơ
      const [showNewViolation, setShowNewViolation] = React.useState(false);
      const [violationName, setViolationName] = React.useState('');
      const [violationPoints, setViolationPoints] = React.useState(2);
      const [violationType, setViolationType] = React.useState('reminder');
      const [violationDate, setViolationDate] = React.useState(new Date().toISOString().slice(0, 10));

      // Quản lý lớp chủ nhiệm
      const [showClassSwitch, setShowClassSwitch] = React.useState(false);
      const [newClassNameInput, setNewClassNameInput] = React.useState('');

      const showToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(''), 3000);
      };

      const updateData = (updater) => {
        setData(prev => {
          const next = typeof updater === 'function' ? updater(prev) : updater;
          saveLocalData(next);
          return next;
        });
      };

      const currentClassId = data.activeClassId || (data.classes && data.classes[0] ? data.classes[0].id : 'class-9a5');
      const currentClass = (data.classes || []).find(c => c.id === currentClassId) || { id: 'class-9a5', name: data.settings.className || 'Lớp 9A5' };
      const currentStudents = data.students.filter(s => (s.classId || 'class-9a5') === currentClass.id);

      const todayStr = new Date().toISOString().slice(0, 10);
      const todayAttendance = data.attendance.filter(a => a.date === todayStr);
      const presentCount = todayAttendance.filter(a => a.status === 'present').length;
      const absentCount = todayAttendance.filter(a => a.status === 'absent_excused' || a.status === 'absent_unexcused').length;
      const lateCount = todayAttendance.filter(a => a.status === 'late').length;

      // Điểm danh tất cả có mặt
      const markAllPresent = () => {
        updateData(prev => {
          const otherDates = prev.attendance.filter(a => a.date !== todayStr);
          const newAtt = currentStudents.map(s => ({
            id: 'att-' + Date.now() + '-' + s.id,
            date: todayStr,
            studentId: s.id,
            status: 'present'
          }));
          return { ...prev, attendance: [...otherDates, ...newAtt] };
        });
        showToast('Đã đánh dấu tất cả có mặt hôm nay!');
      };

      // Đổi trạng thái điểm danh
      const setStudentAttendance = (studentId, status) => {
        updateData(prev => {
          const updated = [...prev.attendance];
          const idx = updated.findIndex(a => a.studentId === studentId && a.date === todayStr);
          if (idx >= 0) {
            updated[idx] = { ...updated[idx], status };
          } else {
            updated.push({ id: 'att-' + Date.now(), studentId, date: todayStr, status });
          }
          return { ...prev, attendance: updated };
        });
      };

      // Mở hộp thoại mật khẩu khi click học sinh
      const handleStudentClick = (student) => {
        setAuthStudent(student);
        setAuthPassword('');
        setAuthError('');
      };

      const verifyPassword = (e) => {
        e.preventDefault();
        if (!authStudent) return;
        const cleanInput = authPassword.replace(/\\D/g, '');
        const p = authStudent.dob.split('-');
        const y = p[0];
        const m = p[1];
        const d = p[2];
        const ddmmyyyy = d + m + y;
        const yyyymmdd = y + m + d;
        const ddmm = d + m;

        if (
          cleanInput === ddmmyyyy ||
          cleanInput === yyyymmdd ||
          cleanInput === ddmm ||
          authPassword.trim() === (d + '/' + m + '/' + y) ||
          authPassword.trim() === authStudent.dob
        ) {
          setActiveProfileStudent(authStudent);
          setAuthStudent(null);
          setProfileMonth('all');
          showToast('Xác thực thành công! Mở hồ sơ em ' + authStudent.name);
        } else {
          setAuthError('Mật khẩu (ngày sinh) không đúng! Vui lòng nhập định dạng NgàyThángNăm (VD: 15/03/2012).');
        }
      };

      const bypassTeacherAuth = () => {
        if (!authStudent) return;
        setActiveProfileStudent(authStudent);
        setAuthStudent(null);
        setProfileMonth('all');
        showToast('Mở khóa bằng quyền Giáo viên chủ nhiệm.');
      };

      // Tính điểm thi đua của học sinh
      const getStudentScore = (studentId) => {
        const records = data.conduct.filter(c => c.studentId === studentId);
        const praises = records.filter(c => c.type === 'praise').reduce((sum, c) => sum + Math.abs(c.points), 0);
        const reminders = records.filter(c => c.type === 'reminder').reduce((sum, c) => sum + Math.abs(c.points), 0);
        const score = 100 + praises - reminders;
        return { score, praises, reminders, ratingInfo: calculateRating(score) };
      };

      // Lưu vi phạm/tuyên dương mới
      const handleSaveViolation = (e) => {
        e.preventDefault();
        if (!violationName.trim()) {
          showToast('Vui lòng nhập nội dung vi phạm / tuyên dương');
          return;
        }
        const pts = violationType === 'praise' ? Math.abs(Number(violationPoints)) : -Math.abs(Number(violationPoints));
        const newRecord = {
          id: 'rec-' + Date.now(),
          date: violationDate,
          studentId: activeProfileStudent.id,
          criterionName: violationName.trim(),
          points: pts,
          type: violationType,
        };
        updateData(prev => ({
          ...prev,
          conduct: [newRecord, ...prev.conduct]
        }));
        showToast('Đã lưu ' + (pts > 0 ? '+' : '') + pts + ' điểm cho ' + activeProfileStudent.name);
        setShowNewViolation(false);
        setViolationName('');
      };

      const deleteViolation = (id) => {
        updateData(prev => ({
          ...prev,
          conduct: prev.conduct.filter(c => c.id !== id)
        }));
        showToast('Đã xóa bản ghi thi đua');
      };

      return (
        <div className="min-h-screen flex flex-col">
          {/* Header */}
          <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-xs no-print">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-teal-500 text-white flex items-center justify-center font-black text-xl shadow-md">
                🎓
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-bold text-slate-800">TRỢ LÝ CHỦ NHIỆM</h1>
                  <button
                    onClick={() => setShowClassSwitch(true)}
                    className="text-xs px-2.5 py-0.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-md font-bold border border-blue-200 cursor-pointer"
                  >
                    {currentClass.name} ▾
                  </button>
                </div>
                <p className="text-xs text-teal-700 font-medium">
                  GVCN: <span className="font-bold text-slate-800">{data.settings.teacherName}</span> • {data.settings.schoolName}
                </p>
              </div>
            </div>
            <div className="text-xs text-slate-600 font-semibold bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
              Hôm nay: {new Date().toLocaleDateString('vi-VN')}
            </div>
          </header>

          {/* Toast */}
          {toast && (
            <div className="fixed bottom-5 right-5 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-lg text-xs font-semibold animate-bounce">
              ✓ {toast}
            </div>
          )}

          <div className="flex-1 flex flex-col lg:flex-row">
            {/* Sidebar */}
            <nav className="w-full lg:w-64 bg-white border-r border-slate-200 p-4 space-y-1.5 shrink-0 no-print">
              {[
                { id: 'dashboard', label: '🏠 Tổng quan' },
                { id: 'students', label: '👨‍🎓 Học sinh' },
                { id: 'attendance', label: '📅 Chuyên cần' },
                { id: 'conduct', label: '⭐ Thi đua – Nề nếp' },
                { id: 'academics', label: '📚 Học tập' },
                { id: 'diary', label: '📝 Nhật ký chủ nhiệm' },
                { id: 'tasks', label: '✅ Công việc' },
                { id: 'reports', label: '📊 Báo cáo' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setCurrentTab(tab.id)}
                  className={'w-full text-left px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ' + (currentTab === tab.id ? 'bg-gradient-to-r from-blue-600 to-teal-600 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-100')}
                >
                  {tab.label}
                </button>
              ))}
            </nav>

            {/* Main Content */}
            <main className="flex-1 p-6 max-w-7xl">
              {currentTab === 'dashboard' && (
                <div className="space-y-6">
                  <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-700 via-teal-600 to-emerald-500 text-white shadow-md">
                    <h2 className="text-xl sm:text-2xl font-bold">Xin chào ${state.settings.teacherName || 'GVCN'}!</h2>
                    <p className="mt-1 text-xs sm:text-sm text-blue-100">
                      Tập thể {currentClass.name} có {currentStudents.length} học sinh. Hôm nay có {presentCount} bạn có mặt.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-xl border border-slate-200">
                      <span className="text-xs text-slate-500 font-semibold">Tổng học sinh</span>
                      <div className="text-2xl font-black text-slate-800 mt-1">{currentStudents.length}</div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-200">
                      <span className="text-xs text-slate-500 font-semibold">Có mặt hôm nay</span>
                      <div className="text-2xl font-black text-emerald-600 mt-1">{presentCount}</div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-200">
                      <span className="text-xs text-slate-500 font-semibold">Vắng hôm nay</span>
                      <div className="text-2xl font-black text-rose-600 mt-1">{absentCount}</div>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-slate-200">
                      <span className="text-xs text-slate-500 font-semibold">Đi muộn</span>
                      <div className="text-2xl font-black text-amber-600 mt-1">{lateCount}</div>
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200">
                    <h3 className="font-bold text-slate-800 text-sm mb-3">Danh sách học sinh {currentClass.name} (Bấm vào tên để mở hồ sơ)</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {currentStudents.map(s => {
                        const scoreInfo = getStudentScore(s.id);
                        return (
                          <div
                            key={s.id}
                            onClick={() => handleStudentClick(s)}
                            className="p-3 bg-slate-50 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 cursor-pointer flex items-center justify-between transition-all"
                          >
                            <div>
                              <div className="font-bold text-xs text-slate-900">{s.name} ({s.code})</div>
                              <div className="text-[11px] text-slate-500">Tổ {s.group} • {s.role} • Sinh: {formatDateVN(s.dob)}</div>
                            </div>
                            <div className="text-right">
                              <span className={'text-[10px] font-bold px-2 py-0.5 rounded border ' + scoreInfo.ratingInfo.badge}>
                                {scoreInfo.ratingInfo.rating} ({scoreInfo.score}đ)
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {currentTab === 'attendance' && (
                <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <h2 className="font-bold text-slate-800">Điểm danh ngày {todayStr} - {currentClass.name}</h2>
                    <button onClick={markAllPresent} className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold cursor-pointer">
                      ✓ Đánh dấu tất cả có mặt
                    </button>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {currentStudents.map(s => {
                      const rec = todayAttendance.find(a => a.studentId === s.id);
                      const cur = rec ? rec.status : 'present';
                      return (
                        <div key={s.id} className="py-3 flex items-center justify-between flex-wrap gap-2">
                          <div>
                            <span className="font-bold text-xs text-slate-800">{s.name}</span>
                            <span className="text-[11px] text-slate-400 ml-2">Tổ {s.group}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button onClick={() => setStudentAttendance(s.id, 'present')} className={'px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer ' + (cur === 'present' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700')}>Có mặt</button>
                            <button onClick={() => setStudentAttendance(s.id, 'absent_excused')} className={'px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer ' + (cur === 'absent_excused' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700')}>Có phép</button>
                            <button onClick={() => setStudentAttendance(s.id, 'absent_unexcused')} className={'px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer ' + (cur === 'absent_unexcused' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-700')}>Vắng</button>
                            <button onClick={() => setStudentAttendance(s.id, 'late')} className={'px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer ' + (cur === 'late' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-700')}>Đi muộn</button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {currentTab === 'students' && (
                <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-bold text-slate-800">Danh sách học sinh {currentClass.name} ({currentStudents.length})</h2>
                      <p className="text-xs text-slate-500">Bấm vào hàng hoặc tên học sinh để xem Hồ sơ (yêu cầu mật khẩu ngày sinh)</p>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500">
                          <th className="py-2.5 px-3">Mã HS</th>
                          <th className="py-2.5 px-3">Họ và tên</th>
                          <th className="py-2.5 px-3">Giới tính</th>
                          <th className="py-2.5 px-3">Ngày sinh</th>
                          <th className="py-2.5 px-3">Tổ</th>
                          <th className="py-2.5 px-3">Chức vụ</th>
                          <th className="py-2.5 px-3">Điểm thi đua</th>
                          <th className="py-2.5 px-3">Hạnh kiểm</th>
                          <th className="py-2.5 px-3">SĐT Phụ huynh</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {currentStudents.map(s => {
                          const scoreInfo = getStudentScore(s.id);
                          return (
                            <tr
                              key={s.id}
                              onClick={() => handleStudentClick(s)}
                              className="hover:bg-blue-50/50 cursor-pointer transition-colors"
                            >
                              <td className="py-3 px-3 font-bold text-slate-500">{s.code}</td>
                              <td className="py-3 px-3 font-bold text-blue-700">{s.name}</td>
                              <td className="py-3 px-3">{s.gender}</td>
                              <td className="py-3 px-3 font-medium">{formatDateVN(s.dob)}</td>
                              <td className="py-3 px-3">Tổ {s.group}</td>
                              <td className="py-3 px-3">{s.role}</td>
                              <td className="py-3 px-3 font-mono font-bold text-slate-800">{scoreInfo.score}đ</td>
                              <td className="py-3 px-3">
                                <span className={'px-2 py-0.5 rounded text-[11px] font-bold border ' + scoreInfo.ratingInfo.badge}>
                                  {scoreInfo.ratingInfo.rating}
                                </span>
                              </td>
                              <td className="py-3 px-3 font-mono text-slate-600">{s.parentPhone}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {currentTab === 'reports' && (
                <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
                  <div className="flex justify-between items-center no-print">
                    <h2 className="font-bold text-slate-800">Báo cáo tình hình lớp</h2>
                    <button onClick={() => window.print()} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold cursor-pointer">In báo cáo</button>
                  </div>
                  <div className="text-center py-4 border-b border-slate-200">
                    <h3 className="font-bold uppercase text-slate-900 text-lg">BÁO CÁO CÔNG TÁC CHỦ NHIỆM</h3>
                    <p className="text-xs text-slate-500 mt-1">Trường: {data.settings.schoolName} • Lớp: {currentClass.name} • GVCN: {data.settings.teacherName}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="p-4 bg-slate-50 rounded-xl border">
                      <div className="font-bold text-slate-800 mb-1">Sĩ số & Chuyên cần</div>
                      <div>Tổng số học sinh: <b>{currentStudents.length}</b></div>
                      <div>Có mặt hôm nay: <b>{presentCount}</b></div>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-xl border">
                      <div className="font-bold text-slate-800 mb-1">Thi đua & Khen thưởng</div>
                      <div>Số lượt ghi nhận thi đua: <b>{data.conduct.length}</b></div>
                      <div>Công việc chủ nhiệm đã tạo: <b>{data.tasks.length}</b></div>
                    </div>
                  </div>
                </div>
              )}

              {currentTab === 'conduct' && (
                <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
                  <h2 className="font-bold text-slate-800">Thi đua – Nề nếp {currentClass.name}</h2>
                  <div className="space-y-2">
                    {data.conduct.map(c => {
                      const s = currentStudents.find(st => st.id === c.studentId);
                      if (!s) return null;
                      return (
                        <div key={c.id} className="p-3 bg-slate-50 rounded-xl border flex justify-between text-xs">
                          <div>
                            <span className="font-bold text-slate-800">{s.name}</span>
                            <span className="text-slate-500 ml-2">{c.criterionName}</span>
                            <span className="text-slate-400 font-mono text-[11px] ml-2">({formatDateVN(c.date)})</span>
                          </div>
                          <span className={'font-bold px-2 py-0.5 rounded ' + (c.points > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800')}>
                            {c.points > 0 ? '+' : ''}{c.points} đ
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {currentTab === 'academics' && (
                <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
                  <h2 className="font-bold text-slate-800">Theo dõi học tập {currentClass.name}</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {currentStudents.map(s => (
                      <div key={s.id} className="p-3 bg-slate-50 rounded-xl border">
                        <div className="flex justify-between font-bold text-slate-900 mb-1">
                          <span>{s.name}</span>
                          <span className="text-blue-600">{s.academicStatus}</span>
                        </div>
                        <p className="text-slate-600 text-[11px]">{s.academicNote || 'Chưa có ghi chú'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {currentTab === 'diary' && (
                <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
                  <h2 className="font-bold text-slate-800">Nhật ký chủ nhiệm</h2>
                  <div className="space-y-3">
                    {data.diary.map(d => (
                      <div key={d.id} className="p-4 bg-slate-50 rounded-xl border text-xs">
                        <div className="flex justify-between font-bold text-slate-800 mb-1">
                          <span>{d.title}</span>
                          <span className="text-slate-400 font-mono">{d.date}</span>
                        </div>
                        <p className="text-slate-700 mt-1">{d.content}</p>
                        <div className="mt-2 text-teal-800 font-medium">Biện pháp: {d.actionTaken}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {currentTab === 'tasks' && (
                <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
                  <h2 className="font-bold text-slate-800">Công việc chủ nhiệm ({data.tasks.length})</h2>
                  <div className="space-y-2">
                    {data.tasks.map(t => (
                      <div key={t.id} className="p-3 bg-slate-50 rounded-xl border flex justify-between items-center text-xs">
                        <div>
                          <span className={'font-bold ' + (t.status === 'Hoàn thành' ? 'line-through text-slate-400' : 'text-slate-800')}>{t.title}</span>
                          <div className="text-[11px] text-slate-400">Hạn: {t.dueDate} • Mức độ: {t.priority}</div>
                        </div>
                        <span className="px-2.5 py-1 rounded-lg font-bold bg-white border text-slate-700">{t.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </main>
          </div>

          {/* MODAL 1: BẢO MẬT XÁC THỰC NGÀY SINH */}
          {authStudent && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
              <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
                <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                  <h3 className="font-bold text-slate-900 text-base">🔒 Bảo mật hồ sơ học sinh</h3>
                  <button onClick={() => setAuthStudent(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
                </div>
                <div className="my-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="font-bold text-slate-900 text-sm">{authStudent.name} ({authStudent.code})</div>
                  <div className="text-xs text-slate-500">Tổ {authStudent.group} • {currentClass.name}</div>
                </div>
                <form onSubmit={verifyPassword} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nhập ngày sinh của em (Mật khẩu riêng)
                    </label>
                    <input
                      type="password"
                      value={authPassword}
                      onChange={(e) => { setAuthPassword(e.target.value); setAuthError(''); }}
                      placeholder="VD: 15/03/2012 hoặc 15032012"
                      className="w-full p-2.5 border border-slate-300 rounded-xl text-sm focus:outline-hidden focus:border-blue-500 font-mono"
                      autoFocus
                    />
                    <div className="text-[11px] text-slate-400 mt-1">
                      Tránh học sinh này xem vi phạm hoặc thông tin của học sinh khác.
                    </div>
                  </div>
                  {authError && (
                    <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs">
                      {authError}
                    </div>
                  )}
                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="submit"
                      className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                    >
                      Xác nhận mở hồ sơ
                    </button>
                    <button
                      type="button"
                      onClick={bypassTeacherAuth}
                      className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                    >
                      Quyền GVCN
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* MODAL 2: HỒ SƠ HỌC SINH CHI TIẾT (CÓ THEO DÕI VI PHẠM THEO THÁNG, TÍNH ĐIỂM THI ĐUA & XẾP HẠNH KIỂM) */}
          {activeProfileStudent && (() => {
            const student = activeProfileStudent;
            const scoreInfo = getStudentScore(student.id);
            const studentRecords = data.conduct.filter(c => c.studentId === student.id);
            const filteredRecords = studentRecords.filter(rec => {
              if (profileMonth === 'all') return true;
              const p = rec.date.split('-');
              return p.length >= 2 && parseInt(p[1], 10).toString() === profileMonth;
            });
            const studentAtt = data.attendance.filter(a => a.studentId === student.id);
            const attPresent = studentAtt.filter(a => a.status === 'present').length;
            const attRate = studentAtt.length > 0 ? Math.round((attPresent / studentAtt.length) * 100) : 100;

            return (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
                <div className="bg-white rounded-3xl max-w-3xl w-full p-5 sm:p-7 shadow-2xl border border-slate-100 my-6 flex flex-col max-h-[92vh]">
                  {/* Header hồ sơ & Menu tabs */}
                  <div className="pb-2 border-b border-slate-200">
                    <div className="flex items-start justify-between pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl font-black text-slate-900">{student.name}</h3>
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">{student.code}</span>
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">Tổ {student.group}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Sinh ngày: <b>{formatDateVN(student.dob)}</b> • Giới tính: {student.gender} • Chức vụ: {student.role}
                        </p>
                      </div>
                      <button onClick={() => setActiveProfileStudent(null)} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 cursor-pointer">✕</button>
                    </div>

                    {/* 5 Tabs chuẩn theo ảnh mẫu */}
                    <div className="flex items-center space-x-6 text-xs sm:text-sm font-semibold overflow-x-auto pt-2">
                      {['Thông tin', 'Điểm danh', 'Học tập', 'Thi đua & Kỷ luật', 'Sổ tay & Liên hệ'].map(tabName => {
                        const tabKey = tabName === 'Thông tin' ? 'info' : tabName === 'Điểm danh' ? 'attendance' : tabName === 'Học tập' ? 'academic' : tabName === 'Thi đua & Kỷ luật' ? 'conduct' : 'parent';
                        const isActive = profileTab === tabKey;
                        return (
                          <button
                            key={tabKey}
                            type="button"
                            onClick={() => setProfileTab(tabKey)}
                            className={'pb-2.5 px-1 border-b-2 transition-colors cursor-pointer whitespace-nowrap ' + (isActive ? 'border-indigo-600 text-indigo-600 font-bold' : 'border-transparent text-slate-500 hover:text-slate-800')}
                          >
                            {tabName}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Nội dung tab */}
                  <div className="mt-4 flex-1 overflow-y-auto pr-1">
                    {profileTab === 'conduct' && (
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                        {/* Cột Trái: + Ghi nhận Sự việc */}
                        <div className="lg:col-span-5 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3.5">
                          <div className="flex items-center space-x-2 text-base font-bold text-slate-900">
                            <span className="text-indigo-600 text-lg font-bold">+</span>
                            <span>Ghi nhận Sự việc</span>
                          </div>

                          <form onSubmit={handleSaveViolation} className="space-y-3 text-xs">
                            <div>
                              <label className="block font-semibold text-slate-700 mb-1">Ngày *</label>
                              <input
                                type="date"
                                required
                                value={violationDate}
                                onChange={(e) => setViolationDate(e.target.value)}
                                className="w-full p-2 bg-white border border-slate-300 rounded-xl font-medium"
                              />
                            </div>

                            <div>
                              <label className="block font-semibold text-slate-700 mb-1">Sự việc *</label>
                              <select
                                value={violationName}
                                onChange={(e) => {
                                  setViolationName(e.target.value);
                                  if (e.target.value.includes('(-1đ)')) setViolationPoints(1);
                                  else if (e.target.value.includes('(-2đ)')) setViolationPoints(2);
                                  else if (e.target.value.includes('(-3đ)')) setViolationPoints(3);
                                  else if (e.target.value.includes('(+2đ)')) { setViolationType('praise'); setViolationPoints(2); }
                                  else if (e.target.value.includes('(+3đ)')) { setViolationType('praise'); setViolationPoints(3); }
                                  else if (e.target.value.includes('(+5đ)')) { setViolationType('praise'); setViolationPoints(5); }
                                }}
                                className="w-full p-2 bg-white border border-slate-300 rounded-xl font-medium"
                              >
                                <option value="Đi học muộn (-1đ)">Đi học muộn (-1đ)</option>
                                <option value="Không làm bài tập (-2đ)">Không làm bài tập (-2đ)</option>
                                <option value="Mất trật tự trong giờ (-2đ)">Mất trật tự trong giờ (-2đ)</option>
                                <option value="Quên sách vở / đồ dùng (-1đ)">Quên sách vở / đồ dùng (-1đ)</option>
                                <option value="Vi phạm đồng phục (-1đ)">Vi phạm đồng phục (-1đ)</option>
                                <option value="Sử dụng điện thoại (-2đ)">Sử dụng điện thoại (-2đ)</option>
                                <option value="Phát biểu xây dựng bài sôi nổi (+2đ)">Phát biểu xây dựng bài sôi nổi (+2đ)</option>
                                <option value="Điểm tốt kiểm tra (+3đ)">Điểm tốt kiểm tra (+3đ)</option>
                                <option value="Giúp đỡ bạn tiến bộ (+2đ)">Giúp đỡ bạn tiến bộ (+2đ)</option>
                                <option value="Việc tốt được khen ngợi (+5đ)">Việc tốt được khen ngợi (+5đ)</option>
                              </select>
                            </div>

                            <div>
                              <label className="block font-semibold text-slate-700 mb-1">Chi tiết (Tùy chọn)</label>
                              <textarea
                                rows="3"
                                placeholder="Nhập thêm chi tiết..."
                                className="w-full p-2 bg-white border border-slate-300 rounded-xl resize-none text-xs"
                              />
                            </div>

                            <button
                              type="submit"
                              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl cursor-pointer shadow-xs text-xs"
                            >
                              Lưu ghi nhận
                            </button>
                          </form>
                        </div>

                        {/* Cột Phải: Kỳ đánh giá & Lịch sử sự việc */}
                        <div className="lg:col-span-7 space-y-4">
                          <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-4">
                            <div>
                              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                                KỲ ĐÁNH GIÁ (THÁNG)
                              </div>
                              <select
                                value={profileMonth}
                                onChange={(e) => setProfileMonth(e.target.value)}
                                className="p-1.5 rounded-xl border border-slate-300 font-bold bg-white text-xs"
                              >
                                <option value="10">Tháng 10/2026</option>
                                <option value="9">Tháng 09/2026</option>
                                <option value="11">Tháng 11/2026</option>
                                <option value="12">Tháng 12/2026</option>
                                <option value="1">Tháng 01/2027</option>
                                <option value="2">Tháng 02/2027</option>
                                <option value="3">Tháng 03/2027</option>
                                <option value="4">Tháng 04/2027</option>
                                <option value="5">Tháng 05/2027</option>
                                <option value="all">Tất cả các tháng</option>
                              </select>
                            </div>

                            <div className="flex items-center space-x-6">
                              <div className="text-right">
                                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">TỔNG ĐIỂM</div>
                                <div className="text-2xl font-black text-emerald-600">
                                  {filteredRecords.reduce((sum, c) => sum + c.points, 0) || 0}
                                </div>
                              </div>
                              <div className="h-7 w-px bg-slate-200"></div>
                              <div>
                                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">XẾP LOẠI</div>
                                <div className="text-xl font-black text-emerald-600">
                                  {filteredRecords.reduce((sum, c) => sum + c.points, 0) >= 0 ? 'Tốt' : 'Khá'}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="font-bold text-slate-900 text-sm">
                                Lịch sử sự việc ({profileMonth === 'all' ? 'Tất cả' : 'Tháng ' + profileMonth + '/2026'})
                              </h4>
                              <span className="text-xs text-slate-500 font-semibold bg-slate-100 px-2 py-0.5 rounded-lg">
                                {filteredRecords.length} sự việc
                              </span>
                            </div>
                            <div className="max-h-72 overflow-y-auto overflow-x-auto rounded-xl border border-slate-100 divide-y divide-slate-100">
                              <table className="w-full text-left text-xs">
                                <thead className="sticky top-0 bg-slate-50 z-10 border-b border-slate-200">
                                  <tr className="text-slate-500 font-semibold">
                                    <th className="py-2.5 px-2">Ngày</th>
                                    <th className="py-2.5 px-2">Sự việc</th>
                                    <th className="py-2.5 px-2 text-center">Điểm</th>
                                    <th className="py-2.5 px-2 text-right">Xóa</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                  {filteredRecords.length === 0 ? (
                                    <tr>
                                      <td colSpan="4" className="py-8 text-center text-slate-400">
                                        Chưa có sự việc nào được ghi nhận trong tháng này.
                                      </td>
                                    </tr>
                                  ) : (
                                    filteredRecords.map(rec => (
                                      <tr key={rec.id} className="hover:bg-slate-50/80">
                                        <td className="py-2.5 px-2 font-medium whitespace-nowrap">{formatDateVN(rec.date)}</td>
                                        <td className="py-2.5 px-2 font-semibold text-slate-800">{rec.criterionName}</td>
                                        <td className="py-2.5 px-2 text-center whitespace-nowrap">
                                          <span className={'px-1.5 py-0.5 rounded font-bold ' + (rec.points > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700')}>
                                            {rec.points > 0 ? '+' : ''}{rec.points}đ
                                          </span>
                                        </td>
                                        <td className="py-2.5 px-2 text-right whitespace-nowrap">
                                          <button onClick={() => deleteViolation(rec.id)} className="text-rose-600 hover:underline cursor-pointer">Xóa</button>
                                        </td>
                                      </tr>
                                    ))
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {profileTab === 'attendance' && (
                      <div className="space-y-3 text-xs">
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                          <span className="font-bold text-slate-700">Tỷ lệ chuyên cần: </span>
                          <span className="font-black text-emerald-600">{attRate}%</span> ({attPresent}/{studentAtt.length} buổi)
                        </div>
                        <div className="divide-y divide-slate-100">
                          {studentAtt.map(a => (
                            <div key={a.id} className="py-2 flex justify-between">
                              <span className="font-mono text-slate-600">{formatDateVN(a.date)}</span>
                              <span className={'font-bold px-2 py-0.5 rounded text-[11px] ' + (a.status === 'present' ? 'bg-emerald-50 text-emerald-700' : a.status === 'late' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700')}>
                                {a.status === 'present' ? 'Có mặt' : a.status === 'late' ? 'Đi muộn' : a.status === 'absent_excused' ? 'Có phép' : 'Vắng'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {profileTab === 'parent' && (
                      <div className="space-y-3 text-xs">
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                          <div className="font-bold text-slate-800">Thông tin gia đình</div>
                          <div>Họ tên phụ huynh: <b>{student.parentName}</b></div>
                          <div>Số điện thoại: <b className="font-mono text-blue-600">{student.parentPhone}</b></div>
                          <div>Địa chỉ: <b>{student.address || 'Chưa cập nhật'}</b></div>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                          <div className="font-bold text-slate-800 mb-1">Ghi chú của GVCN</div>
                          <p className="text-slate-600">{student.note || 'Không có ghi chú'}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* MODAL 3: ĐỔI LỚP CHỦ NHIỆM */}
          {showClassSwitch && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
              <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
                <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                  <h3 className="font-bold text-slate-900 text-base">🏫 Thay đổi lớp chủ nhiệm</h3>
                  <button onClick={() => setShowClassSwitch(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
                </div>
                <div className="my-4 space-y-2">
                  {(data.classes || [{ id: 'class-9a5', name: data.settings.className || 'Lớp 9A5' }]).map(c => (
                    <div
                      key={c.id}
                      onClick={() => {
                        updateData(prev => ({ ...prev, activeClassId: c.id, settings: { ...prev.settings, className: c.name } }));
                        setShowClassSwitch(false);
                        showToast('Đã chuyển sang lớp ' + c.name);
                      }}
                      className={'p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ' + (c.id === currentClassId ? 'bg-blue-50 border-blue-300 font-bold text-blue-700' : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-800')}
                    >
                      <span>{c.name}</span>
                      {c.id === currentClassId && <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">Đang chọn</span>}
                    </div>
                  ))}
                </div>
                <div className="pt-2 border-t border-slate-100">
                  <div className="text-xs font-bold text-slate-700 mb-2">Thêm lớp mới:</div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newClassNameInput}
                      onChange={(e) => setNewClassNameInput(e.target.value)}
                      placeholder="VD: Lớp 9A6, Lớp 9A7..."
                      className="flex-1 p-2 border border-slate-300 rounded-xl text-xs"
                    />
                    <button
                      onClick={() => {
                        if (!newClassNameInput.trim()) return;
                        const newId = 'class-' + Date.now();
                        const newCls = { id: newId, name: newClassNameInput.trim(), grade: 8 };
                        updateData(prev => ({
                          ...prev,
                          classes: [...(prev.classes || []), newCls],
                          activeClassId: newId,
                          settings: { ...prev.settings, className: newCls.name }
                        }));
                        setNewClassNameInput('');
                        setShowClassSwitch(false);
                        showToast('Đã tạo và chuyển sang lớp ' + newCls.name);
                      }}
                      className="px-3 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 cursor-pointer"
                    >
                      Thêm lớp
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    ReactDOM.createRoot(document.getElementById('app')).render(<StandaloneApp />);
  </script>
</body>
</html>`;
}
