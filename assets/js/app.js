const API_URL = 'https://admin.enjazacademy.org/api/index.php';
const ADMIN_API_URL = 'https://admin.enjazacademy.org/api/admin.php';

// بيانات الدول العربية وأرقام الهواتف
const ARAB_COUNTRIES_PHONE_DATA = {
    '20': { country: 'مصر', totalLength: 12, requiredPrefix: '1' },
    '966': { country: 'السعودية', totalLength: 12, requiredPrefix: '5' },
    '971': { country: 'الإمارات', totalLength: 12, requiredPrefix: '5' },
    '965': { country: 'الكويت', totalLength: 11, requiredPrefix: '5' },
    '974': { country: 'قطر', totalLength: 11, requiredPrefix: '5' },
    '973': { country: 'البحرين', totalLength: 11, requiredPrefix: '3' },
    '968': { country: 'عمان', totalLength: 11, requiredPrefix: '9' },
    '962': { country: 'الأردن', totalLength: 12, requiredPrefix: '7' },
    '961': { country: 'لبنان', totalLength: 11, requiredPrefix: '7' },
    '963': { country: 'سوريا', totalLength: 12, requiredPrefix: '9' },
    '964': { country: 'العراق', totalLength: 13, requiredPrefix: '7' },
    '967': { country: 'اليمن', totalLength: 12, requiredPrefix: '7' },
    '970': { country: 'فلسطين', totalLength: 12, requiredPrefix: '5' },
    '218': { country: 'ليبيا', totalLength: 12, requiredPrefix: '9' },
    '216': { country: 'تونس', totalLength: 11, requiredPrefix: '2' },
    '213': { country: 'الجزائر', totalLength: 12, requiredPrefix: '5' },
    '212': { country: 'المغرب', totalLength: 12, requiredPrefix: '6' },
    '249': { country: 'السودان', totalLength: 12, requiredPrefix: '9' },
    '252': { country: 'الصومال', totalLength: 11, requiredPrefix: '6' },
    '253': { country: 'جيبوتي', totalLength: 11, requiredPrefix: '7' },
    '269': { country: 'جزر القمر', totalLength: 10, requiredPrefix: '3' },
    '222': { country: 'موريتانيا', totalLength: 11, requiredPrefix: '2' }
};

// متغيرات عامة
let currentReportData = {};
let selectedScammerImage = null;
let selectedEvidenceImages = [];
let selectedImageFile = null;
let currentSearchMethod = 'phone';
let currentReportStep = 1;
let currentDeleteStep = 'verification';

// ========================================
// دوال مساعدة
// ========================================

// دالة ضغط الصور لتجنب أخطاء الخادم (500 Error)
function compressImage(file, maxWidth = 500, quality = 0.5) {
    return new Promise((resolve) => {
        if (!file || !file.type.match(/image.*/)) {
            resolve(file);
            return;
        }

        const reader = new FileReader();
        reader.onload = (readerEvent) => {
            const image = new Image();
            image.onload = () => {
                const canvas = document.createElement('canvas');
                let width = image.width;
                let height = image.height;

                // حساب الأبعاد الجديدة مع الحفاظ على النسبة
                if (width > height) {
                    if (width > maxWidth) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxWidth) {
                        width *= maxWidth / height;
                        height = maxWidth;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                
                const ctx = canvas.getContext('2d');
                // تعبئة خلفية بيضاء (للصور الشفافة PNG)
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, width, height);
                ctx.drawImage(image, 0, 0, width, height);
                
                canvas.toBlob((blob) => {
                    if (!blob) {
                        resolve(file);
                        return;
                    }
                    // تحويل الاسم إلى jpg لضمان الحجم الصغير
                    const newName = file.name.replace(/\.[^/.]+$/, "") + ".jpg";
                    resolve(new File([blob], newName, {
                        type: 'image/jpeg',
                        lastModified: Date.now(),
                    }));
                }, 'image/jpeg', quality);
            };
            image.onerror = () => resolve(file);
            image.src = readerEvent.target.result;
        };
        reader.onerror = () => resolve(file);
        reader.readAsDataURL(file);
    });
}

