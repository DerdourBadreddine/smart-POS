import json
from pathlib import Path

translations = {
    'confirmation': {'ok': ('OK', 'موافق')},
    'printing': {'narrow': ('Imprimer · 80 mm', 'طباعة · 80 مم')},
    'pagination': {'itemsPerPage': ('Articles par page', 'العناصر في الصفحة'), 'nextPage': ('Page suivante', 'الصفحة التالية'), 'previousPage': ('Page précédente', 'الصفحة السابقة'), 'firstPage': ('Première page', 'الصفحة الأولى'), 'lastPage': ('Dernière page', 'الصفحة الأخيرة')},
    'sales': {'export': ('Exporter les ventes', 'تصدير المبيعات')},
    'common': {'confirm': ('Confirmer', 'تأكيد'), 'noResults': ('Aucun résultat', 'لا توجد نتائج'), 'navigation': ('Navigation principale', 'القائمة الرئيسية'), 'language': ('Changer de langue', 'تغيير اللغة'), 'decrease': ('Diminuer la quantité', 'تقليل الكمية'), 'increase': ('Augmenter la quantité', 'زيادة الكمية'), 'actions': ('Actions', 'إجراءات')},
    'errors': {'network': ('Connexion impossible. Vérifiez que Smart POS est démarré.', 'تعذر الاتصال. تأكد من تشغيل Smart POS.'), 'request': ('Impossible de terminer cette opération. Réessayez.', 'تعذر إتمام العملية. أعد المحاولة.'), 'invalid': ('Vérifiez les champs du formulaire.', 'تحقق من حقول النموذج.')},
    'nav': {'groupSales': ('Ventes', 'المبيعات'), 'groupStock': ('Stock', 'المخزون'), 'groupService': ('Service', 'الصيانة'), 'groupPeople': ('Clients', 'العملاء'), 'groupTools': ('Outils', 'الأدوات')},
    'dashboard': {'expenses': ('Dépenses du jour', 'مصاريف اليوم'), 'noSales': ('Aucune vente sur cette période', 'لا توجد مبيعات في هذه الفترة'), 'quickActions': ('Actions rapides', 'إجراءات سريعة'), 'activity': ('Activité des ventes', 'نشاط المبيعات')},
    'pos': {'shortcuts': ('F2 Rechercher · F9 Encaisser · Échap Vider', 'F2 بحث · F9 دفع · Esc إفراغ'), 'creditCustomerRequired': ('Sélectionnez un client pour une vente à crédit.', 'اختر عميلاً للبيع بالدين.'), 'warranty': ('Garantie jusqu’au', 'الضمان حتى')},
    'customers': {'paymentAmount': ('Montant à encaisser', 'المبلغ المحصل'), 'oldestFirst': ('Le paiement est appliqué aux ventes les plus anciennes.', 'يطبق الدفع على أقدم المبيعات أولاً.'), 'sales': ('Ventes', 'المبيعات'), 'repairs': ('Réparations', 'الإصلاحات')},
    'repairs': {'recordPayment': ('Enregistrer un paiement', 'تسجيل دفعة'), 'printSlip': ('Imprimer la fiche', 'طباعة وصل الاستلام'), 'readyMessage': ('Votre appareil est prêt à récupérer.', 'جهازك جاهز للاستلام.'), 'selectPart': ('Sélectionner une pièce', 'اختيار قطعة')},
    'expenses': {'edit': ('Modifier la dépense', 'تعديل المصروف'), 'deleteConfirm': ('Supprimer cette dépense ?', 'حذف هذا المصروف؟'), 'total': ('Total des dépenses', 'إجمالي المصاريف'), 'note': ('Note', 'ملاحظة')},
    'reports': {'salesTotal': ('Total des ventes', 'إجمالي المبيعات'), 'salesCount': ('Nombre de ventes', 'عدد المبيعات'), 'salesCollected': ('Ventes encaissées', 'المبيعات المحصلة'), 'debtsCollected': ('Dettes recouvrées', 'الديون المحصلة'), 'repairIncome': ('Revenus réparations', 'إيراد الإصلاحات'), 'expenses': ('Dépenses', 'المصاريف'), 'netTotal': ('Solde net', 'الصافي'), 'method': ('Mode de paiement', 'طريقة الدفع')},
    'expenseCategories': {'RENT': ('Loyer', 'الإيجار'), 'UTILITIES': ('Services', 'الخدمات'), 'SUPPLIES': ('Fournitures', 'اللوازم'), 'SALARY': ('Salaires', 'الرواتب'), 'OTHER': ('Autres', 'أخرى')},
    'movementReasons': {'PURCHASE': ('Achat', 'شراء'), 'SALE': ('Vente', 'بيع'), 'REPAIR_USE': ('Réparation', 'إصلاح'), 'ADJUSTMENT': ('Ajustement', 'تعديل'), 'RETURN': ('Retour', 'إرجاع'), 'VOID': ('Annulation', 'إلغاء')},
    'settings': {'saved': ('Paramètres enregistrés', 'تم حفظ الإعدادات'), 'french': ('Français', 'الفرنسية'), 'arabic': ('Arabe', 'العربية')},
}

for index, language in enumerate(('fr', 'ar')):
    path = Path(__file__).resolve().parents[1] / f'src/assets/i18n/{language}.json'
    data = json.loads(path.read_text(encoding='utf-8'))
    for group, values in translations.items():
        data.setdefault(group, {}).update({key: pair[index] for key, pair in values.items()})
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
