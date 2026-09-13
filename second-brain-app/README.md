# 🧠 ذهن دوم - Second Brain

یک سیستم مدیریت شخصی کامل، آفلاین، با پشتیبانی از PWA و Android APK.

## ✨ ویژگی‌ها
- 📝 مدیریت یادداشت‌ها با دسته‌بندی و برچسب
- ✅ مدیریت وظایف با اولویت‌بندی
- 📁 مدیریت پروژه‌ها
- 🎯 اهداف و پیگیری پیشرفت
- 📊 داشبورد هوشمند
- 🔍 جستجوی سراسری
- 🌙 تم روشن و تاریک
- 📱 PWA قابل نصب
- 🤖 Android APK از طریق Capacitor
- 💾 کاملاً آفلاین با Local Storage

## 🚀 شروع سریع

### اجرای محلی
```bash
npm install && npm run dev
```

### دیپلوی PWA
```bash
git push origin main
# GitHub Actions به صورت خودکار deploy می‌کند
```

### دریافت APK
```bash
git tag v1.0.0 && git push origin v1.0.0
```

## 📁 ساختار پروژه
```
second-brain-app/
├── index.html              ← App Shell
├── manifest.json           ← PWA Manifest
├── sw.js                   ← Service Worker
├── capacitor.config.json   ← Android Config
├── package.json
├── src/
│   ├── app.js              ← Main Controller
│   ├── core/               ← هسته برنامه
│   │   ├── storage.js
│   │   ├── router.js
│   │   ├── state.js
│   │   ├── events.js
│   │   └── utils.js
│   ├── modules/
│   │   ├── notification.js
│   │   ├── modal.js
│   │   ├── theme.js
│   │   └── search.js
│   ├── pages/
│   │   └── dashboard.js
│   ├── components/
│   │   └── forms.js
│   └── styles/
│       ├── tokens.css
│       ├── base.css
│       ├── components.css
│       ├── layout.css
│       └── notifications.css
├── public/
│   └── icon.svg
├── .github/workflows/
│   └── build-apk.yml
└── docs/
    └── SETUP.md
```

## ⌨️ میانبرهای کیبورد
| کلید | عملکرد |
|------|--------|
| Ctrl+K | جستجو |
| Ctrl+N | یادداشت جدید |
| Ctrl+T | وظیفه جدید |
| Ctrl+D | داشبورد |
| Escape | بستن مودال |

## 📄 مجوز
MIT License