// عرض الإشعارات
function showNotification(message, type = 'info') {
    const container = document.getElementById('notificationsContainer');
    if (!container) return;

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-icon">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'}"></i>
        </div>
        <div class="notification-content">
            <div class="notification-title">${type === 'success' ? 'نجح' : type === 'error' ? 'خطأ' : type === 'warning' ? 'تحذير' : 'معلومات'}</div>
            <div class="notification-message">${message}</div>
        </div>
        <button class="notification-close">
            <i class="fas fa-times"></i>
        </button>
    `;

    container.appendChild(notification);

    // إزالة تلقائية بعد 5 ثواني
    setTimeout(() => {
        if (notification.parentNode) {
            notification.classList.add('hiding');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }
    }, 5000);

    // زر الإغلاق
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.classList.add('hiding');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    });
}

// إرسال طلب إلى API
async function callAPI(action, data = {}, method = 'POST') {
    const formData = new FormData();

    // إضافة البيانات النصية
    Object.keys(data).forEach(key => {
        if (typeof data[key] !== 'object' || data[key] === null) {
            formData.append(key, data[key]);
        }
    });

    // إضافة الملفات
    if (data.scammer_image) {
        formData.append('scammer_image', data.scammer_image);
    }

    if (data.evidence_images && data.evidence_images.length > 0) {
        data.evidence_images.forEach((img, index) => {
            formData.append('evidence_images[]', img);
        });
    }

    console.log('Sending to API:', action, data); // للتتبع

    try {
        // إضافة action كـ query parameter
        const url = `${API_URL}?action=${encodeURIComponent(action)}`;
        const response = await fetch(url, {
            method: method,
            body: formData
        });

        const result = await response.json();
        console.log('API Response:', result); // للتتبع
        return result;
    } catch (error) {
        console.error('API Error:', error);
        return {
            success: false,
            message: 'حدث خطأ في الاتصال بالخادم'
        };
    }
}

// ========================================
// إدارة النموذج والتسجيل
// ========================================

// التحقق من الخطوة الأولى
async function validateStep1() {
    const requiredFields = [
        'scammerPhone',
        'scammerType',
        'scammerDetails',
        'reporterContact'
    ];

    let isValid = true;

    requiredFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field && !field.value.trim()) {
            field.classList.add('error');
            isValid = false;
        } else if (field) {
            field.classList.remove('error');
        }
    });

    // التحقق من تفاصيل الشكوى (30-1000 حرف)
    const detailsTextarea = document.getElementById('scammerDetails');
    const details = detailsTextarea.value.trim();

    if (details.length < 30) {
        showFieldError(detailsTextarea, `تفاصيل الشكوى يجب أن تكون على الأقل 30 حرفاً (حالياً: ${details.length})`);
        isValid = false;
    } else if (details.length > 1000) {
        showFieldError(detailsTextarea, `تفاصيل الشكوى يجب ألا تتجاوز 1000 حرف (حالياً: ${details.length})`);
        isValid = false;
    }

    // التحقق من أن أرقام الهواتف صحيحة
    const scammerPhone = document.getElementById('scammerPhone').value.trim();
    const reporterContact = document.getElementById('reporterContact').value.trim();

    if (!validatePhoneField(document.getElementById('scammerPhone'))) {
        isValid = false;
    }

    if (!validatePhoneField(document.getElementById('reporterContact'))) {
        isValid = false;
    }

    if (scammerPhone && reporterContact && scammerPhone === reporterContact) {
        showNotification('رقم المبلغ يجب أن يكون مختلفاً عن رقم المشكو منه', 'error');
        isValid = false;
    }

    // التحقق من عدم تكرار رقم المشكو منه ورقم المبلغ بالتزامن
    if (scammerPhone && reporterContact && isValid) {
        try {
            // التحقق المتزامن من كلا الرقمين
            const [scammerResult, reporterResult] = await Promise.all([
                callAPI('check_duplicate_phone', { phone: scammerPhone }),
                callAPI('check_reporter_phone', { phone: reporterContact })
            ]);
            
            // التحقق من رقم المشكو منه
            if (scammerResult.success && scammerResult.data) {
                if (scammerResult.data.exists === true) {
                    const statusText = scammerResult.data.is_confirmed ? 'حالة مؤكدة' : 'تقرير قيد المراجعة';
                    showNotification(`رقم المشكو منه مسجل بالفعل في قاعدة البيانات (${statusText}). يرجى التحقق من البحث والاستعلام أولاً.`, 'error');
                    showFieldError(document.getElementById('scammerPhone'), 'هذا الرقم مسجل بالفعل في قاعدة البيانات');
                    isValid = false;
                }
            } else if (!scammerResult.success) {
                showNotification('حدث خطأ في التحقق من رقم المشكو منه. يرجى المحاولة مرة أخرى.', 'error');
                isValid = false;
            }
            
            // التحقق من رقم المبلغ
            if (reporterResult.success && reporterResult.data) {
                if (reporterResult.data.exists === true) {
                    const statusText = reporterResult.data.is_confirmed ? 'حالة مؤكدة' : 'تقرير قيد المراجعة';
                    showNotification(`رقم المبلغ مسجل كرقم مشكو منه في قاعدة البيانات (${statusText}). يرجى استخدام رقم آخر.`, 'error');
                    showFieldError(document.getElementById('reporterContact'), 'هذا الرقم مسجل كرقم مشكو منه في قاعدة البيانات');
                    isValid = false;
                }
            } else if (!reporterResult.success) {
                showNotification('حدث خطأ في التحقق من رقم المبلغ. يرجى المحاولة مرة أخرى.', 'error');
                isValid = false;
            }
        } catch (error) {
            console.error('Error checking phone numbers:', error);
            showNotification('حدث خطأ في التحقق من الأرقام. يرجى المحاولة مرة أخرى.', 'error');
            isValid = false; // منع المتابعة في حالة فشل الاتصال
        }
    }

    // لا نعرض رسالة عامة هنا - الرسائل المحددة لكل خطأ كافية
    return isValid;
}

// حفظ بيانات الخطوة الأولى
function saveStep1Data() {
    currentReportData = {
        scammer_name: document.getElementById('scammerName').value.trim(),
        scammer_phone: document.getElementById('scammerPhone').value.trim(),
        scammer_email: document.getElementById('scammerEmail').value.trim(),
        scam_type: document.getElementById('scammerType').value,
        details: document.getElementById('scammerDetails').value.trim(),
        reporter_name: document.getElementById('reporterName').value.trim(),
        reporter_contact: document.getElementById('reporterContact').value.trim()
    };
}

// إرسال البلاغ
async function handleReportSubmission() {
    // التحقق النهائي من صحة البيانات قبل الإرسال
    if (!(await validateStep1())) {
        showNotification('يرجى تصحيح الأخطاء في النموذج قبل الحفظ', 'error');
        switchStep(1); // العودة للخطوة الأولى لإصلاح الأخطاء
        return;
    }

    // التحقق من رفع صورة دليل واحدة على الأقل
    if (selectedEvidenceImages.length === 0) {
        showNotification('يرجى رفع صورة واحدة على الأقل من الأدلة', 'error');
        switchStep(2); // العودة للخطوة الثانية
        return;
    }

    try {
        const submitBtn = document.getElementById('submitReportBtn');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري حفظ البيانات...';

        showNotification('جاري حفظ البيانات...', 'info');

        // ضغط الصور لتجنب مشاكل الخادم
        const compressedScammerImage = selectedScammerImage ? await compressImage(selectedScammerImage) : null;
        const compressedEvidence = await Promise.all(selectedEvidenceImages.map(img => compressImage(img)));

        // التحقق من حجم الملفات بعد الضغط لتجنب أخطاء الخادم
        if (compressedScammerImage && compressedScammerImage.size > 2 * 1024 * 1024) {
            showNotification('صورة المشكو منه كبيرة جداً. يرجى اختيار صورة أصغر.', 'warning');
            const submitBtn = document.getElementById('submitReportBtn');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-save"></i> حفظ التقرير';
            return;
        }
        
        if (compressedEvidence.some(img => img.size > 2 * 1024 * 1024)) {
            showNotification('إحدى صور الأدلة كبيرة جداً. يرجى اختيار صور أصغر.', 'warning');
            const submitBtn = document.getElementById('submitReportBtn');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-save"></i> حفظ التقرير';
            return;
        }

        // إضافة الملفات إلى البيانات
        const formData = {
            ...currentReportData,
            scammer_image: compressedScammerImage,
            evidence_images: compressedEvidence
        };

        const result = await callAPI('insert_scam_report', formData);

        if (result.success) {
            showNotification('تم تسجيل البلاغ بنجاح في قاعدة البيانات', 'success');

            // تفريغ النموذج أولاً
            resetReportForm();
            
            // الانتقال إلى قسم البحث والاستعلام مع سكرول تلقائي
            setTimeout(() => {
                scrollToSection('search');
            }, 1500);
        } else {
            showNotification(result.message || 'حدث خطأ أثناء حفظ البلاغ', 'error');
        }
    } catch (error) {
        console.error('Error submitting report:', error);
        showNotification('حدث خطأ أثناء حفظ البلاغ. يرجى المحاولة مرة أخرى.', 'error');
    } finally {
        const submitBtn = document.getElementById('submitReportBtn');
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-save"></i> حفظ التقرير';
    }
}

// ========================================
// البحث والاستعلام
// ========================================

// البحث برقم الهاتف
async function handlePhoneSearch() {
    const phone = document.getElementById('phoneSearchInput').value.trim();
    const searchBtn = document.getElementById('phoneSearchBtn');
    
    if (!phone) {
        showNotification('يرجى إدخال رقم هاتف للبحث', 'warning');
        return;
    }
    
    if (!validatePhoneField(document.getElementById('phoneSearchInput'))) {
        return;
    }

    const originalBtnContent = searchBtn.innerHTML;
    searchBtn.disabled = true;
    searchBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري البحث...';

    // مسح النتائج السابقة وتهيئة المنطقة
    const resultsGrid = document.getElementById('resultsGrid');
    const noResults = document.getElementById('noResults');
    const searchSummary = document.getElementById('searchSummary');
    const resultsCount = document.getElementById('resultsCount');
    
    if (resultsGrid) resultsGrid.innerHTML = '';
    if (noResults) noResults.style.display = 'none';
    if (searchSummary) searchSummary.style.display = 'none';
    if (resultsCount) resultsCount.style.display = 'none';

    showSearchLoading();

    try {
        const result = await callAPI('search_by_phone', { phone: phone });
        
        hideSearchLoading();
        searchBtn.disabled = false;
        searchBtn.innerHTML = originalBtnContent;

        if (result.success) {
            const statusText = result.data.is_confirmed ? 'حالة مؤكدة' : 'تقرير قيد المراجعة';
            
            // عرض البيانات فقط إذا كانت موجودة (للحالات المؤكدة)
            if (result.data.data) {
                displaySearchResults([result.data.data], `${statusText}: ${phone}`);
                // سكرول تلقائي لقسم النتائج
                scrollToSection('resultsGrid');
            }
            
            showNotification(result.data.is_confirmed ? 
                'تم العثور على حالة مؤكدة' : 
                'هذا الرقم مرتبط ببلاغ قيد المراجعة (البيانات محجوبة مؤقتاً)', 
                result.data.is_confirmed ? 'success' : 'warning');
        } else {
            displaySearchResults([], `البحث برقم الهاتف: ${phone}`);
            showNotification('لم يتم العثور على أي بيانات مطابقة لرقم الهاتف المدخل', 'info');
        }
    } catch (error) {
        hideSearchLoading();
        searchBtn.disabled = false;
        searchBtn.innerHTML = originalBtnContent;
        
        console.error('Search error:', error);
        showNotification('حدث خطأ أثناء البحث: ' + error.message, 'error');
    }
}

// البحث بالصورة
async function handleImageSearch() {
    const searchBtn = document.getElementById('advancedSearchBtn');
    
    if (!selectedImageFile) {
        showNotification('يرجى اختيار صورة للبحث', 'warning');
        return;
    }

    const originalBtnContent = searchBtn.innerHTML;
    searchBtn.disabled = true;
    searchBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري البحث...';

    // مسح النتائج السابقة وتهيئة المنطقة
    const resultsGrid = document.getElementById('resultsGrid');
    const noResults = document.getElementById('noResults');
    const searchSummary = document.getElementById('searchSummary');
    const resultsCount = document.getElementById('resultsCount');
    
    if (resultsGrid) resultsGrid.innerHTML = '';
    if (noResults) noResults.style.display = 'none';
    if (searchSummary) searchSummary.style.display = 'none';
    if (resultsCount) resultsCount.style.display = 'none';

    showSearchLoading();

    try {
        // ضغط الصورة قبل الإرسال لتجنب مشاكل حجم الباكت في الخادم
        const compressedFile = await compressImage(selectedImageFile);
        
        // التحقق من الحجم قبل الإرسال (2MB كحد أقصى)
        if (compressedFile.size > 2 * 1024 * 1024) {
            showNotification('الصورة كبيرة جداً. يرجى اختيار صورة أصغر.', 'warning');
            hideSearchLoading();
            searchBtn.disabled = false;
            searchBtn.innerHTML = originalBtnContent;
            return;
        }

        const result = await callAPI('search_by_image', { scammer_image: compressedFile });
        
        hideSearchLoading();
        searchBtn.disabled = false;
        searchBtn.innerHTML = originalBtnContent;

        if (result.success) {
            let results = [];
            // التعامل مع احتمالات مختلفة لهيكل البيانات المرجعة
            if (result.data && result.data.data) {
                results = [result.data.data];
            } else if (Array.isArray(result.data)) {
                results = result.data;
            }

            if (results.length > 0) {
                displaySearchResults(results, 'نتائج البحث بالصورة');
                scrollToSection('resultsGrid');
            }
            
            const msg = result.data.is_confirmed === false ? 'تم العثور على تطابق مع بلاغ قيد المراجعة (البيانات محجوبة)' : 'تم العثور على نتائج مطابقة';
            showNotification(msg, result.data.is_confirmed === false ? 'warning' : 'success');
        } else {
            displaySearchResults([], 'نتائج البحث بالصورة');
            showNotification(result.message || 'لم يتم العثور على أي بيانات مطابقة', 'info');
        }
    } catch (error) {
        hideSearchLoading();
        searchBtn.disabled = false;
        searchBtn.innerHTML = originalBtnContent;
        
        console.error('Search error:', error);
        showNotification('حدث خطأ أثناء البحث: ' + error.message, 'error');
    }
}

// ========================================
// طلب حذف البيانات
// ========================================

// التحقق من هوية مقدم الطلب
async function handleIdentityVerification() {
    const applicantWhatsApp = document.getElementById('verifyApplicantWhatsApp').value.trim();
    const verifyBtn = document.getElementById('verifyIdentityBtn');

    if (!applicantWhatsApp) {
        showNotification('يرجى إدخال رقم واتساب مقدم الطلب', 'error');
        return;
    }

    if (!validatePhoneField(document.getElementById('verifyApplicantWhatsApp'))) {
        return;
    }

    try {
        const originalBtnContent = verifyBtn.innerHTML;
        verifyBtn.disabled = true;
        verifyBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري التحقق...';

        const result = await callAPI('verify_applicant', { whatsapp: applicantWhatsApp });

        verifyBtn.disabled = false;
        verifyBtn.innerHTML = originalBtnContent;

        if (result.success) {
            window.verifiedApplicant = result.data.details;
            const statusText = result.data.is_confirmed ? 'تقرير مؤكد' : 'تقرير قيد المراجعة';
            
            switchDeleteStep('deleteRequest');
            showNotification(`تم التحقق من هوية مقدم الطلب بنجاح (${statusText})`, 'success');
            
            // تعبئة البيانات تلقائياً
            document.getElementById('applicantName').value = result.data.details.reporter_name || '';
            document.getElementById('applicantContact').value = result.data.details.reporter_contact || '';
        } else {
            showNotification(result.message || 'رقم الواتساب غير مسجل', 'error');
        }
    } catch (error) {
        verifyBtn.disabled = false;
        verifyBtn.innerHTML = '<i class="fas fa-user-check"></i> التحقق من الهوية';
        
        console.error('Verification error:', error);
        showNotification('حدث خطأ أثناء التحقق', 'error');
    }
}

// إرسال طلب الحذف
async function handleDeleteRequestSubmission() {
    const formData = {
        applicant_name: document.getElementById('applicantName').value.trim(),
        applicant_whatsapp: document.getElementById('applicantContact').value.trim(),
        delete_scammer_name: window.verifiedApplicant?.scammer_name || '',
        delete_scammer_whatsapp: document.getElementById('scammerWhatsApp').value.trim(),
        request_reason: document.getElementById('deleteReason').value.trim()
    };

    // التحقق من الحقول المطلوبة
    if (!formData.applicant_whatsapp || !formData.request_reason || !formData.delete_scammer_whatsapp) {
        showNotification('يرجى ملء جميع الحقول المطلوبة', 'error');
        return;
    }
    
    // التحقق من طول سبب الحذف (30-1000 حرف)
    if (formData.request_reason.length < 30) {
        showNotification('سبب طلب الحذف يجب أن يكون على الأقل 30 حرفاً', 'error');
        const reasonField = document.getElementById('deleteReason');
        if(reasonField) showFieldError(reasonField, `يجب أن يكون النص 30 حرفاً على الأقل (حالياً: ${formData.request_reason.length})`);
        return;
    }

    if (formData.request_reason.length > 1000) {
        showNotification('سبب طلب الحذف يجب ألا يتجاوز 1000 حرف', 'error');
        return;
    }

    // التحقق من صحة أرقام الهواتف
    if (!validatePhoneField(document.getElementById('applicantContact')) || 
        !validatePhoneField(document.getElementById('scammerWhatsApp'))) {
        return;
    }

    try {
        const submitBtn = document.getElementById('submitDeleteRequest');
        const originalBtnContent = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري التحقق...';

        const result = await callAPI('submit_delete_request', formData);

        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnContent;

        if (result.success) {
            showNotification('تم إرسال طلب المراجعة بنجاح. سيتم التواصل معك خلال 24-48 ساعة', 'success');
            
            submitBtn.innerHTML = '<i class="fas fa-check"></i> تم الإرسال';
            submitBtn.style.background = 'linear-gradient(135deg, #28a745 0%, #20c997 100%)';
            submitBtn.style.borderColor = '#28a745';

            // تنظيف النموذج
            clearDeleteFormFields();

            setTimeout(() => {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> إرسال طلب الحذف';
                submitBtn.style.background = '';
                submitBtn.style.borderColor = '';

                switchDeleteStep('verification');
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            }, 2000);
        } else {
            showNotification(result.message || 'حدث خطأ أثناء إرسال الطلب', 'error');
        }
    } catch (error) {
        const submitBtn = document.getElementById('submitDeleteRequest');
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> إرسال طلب الحذف';
        
        console.error('Delete request error:', error);
        showNotification('حدث خطأ أثناء إرسال الطلب', 'error');
    }
}

// ========================================
// دوال التحقق
// ========================================

// التحقق من رقم الهاتف
function validatePhoneField(field) {
    const value = field.value.trim();
    const errorElement = field.parentElement.querySelector('.field-error');

    field.classList.remove('error');
    if (errorElement) {
        errorElement.remove();
    }

    if (value.length === 0 && field.hasAttribute('required')) {
        showFieldError(field, 'هذا الحقل مطلوب');
        return false;
    }

    if (value.length === 0 && !field.hasAttribute('required')) {
        return true;
    }

    if (!/^[0-9]+$/.test(value)) {
        showFieldError(field, 'رقم الهاتف يجب أن يحتوي على أرقام فقط');
        return false;
    }

    let matchedCountry = null;
    let matchedCode = '';

    // البحث عن أطول كود دولي مطابق أولاً
    const sortedCodes = Object.keys(ARAB_COUNTRIES_PHONE_DATA).sort((a, b) => b.length - a.length);

    for (const code of sortedCodes) {
        if (value.startsWith(code)) {
            matchedCountry = ARAB_COUNTRIES_PHONE_DATA[code];
            matchedCode = code;
            break;
        }
    }

    if (!matchedCountry) {
        showFieldError(field, 'يجب أن يبدأ الرقم بكود دولة عربية صحيح');
        return false;
    }

    // التحقق من الطول الكلي
    if (value.length !== matchedCountry.totalLength) {
        showFieldError(field, `رقم الهاتف لـ${matchedCountry.country} يجب أن يكون ${matchedCountry.totalLength} رقم بالضبط`);
        return false;
    }

    // استخراج الرقم بعد الكود الدولي
    const numberAfterCode = value.substring(matchedCode.length);

    // التحقق من أن الرقم يبدأ بالرقم المطلوب
    if (!numberAfterCode.startsWith(matchedCountry.requiredPrefix)) {
        showFieldError(field, `رقم الهاتف لـ${matchedCountry.country} يجب أن يبدأ بـ ${matchedCountry.requiredPrefix} بعد كود الدولة`);
        return false;
    }

    // إزالة الفئة error إذا كان الرقم صحيح
    field.classList.remove('error');
    if (errorElement) {
        errorElement.remove();
    }

    return true;
}

// عرض خطأ الحقل
function showFieldError(field, message) {
    field.classList.add('error');
    field.parentElement.insertAdjacentHTML('beforeend', `
        <div class="field-error">
            <i class="fas fa-exclamation-circle"></i>
            <span>${message}</span>
        </div>
    `);
}

// ========================================
// تهيئة النظام
// ========================================

// إخفاء شاشة التحميل عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
        loadingScreen.style.display = 'none';
    }

    // إزالة علامة النجمة (*) من حقل اسم مقدم الطلب لأنه حقل اختياري
    const applicantNameLabel = document.querySelector("label[for='applicantName']");
    if (applicantNameLabel) {
        applicantNameLabel.innerHTML = applicantNameLabel.innerHTML.replace('*', '');
    }

    // إضافة event listeners للأزرار
    initializeEventListeners();
});

// تهيئة event listeners لجميع الأزرار والعناصر التفاعلية
function initializeEventListeners() {
    // أزرار النموذج
    const nextToStep2Btn = document.getElementById('nextToStep2');
    const backToStep1Btn = document.getElementById('backToStep1');
    const nextToStep3Btn = document.getElementById('nextToStep3');
    const backToStep2Btn = document.getElementById('backToStep2');
    const submitReportBtn = document.getElementById('submitReportBtn');

    // أزرار البحث
    const phoneSearchBtn = document.getElementById('phoneSearchBtn');
    const clearResultsBtn = document.getElementById('clearResultsBtn');
    const addNewReportBtn = document.getElementById('addNewReportBtn');

    // أزرار طلب الحذف
    const verifyIdentityBtn = document.getElementById('verifyIdentityBtn');
    const submitDeleteRequest = document.getElementById('submitDeleteRequest');

    // أزرار modal الصور
    const closeModal = document.getElementById('closeModal');
    const imageModal = document.getElementById('imageModal');

    // إضافة listeners للنموذج
    if (nextToStep2Btn) {
        nextToStep2Btn.addEventListener('click', async function() {
            // منع النقر المتكرر أثناء التحقق
            if (this.disabled) return;

            const originalText = this.innerHTML;
            this.disabled = true;
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري التحقق...';

            try {
                if (await validateStep1()) {
                    saveStep1Data();
                    switchStep(2);
                }
            } finally {
                this.disabled = false;
                this.innerHTML = originalText;
            }
        });
    }

    if (backToStep1Btn) {
        backToStep1Btn.addEventListener('click', function() {
            switchStep(1);
        });
    }

    if (nextToStep3Btn) {
        nextToStep3Btn.addEventListener('click', function() {
            // التحقق من رفع صورة واحدة على الأقل
            if (selectedEvidenceImages.length === 0) {
                showNotification('يرجى رفع صورة واحدة على الأقل من الأدلة', 'error');
                return;
            }
            switchStep(3);
        });
    }

    if (backToStep2Btn) {
        backToStep2Btn.addEventListener('click', function() {
            switchStep(2);
        });
    }

    if (submitReportBtn) {
        submitReportBtn.addEventListener('click', handleReportSubmission);
    }

    // إضافة listeners للبحث
    if (phoneSearchBtn) {
        phoneSearchBtn.addEventListener('click', handlePhoneSearch);
    }

    if (clearResultsBtn) {
        clearResultsBtn.addEventListener('click', function() {
            clearSearchResults();
        });
    }

    if (addNewReportBtn) {
        addNewReportBtn.addEventListener('click', function() {
            scrollToSection('report');
            // إعادة تعيين النموذج
            resetReportForm();
        });
    }

    // إضافة listeners لطلب الحذف
    if (verifyIdentityBtn) {
        verifyIdentityBtn.addEventListener('click', handleIdentityVerification);
    }

    if (submitDeleteRequest) {
        submitDeleteRequest.addEventListener('click', handleDeleteRequestSubmission);
    }

    // إغلاق modal الصور
    if (closeModal) {
        closeModal.addEventListener('click', closeImageModal);
    }

    // إغلاق modal عند النقر خارج الصورة
    if (imageModal) {
        imageModal.addEventListener('click', function(e) {
            if (e.target === imageModal) {
                closeImageModal();
            }
        });
    }

    // إغلاق modal عند الضغط على ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeImageModal();
        }
    });

    // إضافة listeners للتحقق من الأرقام أثناء الكتابة
    const phoneFields = document.querySelectorAll('input[type="tel"]');
    phoneFields.forEach(field => {
        // 1. منع كتابة أي شيء غير الأرقام (keypress)
        field.addEventListener('keypress', function(e) {
            // السماح فقط بالأرقام (0-9)
            if (e.key.length === 1 && !/^[0-9]$/.test(e.key)) {
                e.preventDefault();
            }
        });

        // 2. معالجة اللصق (Paste) - السماح فقط بالأرقام
        field.addEventListener('paste', function(e) {
            e.preventDefault();
            const pastedData = (e.clipboardData || window.clipboardData).getData('text');
            // استخراج الأرقام فقط
            const numericData = pastedData.replace(/[^0-9]/g, '');
            
            if (numericData) {
                // إدراج النص الرقمي في مكان المؤشر
                const start = this.selectionStart;
                const end = this.selectionEnd;
                const text = this.value;
                const newText = text.substring(0, start) + numericData + text.substring(end);
                
                this.value = newText;
                // إطلاق حدث input يدوياً لتفعيل التحقق من الطول
                this.dispatchEvent(new Event('input'));
            }
        });

        field.addEventListener('blur', function() {
            validatePhoneField(this);
        });

        // منع كتابة أرقام أطول من المسموح + تنظيف المدخلات
        field.addEventListener('input', function() {
            // تنظيف فوري لأي أحرف غير رقمية (حماية إضافية)
            this.value = this.value.replace(/[^0-9]/g, '');

            const value = this.value.trim();
            if (value.length > 0) {
                // البحث عن الكود الدولي المطابق
                const sortedCodes = Object.keys(ARAB_COUNTRIES_PHONE_DATA).sort((a, b) => b.length - a.length);
                let maxLength = 13; // الحد الأقصى العام

                for (const code of sortedCodes) {
                    if (value.startsWith(code)) {
                        maxLength = ARAB_COUNTRIES_PHONE_DATA[code].totalLength;
                        break;
                    }
                }

                // قصر الطول على الحد الأقصى المسموح
                if (value.length > maxLength) {
                    this.value = value.substring(0, maxLength);
                }
            }
        });

        // إضافة حد أقصى للطول في HTML
        field.setAttribute('maxlength', '13');
    });

    // إضافة listener لحساب عدد الأحرف في textarea والتحقق اللحظي
    const detailsTextarea = document.getElementById('scammerDetails');
    if (detailsTextarea) {
        detailsTextarea.addEventListener('input', function() {
            updateCharCount();
            validateDetailsLength(this); // التحقق اللحظي

            // منع الكتابة إذا تجاوز الحد الأقصى
            if (this.value.length > 1000) {
                this.value = this.value.substring(0, 1000);
                updateCharCount();
                showNotification('لا يمكن كتابة أكثر من 1000 حرف', 'warning');
            }
        });

        // منع اللصق إذا يتجاوز الحد
        detailsTextarea.addEventListener('paste', function(e) {
            const pastedText = e.clipboardData.getData('text');
            const currentText = this.value;
            const newText = currentText + pastedText;

            if (newText.length > 1000) {
                e.preventDefault();
                const allowedText = pastedText.substring(0, 1000 - currentText.length);
                const start = this.selectionStart;
                const end = this.selectionEnd;
                this.value = currentText.substring(0, start) + allowedText + currentText.substring(end);
                updateCharCount();
                showNotification('تم لصق النص مع الحفاظ على الحد الأقصى 1000 حرف', 'info');
            }
        });
    }
    
    // إضافة listener لحقل سبب الحذف (deleteReason) وتطبيق قيود الطول
    const deleteReasonTextarea = document.getElementById('deleteReason');
    if (deleteReasonTextarea) {
        deleteReasonTextarea.addEventListener('input', function() {
            validateDeleteReasonLength(this); // التحقق اللحظي

            // منع الكتابة إذا تجاوز الحد الأقصى
            if (this.value.length > 1000) {
                this.value = this.value.substring(0, 1000);
                showNotification('لا يمكن كتابة أكثر من 1000 حرف', 'warning');
            }
        });

        // منع اللصق إذا يتجاوز الحد
        deleteReasonTextarea.addEventListener('paste', function(e) {
            const pastedText = e.clipboardData.getData('text');
            const currentText = this.value;
            const newText = currentText + pastedText;

            if (newText.length > 1000) {
                e.preventDefault();
                const allowedText = pastedText.substring(0, 1000 - currentText.length);
                const start = this.selectionStart;
                const end = this.selectionEnd;
                this.value = currentText.substring(0, start) + allowedText + currentText.substring(end);
                showNotification('تم لصق النص مع الحفاظ على الحد الأقصى 1000 حرف', 'info');
            }
        });
    }

    // تهيئة معالجة الصور
    initializeImageHandlers();

    // إخفاء زر حذف الكل في البداية
    const clearAllBtn = document.getElementById('clearAllEvidence');
    if (clearAllBtn) {
        clearAllBtn.style.display = 'none';
    }
}

// تهيئة معالجات الصور
function initializeImageHandlers() {
    // معالجة صورة المشتبه به
    const scammerImageInput = document.getElementById('scammerImageInput');
    const scammerImageUpload = document.getElementById('scammerImageUpload');
    const scammerImagePreview = document.getElementById('scammerImagePreview');
    const removeScammerImageBtn = document.getElementById('removeScammerImageBtn');

    if (scammerImageInput) {
        scammerImageInput.addEventListener('change', function(e) {
            handleImageSelection(e.target.files[0], 'scammer');
        });
    }

    if (scammerImageUpload) {
        scammerImageUpload.addEventListener('click', function() {
            scammerImageInput.click();
        });

        // دعم السحب والإفلات
        scammerImageUpload.addEventListener('dragover', function(e) {
            e.preventDefault();
            this.classList.add('drag-over');
        });

        scammerImageUpload.addEventListener('dragleave', function(e) {
            e.preventDefault();
            this.classList.remove('drag-over');
        });

        scammerImageUpload.addEventListener('drop', function(e) {
            e.preventDefault();
            this.classList.remove('drag-over');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                handleImageSelection(files[0], 'scammer');
            }
        });
    }

    if (removeScammerImageBtn) {
        removeScammerImageBtn.addEventListener('click', function() {
            removeScammerImage();
        });
    }

    // معالجة صور الأدلة
    const evidenceImagesInput = document.getElementById('evidenceImagesInput');
    const evidenceDropZone = document.getElementById('evidenceDropZone');
    const clearAllEvidenceBtn = document.getElementById('clearAllEvidence');

    if (evidenceImagesInput) {
        evidenceImagesInput.addEventListener('change', function(e) {
            handleMultipleImageSelection(e.target.files);
        });
    }

    if (evidenceDropZone) {
        // دعم السحب والإفلات للأدلة
        evidenceDropZone.addEventListener('dragover', function(e) {
            e.preventDefault();
            this.classList.add('drag-over');
        });

        evidenceDropZone.addEventListener('dragleave', function(e) {
            e.preventDefault();
            this.classList.remove('drag-over');
        });

        evidenceDropZone.addEventListener('drop', function(e) {
            e.preventDefault();
            this.classList.remove('drag-over');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                handleMultipleImageSelection(files);
            }
        });
    }

    if (clearAllEvidenceBtn) {
        clearAllEvidenceBtn.addEventListener('click', function() {
            clearAllEvidenceImages();
        });
    }

    // معالجة الصورة المراد البحث عنها
    const imageSearchInput = document.getElementById('imageSearchInput');
    const browseImageBtn = document.getElementById('browseImageBtn');
    const clearImageBtn = document.getElementById('clearImageBtn');
    const advancedSearchBtn = document.getElementById('advancedSearchBtn');
    const clearAdvancedSearch = document.getElementById('clearAdvancedSearch');

    if (imageSearchInput) {
        imageSearchInput.addEventListener('change', function(e) {
            if (e.target.files.length > 0) {
                handleImageSelection(e.target.files[0], 'search');
            }
        });
    }

    if (browseImageBtn) {
        browseImageBtn.addEventListener('click', function() {
            imageSearchInput.click();
        });
    }

    if (clearImageBtn) {
        clearImageBtn.addEventListener('click', function() {
            clearSearchImage();
        });
    }

    if (advancedSearchBtn) {
        advancedSearchBtn.addEventListener('click', function() {
            handleImageSearch();
        });
    }

    if (clearAdvancedSearch) {
        clearAdvancedSearch.addEventListener('click', function() {
            clearSearchImage();
        });
    }
}

// معالجة اختيار صورة واحدة
function handleImageSelection(file, type) {
    if (!file) return;

    // التحقق من نوع الملف
    if (!file.type.startsWith('image/')) {
        showNotification('يرجى اختيار ملف صورة فقط', 'error');
        return;
    }

    // التحقق من حجم الملف (5MB)
    if (file.size > 5 * 1024 * 1024) {
        showNotification('حجم الصورة يجب أن يكون أقل من 5 ميجابايت', 'error');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        if (type === 'scammer') {
            selectedScammerImage = file;
            updateScammerImagePreview(e.target.result);
        } else if (type === 'search') {
            selectedImageFile = file;
            updateSearchImagePreview(e.target.result);
        }
    };
    reader.readAsDataURL(file);
}

// معالجة اختيار صور متعددة
function handleMultipleImageSelection(files) {
    if (!files || files.length === 0) return;

    const maxImages = 8;
    const currentCount = selectedEvidenceImages.length;
    const availableSlots = maxImages - currentCount;

    if (files.length > availableSlots) {
        showNotification(`يمكنك رفع ${availableSlots} صورة فقط (${currentCount}/8)`, 'warning');
        // خذ أول availableSlots صور فقط
        files = Array.from(files).slice(0, availableSlots);
    }

    Array.from(files).forEach(file => {
        // التحقق من نوع الملف
        if (!file.type.startsWith('image/')) {
            showNotification('يرجى اختيار ملفات صور فقط', 'error');
            return;
        }

        // التحقق من حجم الملف (5MB)
        if (file.size > 5 * 1024 * 1024) {
            showNotification('حجم الصورة يجب أن يكون أقل من 5 ميجابايت', 'error');
            return;
        }

        // التحقق من عدم تكرار الصورة
        if (isImageAlreadySelected(file)) {
            showNotification(`الصورة "${file.name}" مُرفوعة بالفعل`, 'warning');
            return;
        }

        selectedEvidenceImages.push(file);
    });

    updateEvidenceImagesPreview();
    updateEvidenceCount();
}

// التحقق من أن الصورة مُختارة بالفعل
function isImageAlreadySelected(newFile) {
    return selectedEvidenceImages.some(existingFile => {
        return existingFile.name === newFile.name &&
               existingFile.size === newFile.size &&
               existingFile.lastModified === newFile.lastModified;
    });
}

// تحديث معاينة صورة المشتبه به
function updateScammerImagePreview(src) {
    const preview = document.getElementById('scammerImagePreview');
    const removeBtn = document.getElementById('removeScammerImageBtn');

    if (preview) {
        preview.innerHTML = `<img src="${src}" alt="صورة المشتبه به" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
    }

    if (removeBtn) {
        removeBtn.style.display = 'block';
    }
}

