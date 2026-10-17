# Guide du propriétaire — Smart POS

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

---

# دليل المالك — Smart POS

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
