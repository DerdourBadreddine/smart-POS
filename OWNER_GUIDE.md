# Guide du propriétaire — Smart POS

## Version améliorée

Le nouveau dossier à remettre au magasin est `release\SmartPOS-Client`.
Le dossier d’origine reste intact. Fermez la version déjà ouverte avant de
lancer la nouvelle version sur le port habituel. Pour conserver vos données,
copiez votre base et vos sauvegardes dans la nouvelle version uniquement
lorsque le programme est fermé; conservez toujours la copie d’origine.

Pour une réparation avec acompte, saisissez aussi la main-d’œuvre réellement
facturée. Le coût estimé reste une estimation. Le montant encaissé ne peut
pas dépasser le total. Un ticket livré est clôturé.

Dans Clients, ouvrez Détails puis Encaisser. Le paiement rembourse les ventes
les plus anciennes en premier. Les dépenses peuvent être ajoutées, modifiées
ou supprimées avec les boutons du tableau. Les reçus s’ouvrent après la vente.

Fermez le programme avant une restauration. Lancez
`launcher\restore_backup.bat`, sélectionnez la sauvegarde et confirmez.
Une copie `db-before-restore-…sqlite3` de la base actuelle est conservée.

## Démarrer

Double-cliquez sur l’icône **Smart POS** du Bureau. La fenêtre de vente s’ouvre automatiquement.

## Utiliser et fermer

Utilisez **Vente** pour encaisser, **Réparations** pour suivre les téléphones et
**Rapports** pour la fin de journée. Fermez simplement la fenêtre pour arrêter
l’application.

## Sauvegardes

Les sauvegardes sont dans le dossier `backups/`. Une nouvelle copie est créée
au démarrage et les 14 plus récentes sont conservées.

## Restaurer

Fermez Smart POS, lancez `launcher\restore_backup.bat`, choisissez le fichier
à restaurer, puis redémarrez l’application. Une copie de sécurité de la base
actuelle est créée avant le remplacement.

## Si la fenêtre ne s’ouvre pas

Consultez `logs\app.log`. Ne supprimez pas `backend\db.sqlite3`. Contactez la
personne qui entretient l’ordinateur si le problème persiste.

## Mise à jour

Fermez l’application, copiez le nouveau dossier sans supprimer `backend\db.sqlite3`,
`backups/` ni `logs/`, puis lancez `launcher\install.bat`.

## Version EXE

Si le dossier `dist\SmartPOS` est fourni, lancez `SmartPOS.exe`. Gardez
`backend\db.sqlite3`, `backups/` et `logs/` à côté de l’application. Windows
Defender peut demander une exception pour une version non signée; utilisez
uniquement une copie provenant de votre dossier de confiance.

---

# دليل المالك — Smart POS

## النسخة المحسنة

توجد النسخة الجديدة في `release\SmartPOS-Client` وتبقى النسخة الأصلية محفوظة.
أغلق النسخة المفتوحة قبل تشغيل النسخة الجديدة على المنفذ المعتاد. انقل قاعدة
البيانات والنسخ الاحتياطية فقط بعد إغلاق البرنامج، واحتفظ دائماً بالنسخة الأصلية.

عند استلام عربون إصلاح، أدخل أيضاً أجرة العمل الفعلية. التكلفة المقدرة تبقى
تقديراً، ولا يمكن تحصيل مبلغ يتجاوز الإجمالي. لا يمكن تعديل تذكرة مسلمة.

افتح تفاصيل العميل ثم تحصيل الدفع لتسديد أقدم المبيعات أولاً. يمكنك إضافة
المصاريف وتعديلها وحذفها من الجدول. يظهر الوصل مباشرة بعد البيع.

أغلق البرنامج قبل الاسترجاع، وشغّل `launcher\restore_backup.bat` ثم اختر
النسخة الاحتياطية وأكد الاسترجاع. يحتفظ البرنامج بنسخة أمان منفصلة من القاعدة الحالية.

## التشغيل

انقر مرتين على أيقونة **Smart POS** الموجودة على سطح المكتب. ستفتح نافذة البيع تلقائيا.

## الاستخدام والإغلاق

استعمل **البيع** لتسجيل المبيعات، و**الإصلاحات** لمتابعة الهواتف، و**التقارير**
لنهاية اليوم. أغلق النافذة لإيقاف البرنامج.

## النسخ الاحتياطية

توجد النسخ في مجلد `backups/`. ينشئ البرنامج نسخة عند التشغيل ويحتفظ بآخر 14 نسخة.

## الاسترجاع

أغلق البرنامج، شغّل `launcher\restore_backup.bat`، اختر النسخة المطلوبة ثم شغّل
البرنامج من جديد. يتم إنشاء نسخة أمان من قاعدة البيانات الحالية قبل الاستبدال.

## إذا لم تفتح النافذة

راجع الملف `logs\app.log`. لا تحذف `backend\db.sqlite3`. اطلب المساعدة التقنية
إذا استمرت المشكلة.

## التحديث

أغلق البرنامج، انسخ الملفات الجديدة دون حذف `backend\db.sqlite3` أو `backups/`
أو `logs/`، ثم شغّل `launcher\install.bat`.

## نسخة EXE

إذا تم توفير مجلد `dist\SmartPOS`، شغّل `SmartPOS.exe`. احتفظ بملفات
`backend\db.sqlite3` ومجلدي `backups/` و`logs/` بجانب التطبيق. قد يطلب Windows
Defender استثناء للنسخة غير الموقعة؛ استعمل نسخة من مصدر موثوق فقط.