// حذف صورة المشتبه به
function removeScammerImage() {
    selectedScammerImage = null;

    // إعادة تعيين قيمة input field لمسح الملف المخزن
    const scammerImageInput = document.getElementById('scammerImageInput');
    if (scammerImageInput) {
        scammerImageInput.value = '';
    }

    const preview = document.getElementById('scammerImagePreview');
    const removeBtn = document.getElementById('removeScammerImageBtn');

    if (preview) {
        preview.innerHTML = `
            <div class="preview-placeholder">
                <i class="fas fa-user-plus"></i>
                <span>انقر لإضافة صورة</span>
            </div>
        `;
    }

    if (removeBtn) {
        removeBtn.style.display = 'none';
    }

    // منع فتح مربع الحوار تلقائياً
    event?.stopPropagation();
    event?.preventDefault();
}

// تحديث معاينة صور الأدلة
function updateEvidenceImagesPreview() {
    const grid = document.getElementById('evidenceGrid');
    if (!grid) return;

    grid.innerHTML = '';

    selectedEvidenceImages.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const imageItem = document.createElement('div');
            imageItem.className = 'evidence-item';
            imageItem.innerHTML = `
                <img src="${e.target.result}" alt="دليل ${index + 1}">
                <button class="evidence-remove" onclick="removeEvidenceImage(${index})" title="حذف هذه الصورة">
                    <i class="fas fa-times"></i>
                </button>
            `;
            grid.appendChild(imageItem);
        };
        reader.readAsDataURL(file);
    });
}

