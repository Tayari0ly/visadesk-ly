# تقرير المراجعة وإعادة البناء — VisaDesk LY

## 1. ملخص تنفيذي

المشروع الحالي هو تطبيق **Next.js 16 + React 19 + TypeScript + Drizzle ORM + PostgreSQL** مع قراءة MRZ محلية عبر Tesseract.js وتوليد PDF رسمي من جهة العميل.

كان التطبيق يعمل كنسخة MVP محلية، وليس كنظام SaaS متعدد الفروع. لذلك تم تنفيذ إعادة بناء تأسيسية في الأجزاء الأكثر خطورة بدل إضافة حلول شكلية فوق التصميم القديم:

- تشديد جلسات الدخول وجعل الجلسة تعتمد على Cookie من نوع HttpOnly مع إعادة التحقق من المستخدم في قاعدة البيانات.
- إزالة كلمة المرور الافتراضية المضمّنة من مسار التهيئة.
- إضافة أساس Multi-Tenant: فروع، تراخيص، أدوار، صلاحيات، `branch_id`، وعزل Server-Side.
- إضافة نسخ غير قابلة للحذف للنماذج وسجل تدقيق.
- إضافة Pagination وفلترة Server-Side للنماذج.
- تشديد MRZ: التحقق من التواريخ وCheck Digits والإشارة إلى البيانات التي تحتاج مراجعة.
- منع رفع صورة الجواز إلى API افتراضيًا؛ تتم القراءة محليًا داخل المتصفح.
- إضافة تقارير أداء وواجهات إدارة الفروع والتراخيص.
- إضافة `.env.example` وتعديل إعداد Drizzle لعدم احتواءه على اتصال ثابت بقاعدة البيانات.

## 2. نتائج التدقيق وتصنيف المشاكل

### Critical

1. كلمة مرور `Admin@123` كانت موجودة داخل الكود ويتم إنشاء الحساب تلقائيًا.
2. سر جلسة احتياطي ثابت، مع استخدام `DATABASE_URL` كسر عند غياب السر.
3. بيانات الجلسة كانت تحتوي الدور، وكان من الممكن الاعتماد على نسخة قديمة من الدور أو حالة الحساب.
4. لا يوجد `branch_id` ولا نظام تراخيص أو عزل فروع حقيقي.
5. حذف النموذج كان حذفًا فعليًا بلا Audit أو History.
6. API استخراج الجواز كان يقبل صورة Base64 ويرسلها إلى Ollama دون طبقة وصول أو حدود حجم واضحة.

### High

1. الأدوار محصورة في `admin/employee` ولا توجد RBAC قابلة للتوسع.
2. كل Admin كان يرى جميع النماذج، وليس نماذج فرعه فقط.
3. MRZ كانت تعتبر القراءة ناجحة حتى مع Check Digits غير صحيحة.
4. لا توجد نسخ للنموذج عند التعديل.
5. لا توجد فهارس أو Pagination قابلة للبحث واسع النطاق.
6. بعض API endpoints كانت تعيد رسائل أخطاء تقنية مباشرة.
7. إعداد Drizzle احتوى على اتصال PostgreSQL ثابت داخل المستودع.

### Medium

1. نظام الطباعة يعتمد على معاينة PDF، لكن لا توجد طبقة Print Layout مستقلة كاملة داخل CSS.
2. لا توجد واجهة Dashboard وتقارير متكاملة حسب الدور.
3. صور الجواز كانت قابلة للتواجد داخل JSON/قاعدة البيانات عبر Preview.
4. لا توجد مسارات Password Reset أو إدارة متقدمة للحسابات.
5. لا توجد اختبارات آلية مستقلة لـ MRZ وRBAC وLicensing.

### Low

1. رسائل الواجهة تعتمد في مواضع على `alert` و`confirm`.
2. بعض النصوص والأنواع القديمة ما زالت تحمل اسم `admin` للتوافق مع النسخ السابقة.
3. ملفات التثبيت المحلية تحتاج تحديثًا لإضافة إعدادات Bootstrap الجديدة.

## 3. ما تم إصلاحه

### المصادقة والأمان

- الجلسة أصبحت تحمل معرف المستخدم فقط، ثم يعاد تحميل المستخدم من قاعدة البيانات في كل طلب محمي.
- الحساب الموقوف لا يستطيع إنشاء جلسة أو استعمال جلسة قديمة.
- الدور والفرع الحاليان يؤخذان من قاعدة البيانات، وليس من Payload قديم قابل لإعادة الاستخدام.
- `SESSION_SECRET` مطلوب في الإنتاج.
- لم يعد هناك إنشاء تلقائي بكلمة مرور ثابتة؛ التهيئة الأولى تستخدم `BOOTSTRAP_ADMIN_PASSWORD` فقط.
- كلمة المرور الجديدة لا تقل عن 10 أحرف وتخزن باستخدام `scrypt`.
- الحسابات لا تحذف فعليًا؛ الحذف الإداري يتحول إلى تعطيل للحفاظ على السجلات.

### Multi-Tenant وLicensing

