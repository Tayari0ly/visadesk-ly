# الخطوات التالية لتشغيل VisaDesk LY

## الحالة الحالية

تم تحديث المشروع ليستخدم Webpack في وضع التطوير، وإضافة إعدادات Bootstrap محلية، وإضافة migration تأسيسية لـ SaaS. لم يتم تطبيق migration على قاعدة البيانات تلقائيًا، ولم يتم تشغيل خادم عام من الـsandbox لأن المشروع موجود على مجلد Windows مركّب؛ هذا النوع من المجلدات يجعل Next يبقى في مرحلة مراقبة الملفات ولا يفتح المنفذ بشكل موثوق.

## تشغيل محلي على Windows

افتح PowerShell داخل:

```powershell
cd C:\Users\Tayary\local-ai-schengen-form-automation
```

ثبّت الحزم وأعد تشغيل الخادم:

```powershell
npm ci
npm run dev
```

ثم افتح:

```text
http://localhost:3000
```

حساب التهيئة المحلية هو:

```text
Username: admin
Password: LocalAdminPassword2026!
```

غيّر كلمة المرور فورًا في بيئة حقيقية. إذا كان لديك مستخدمون قدامى، لا تستخدم Bootstrap مرة ثانية قبل التأكد من وجود الحسابات.

## إذا بقي Next عالقًا على Windows

استخدم أحد الحلين التاليين:

1. انقل المشروع إلى مسار محلي غير مربوط بالـsandbox، مثل `C:\dev\local-ai-schengen-form-automation`، ثم نفذ `npm ci` و`npm run dev`.
2. شغّل المشروع داخل Docker باستخدام ملفات `install/docker-compose.yml`.

لا تحذف `src` أو `node_modules`. يمكن حذف `.next` فقط عند وجود كاش بناء تالف.

## ربط PostgreSQL/Neon

1. أنشئ قاعدة PostgreSQL في Neon.
2. انسخ pooled connection string من Neon.
3. ضعها في `.env.local` أو إعدادات Vercel باسم `DATABASE_URL` مع `sslmode=require`.
4. خذ نسخة احتياطية من قاعدة البيانات القديمة.
5. طبّق الملف التالي مرة واحدة من خلال Neon SQL Editor أو `psql`:

```text
drizzle/0001_saas_foundation.sql
```

المigration إضافية ولا تعمل Drop أو Reset للجداول الحالية. بعد تطبيقها، راجع أن أعمدة `branch_id`, `created_by`, `updated_by`, و`printed_at` أضيفت إلى الجداول القديمة.

## متغيرات الإنتاج

يجب تعريف:

```text
DATABASE_URL=<Neon pooled connection string>
SESSION_SECRET=<random value of at least 32 characters>
NEXT_PUBLIC_APP_NAME=VisaDesk LY
DB_POOL_MAX=5
```

يستخدم `BOOTSTRAP_ADMIN_USERNAME` و`BOOTSTRAP_ADMIN_PASSWORD` للتهيئة الأولى فقط. بعد إنشاء أول Super Admin، احذفهما من بيئة الإنتاج.

لا تستخدم كلمة مرور الاختبار المحلية في Vercel أو Neon.

## فحص ما قبل الإنتاج

شغّل الأوامر من مسار Linux أصلي أو Windows محلي غير مركّب:

```bash
npm ci
npm run typecheck
npm run lint
npm run build
npm run start
```

ثم افحص:

```text
GET /api/health
GET /api/system-status
```

يجب ألا تنشر التطبيق إذا كان `npm run build` يفشل.

## النشر على Vercel

1. ارفع المشروع إلى Git repository خاص.
2. أنشئ مشروعًا جديدًا في Vercel.
3. اختر Next.js، واترك Build Command على `npm run build`.
4. أضف `DATABASE_URL`, `SESSION_SECRET`, و`NEXT_PUBLIC_APP_NAME` في Production Environment Variables.
5. لا تضف `OLLAMA_BASE_URL` إلا إذا كان لديك Vision service سحابية؛ Ollama المحلي لا يعمل داخل Vercel.
6. نفذ Deploy.
7. طبّق migration على Neon قبل اختبار تسجيل الدخول.
8. أنشئ الفرع الأول والرخصة والمستخدمين.

## الاختبارات المطلوبة بعد النشر

اختبر بالترتيب:

- تسجيل الدخول بكلمة صحيحة وخاطئة.
- إيقاف الحساب والتأكد من رفض الجلسة القديمة.
- إنشاء فرعين ومستخدمين والتأكد أن كل فرع يرى بياناته فقط.
- ترخيص فعال، منتهٍ، ومعطل.
- إنشاء نموذج وتعديله ثم مراجعة History.
- حذف نموذج والتأكد أنه لا يختفي من Audit.
- MRZ صحيحة، Check Digit خاطئة، تاريخ غير صالح، وصورة غير واضحة.
- البحث والـPagination والتقرير.
- PDF Preview والتنزيل والطباعة.

## ما يحتاج تطويرًا لاحقًا

قبل اعتبار النظام SaaS تجاريًا مكتملًا، يجب إضافة واجهة Super Admin كاملة، Password Reset، Object Storage للصور عند الحاجة، تسجيل حدث الطباعة، تصدير CSV/Excel/PDF، واختبارات آلية في CI. كما يجب تشغيل migration وبناء الإنتاج في بيئة أصلية؛ نتيجة الـsandbox الحالية لا تمثل فشلًا في كود التطبيق، بل قيدًا في مسار الملفات المركّب.