// حذف صورة دليل واحدة
function removeEvidenceImage(index) {
    selectedEvidenceImages.splice(index, 1);
    updateEvidenceImagesPreview();
    updateEvidenceCount();

    // مسح قيمة input field للسماح بإعادة رفع نفس الصورة
    const evidenceImagesInput = document.getElementById('evidenceImagesInput');
    if (evidenceImagesInput) {
        evidenceImagesInput.value = '';
    }
}

// مسح جميع صور الأدلة
function clearAllEvidenceImages() {
    selectedEvidenceImages = [];
    updateEvidenceImagesPreview();
    updateEvidenceCount();

    // مسح قيمة input field للسماح بإعادة رفع نفس الصورة
    const evidenceImagesInput = document.getElementById('evidenceImagesInput');
    if (evidenceImagesInput) {
        evidenceImagesInput.value = '';
    }
}

// تحديث عدد صور الأدلة
function updateEvidenceCount() {
    const countElement = document.getElementById('evidenceCount');
    const clearAllBtn = document.getElementById('clearAllEvidence');

    if (countElement) {
        countElement.textContent = selectedEvidenceImages.length;
    }

    // إظهار/إخفاء زر حذف الكل حسب وجود صور
    if (clearAllBtn) {
        if (selectedEvidenceImages.length > 0) {
            clearAllBtn.style.display = 'inline-block';
        } else {
            clearAllBtn.style.display = 'none';
        }
    }
}