تمت إضافة الجداول والحقول اللازمة للفروع والتراخيص. كل مستخدم فرع يتم التحقق له من:

- وجود الفرع وتفعيله.
- وجود ترخيص بحالة `active`.
- أن تاريخ انتهاء الترخيص في المستقبل.

### النماذج والتاريخ

- الاستعلامات أصبحت Server-Side مع `page`, `limit`, `search`, `status`, `from`, `to`.
- تم إضافة فهارس على الفرع، المستخدم، رقم الجواز، الحالة، والتاريخ.
- تعديل النموذج يسجل `form_versions` مع الحقول القديمة والجديدة.
- حذف النموذج منطقي Soft Delete بالحالة `deleted`.
- عمليات الإنشاء والتعديل والحذف تكتب في `audit_logs`.

### MRZ/OCR

خط القراءة الآن يعتمد على:

`Local OCR → MRZ Detection → TD3 Parsing → Date Validation → Check Digits → Confidence/Review Flag → Form`

تمت إضافة:

- التحقق من صحة اليوم داخل الشهر، وليس فقط `1..31`.
- Passport Number Check Digit.
- Date of Birth Check Digit.
- Expiry Date Check Digit.
- Composite TD3 Check Digit.
- `valid` لا تصبح `true` إلا عند اكتمال البيانات الأساسية ونجاح التحققات.
- `confidenceScore`, `checks`, و`requiresReview` لإظهار الشك للمستخدم.
- OCR المحلي لا يطبق النتيجة تلقائيًا إلا عند تحقق قوي من MRZ.
- صورة الجواز لا ترسل إلى الخادم في مسار OCR الاعتيادي.

## 4. الملفات التي تم تعديلها أو إنشاؤها

### تم تعديلها

- `src/db/schema.ts`
- `src/db/index.ts`
- `src/lib/auth.ts`
- `src/lib/mrzParser.ts`
- `src/lib/passportOcr.ts`
- `src/components/PassportScanner.tsx`
- `src/components/Header.tsx`
- `src/components/LoginForm.tsx`
- `src/app/api/auth/login/route.ts`
- `src/app/api/applications/route.ts`
- `src/app/api/applications/[id]/route.ts`
- `src/app/api/users/route.ts`
- `src/app/api/users/[id]/route.ts`
- `src/app/api/extract-passport/route.ts`
- `tsconfig.json`
- `drizzle.config.json`

### تم إنشاؤها

- `.env.example`
- `drizzle/README.md`
- `src/app/api/admin/branches/route.ts`
- `src/app/api/reports/performance/route.ts`
- `PROJECT_AUDIT_REPORT_AR.md`

## 5. مخطط قاعدة البيانات الجديد

الجداول الأساسية:

- `branches`: الفروع والشركات.
- `licenses`: مفتاح الترخيص، الحالة، بداية ونهاية الترخيص، الحدود.
- `users`: المستخدمون، الدور، الفرع، الحالة.
- `roles`, `permissions`, `user_roles`: أساس RBAC قابل للتوسع.
- `applications`: النماذج مع `branch_id`, `created_by`, `updated_by`, `status`, وبيانات النموذج.
- `form_versions`: النسخ التاريخية للنماذج.
- `audit_logs`: سجل التغييرات التفصيلي.
- `activity_logs`: سجل النشاط العام.
- `ai_extraction_logs`: سجل عمليات الاستخراج دون تخزين صورة الجواز افتراضيًا.

لا يتم تنفيذ Reset أو Drop لقاعدة البيانات. يجب توليد Migration ومراجعتها وأخذ Backup قبل تطبيقها على قاعدة بيانات قائمة.

## 6. API Routes الحالية والجديدة

- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `GET /api/applications?page=&limit=&search=&status=&from=&to=`
- `POST /api/applications`
- `GET /api/applications/:id`
- `PUT /api/applications/:id`
- `DELETE /api/applications/:id` — Soft Delete حسب الصلاحية
- `GET/POST /api/users`
- `PUT/DELETE /api/users/:id`
- `POST /api/extract-passport` — MRZ/raw text validated path
- `GET /api/reports/performance`
- `GET/POST /api/admin/branches`
- `GET /api/health`
- `GET /api/system-status`

## 7. Roles & Permissions

- `super_admin`: صلاحية كاملة على النظام والفروع والتراخيص.
- `branch_admin`: إدارة الفرع والمستخدمين والنماذج والتقارير.
- `supervisor`: مراجعة النماذج ومتابعة الموظفين والتقارير.
- `employee`: إنشاء وتعديل وطباعة نماذجه المسموح بها.
- `viewer`: مشاهدة فقط.

الصلاحيات المركزية تشمل: `view_forms`, `create_form`, `edit_form`, `delete_form`, `print_form`, `view_reports`, `view_employees`, `create_employees`, `edit_employees`, `manage_employees`, `view_performance`, `manage_branch_settings`.

## 8. طريقة تشغيل الترخيص

