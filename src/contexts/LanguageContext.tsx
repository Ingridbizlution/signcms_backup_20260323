import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Language = "zh" | "en" | "ja";

const translations = {
  // App
  appName: { zh: "SignBoard CMS", en: "SignBoard CMS", ja: "SignBoard CMS" },
  appSubtitle: { zh: "連鎖店電子看板管理系統", en: "Digital Signage Management", ja: "デジタルサイネージ管理" },

  // Nav
  navDashboard: { zh: "總覽儀表板", en: "Dashboard", ja: "ダッシュボード" },
  navScreens: { zh: "螢幕管理", en: "Screens", ja: "スクリーン管理" },
  navMedia: { zh: "廣告素材庫", en: "Media Library", ja: "メディアライブラリ" },
  navSchedules: { zh: "播放清單排程", en: "Schedules", ja: "スケジュール" },
  navAdmin: { zh: "使用者管理", en: "User Management", ja: "ユーザー管理" },

  // Common
  cancel: { zh: "取消", en: "Cancel", ja: "キャンセル" },
  save: { zh: "儲存", en: "Save", ja: "保存" },
  delete: { zh: "刪除", en: "Delete", ja: "削除" },
  edit: { zh: "編輯", en: "Edit", ja: "編集" },
  add: { zh: "新增", en: "Add", ja: "追加" },
  search: { zh: "搜尋", en: "Search", ja: "検索" },
  upload: { zh: "上傳", en: "Upload", ja: "アップロード" },
  logout: { zh: "登出", en: "Sign Out", ja: "ログアウト" },
  user: { zh: "使用者", en: "User", ja: "ユーザー" },
  online: { zh: "在線", en: "Online", ja: "オンライン" },
  offline: { zh: "離線", en: "Offline", ja: "オフライン" },
  enabled: { zh: "啟用中", en: "Enabled", ja: "有効" },
  disabled: { zh: "已停用", en: "Disabled", ja: "無効" },
  confirmDelete: { zh: "確定刪除", en: "Confirm Delete", ja: "削除確認" },
  seconds: { zh: "秒", en: "s", ja: "秒" },
  allBranches: { zh: "所有分店", en: "All Branches", ja: "全店舗" },
  allTypes: { zh: "所有類型", en: "All Types", ja: "全タイプ" },
  image: { zh: "圖片", en: "Image", ja: "画像" },
  video: { zh: "影片", en: "Video", ja: "動画" },
  uploadMedia: { zh: "上傳素材", en: "Upload Media", ja: "メディアアップロード" },

  // Dashboard
  dashTitle: { zh: "總覽儀表板", en: "Dashboard", ja: "ダッシュボード" },
  dashSubtitle: { zh: "即時監控所有分店電子看板狀態", en: "Monitor all branch digital signage in real-time", ja: "全店舗のデジタルサイネージをリアルタイム監視" },
  dashOnlineScreens: { zh: "在線螢幕", en: "Online Screens", ja: "オンラインスクリーン" },
  dashRunningNormal: { zh: "運行正常", en: "Running normally", ja: "正常稼働中" },
  dashOfflineWarning: { zh: "離線螢幕警告", en: "Offline Warnings", ja: "オフライン警告" },
  dashNeedCheck: { zh: "需要檢查", en: "Needs attention", ja: "要確認" },
  dashTodayPlays: { zh: "今日預計播放", en: "Today's Plays", ja: "本日再生予定" },
  dashPlayCount: { zh: "次廣告輪播", en: "ad rotations", ja: "回広告ローテーション" },
  dashScreenList: { zh: "分店螢幕列表", en: "Branch Screen List", ja: "店舗スクリーン一覧" },
  dashJustNow: { zh: "剛剛", en: "Just now", ja: "たった今" },
  dashMinAgo: { zh: "分鐘前", en: "min ago", ja: "分前" },
  dashScheduleOverview: { zh: "排程總覽", en: "Schedule Overview", ja: "スケジュール概要" },
  dashMediaStats: { zh: "素材使用統計", en: "Media Usage", ja: "メディア使用統計" },
  dashScheduleName: { zh: "排程名稱", en: "Schedule", ja: "スケジュール名" },
  dashItems: { zh: "素材數", en: "Items", ja: "素材数" },
  dashDuration: { zh: "時長(秒)", en: "Duration(s)", ja: "時間(秒)" },
  dashStatus: { zh: "狀態", en: "Status", ja: "ステータス" },
  dashScreen: { zh: "螢幕", en: "Screen", ja: "スクリーン" },
  dashUsedIn: { zh: "次", en: "times", ja: "回" },
  dashTotalMedia: { zh: "素材總數", en: "Total Media", ja: "メディア合計" },
  dashTotalSchedules: { zh: "啟用排程", en: "Active Schedules", ja: "有効スケジュール" },
  dashByType: { zh: "素材類型分佈", en: "Media by Type", ja: "メディアタイプ分布" },
  dashByBranch: { zh: "各分店螢幕數", en: "Screens by Branch", ja: "店舗別スクリーン数" },

  // Screens
  screensTitle: { zh: "螢幕管理", en: "Screen Management", ja: "スクリーン管理" },
  screensSubtitle: { zh: "管理所有分店的電子看板設備", en: "Manage all branch digital signage devices", ja: "全店舗のデジタルサイネージを管理" },
  screensAdd: { zh: "新增螢幕", en: "Add Screen", ja: "スクリーン追加" },
  screensSearchPlaceholder: { zh: "搜尋螢幕名稱、分店...", en: "Search screens, branches...", ja: "スクリーン名、店舗を検索..." },
  screensNoResult: { zh: "沒有找到符合條件的螢幕", en: "No screens found", ja: "スクリーンが見つかりません" },
  screensName: { zh: "螢幕名稱", en: "Screen Name", ja: "スクリーン名" },
  screensBranch: { zh: "所屬分店", en: "Branch", ja: "所属店舗" },
  screensLocation: { zh: "安裝位置", en: "Location", ja: "設置場所" },
  screensResolution: { zh: "螢幕解析度", en: "Resolution", ja: "解像度" },
  screensEditTitle: { zh: "編輯螢幕", en: "Edit Screen", ja: "スクリーン編集" },
  screensAddTitle: { zh: "新增螢幕", en: "Add Screen", ja: "スクリーン追加" },
  screensSaveChanges: { zh: "儲存變更", en: "Save Changes", ja: "変更を保存" },
  screensDeleteConfirm: { zh: "確定要刪除這台螢幕嗎？", en: "Delete this screen?", ja: "このスクリーンを削除しますか？" },
  screensDeleteDesc: { zh: "刪除後將無法復原，相關的播放排程也會一併移除。", en: "This action cannot be undone. Related schedules will also be removed.", ja: "この操作は取り消せません。関連するスケジュールも削除されます。" },
  screensSelectBranch: { zh: "選擇分店", en: "Select branch", ja: "店舗を選択" },
  screensNamePlaceholder: { zh: "例如：1F 入口大螢幕", en: "e.g. 1F Entrance Display", ja: "例：1F 入口ディスプレイ" },
  screensLocationPlaceholder: { zh: "例如：一樓入口右側", en: "e.g. Right side of 1F entrance", ja: "例：1階入口右側" },
  screensFillRequired: { zh: "請填寫螢幕名稱和所屬分店", en: "Please fill in screen name and branch", ja: "スクリーン名と所属店舗を入力してください" },
  screensUpdated: { zh: "螢幕已更新", en: "Screen updated", ja: "スクリーンを更新しました" },
  screensAdded: { zh: "螢幕已新增", en: "Screen added", ja: "スクリーンを追加しました" },
  screensDeleted: { zh: "螢幕已刪除", en: "Screen deleted", ja: "スクリーンを削除しました" },

  // Media
  mediaTitle: { zh: "廣告素材庫", en: "Media Library", ja: "メディアライブラリ" },
  mediaSubtitle: { zh: "管理所有廣告圖片與影片素材", en: "Manage all advertising images and videos", ja: "すべての広告画像と動画を管理" },
  mediaImages: { zh: "張圖片", en: "images", ja: "枚の画像" },
  mediaVideos: { zh: "部影片", en: "videos", ja: "本の動画" },
  mediaSearchPlaceholder: { zh: "搜尋素材名稱...", en: "Search media...", ja: "メディアを検索..." },
  mediaNoResult: { zh: "沒有找到符合條件的素材", en: "No media found", ja: "メディアが見つかりません" },
  mediaUpload: { zh: "上傳素材", en: "Upload Media", ja: "メディアアップロード" },
  mediaDeleteConfirm: { zh: "確定要刪除這個素材嗎？", en: "Delete this media?", ja: "このメディアを削除しますか？" },
  mediaDeleteDesc: { zh: "刪除後將無法復原，使用此素材的播放清單也會受到影響。", en: "This cannot be undone. Playlists using this media will be affected.", ja: "この操作は取り消せません。このメディアを使用するプレイリストに影響します。" },
  mediaType: { zh: "類型", en: "Type", ja: "タイプ" },
  mediaFileSize: { zh: "檔案大小", en: "File Size", ja: "ファイルサイズ" },
  mediaResolution: { zh: "解析度", en: "Resolution", ja: "解像度" },
  mediaDuration: { zh: "時長", en: "Duration", ja: "再生時間" },
  mediaUploadDate: { zh: "上傳日期", en: "Upload Date", ja: "アップロード日" },
  mediaPreviewUnavailable: { zh: "預覽不可用（範例素材）", en: "Preview unavailable (sample)", ja: "プレビュー不可（サンプル）" },
  mediaDeleteItem: { zh: "刪除素材", en: "Delete Media", ja: "メディア削除" },
  mediaUploaded: { zh: "已上傳", en: "Uploaded", ja: "アップロード済み" },
  mediaDeleted: { zh: "已刪除", en: "Deleted", ja: "削除済み" },
  mediaUnsupported: { zh: "不支援的檔案格式", en: "Unsupported file format", ja: "サポートされていないファイル形式" },
  mediaReading: { zh: "讀取中...", en: "Loading...", ja: "読み込み中..." },

  // Schedules
  schedTitle: { zh: "播放清單排程", en: "Playlist Schedules", ja: "プレイリストスケジュール" },
  schedSubtitle: { zh: "設定各螢幕的播放內容與時段", en: "Configure playback content and time slots for each screen", ja: "各スクリーンの再生内容と時間帯を設定" },
  schedAdd: { zh: "新增排程", en: "Add Schedule", ja: "スケジュール追加" },
  schedNoResult: { zh: "尚未建立任何排程", en: "No schedules created yet", ja: "スケジュールはまだありません" },
  schedName: { zh: "排程名稱", en: "Schedule Name", ja: "スケジュール名" },
  schedScreen: { zh: "指定螢幕", en: "Target Screen", ja: "対象スクリーン" },
  schedStartTime: { zh: "開始時間", en: "Start Time", ja: "開始時間" },
  schedEndTime: { zh: "結束時間", en: "End Time", ja: "終了時間" },
  schedPlayDays: { zh: "播放日", en: "Play Days", ja: "再生日" },
  schedPlaylist: { zh: "播放清單", en: "Playlist", ja: "プレイリスト" },
  schedPlayOrder: { zh: "播放順序", en: "Play Order", ja: "再生順序" },
  schedItems: { zh: "個素材", en: "items", ja: "アイテム" },
  schedSelectScreen: { zh: "選擇螢幕", en: "Select screen", ja: "スクリーンを選択" },
  schedNamePlaceholder: { zh: "例如：早班輪播", en: "e.g. Morning rotation", ja: "例：朝のローテーション" },
  schedFillRequired: { zh: "請填寫排程名稱和指定螢幕", en: "Please fill in schedule name and target screen", ja: "スケジュール名と対象スクリーンを入力してください" },
  schedAddItem: { zh: "請至少加入一個素材", en: "Add at least one media item", ja: "少なくとも1つのメディアを追加してください" },
  schedUpdated: { zh: "排程已更新", en: "Schedule updated", ja: "スケジュールを更新しました" },
  schedAdded: { zh: "排程已新增", en: "Schedule added", ja: "スケジュールを追加しました" },
  schedDeleted: { zh: "排程已刪除", en: "Schedule deleted", ja: "スケジュールを削除しました" },
  schedEditTitle: { zh: "編輯排程", en: "Edit Schedule", ja: "スケジュール編集" },
  schedAddTitle: { zh: "新增排程", en: "Add Schedule", ja: "スケジュール追加" },
  schedSaveChanges: { zh: "儲存變更", en: "Save Changes", ja: "変更を保存" },
  schedDeleteConfirm: { zh: "確定要刪除這個排程嗎？", en: "Delete this schedule?", ja: "このスケジュールを削除しますか？" },
  schedDeleteDesc: { zh: "刪除後將無法復原，該螢幕的播放內容將會停止。", en: "This cannot be undone. Playback on this screen will stop.", ja: "この操作は取り消せません。このスクリーンの再生は停止します。" },
  schedClickToAdd: { zh: "點擊加入素材", en: "Click to add media", ja: "クリックしてメディアを追加" },
  schedFromBelow: { zh: "從下方選擇素材加入清單", en: "Select media below to add to playlist", ja: "下からメディアを選択してプレイリストに追加" },

  // Days
  dayMon: { zh: "一", en: "Mon", ja: "月" },
  dayTue: { zh: "二", en: "Tue", ja: "火" },
  dayWed: { zh: "三", en: "Wed", ja: "水" },
  dayThu: { zh: "四", en: "Thu", ja: "木" },
  dayFri: { zh: "五", en: "Fri", ja: "金" },
  daySat: { zh: "六", en: "Sat", ja: "土" },
  daySun: { zh: "日", en: "Sun", ja: "日" },

  // Duration formatting
  durationMin: { zh: "分", en: "m", ja: "分" },
  durationSec: { zh: "秒", en: "s", ja: "秒" },

  // Admin
  adminTitle: { zh: "使用者管理", en: "User Management", ja: "ユーザー管理" },
  adminSubtitle: { zh: "管理系統使用者角色與權限", en: "Manage user roles and permissions", ja: "ユーザーの役割と権限を管理" },
  adminTotalUsers: { zh: "總使用者數", en: "Total Users", ja: "総ユーザー数" },
  adminAdminCount: { zh: "管理員數", en: "Admin Count", ja: "管理者数" },
  adminUserList: { zh: "使用者列表", en: "User List", ja: "ユーザー一覧" },
  adminUserListDesc: { zh: "查看和管理所有使用者的角色", en: "View and manage all user roles", ja: "すべてのユーザーの役割を表示・管理" },
  adminRole: { zh: "管理員", en: "Admin", ja: "管理者" },
  adminRegularUser: { zh: "一般使用者", en: "Regular User", ja: "一般ユーザー" },
  adminUnnamed: { zh: "未命名使用者", en: "Unnamed User", ja: "未設定ユーザー" },
  adminConfirmChange: { zh: "確認更改角色", en: "Confirm Role Change", ja: "役割変更の確認" },
  adminConfirmChangeDesc: { zh: "確定要將", en: "Are you sure you want to change", ja: "次のユーザーの役割を変更しますか：" },
  adminChangeRoleTo: { zh: "的角色更改為", en: "'s role to", ja: "の役割を" },
  adminConfirm: { zh: "確認更改", en: "Confirm", ja: "確認" },
  adminNoPermission: { zh: "權限不足", en: "Access Denied", ja: "アクセス拒否" },
  adminNoPermissionDesc: { zh: "您沒有管理員權限，無法存取此頁面。請聯繫系統管理員。", en: "You don't have admin privileges. Contact system administrator.", ja: "管理者権限がありません。システム管理者にお問い合わせください。" },
  adminRoleUpdated: { zh: "角色更新成功", en: "Role updated", ja: "役割を更新しました" },
  adminRoleUpdateFailed: { zh: "角色更新失敗", en: "Role update failed", ja: "役割の更新に失敗しました" },

  // Auth
  authWelcome: { zh: "歡迎回來", en: "Welcome Back", ja: "おかえりなさい" },
  authCreateAccount: { zh: "建立帳號", en: "Create Account", ja: "アカウント作成" },
  authSignUpDesc: { zh: "註冊以開始管理您的電子看板", en: "Sign up to manage your digital signage", ja: "デジタルサイネージの管理を開始" },
  authSignInDesc: { zh: "登入以管理您的電子看板系統", en: "Sign in to manage your digital signage", ja: "デジタルサイネージシステムにログイン" },
  authGoogleSignIn: { zh: "使用 Google 帳號登入", en: "Sign in with Google", ja: "Google でログイン" },
  authOrEmail: { zh: "或使用 Email", en: "or use Email", ja: "またはメールで" },
  authDisplayName: { zh: "顯示名稱", en: "Display Name", ja: "表示名" },
  authNamePlaceholder: { zh: "您的名稱", en: "Your name", ja: "お名前" },
  authPassword: { zh: "密碼", en: "Password", ja: "パスワード" },
  authPasswordPlaceholder: { zh: "至少 6 個字元", en: "At least 6 characters", ja: "6文字以上" },
  authForgotPassword: { zh: "忘記密碼？", en: "Forgot password?", ja: "パスワードを忘れた方" },
  authSignIn: { zh: "登入", en: "Sign In", ja: "ログイン" },
  authSignUp: { zh: "註冊", en: "Sign Up", ja: "新規登録" },
  authHaveAccount: { zh: "已有帳號？", en: "Already have an account?", ja: "アカウントをお持ちの方" },
  authNoAccount: { zh: "還沒有帳號？", en: "Don't have an account?", ja: "アカウントをお持ちでない方" },
  authSignUpSuccess: { zh: "註冊成功！請檢查您的信箱以驗證帳號。", en: "Sign up successful! Check your email to verify.", ja: "登録成功！メールを確認してアカウントを認証してください。" },
  authSignInSuccess: { zh: "登入成功！", en: "Signed in!", ja: "ログインしました！" },
  authFailed: { zh: "驗證失敗，請重試。", en: "Authentication failed. Please try again.", ja: "認証に失敗しました。もう一度お試しください。" },
  authGoogleFailed: { zh: "Google 登入失敗", en: "Google sign-in failed", ja: "Google ログインに失敗しました" },

  // Forgot password
  forgotTitle: { zh: "忘記密碼", en: "Forgot Password", ja: "パスワードを忘れた方" },
  forgotDesc: { zh: "輸入您的 Email，我們將寄送重設連結", en: "Enter your email to receive a reset link", ja: "メールアドレスを入力してリセットリンクを送信" },
  forgotCheckEmail: { zh: "請檢查您的信箱", en: "Check your email", ja: "メールを確認してください" },
  forgotSent: { zh: "重設密碼連結已寄出，請檢查您的信箱。", en: "Reset link sent. Check your email.", ja: "リセットリンクを送信しました。メールを確認してください。" },
  forgotSentDesc: { zh: "我們已將密碼重設連結寄至", en: "We've sent a password reset link to", ja: "パスワードリセットリンクを送信しました：" },
  forgotClickLink: { zh: "，請點擊信中的連結來設定新密碼。", en: ". Click the link in the email to set a new password.", ja: "。メール内のリンクをクリックして新しいパスワードを設定してください。" },
  forgotBackToLogin: { zh: "返回登入", en: "Back to Login", ja: "ログインに戻る" },
  forgotSendLink: { zh: "寄送重設連結", en: "Send Reset Link", ja: "リセットリンクを送信" },
  forgotSendFailed: { zh: "發送失敗，請重試。", en: "Failed to send. Please try again.", ja: "送信に失敗しました。もう一度お試しください。" },

  // Reset password
  resetTitle: { zh: "設定新密碼", en: "Set New Password", ja: "新しいパスワードの設定" },
  resetDesc: { zh: "請輸入您的新密碼", en: "Enter your new password", ja: "新しいパスワードを入力してください" },
  resetNewPassword: { zh: "新密碼", en: "New Password", ja: "新しいパスワード" },
  resetConfirmPassword: { zh: "確認新密碼", en: "Confirm Password", ja: "パスワード確認" },
  resetConfirmPlaceholder: { zh: "再次輸入新密碼", en: "Re-enter new password", ja: "新しいパスワードを再入力" },
  resetUpdate: { zh: "更新密碼", en: "Update Password", ja: "パスワードを更新" },
  resetMismatch: { zh: "兩次密碼輸入不一致", en: "Passwords don't match", ja: "パスワードが一致しません" },
  resetSuccess: { zh: "密碼已更新成功！", en: "Password updated!", ja: "パスワードを更新しました！" },
  resetFailed: { zh: "密碼更新失敗", en: "Password update failed", ja: "パスワードの更新に失敗しました" },
  resetInvalidLink: { zh: "無效的重設連結，請重新請求密碼重設。", en: "Invalid reset link. Please request a new one.", ja: "無効なリセットリンクです。新しいリンクをリクエストしてください。" },
  resetRequestNew: { zh: "重新請求", en: "Request New Link", ja: "新しいリンクをリクエスト" },

  // 404
  notFoundTitle: { zh: "找不到頁面", en: "Page Not Found", ja: "ページが見つかりません" },
  notFoundDesc: { zh: "您訪問的頁面不存在", en: "The page you're looking for doesn't exist", ja: "お探しのページは存在しません" },
  notFoundBack: { zh: "返回首頁", en: "Return to Home", ja: "ホームに戻る" },

  // Theme
  lightMode: { zh: "淺色模式", en: "Light Mode", ja: "ライトモード" },
  darkMode: { zh: "深色模式", en: "Dark Mode", ja: "ダークモード" },
} as const;

type TranslationKey = keyof typeof translations;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem("signboard-lang");
    return (saved as Language) || "zh";
  });

  useEffect(() => {
    localStorage.setItem("signboard-lang", language);
    document.documentElement.lang = language === "zh" ? "zh-TW" : language === "ja" ? "ja" : "en";
  }, [language]);

  const t = (key: TranslationKey): string => {
    return translations[key]?.[language] ?? key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