// تحديث معاينة الصورة للبحث
function updateSearchImagePreview(src) {
    const preview = document.getElementById('imageSearchPreview');
    const clearBtn = document.getElementById('clearImageBtn');
    const searchBtn = document.getElementById('advancedSearchBtn');
    const clearSearchBtn = document.getElementById('clearAdvancedSearch');

    if (preview) {
        preview.innerHTML = `<img src="${src}" alt="صورة البحث" style="width: 100%; height: 100%; object-fit: cover; border-radius: 10px;">`;
    }

    if (clearBtn) clearBtn.style.display = 'block';
    if (searchBtn) searchBtn.disabled = false;
    if (clearSearchBtn) clearSearchBtn.disabled = false;
}

// مسح صورة البحث
function clearSearchImage() {
    selectedImageFile = null;
    const preview = document.getElementById('imageSearchPreview');
    const clearBtn = document.getElementById('clearImageBtn');
    const searchBtn = document.getElementById('advancedSearchBtn');
    const clearSearchBtn = document.getElementById('clearAdvancedSearch');

    if (preview) {
        preview.innerHTML = `
            <div class="preview-placeholder">
                <i class="fas fa-cloud-upload-alt"></i>
                <span>انقر لإضافة صورة</span>
            </div>
        `;
    }

    if (clearBtn) clearBtn.style.display = 'none';
    if (searchBtn) searchBtn.disabled = true;
    if (clearSearchBtn) clearSearchBtn.disabled = true;
}

// تحديث عدد الأحرف في textarea
function updateCharCount() {
    const textarea = document.getElementById('scammerDetails');
    const counter = document.getElementById('detailsCount');
    if (textarea && counter) {
        counter.textContent = textarea.value.length;
    }
}