1. ينشئ `super_admin` فرعًا من `POST /api/admin/branches`.
2. ينشأ License Key تلقائيًا مع تاريخ انتهاء وحدود اختيارية.
3. يربط المستخدم بالفرع عبر `branch_id`.
4. عند كل جلسة، يتم رفض الحساب إذا كان الفرع متوقفًا أو الرخصة غير نشطة أو منتهية.
5. التحقق Server-Side وليس في الواجهة فقط.

## 9. Print Preview والطباعة

المعاينة الحالية تعتمد على ملف PDF الرسمي الذي يتم توليده من `pdfOfficial.ts` داخل iframe، وهذا يضمن أن المعاينة هي نفس الملف المنزّل. ما يزال مطلوبًا في مرحلة لاحقة إضافة زر Print مباشر وسجل `PRINT_FORM` عند الطباعة، مع تحسين CSS الخاص بـ A4 إذا كان المطلوب طباعة HTML مستقلة بدل PDF.

## 10. Reports

تم إنشاء تقرير أداء Server-Side يرجع لكل موظف:

- Total Forms.
- Printed Forms.
- Edited Forms.
- Last Activity.
- فترة التاريخ المختارة.

يستطيع المستخدم المصرح له تمرير `from` و`to`. التصدير إلى PDF/Excel/CSV يحتاج UI تصدير منفصل أو مكتبة تصدير، ولم يتم الادعاء بأنه مكتمل في هذه المرحلة.

## 11. Environment Variables

راجع `.env.example`. المتغيرات المطلوبة:

- `DATABASE_URL`
- `SESSION_SECRET`
- `BOOTSTRAP_ADMIN_USERNAME` اختياري للتهيئة الأولى.
- `BOOTSTRAP_ADMIN_PASSWORD` اختياري للتهيئة الأولى، ويجب حذفه أو تغييره بعد إنشاء الحساب.
- `OLLAMA_BASE_URL` اختياري ومحلي فقط.
- `NEXT_PUBLIC_APP_NAME`
- `DB_POOL_MAX` اختياري.

## 12. Neon وVercel

- استخدم `DATABASE_URL` من Neon مع `sslmode=require`.
- لا تضع بيانات الاتصال داخل الكود أو `drizzle.config.json`؛ الإعداد الآن يقرأ `${DATABASE_URL}`.
- راجع Migration الناتجة من `drizzle-kit generate` قبل التطبيق.
- استخدم Connection Pool صغيرًا في بيئة Serverless.
- لا تعتمد على تخزين ملفات داخل Vercel؛ عند الحاجة يجب إضافة Object Storage مثل S3-compatible storage مع Signed URLs.
- لا تعتمد على Ollama المحلي في Vercel؛ OCR الحالي المحلي يعمل داخل المتصفح، أما Vision Server فيحتاج مزودًا سحابيًا أو خدمة مستقلة.

## 13. الاختبارات والتحقق

تم تنفيذ فحص ساكن للملفات والتغييرات، كما تم فحص وجود الملفات الجديدة وحجمها.

لم يكتمل `npm run typecheck`, `npm run lint`, و`npm run build` داخل هذه الجلسة بسبب مشكلة بيئية في المجلد المركب من Windows: شُغلت أوامر Node لكن أدوات TypeScript/Next/ESLint علقت عند اجتياز شجرة المشروع أو ظهرت كـ`Permission denied` عبر `node_modules/.bin`. لذلك يجب تشغيل الأوامر التالية في Linux/CI أو داخل Docker:

```bash
npm ci
npm run typecheck
npm run lint
npm run build
```

كما يجب إضافة اختبارات فعلية قبل الإنتاج لـ:

- Login/logout/invalid password/disabled account.
- Employee لا يصل إلى Admin.
- Branch A لا يصل إلى Branch B.
- Active/expired/disabled license.
- MRZ صحيحة، Check Digit خاطئة، صورة منخفضة الجودة، وتواريخ غير صحيحة.
- Create/Edit/History/Soft Delete/Print.

## 14. نقاط تحتاج إعدادًا يدويًا قبل الإنتاج

1. أخذ Backup لقاعدة البيانات الحالية.
2. توليد Migration من Drizzle ومراجعتها مع بيانات Legacy.
3. تعيين `SESSION_SECRET` قويًا في Vercel/Neon deployment.
4. تعيين `BOOTSTRAP_ADMIN_PASSWORD` للتهيئة الأولى فقط ثم إزالته.
5. إنشاء أول فرع ورخصة وربط مستخدمي الفروع.
6. اختيار Object Storage للصور إن تقرر حفظها.
7. تشغيل الاختبارات وبناء الإنتاج داخل CI/Linux أصلي.
8. إضافة UI منفصل لإدارة Super Admin والفروع والتقارير والتصدير.

## 15. حدود هذه المرحلة

لم يتم حذف أي Feature قائم، ولم يتم Reset لقاعدة البيانات، ولم يتم ادعاء أن التصدير Excel أو Password Reset أو Object Storage مكتمل. هذه الأجزاء تحتاج تنفيذًا تكميليًا بعد اعتماد Migration وقرارات التشغيل السحابي.
