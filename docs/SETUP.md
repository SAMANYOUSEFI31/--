# راهنمای راه‌اندازی کامل

## پیش‌نیازها
- Node.js 20+
- Git
- Android Studio (برای build محلی)
- Java JDK 17+

## ۱. اجرای محلی
```bash
git clone https://github.com/YOUR_USERNAME/second-brain.git
cd second-brain-app
npm install
npm run dev
# http://localhost:3000
```

## ۲. دیپلوی GitHub Pages (PWA)
```bash
git init && git add . && git commit -m "init"
git remote add origin https://github.com/YOUR/REPO.git
git push -u origin main
```
سپس: Settings → Pages → Source: GitHub Actions

## ۳. Build APK محلی
```bash
npm install -g @capacitor/cli
npx cap add android
npx cap sync android
cd android && ./gradlew assembleDebug
# APK: android/app/build/outputs/apk/debug/
```

## ۴. ایجاد Keystore برای Release
```bash
keytool -genkey -v -keystore release.keystore \
  -alias secondbrain -keyalg RSA -keysize 2048 -validity 10000

# تبدیل به base64
base64 release.keystore
```

## ۵. GitHub Secrets
Settings → Secrets → Actions:
- KEYSTORE_BASE64
- KEYSTORE_PASSWORD
- KEY_ALIAS
- KEY_PASSWORD

## ۶. نصب APK روی اندروید
1. فایل APK را دانلود کنید
2. تنظیمات → امنیت → نصب از منابع ناشناس را فعال کنید
3. فایل APK را باز کنید

## ۷. نصب PWA
### اندروید (Chrome):
منوی سه‌نقطه → Add to Home screen

### iOS (Safari):
Share → Add to Home Screen