// التحقق اللحظي من طول تفاصيل الشكوى
function validateDetailsLength(textarea) {
    const details = textarea.value.trim();
    const errorElement = textarea.parentElement.querySelector('.field-error');

    // إزالة أي أخطاء سابقة أولاً
    textarea.classList.remove('error');
    if (errorElement) {
        errorElement.remove();
    }

    if (details.length === 0) {
        // النص فارغ - لا نظهر خطأ
        return;
    }

    if (details.length < 30) {
        showFieldError(textarea, `تفاصيل الشكوى يجب أن تكون على الأقل 30 حرفاً (حالياً: ${details.length})`);
        textarea.classList.add('error');
    } else if (details.length > 1000) {
        showFieldError(textarea, `تفاصيل الشكوى يجب ألا تتجاوز 1000 حرف (حالياً: ${details.length})`);
        textarea.classList.add('error');
    }
    // إذا كان الطول صحيح (30-1000)، لا نفعل شيئاً - الخطأ تم إزالته في البداية
}

// التحقق اللحظي من طول سبب الحذف
function validateDeleteReasonLength(textarea) {
    const reason = textarea.value.trim();
    const errorElement = textarea.parentElement.querySelector('.field-error');

    // إزالة أي أخطاء سابقة أولاً
    textarea.classList.remove('error');
    if (errorElement) {
        errorElement.remove();
    }

    if (reason.length === 0) {
        return;
    }

    if (reason.length < 30) {
        showFieldError(textarea, `السبب يجب أن يكون على الأقل 30 حرفاً (حالياً: ${reason.length})`);
    } else if (reason.length > 1000) {
        showFieldError(textarea, `السبب يجب ألا يتجاوز 1000 حرف (حالياً: ${reason.length})`);
    }
}

