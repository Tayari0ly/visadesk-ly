# VisaDesk LY — Cloud Schengen Form SaaS

نظام Cloud لإدارة وتعبئة نماذج تأشيرة شنغن، مبني باستخدام **Next.js 16، React، TypeScript، Drizzle ORM، وPostgreSQL**.

يعمل OCR الخاص بالجواز داخل المتصفح باستخدام Tesseract.js وMRZ validation، لذلك لا يحتاج النشر السحابي إلى Ollama أو خادم OCR محلي.

## المكونات السحابية

- **GitHub:** مستودع الكود.
- **Neon:** PostgreSQL Cloud.
- **Vercel:** تشغيل Next.js وAPI Routes.

لا يتم رفع `node_modules` أو `.next` أو ملفات `.env` إلى GitHub. راجع `.gitignore`.

## تشغيل محلي اختياري

يتطلب Node.js LTS وPostgreSQL أو اتصال Neon:

```bash
npm ci
npm run dev
```

افتح `http://localhost:3000`.

## إعداد Neon

1. أنشئ مشروعًا في [Neon](https://neon.tech).
2. انسخ **pooled connection string** من Neon.
3. خذ نسخة احتياطية من قاعدة البيانات القديمة إن وجدت.
4. طبّق الملف `drizzle/0001_saas_foundation.sql` من Neon SQL Editor.
5. لا تنفذ `DROP` أو `RESET` على قاعدة البيانات الحالية.

## Environment Variables

انسخ أسماء المتغيرات من `.env.example` إلى Vercel. لا ترفع القيم الحقيقية إلى GitHub:

```text
DATABASE_URL=postgresql://...?...sslmode=require
SESSION_SECRET=<random-secret-at-least-32-characters>
NEXT_PUBLIC_APP_NAME=VisaDesk LY
DB_POOL_MAX=5
```

لتهيئة أول Super Admin مرة واحدة فقط:

```text
BOOTSTRAP_ADMIN_USERNAME=admin
BOOTSTRAP_ADMIN_PASSWORD=<strong-password-at-least-10-characters>
```

بعد أول تسجيل دخول وإنشاء الحساب، احذف متغيرات Bootstrap من Vercel.

## النشر على GitHub

من مجلد المشروع:

```bash
git init
git add .
git commit -m "Prepare cloud deployment"
git branch -M main
git remote add origin https://github.com/<username>/<repository>.git
git push -u origin main
```

تأكد قبل `git push` من أن:

- `.env` غير موجود في Git.
- `node_modules/` غير موجود.
- `.next/` غير موجود.
- لا توجد كلمات مرور أو مفاتيح API داخل الملفات.

## النشر على Vercel

1. افتح [Vercel](https://vercel.com) واختر **Add New Project**.
2. اربط مستودع GitHub.
3. اختر Framework: **Next.js**.
4. اترك Build Command: `npm run build`.
5. أضف Environment Variables للإعدادات الثلاثة الأساسية.
6. نفّذ Deploy.
7. بعد النشر اختبر:

```text
https://<your-domain>/api/health
https://<your-domain>/api/system-status
```

8. أنشئ أول Super Admin ثم احذف متغيرات Bootstrap.

يمكن أيضًا استخدام تكامل Neon الرسمي من لوحة Vercel لربط قاعدة البيانات وإدارة متغيرات البيئة.

## مسارات API الأساسية

- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `GET/POST /api/applications`
- `GET/PUT/DELETE /api/applications/:id`
- `GET/POST /api/users`
- `PUT/DELETE /api/users/:id`
- `GET/POST /api/admin/branches`
- `GET /api/reports/performance`
- `POST /api/extract-passport`
- `GET /api/health`
- `GET /api/system-status`

## ملاحظات Cloud مهمة

- لا يعتمد التطبيق على Local File Storage.
- لا يتم إرسال صورة الجواز إلى Ollama محلي؛ القراءة الافتراضية محلية داخل المتصفح.
- لا تستخدم Edge Runtime لمسارات قاعدة البيانات؛ المسارات تستخدم Node.js runtime عند الحاجة.
- Connection pooling مضبوط من خلال `DB_POOL_MAX`، ويجب استخدام pooled URL من Neon.
- إذا تقرر حفظ صور الجوازات مستقبلًا، استخدم Object Storage وSigned URLs بدل تخزينها في Vercel filesystem.

## التحقق قبل الإنتاج

شغّل من بيئة Linux أو Windows محلية عادية، وليس من مجلد filesystem مركّب:

```bash
npm ci
npm run typecheck
npm run lint
npm run build
```

ثم اختبر تسجيل الدخول، عزل الفروع، التراخيص، إنشاء النماذج، سجل النسخ، MRZ، والمعاينة.

## الملفات المهمة

- `.env.example`: أسماء المتغيرات فقط.
- `.gitignore`: منع رفع الملفات المحلية والزائدة.
- `vercel.json`: إعداد Vercel.
- `drizzle/0001_saas_foundation.sql`: Migration إضافية آمنة.
- `PROJECT_AUDIT_REPORT_AR.md`: تقرير المراجعة التقنية.
- `NEXT_STEPS_AR.md`: دليل التشغيل والانتقال إلى Cloud.