// تبديل الخطوات في النموذج
function switchStep(stepNumber) {
    // إخفاء خطوات نموذج البلاغ فقط لتجنب التأثير على الأقسام الأخرى
    const steps = document.querySelectorAll('#step1, #step2, #step3');
    steps.forEach(step => step.classList.remove('active'));

    // إظهار الخطوة المطلوبة
    const targetStep = document.getElementById('step' + stepNumber);
    if (targetStep) {
        targetStep.classList.add('active');
    }

    // تحديث شريث التقدم
    updateProgressBar(stepNumber);

    // تحديث بيانات قسم التأكيد إذا انتقلنا إلى الخطوة 3
    if (stepNumber === 3) {
        updateVerificationData();
    }

    // التمرير إلى أعلى النموذج
    const formCard = document.querySelector('.form-step.active .form-card');
    if (formCard) {
        formCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// تحديث شريط التقدم
function updateProgressBar(activeStep) {
    const steps = document.querySelectorAll('.progress-step');
    steps.forEach((step, index) => {
        const stepNumber = index + 1;
        if (stepNumber < activeStep) {
            step.classList.add('completed');
            step.classList.remove('active');
        } else if (stepNumber === activeStep) {
            step.classList.add('active');
            step.classList.remove('completed');
        } else {
            step.classList.remove('active', 'completed');
        }
    });
}

// دوال إضافية مطلوبة للبحث والحذف
function showSearchLoading() {
    const loading = document.getElementById('searchLoading');
    if (loading) loading.style.display = 'block';
}

function hideSearchLoading() {
    const loading = document.getElementById('searchLoading');
    if (loading) loading.style.display = 'none';
}

function displaySearchResults(results, query) {
    const resultsGrid = document.getElementById('resultsGrid');
    const noResults = document.getElementById('noResults');
    const resultsCount = document.getElementById('resultsCount');
    const searchSummary = document.getElementById('searchSummary');
    const searchQueryDetails = document.getElementById('searchQueryDetails');
    const searchTimestamp = document.getElementById('searchTimestamp');
    const clearResultsBtn = document.getElementById('clearResultsBtn');
    const addNewReportBtn = document.getElementById('addNewReportBtn');
    
    // إخفاء حالة "لا توجد نتائج"
    if (noResults) {
        noResults.style.display = 'none';
    }
    
    // تحديث معلومات البحث
    if (searchSummary) {
        searchSummary.style.display = (results && results.length > 0) ? 'block' : 'none';
    }
    
    if (searchQueryDetails) {
        searchQueryDetails.textContent = query || 'نتائج البحث';
    }
    
    if (searchTimestamp) {
        const now = new Date();
        searchTimestamp.textContent = `تاريخ البحث: ${now.toLocaleDateString('ar-SA', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })}`;
    }
    
    // إظهار أزرار التحكم
    if (clearResultsBtn) {
        clearResultsBtn.style.display = 'inline-block';
    }
    if (addNewReportBtn) {
        addNewReportBtn.style.display = 'inline-block';
    }
    
    // عرض النتائج
    if (resultsGrid) {
        resultsGrid.innerHTML = '';
        
        if (results && results.length > 0) {
            // تحديث عدد النتائج
            if (resultsCount) {
                resultsCount.style.display = 'block';
                resultsCount.innerHTML = `تم العثور على <span>${results.length}</span> نتيجة`;
            }
            
            // حفظ النتائج عالمياً للوصول إليها عند الطباعة
            window.currentSearchResults = results;
            
            // إنشاء بطاقة لكل نتيجة
            results.forEach((result, index) => {
                const card = createResultCard(result, index);
                resultsGrid.appendChild(card);
            });
        } else {
            // لا توجد نتائج
            if (resultsCount) {
                resultsCount.style.display = 'none';
            }
            
            if (noResults) {
                noResults.style.display = 'block';
                noResults.innerHTML = `
                    <div class="no-results-content">
                        <i class="fas fa-search"></i>
                        <h4>لا توجد نتائج</h4>
                        <p>لم يتم العثور على أي بيانات مطابقة لمعايير البحث</p>
                    </div>
                `;
            }
        }
    }
}

// إنشاء بطاقة نتيجة محسنة
function createResultCard(result, index) {
    const card = document.createElement('div');
    card.className = 'enhanced-result-card';

    // 1. تحديد البيانات الأساسية
    const isConfirmed = result.confirmation_date || result.is_confirmed;
    const statusClass = isConfirmed ? 'confirmed' : 'pending';
    const statusText = isConfirmed ? 'حالة مؤكدة' : 'تقرير قيد المراجعة';
    const statusIcon = isConfirmed ? 'fa-check-circle' : 'fa-clock';

    const createdDate = result.created_at || result.confirmation_date;
    const dateText = createdDate ? new Date(createdDate).toLocaleDateString('ar-SA', {
        year: 'numeric', month: 'long', day: 'numeric'
    }) : 'غير محدد';

    // 2. صورة المشكو منه
    const scammerImageContent = result.scammer_image
        ? `<img src="${result.scammer_image}" alt="صورة المشكو منه" class="scammer-image">
           <div class="image-overlay">
               <i class="fas fa-search-plus"></i>
           </div>`
        : `<div class="scammer-image-placeholder">
               <i class="fas fa-user"></i>
               <span>لا توجد صورة</span>
           </div>`;

    // 3. صور الأدلة
    let evidenceHTML = '';
    if (result.evidence_images && result.evidence_images.length > 0) {
        evidenceHTML = `
            <div class="evidence-section-enhanced">
                <div class="evidence-header">
                    <h5>
                        <i class="fas fa-images"></i>
                        الأدلة المرفقة (${result.evidence_images.length})
                    </h5>
                </div>
                <div class="evidence-grid-enhanced">
                    ${result.evidence_images.slice(0, 6).map((img, idx) => `
                        <div class="evidence-item-enhanced" onclick="openImageModal('${img}')">
                            <img src="${img}" alt="دليل ${idx + 1}" class="evidence-image">
                            <div class="evidence-overlay">
                                <i class="fas fa-search-plus"></i>
                                <span>${idx + 1}</span>
                            </div>
                        </div>
                    `).join('')}
                    ${result.evidence_images.length > 6 ? `
                        <div class="evidence-more-enhanced">
                            <i class="fas fa-plus"></i>
                            <span>+${result.evidence_images.length - 6}</span>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    // 4. بناء الهيكل الكامل للبطاقة
    card.innerHTML = `
        <div class="enhanced-result-header">
            <div class="scammer-image-section">
                <div class="scammer-image-container" ${result.scammer_image ? `onclick="openImageModal('${result.scammer_image}')"` : ''}>
                    ${scammerImageContent}
                </div>
            </div>
            <div class="scammer-info-section">
                <div class="scammer-name">
                    <h4>${result.scammer_name || 'غير محدد'}</h4>
                </div>
                <div class="scammer-contact">
                    <div class="contact-item">
                        <i class="fas fa-phone"></i>
                        <span>${result.scammer_phone || '-'}</span>
                    </div>
                    ${result.scammer_email ? `
                        <div class="contact-item">
                            <i class="fas fa-envelope"></i>
                            <span>${result.scammer_email}</span>
                        </div>
                    ` : ''}
                </div>
                <div class="scammer-dates">
                    <div class="date-item">
                        <i class="fas fa-calendar"></i>
                        <span>${dateText}</span>
                    </div>
                </div>
            </div>
            <div class="result-status-section">
                <div class="status-badge-enhanced ${statusClass}">
                    <i class="fas ${statusIcon}"></i>
                    <span>${statusText}</span>
                </div>
                ${isConfirmed ? `
                    <div class="confirmation-badge-enhanced">
                        <i class="fas fa-shield-check"></i>
                        <span>مؤكد</span>
                    </div>
                ` : ''}
            </div>
        </div>

        <div class="enhanced-result-body">
            <div class="main-details-section">
                <div class="details-grid">
                    <div class="detail-item">
                        <div class="detail-icon">
                            <i class="fas fa-exclamation-triangle"></i>
                        </div>
                        <div class="detail-info">
                            <div class="detail-label">نوع الشكوى</div>
                            <div class="detail-value">${result.scam_type || '-'}</div>
                        </div>
                    </div>
                    ${result.reporter_name ? `
                        <div class="detail-item">
                            <div class="detail-icon">
                                <i class="fas fa-user-check"></i>
                            </div>
                            <div class="detail-info">
                                <div class="detail-label">اسم المبلغ</div>
                                <div class="detail-value">${result.reporter_name}</div>
                            </div>
                        </div>
                    ` : ''}
                </div>

                <div class="details-section-full">
                    <div class="detail-label">
                        <i class="fas fa-file-alt"></i>
                        تفاصيل الشكوى
                    </div>
                    <div class="detail-content">
                        ${result.details || 'لا توجد تفاصيل'}
                    </div>
                </div>

                ${isConfirmed && result.confirmation_notes ? `
                    <div class="details-section-full confirmation-section">
                        <div class="detail-label">
                            <i class="fas fa-shield-alt"></i>
                            ملاحظات التأكيد
                        </div>
                        <div class="detail-content">
                            ${result.confirmation_notes}
                        </div>
                    </div>
                ` : ''}
            </div>

            ${evidenceHTML}
        </div>

        <div class="enhanced-result-actions">
            <div class="actions-list">
                <button class="action-btn primary" onclick="downloadReportAsPDF(${index})">
                    <i class="fas fa-print"></i>
                    <span>طباعة</span>
                </button>
                <button class="action-btn secondary" onclick="clearSearchResults()" style="background: #6c757d; color: white; margin-right: 10px; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer; display: inline-flex; align-items: center; gap: 5px;">
                    <i class="fas fa-eraser"></i>
                    <span>محو السجل</span>
                </button>
                <button class="action-btn danger" onclick="prepareDeleteRequest('${result.scammer_phone || ''}')" style="background: #dc3545; color: white; margin-right: 10px; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer; display: inline-flex; align-items: center; gap: 5px;">
                    <i class="fas fa-trash-alt"></i>
                    <span>حذف التقرير</span>
                </button>
            </div>
        </div>
    `;

    return card;
}

// فتح صورة في modal بسيط
function openImageModal(imageSrc) {
    const modal = document.getElementById('imageModal');
    const modalImage = document.getElementById('modalImage');
    const loadingElement = modal.querySelector('.image-loading');
    const imageContainer = modal.querySelector('.image-container');

    if (modal && modalImage) {
        // إظهار التحميل
        if (loadingElement) loadingElement.style.display = 'flex';
        if (imageContainer) imageContainer.classList.add('loading');

        // تحميل الصورة
        modalImage.onload = function() {
            // إخفاء التحميل
            if (loadingElement) loadingElement.style.display = 'none';
            if (imageContainer) imageContainer.classList.remove('loading');

            // إعادة تعيين أي تحويلات سابقة
            modalImage.style.transform = 'none';
        };

        modalImage.onerror = function() {
            if (loadingElement) {
                loadingElement.innerHTML = `
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>فشل في تحميل الصورة</p>
                `;
            }
        };

        // تعيين مصدر الصورة
        modalImage.src = imageSrc;

        // إظهار الـ modal
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

// إغلاق modal الصور
function closeImageModal() {
    const modal = document.getElementById('imageModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';

        // إعادة تعيين القيم
        resetImageModal();
    }
}

// إعادة تعيين الـ modal
function resetImageModal() {
    const modalImage = document.getElementById('modalImage');
    if (modalImage) {
        modalImage.style.transform = 'none';
    }
}



// مشاركة التقرير عبر واتساب
function shareReportToWhatsApp(reportId, scammerName, scamType, phone) {
    // إنشاء رسالة مشاركة
    const message = `🚨 تنبيه أمني مهم 🚨

تم العثور على حالة مشبوهة في قاعدة بيانات نظام حل المنازعات الأكاديمي:

👤 الاسم: ${scammerName}
📋 نوع الشكوى: ${scamType}
📞 رقم الهاتف: ${phone || 'غير محدد'}

⚠️ يُنصح بالحذر الشديد من التعامل مع هذا الشخص!

🔍 للمزيد من التفاصيل، يرجى زيارة:
https://scam.enjazacademy.org/

#حماية_أكاديمية #السلامة_الأكاديمية
    `;

    // ترميز الرسالة للـ URL
    const encodedMessage = encodeURIComponent(message);

    // إنشاء رابط واتساب
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;

    // فتح واتساب في نافذة جديدة
    window.open(whatsappUrl, '_blank');

    // إظهار إشعار نجاح
    showNotification('تم فتح واتساب للمشاركة', 'success');
}

// تحميل التقرير كملف PDF
function downloadReportAsPDF(index) {
    const report = window.currentSearchResults && window.currentSearchResults[index];
    if (!report) return;

    // الحصول على عنصر البطاقة من DOM لضمان تطابق الشكل
    const cards = document.querySelectorAll('.enhanced-result-card');
    if (!cards[index]) return;
    
    const cardClone = cards[index].cloneNode(true);
    
    // إزالة أزرار الإجراءات من النسخة المطبوعة
    const actions = cardClone.querySelector('.enhanced-result-actions');
    if (actions) actions.remove();

    const printWindow = window.open('', '_blank');
    
    // نسخ الأنماط من الصفحة الحالية
    let stylesHtml = '';
    document.querySelectorAll('link[rel="stylesheet"], style').forEach(node => {
        stylesHtml += node.outerHTML;
    });

    const htmlContent = `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
            <meta charset="UTF-8">
            <title>تقرير - ${report.scammer_name || 'غير معروف'}</title>
            ${stylesHtml}
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
                body { 
                    background: #fff; 
                    padding: 0;
                    margin: 0;
                    font-family: 'Cairo', sans-serif;
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                }
                .print-container {
                    max-width: 210mm;
                    margin: 0 auto;
                    padding: 10px;
                }
                .enhanced-result-card { 
                    margin: 0 auto; 
                    box-shadow: none !important; 
                    border: 2px solid #2c3e50 !important;
                    border-radius: 12px !important;
                    overflow: hidden;
                    width: 100%;
                    page-break-inside: avoid;
                }
                /* Header Optimization */
                .enhanced-result-header {
                    padding: 15px !important;
                    background: #f8f9fa !important;
                    border-bottom: 2px solid #eee !important;
                    display: flex;
                    align-items: center;
                    gap: 15px;
                }
                .scammer-image-container {
                    width: 100px !important;
                    height: 100px !important;
                    border: 3px solid #2c3e50 !important;
                    box-shadow: none !important;
                    border-radius: 50% !important;
                    overflow: hidden;
                }
                .scammer-image {
                    width: 100% !important;
                    height: 100% !important;
                    object-fit: cover !important;
                }
                .scammer-info-section { flex: 1; }
                .scammer-name h4 {
                    font-size: 1.4rem !important;
                    color: #2c3e50 !important;
                    margin: 0 0 10px 0 !important;
                }
                .contact-item, .date-item {
                    font-size: 0.9rem !important;
                    margin-bottom: 5px !important;
                    color: #555 !important;
                }
                /* Body Optimization */
                .enhanced-result-body { padding: 15px !important; }
                .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
                .detail-item { padding: 10px !important; border: 1px solid #eee; background: #fff; border-radius: 8px; }
                .details-section-full { margin-top: 10px !important; padding: 10px !important; background: #fcfcfc; border: 1px solid #eee; border-radius: 8px; }
                .detail-content { font-size: 0.95rem !important; line-height: 1.5 !important; color: #333 !important; text-align: justify; }
                /* Evidence Optimization */
                .evidence-section-enhanced { margin-top: 15px !important; padding-top: 10px !important; border-top: 2px dashed #eee; page-break-inside: avoid; }
                .evidence-grid-enhanced { display: grid !important; grid-template-columns: repeat(6, 1fr) !important; gap: 10px !important; }
                .evidence-item-enhanced { height: 80px !important; width: auto !important; border: 1px solid #ddd; border-radius: 6px; overflow: hidden; }
                .evidence-image { width: 100%; height: 100%; object-fit: cover; }
                .evidence-overlay, .image-overlay, .evidence-more-enhanced { display: none !important; }
                /* Hide Actions */
                .enhanced-result-actions { display: none !important; }
                /* Print Header/Footer */
                .print-header { text-align: center; margin-bottom: 10px; border-bottom: 2px solid #2c3e50; padding-bottom: 10px; }
                .print-header h1 { margin: 0; color: #2c3e50; font-size: 1.8rem; font-weight: 700; }
                .print-header p { margin: 5px 0 0; color: #7f8c8d; font-size: 0.9rem; }
                .print-footer { margin-top: 15px; text-align: center; font-size: 0.85rem; color: #7f8c8d; border-top: 1px solid #eee; padding-top: 10px; page-break-inside: avoid; }
                @page { size: A4; margin: 5mm; }
            </style>
        </head>
        <body>
            <div class="print-container">
                <div class="print-header">
                    <h1>نظام حل المنازعات الأكاديمي</h1>
                    <p>تقرير حالة رسمية</p>
                </div>
                ${cardClone.outerHTML}
                <div class="print-footer">
                    تم استخراج هذا التقرير بتاريخ ${new Date().toLocaleDateString('ar-EG')} الساعة ${new Date().toLocaleTimeString('ar-EG')}
                    <br>
                    https://scam.enjazacademy.org
                </div>
            </div>
            <script>window.onload = function() { setTimeout(() => window.print(), 500); }</script>
        </body>
        </html>
    `;
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
}

// التحضير لطلب حذف التقرير
function prepareDeleteRequest(phone) {
    // التمرير إلى قسم التحقق من الهوية (الخطوة الأولى للحذف)
    const verifyBtn = document.getElementById('verifyIdentityBtn');
    if (verifyBtn) {
        verifyBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // وميض للقسم لجذب الانتباه
        const container = verifyBtn.closest('.form-card') || verifyBtn.parentElement;
        if (container) {
            container.style.transition = 'box-shadow 0.5s';
            container.style.boxShadow = '0 0 20px rgba(220, 53, 69, 0.5)';
            setTimeout(() => container.style.boxShadow = '', 1500);
        }
    }
    
    // تعبئة رقم المشكو منه في حقل الحذف (سيتم استخدامه بعد التحقق)
    const scammerPhoneInput = document.getElementById('scammerWhatsApp');
    if (scammerPhoneInput && phone) {
        scammerPhoneInput.value = phone;
    }
    
    showNotification('لطلب حذف التقرير، يرجى التحقق من هويتك أولاً', 'info');
}

// جعل الدالة متاحة بشكل عام للاستخدام من HTML
window.openImageModal = openImageModal;
window.closeImageModal = closeImageModal;
window.shareReportToWhatsApp = shareReportToWhatsApp;
window.downloadReportAsPDF = downloadReportAsPDF;
window.prepareDeleteRequest = prepareDeleteRequest;

// مسح نتائج البحث
function clearSearchResults() {
    const resultsGrid = document.getElementById('resultsGrid');
    const noResults = document.getElementById('noResults');
    const resultsCount = document.getElementById('resultsCount');
    const searchSummary = document.getElementById('searchSummary');
    const clearResultsBtn = document.getElementById('clearResultsBtn');
    const addNewReportBtn = document.getElementById('addNewReportBtn');
    const phoneSearchInput = document.getElementById('phoneSearchInput');
    
    // مسح النتائج
    if (resultsGrid) {
        resultsGrid.innerHTML = '';
    }
    
    // إظهار حالة "ابدأ بالبحث"
    if (noResults) {
        noResults.style.display = 'block';
        noResults.innerHTML = `
            <div class="no-results-content">
                <i class="fas fa-search"></i>
                <h4>ابدأ بالبحث الآن</h4>
                <p>استخدم البحث الأساسي أو البحث المتقدم للعثور على المشكو منهم المؤكدين رسمياً</p>
                <div class="search-tips">
                    <h5>نصائح للبحث الفعال:</h5>
                    <ul>
                        <li><i class="fas fa-check"></i> استخدم رقم الهاتف مع كود الدولة</li>
                        <li><i class="fas fa-check"></i> اختر صور واضحة للمشكو منه</li>
                        <li><i class="fas fa-check"></i> استخدم البحث المتقدم للحصول على دقة أكبر</li>
                    </ul>
                </div>
            </div>
        `;
    }
    
    // إخفاء ملخص البحث
    if (searchSummary) {
        searchSummary.style.display = 'none';
    }
    
    // تحديث نص عدد النتائج
    if (resultsCount) {
        resultsCount.style.display = 'none';
    }
    
    // إخفاء أزرار التحكم
    if (clearResultsBtn) {
        clearResultsBtn.style.display = 'none';
    }
    if (addNewReportBtn) {
        addNewReportBtn.style.display = 'none';
    }
    
    // مسح حقل البحث
    if (phoneSearchInput) {
        phoneSearchInput.value = '';
    }
}

function clearDeleteFormFields() {
    // تنظيف حقول نموذج الحذف
    const fields = [
        'applicantName', 
        'applicantContact', 
        'scammerWhatsApp', 
        'deleteReason',
        'verifyApplicantName',
        'verifyApplicantWhatsApp'
    ];
    fields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) field.value = '';
    });
    
    // مسح البيانات المخزنة
    window.verifiedApplicant = null;
}

function switchDeleteStep(step) {
    // تبديل خطوات نموذج الحذف
    // تحديد خطوات الحذف فقط لتجنب التأثير على نموذج البلاغ
    const steps = document.querySelectorAll('#verificationStep, #deleteRequestStep');
    steps.forEach(s => s.classList.remove('active'));

    const targetStep = document.getElementById(step + 'Step');
    if (targetStep) {
        targetStep.classList.add('active');
    }
}

// دوال أخرى مطلوبة
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
    }
}

function resetReportForm() {
    // إعادة تعيين النموذج
    currentReportData = {};
    selectedScammerImage = null;
    selectedEvidenceImages = [];
    
    // تفريغ حقول الإدخال في النموذج
    document.getElementById('scammerName').value = '';
    document.getElementById('scammerPhone').value = '';
    document.getElementById('scammerEmail').value = '';
    document.getElementById('scammerType').value = '';
    document.getElementById('scammerDetails').value = '';
    document.getElementById('reporterName').value = '';
    document.getElementById('reporterContact').value = '';
    
    if (document.getElementById('detailsCount')) document.getElementById('detailsCount').textContent = '0';
    
    // إعادة تعيين واجهة الصور
    removeScammerImage();
    clearAllEvidenceImages();
    
    switchStep(1);
}

// تحديث بيانات قسم التأكيد
function updateVerificationData() {
    // تحديث البيانات النصية
    const verifyName = document.getElementById('verifyName');
    const verifyPhone = document.getElementById('verifyPhone');
    const verifyType = document.getElementById('verifyType');
    const verifyReporter = document.getElementById('verifyReporter');

    if (verifyName) verifyName.textContent = currentReportData.scammer_name || '-';
    if (verifyPhone) verifyPhone.textContent = currentReportData.scammer_phone || '-';

    // تحويل نوع النصب إلى نص مقروء
    let scamTypeText = '-';
    if (currentReportData.scam_type) {
        const scamTypes = {
            'سرقة أبحاث': 'سرقة أبحاث',
            'التزوير في الوثائق': 'التزوير في الوثائق',
            'الاحتيال المالي': 'الاحتيال المالي',
            'انتحال شخصية أكاديمية': 'انتحال شخصية أكاديمية',
            'أخرى': 'أخرى'
        };
        scamTypeText = scamTypes[currentReportData.scam_type] || currentReportData.scam_type;
    }
    if (verifyType) verifyType.textContent = scamTypeText;

    if (verifyReporter) verifyReporter.textContent = currentReportData.reporter_name || '-';

    // تحديث معاينة الصور
    updateVerificationImages();
}

// تحديث معاينة الصور في قسم التأكيد
function updateVerificationImages() {
    const scammerImagePreview = document.getElementById('verificationScammerImage');
    const evidenceImagesContainer = document.getElementById('verificationEvidenceImages');

    // صورة المشتبه به
    if (scammerImagePreview) {
        if (selectedScammerImage) {
            const reader = new FileReader();
            reader.onload = function(e) {
                scammerImagePreview.innerHTML = `
                    <img src="${e.target.result}" alt="صورة المشتبه به" style="max-width: 100px; max-height: 100px; border-radius: 8px;">
                `;
            };
            reader.readAsDataURL(selectedScammerImage);
        } else {
            scammerImagePreview.innerHTML = '<span class="text-muted">لم يتم رفع صورة</span>';
        }
    }

    // صور الأدلة
    if (evidenceImagesContainer) {
        evidenceImagesContainer.innerHTML = '';

        if (selectedEvidenceImages.length > 0) {
            selectedEvidenceImages.forEach((file, index) => {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const imgElement = document.createElement('img');
                    imgElement.src = e.target.result;
                    imgElement.alt = `دليل ${index + 1}`;
                    imgElement.style = 'max-width: 80px; max-height: 80px; margin: 5px; border-radius: 4px;';
                    evidenceImagesContainer.appendChild(imgElement);
                };
                reader.readAsDataURL(file);
            });
        } else {
            evidenceImagesContainer.innerHTML = '<span class="text-muted">لم يتم رفع أدلة</span>';
        }
    }
}
