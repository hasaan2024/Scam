// app.js - نظام مكافحة النصب الأكاديمي
// Supabase Configuration
const SUPABASE_URL = 'https://ubnjvpdjlduyirhdkjjv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVibmp2cGRqbGR1eWlyaGRramp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1OTQzODksImV4cCI6MjA3NzE3MDM4OX0.4LVmgXV6dOi6azHaTzubp4_Jatl2ox7S7ASAQ2cP-wU';

// Initialize Supabase client
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Global variables
let currentReportData = {};
let selectedScammerImage = null;
let selectedEvidenceImages = [];
let selectedImageFile = null;
let currentSearchMethod = 'phone';
let currentReportStep = 1;
let currentDeleteStep = 'verification';

// Arab countries phone codes and lengths with required prefixes
const ARAB_COUNTRIES_PHONE_DATA = {
    '20': {
        country: 'مصر',
        totalLength: 12,
        digitsAfterCode: 10,
        requiredPrefix: '1',
        prefixDescription: 'رقم محمول مصري يبدأ بـ 1'
    },
    '966': {
        country: 'السعودية',
        totalLength: 12,
        digitsAfterCode: 9,
        requiredPrefix: '5',
        prefixDescription: 'رقم سعودي يبدأ بـ 5'
    },
    '971': {
        country: 'الإمارات',
        totalLength: 12,
        digitsAfterCode: 9,
        requiredPrefix: '5',
        prefixDescription: 'رقم إماراتي يبدأ بـ 5'
    },
    '965': {
        country: 'الكويت',
        totalLength: 11,
        digitsAfterCode: 8,
        requiredPrefix: '5',
        prefixDescription: 'رقم كويتي يبدأ بـ 5'
    },
    '974': {
        country: 'قطر',
        totalLength: 11,
        digitsAfterCode: 8,
        requiredPrefix: '5',
        prefixDescription: 'رقم قطري يبدأ بـ 5'
    },
    '973': {
        country: 'البحرين',
        totalLength: 11,
        digitsAfterCode: 8,
        requiredPrefix: '3',
        prefixDescription: 'رقم بحريني يبدأ بـ 3'
    },
    '968': {
        country: 'عمان',
        totalLength: 11,
        digitsAfterCode: 8,
        requiredPrefix: '9',
        prefixDescription: 'رقم عماني يبدأ بـ 9'
    },
    '962': {
        country: 'الأردن',
        totalLength: 12,
        digitsAfterCode: 9,
        requiredPrefix: '7',
        prefixDescription: 'رقم أردني يبدأ بـ 7'
    },
    '961': {
        country: 'لبنان',
        totalLength: 11,
        digitsAfterCode: 8,
        requiredPrefix: '7',
        prefixDescription: 'رقم لبناني يبدأ بـ 7'
    },
    '963': {
        country: 'سوريا',
        totalLength: 12,
        digitsAfterCode: 9,
        requiredPrefix: '9',
        prefixDescription: 'رقم سوري يبدأ بـ 9'
    },
    '964': {
        country: 'العراق',
        totalLength: 13,
        digitsAfterCode: 10,
        requiredPrefix: '7',
        prefixDescription: 'رقم عراقي يبدأ بـ 7'
    },
    '967': {
        country: 'اليمن',
        totalLength: 12,
        digitsAfterCode: 9,
        requiredPrefix: '7',
        prefixDescription: 'رقم يمني يبدأ بـ 7'
    },
    '970': {
        country: 'فلسطين',
        totalLength: 12,
        digitsAfterCode: 9,
        requiredPrefix: '5',
        prefixDescription: 'رقم فلسطيني يبدأ بـ 5'
    },
    '218': {
        country: 'ليبيا',
        totalLength: 12,
        digitsAfterCode: 9,
        requiredPrefix: '9',
        prefixDescription: 'رقم ليبي يبدأ بـ 9'
    },
    '216': {
        country: 'تونس',
        totalLength: 11,
        digitsAfterCode: 8,
        requiredPrefix: '2',
        prefixDescription: 'رقم تونسي يبدأ بـ 2'
    },
    '213': {
        country: 'الجزائر',
        totalLength: 12,
        digitsAfterCode: 9,
        requiredPrefix: '5',
        prefixDescription: 'رقم جزائري يبدأ بـ 5'
    },
    '212': {
        country: 'المغرب',
        totalLength: 12,
        digitsAfterCode: 9,
        requiredPrefix: '6',
        prefixDescription: 'رقم مغربي يبدأ بـ 6'
    },
    '249': {
        country: 'السودان',
        totalLength: 12,
        digitsAfterCode: 9,
        requiredPrefix: '9',
        prefixDescription: 'رقم سوداني يبدأ بـ 9'
    },
    '252': {
        country: 'الصومال',
        totalLength: 11,
        digitsAfterCode: 8,
        requiredPrefix: '6',
        prefixDescription: 'رقم صومالي يبدأ بـ 6'
    },
    '253': {
        country: 'جيبوتي',
        totalLength: 11,
        digitsAfterCode: 8,
        requiredPrefix: '7',
        prefixDescription: 'رقم جيبوتي يبدأ بـ 7'
    },
    '269': {
        country: 'جزر القمر',
        totalLength: 10,
        digitsAfterCode: 7,
        requiredPrefix: '3',
        prefixDescription: 'رقم جزر القمر يبدأ بـ 3'
    },
    '222': {
        country: 'موريتانيا',
        totalLength: 11,
        digitsAfterCode: 8,
        requiredPrefix: '2',
        prefixDescription: 'رقم موريتاني يبدأ بـ 2'
    }
};

// ========================================
// UTILITY FUNCTIONS
// ========================================

// Convert file to base64
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result;
            const base64 = result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = error => reject(error);
    });
}

// Show notification
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

    // Auto remove after 5 seconds
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

    // Close button
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.classList.add('hiding');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    });
}

// Show loading screen
function showLoadingScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
        loadingScreen.classList.remove('hidden');
    }
}

// Hide loading screen
function hideLoadingScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
        loadingScreen.classList.add('hidden');
    }
}

// ========================================
// NAVIGATION & UI
// ========================================

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Hide loading screen
    hideLoadingScreen();

    // Set current year in footer
    const currentYearElement = document.getElementById('currentYearFooter');
    if (currentYearElement) {
        currentYearElement.textContent = new Date().getFullYear();
    }

    // Initialize navigation
    initializeNavigation();

    // Initialize mobile menu
    initializeMobileMenu();

    // Initialize hero actions
    initializeHeroActions();

    // Initialize report form
    initializeReportForm();

    // Initialize search functionality
    initializeSearch();

    // Initialize delete request
    initializeDeleteRequest();

    // Initialize admin panel
    initializeAdmin();

    // Initialize scroll to top
    initializeScrollToTop();

    // Initialize image modal
    initializeImageModal();

    // Initialize content protection
    initializeContentProtection();

    // Update stats
    updateStats();
    
    // تحديث حالة أزرار البحث المتقدم
    updateClearImageButtonState();
}

// Initialize navigation
function initializeNavigation() {
    const navLinks = document.querySelectorAll('.nav-link, .mobile-nav-link');

    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const href = this.getAttribute('href');
            if (href && href.startsWith('#')) {
                const targetId = href.substring(1);
                scrollToSection(targetId);

                // Update active nav
                updateActiveNav(targetId);

                // Close mobile menu
                closeMobileMenu();
            }
        });
    });

    // Update active nav on scroll
    window.addEventListener('scroll', throttle(updateActiveNavOnScroll, 100));
}

// Scroll to section
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        const offset = 70; // navbar height
        const top = section.offsetTop - offset;
        window.scrollTo({
            top: top,
            behavior: 'smooth'
        });
    }
}

// Update active navigation
function updateActiveNav(activeSection) {
    const navLinks = document.querySelectorAll('.nav-link, .mobile-nav-link');

    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href && href === `#${activeSection}`) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

// Update active nav on scroll
function updateActiveNavOnScroll() {
    const sections = ['report', 'search', 'delete', 'about'];
    const scrollPosition = window.scrollY + 150;

    let activeSection = 'report';

    sections.forEach(sectionId => {
        const section = document.getElementById(sectionId);
        if (section) {
            const top = section.offsetTop;
            const bottom = top + section.offsetHeight;

            if (scrollPosition >= top && scrollPosition < bottom) {
                activeSection = sectionId;
            }
        }
    });

    updateActiveNav(activeSection);
}

// Initialize mobile menu
function initializeMobileMenu() {
    const mobileToggle = document.getElementById('mobileToggle');
    const mobileNav = document.getElementById('mobileNav');
    const mobileClose = document.getElementById('mobileClose');

    if (mobileToggle && mobileNav) {
        mobileToggle.addEventListener('click', () => {
            mobileNav.classList.add('active');
        });
    }

    if (mobileClose && mobileNav) {
        mobileClose.addEventListener('click', () => {
            closeMobileMenu();
        });
    }

    // Close on overlay click
    if (mobileNav) {
        mobileNav.addEventListener('click', (e) => {
            if (e.target === mobileNav) {
                closeMobileMenu();
            }
        });
    }
}

// Close mobile menu
function closeMobileMenu() {
    const mobileNav = document.getElementById('mobileNav');
    if (mobileNav) {
        mobileNav.classList.remove('active');
    }
}

// Initialize hero actions
function initializeHeroActions() {
    const heroButtons = document.querySelectorAll('.hero-actions .btn[data-section]');

    heroButtons.forEach(button => {
        button.addEventListener('click', function() {
            const section = this.getAttribute('data-section');
            if (section) {
                scrollToSection(section);
            }
        });
    });
}

// Initialize scroll to top
function initializeScrollToTop() {
    const scrollTopBtn = document.getElementById('scrollTopBtn');
    const whatsappBtn = document.querySelector('.whatsapp-float');

    if (scrollTopBtn || whatsappBtn) {
        // Show/hide buttons on scroll
        window.addEventListener('scroll', () => {
            const shouldShow = window.scrollY > 300;

            if (scrollTopBtn) {
                if (shouldShow) {
                    scrollTopBtn.classList.add('visible');
                } else {
                    scrollTopBtn.classList.remove('visible');
                }
            }

            if (whatsappBtn) {
                if (shouldShow) {
                    whatsappBtn.classList.add('visible');
                } else {
                    whatsappBtn.classList.remove('visible');
                }
            }
        });

        // Scroll to top on click
        if (scrollTopBtn) {
            scrollTopBtn.addEventListener('click', () => {
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            });
        }
    }
}

// Initialize image modal
function initializeImageModal() {
    const modal = document.getElementById('imageModal');
    const closeModal = document.getElementById('closeModal');

    if (closeModal && modal) {
        closeModal.addEventListener('click', () => {
            modal.classList.remove('active');
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    }
}

// Show image in modal
function showImageModal(imageSrc, alt = '') {
    const modal = document.getElementById('imageModal');
    const modalImage = document.getElementById('modalImage');

    if (modal && modalImage) {
        modalImage.src = imageSrc;
        modalImage.alt = alt;
        modal.classList.add('active');
    }
}

// Throttle function
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// ========================================
// REPORT FORM
// ========================================

// Initialize report form
function initializeReportForm() {
    // Progress steps
    initializeProgressSteps();

    // Form steps navigation
    initializeFormNavigation();

    // Form validation
    initializeFormValidation();

    // Image uploads
    initializeImageUploads();

    // Initialize remove scammer image button
    const removeScammerBtn = document.getElementById('removeScammerImageBtn');
    if (removeScammerBtn) {
        removeScammerBtn.addEventListener('click', removeScammerImage);
    }
}

// Initialize progress steps
function initializeProgressSteps() {
    const progressSteps = document.querySelectorAll('.progress-step[data-step]');

    progressSteps.forEach(step => {
        step.addEventListener('click', function() {
            const stepNumber = parseInt(this.getAttribute('data-step'));
            if (stepNumber <= currentReportStep) {
                switchToReportStep(stepNumber);
            }
        });
    });
}

// Initialize form navigation
function initializeFormNavigation() {
    // Next buttons
    const nextToStep2 = document.getElementById('nextToStep2');
    const nextToStep3 = document.getElementById('nextToStep3');

    if (nextToStep2) {
        nextToStep2.addEventListener('click', () => {
            if (validateStep1()) {
                saveStep1Data();
                switchToReportStep(2);
            }
        });
    }

    if (nextToStep3) {
        nextToStep3.addEventListener('click', () => {
            if (validateStep2()) {
                switchToReportStep(3);
            }
        });
    }

    // Back buttons
    const backToStep1 = document.getElementById('backToStep1');
    const backToStep2 = document.getElementById('backToStep2');

    if (backToStep1) {
        backToStep1.addEventListener('click', () => {
            switchToReportStep(1);
        });
    }

    if (backToStep2) {
        backToStep2.addEventListener('click', () => {
            switchToReportStep(2);
        });
    }

    // Submit button
    const submitReportBtn = document.getElementById('submitReportBtn');
    if (submitReportBtn) {
        submitReportBtn.addEventListener('click', handleReportSubmission);
    }
}

// Switch to report step
function switchToReportStep(stepNumber) {
    // Update current step
    currentReportStep = stepNumber;

    // Update progress steps
    const progressSteps = document.querySelectorAll('.progress-step');
    progressSteps.forEach((step, index) => {
        const stepNum = index + 1;
        if (stepNum < stepNumber) {
            step.classList.add('completed');
            step.classList.remove('active');
        } else if (stepNum === stepNumber) {
            step.classList.add('active');
            step.classList.remove('completed');
        } else {
            step.classList.remove('active', 'completed');
        }
    });

    // Show/hide form steps
    const formSteps = document.querySelectorAll('.form-step');
    formSteps.forEach((step, index) => {
        const stepNum = index + 1;
        if (stepNum === stepNumber) {
            step.classList.add('active');
        } else {
            step.classList.remove('active');
        }
    });

    // Scroll to top of the active step
    if (stepNumber === 2 || stepNumber === 3) {
        setTimeout(() => {
            const activeStep = document.querySelector('.form-step.active');
            if (activeStep) {
                const offset = 100; // Small offset from top
                const top = activeStep.offsetTop - offset;
                window.scrollTo({
                    top: top,
                    behavior: 'smooth'
                });
            }
        }, 100); // Small delay to ensure the step is visible
    }

    // Populate verification data when moving to step 3
    if (stepNumber === 3) {
        populateVerificationStep();
    }
}

// Validate step 1
function validateStep1() {
    const requiredFields = [
        'scammerPhone',
        'scammerType',
        'scammerDetails',
        'reporterContact'
    ];

    const optionalFields = [
        'scammerName',
        'reporterName'
    ];

    let isValid = true;

    // Validate required fields
    requiredFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field && !field.value.trim()) {
            field.classList.add('error');
            isValid = false;
        } else if (field) {
            field.classList.remove('error');
        }
    });

    // Validate optional fields if they have content
    optionalFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field && field.value.trim()) {
            // Add validation for optional fields if needed
            // For now, just check if they have content
        }
    });

    // Validate that reporter WhatsApp is different from scammer WhatsApp
    const scammerPhone = document.getElementById('scammerPhone').value.trim();
    const reporterContact = document.getElementById('reporterContact').value.trim();
    
    if (scammerPhone && reporterContact && scammerPhone === reporterContact) {
        const reporterContactField = document.getElementById('reporterContact');
        reporterContactField.classList.add('error');
        showFieldError(reporterContactField, 'رقم واتساب المبلغ يجب أن يكون مختلفاً عن رقم واتساب المشكو منه');
        isValid = false;
    }

    if (!isValid) {
        showNotification('يرجى ملء جميع الحقول المطلوبة وتصحيح الأخطاء', 'error');
    }

    return isValid;
}

// Validate step 2
function validateStep2() {
    // Check if at least one evidence image is uploaded
    if (!selectedEvidenceImages || selectedEvidenceImages.length === 0) {
        showNotification('يجب رفع صورة واحدة على الأقل من صور الأدلة والوثائق', 'error');
        return false;
    }

    return true;
}

// Save step 1 data
function saveStep1Data() {
    currentReportData = {
        name: document.getElementById('scammerName').value.trim(),
        phone: document.getElementById('scammerPhone').value.trim(),
        email: document.getElementById('scammerEmail').value.trim(),
        scamType: document.getElementById('scammerType').value,
        details: document.getElementById('scammerDetails').value.trim(),
        reporterName: document.getElementById('reporterName').value.trim(),
        reporterContact: document.getElementById('reporterContact').value.trim()
    };
}

// Populate verification step with data from previous steps
function populateVerificationStep() {
    if (!currentReportData) return;

    // Populate verification fields
    const verifyName = document.getElementById('verifyName');
    const verifyPhone = document.getElementById('verifyPhone');
    const verifyType = document.getElementById('verifyType');
    const verifyReporter = document.getElementById('verifyReporter');

    if (verifyName) verifyName.textContent = currentReportData.name || '-';
    if (verifyPhone) verifyPhone.textContent = currentReportData.phone || '-';
    if (verifyType) verifyType.textContent = currentReportData.scamType || '-';
    if (verifyReporter) verifyReporter.textContent = currentReportData.reporterName || '-';
}

// Handle report submission
async function handleReportSubmission() {
    try {
        // Show loading
        const submitBtn = document.getElementById('submitReportBtn');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري حفظ البيانات...';

        // Submit report
        showNotification('جاري حفظ البيانات...', 'info');
        await submitCompleteScamReport(currentReportData, selectedScammerImage, selectedEvidenceImages);

        // Show success
        showNotification('تم تسجيل المشكو منه بنجاح في قاعدة البيانات', 'success');

        // Hide report section and show search after a delay
        setTimeout(() => {
            document.getElementById('report').style.display = 'none';
            scrollToSection('search');
            // Reset form after navigation
            resetReportForm();
        }, 2000);

    } catch (error) {
        console.error('Error submitting report:', error);
        showNotification('حدث خطأ أثناء حفظ المشكو منه. يرجى المحاولة مرة أخرى.', 'error');
    } finally {
        // Reset button
        const submitBtn = document.getElementById('submitReportBtn');
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-save"></i> حفظ التقرير';
    }
}

// Reset report form
function resetReportForm() {
    // Reset data
    currentReportData = {};
    selectedScammerImage = null;
    selectedEvidenceImages = [];

    // Reset form fields
    const form = document.getElementById('reportForm');
    if (form) {
        form.reset();
    }

    // Reset steps
    switchToReportStep(1);

    // Clear image previews
    clearImagePreviews();
}

// Initialize form validation
function initializeFormValidation() {
    // Character counter for details
    const detailsTextarea = document.getElementById('scammerDetails');
    const detailsCount = document.getElementById('detailsCount');

    if (detailsTextarea && detailsCount) {
        detailsTextarea.addEventListener('input', function() {
            const count = this.value.length;
            detailsCount.textContent = count;
            
            // Validate details length
            validateDetailsLength(this);
        });
    }
    
    // Initialize input validation for all form fields
    initializeInputValidation();
}

// Initialize input validation for all form fields
function initializeInputValidation() {
    // Name fields validation
    const nameFields = [
        'scammerName',
        'reporterName',
        'verifyApplicantName',
        'applicantName'
    ];

    nameFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            // Set max length attribute
            field.setAttribute('maxlength', '20');

            field.addEventListener('input', function() {
                validateNameField(this);
            });

            field.addEventListener('keypress', function(e) {
                // Allow only letters (Arabic and English), spaces, and control keys
                const charCode = e.which ? e.which : e.keyCode;
                const char = String.fromCharCode(charCode);

                // Allow control keys (backspace, delete, arrows, etc.)
                if (charCode < 32 || charCode === 127) return;

                // Allow Arabic letters (U+0600 to U+06FF) and English letters
                if (!/^[a-zA-Z\u0600-\u06FF\s]$/.test(char)) {
                    e.preventDefault();
                }

                // Prevent leading space
                if (char === ' ' && this.value.length === 0) {
                    e.preventDefault();
                }

                // Prevent double spaces
                if (char === ' ' && this.value.endsWith(' ')) {
                    e.preventDefault();
                }
            });

            field.addEventListener('paste', function(e) {
                e.preventDefault();
                const text = (e.originalEvent || e).clipboardData.getData('text/plain');
                if (text) {
                    // Filter to allow only letters and single spaces
                    let filteredText = text.replace(/[^a-zA-Z\u0600-\u06FF\s]/g, '') // Remove non-letters/non-spaces
                                           .replace(/\s+/g, ' ') // Replace multiple spaces with single space
                                           .replace(/^\s+/, ''); // Remove leading spaces

                    // Limit to 20 characters
                    filteredText = filteredText.substring(0, 20);

                    this.value = filteredText;
                    validateNameField(this);
                }
            });
        }
    });

    // Phone fields validation
    const phoneFields = [
        'scammerPhone',
        'reporterContact',
        'verifyApplicantWhatsApp',
        'applicantContact',
        'scammerWhatsApp',
        'phoneSearchInput'
    ];

    phoneFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.addEventListener('input', function() {
                validatePhoneField(this);
            });

            field.addEventListener('keypress', function(e) {
                // Allow only numbers and control keys
                const charCode = e.which ? e.which : e.keyCode;
                if (charCode > 31 && (charCode < 48 || charCode > 57)) {
                    e.preventDefault();
                    return;
                }

                // Allow control keys
                if (charCode < 32 || charCode === 127) return;

                // Get current value and potential new value
                const currentValue = this.value;
                const char = String.fromCharCode(charCode);
                const newValue = currentValue + char;

                // Find the country data based on current input
                let countryData = null;
                let maxLength = 13; // Default max for longest Arab phone number

                // Check if we can determine the country code from current input
                const sortedCodes = Object.keys(ARAB_COUNTRIES_PHONE_DATA).sort((a, b) => b.length - a.length);
                for (const code of sortedCodes) {
                    if (newValue.startsWith(code) || currentValue.startsWith(code)) {
                        countryData = ARAB_COUNTRIES_PHONE_DATA[code];
                        maxLength = countryData.totalLength;
                        break;
                    }
                }

                // Prevent typing beyond the maximum length
                if (newValue.length > maxLength) {
                    e.preventDefault();
                    return;
                }

                // Enforce required prefix after country code
                if (countryData && newValue.length === countryData.totalLength - countryData.digitsAfterCode + 1) {
                    // This is the position right after the country code
                    const expectedPrefix = countryData.requiredPrefix;
                    if (char !== expectedPrefix) {
                        e.preventDefault();
                        // Show a brief visual hint
                        showNotification(`${countryData.prefixDescription} - يجب أن يكون الرقم التالي ${expectedPrefix}`, 'warning');
                    }
                }
            });

            field.addEventListener('paste', function(e) {
                e.preventDefault();
                const text = (e.originalEvent || e).clipboardData.getData('text/plain');
                if (text) {
                    let numbers = text.replace(/[^0-9]/g, '');

                    // Find the country data based on pasted content
                    let countryData = null;
                    const sortedCodes = Object.keys(ARAB_COUNTRIES_PHONE_DATA).sort((a, b) => b.length - a.length);

                    for (const code of sortedCodes) {
                        if (numbers.startsWith(code)) {
                            countryData = ARAB_COUNTRIES_PHONE_DATA[code];
                            break;
                        }
                    }

                    if (countryData) {
                        // Validate the pasted number against country requirements
                        const expectedLength = countryData.totalLength;
                        const requiredPrefix = countryData.requiredPrefix;

                        // Truncate to expected length
                        numbers = numbers.substring(0, expectedLength);

                        // Check if it meets the minimum requirements
                        if (numbers.length >= countryData.totalLength - countryData.digitsAfterCode + 1) {
                            const digitsAfterCode = numbers.substring(countryData.totalLength - countryData.digitsAfterCode);
                            if (!digitsAfterCode.startsWith(requiredPrefix)) {
                                // Force the correct prefix
                                const correctPrefix = numbers.substring(0, numbers.length - digitsAfterCode.length) + requiredPrefix;
                                const remainingDigits = digitsAfterCode.substring(1);
                                numbers = correctPrefix + remainingDigits;
                                numbers = numbers.substring(0, expectedLength);
                                showNotification(`${countryData.prefixDescription} - تم تصحيح الرقم تلقائياً`, 'info');
                            }
                        }

                        this.value = numbers;
                    } else {
                        // No valid country code found, just clean numbers
                        this.value = numbers.substring(0, 13); // Max length
                    }

                    validatePhoneField(this);
                }
            });
        }
    });

    // Email fields validation
    const emailFields = [
        'scammerEmail'
    ];

    emailFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.addEventListener('input', function() {
                validateEmailField(this);
            });

            field.addEventListener('keypress', function(e) {
                // Allow only valid email characters: letters, numbers, @, ., -, _, and control keys
                const charCode = e.which ? e.which : e.keyCode;
                const char = String.fromCharCode(charCode);

                // Allow control keys (backspace, delete, arrows, etc.)
                if (charCode < 32 || charCode === 127) return;

                // Allow valid email characters
                if (!/^[a-zA-Z0-9@._-]$/.test(char)) {
                    e.preventDefault();
                }

                // Prevent spaces
                if (char === ' ') {
                    e.preventDefault();
                }

                // Prevent multiple @ symbols
                if (char === '@' && this.value.includes('@')) {
                    e.preventDefault();
                }
            });

            field.addEventListener('paste', function(e) {
                e.preventDefault();
                const text = (e.originalEvent || e).clipboardData.getData('text/plain');
                if (text) {
                    // Filter to allow only valid email characters
                    let filteredText = text.replace(/[^a-zA-Z0-9@._-]/g, '') // Remove invalid characters
                                           .replace(/\s+/g, ''); // Remove spaces

                    // Ensure only one @ symbol
                    const atIndex = filteredText.indexOf('@');
                    if (atIndex !== -1) {
                        const beforeAt = filteredText.substring(0, atIndex + 1);
                        const afterAt = filteredText.substring(atIndex + 1).replace(/@/g, '');
                        filteredText = beforeAt + afterAt;
                    }

                    this.value = filteredText;
                    validateEmailField(this);
                }
            });
        }
    });

    // Details field validation
    const detailsField = document.getElementById('scammerDetails');
    if (detailsField) {
        // Set max length attribute to prevent typing more than 1000 characters
        detailsField.setAttribute('maxlength', '1000');

        detailsField.addEventListener('input', function() {
            validateDetailsLength(this);
        });

        detailsField.addEventListener('paste', function(e) {
            // Allow paste but limit to 1000 characters
            setTimeout(() => {
                if (this.value.length > 1000) {
                    this.value = this.value.substring(0, 1000);
                }
                validateDetailsLength(this);
            }, 0);
        });
    }
}

// Validate name field
function validateNameField(field) {
    const value = field.value;
    const trimmedValue = value.trim();
    const errorElement = field.parentElement.querySelector('.field-error');

    // Remove existing error
    field.classList.remove('error');
    if (errorElement) {
        errorElement.remove();
    }

    // Check if empty (for required fields)
    if (field.hasAttribute('required') && trimmedValue.length === 0) {
        return true; // Let the general validation handle required fields
    }

    // Check minimum length
    if (trimmedValue.length > 0 && trimmedValue.length < 3) {
        showFieldError(field, 'الاسم يجب أن يكون على الأقل 3 أحرف');
        return false;
    }

    // Check maximum length
    if (value.length > 20) {
        showFieldError(field, 'الاسم يجب ألا يتجاوز 20 حرفاً');
        return false;
    }

    // Check for letters only (Arabic and English) and spaces
    if (trimmedValue.length > 0 && !/^[a-zA-Z\u0600-\u06FF\s]+$/.test(trimmedValue)) {
        showFieldError(field, 'الاسم يجب أن يحتوي على حروف فقط');
        return false;
    }

    // Check for double spaces
    if (value.includes('  ')) {
        showFieldError(field, 'الاسم لا يجب أن يحتوي على مسافات مزدوجة');
        return false;
    }

    // Check if starts with space
    if (value.length > 0 && value.startsWith(' ')) {
        showFieldError(field, 'الاسم لا يجب أن يبدأ بمسافة');
        return false;
    }

    return true;
}

// Validate phone field
function validatePhoneField(field) {
    const value = field.value.trim();
    const errorElement = field.parentElement.querySelector('.field-error');

    // Remove existing error
    field.classList.remove('error');
    if (errorElement) {
        errorElement.remove();
    }

    // If empty and field is not required, it's valid
    if (value.length === 0 && !field.hasAttribute('required')) {
        return true;
    }

    // If empty and field is required, it's invalid
    if (value.length === 0 && field.hasAttribute('required')) {
        showFieldError(field, 'هذا الحقل مطلوب');
        return false;
    }

    // Check for numbers only
    if (!/^[0-9]+$/.test(value)) {
        showFieldError(field, 'رقم الهاتف يجب أن يحتوي على أرقام فقط');
        return false;
    }

    // Check minimum length (at least a country code)
    if (value.length < 2) {
        showFieldError(field, 'يرجى إدخال كود الدولة على الأقل');
        return false;
    }

    // Find matching Arab country code
    let matchedCountry = null;
    let expectedLength = 0;

    // Sort country codes by length (longest first) to match correctly
    const sortedCodes = Object.keys(ARAB_COUNTRIES_PHONE_DATA).sort((a, b) => b.length - a.length);

    for (const code of sortedCodes) {
        if (value.startsWith(code)) {
            matchedCountry = ARAB_COUNTRIES_PHONE_DATA[code];
            expectedLength = matchedCountry.totalLength;
            break;
        }
    }

    // Check if it's a valid Arab country code
    if (!matchedCountry) {
        showFieldError(field, 'يجب أن يبدأ الرقم بكود دولة عربية صحيح (مثل: 20 لمصر، 966 للسعودية)');
        return false;
    }

    // Check exact length
    if (value.length !== expectedLength) {
        showFieldError(field, `رقم الهاتف لـ${matchedCountry.country} يجب أن يكون ${expectedLength} رقم بالضبط (${matchedCountry.digitsAfterCode} أرقام بعد كود الدولة)`);
        return false;
    }

    // Check required prefix after country code
    const digitsAfterCode = value.substring(matchedCountry.totalLength - matchedCountry.digitsAfterCode);
    if (!digitsAfterCode.startsWith(matchedCountry.requiredPrefix)) {
        showFieldError(field, `${matchedCountry.prefixDescription} (${matchedCountry.country})`);
        return false;
    }

    return true;
}

// Validate email field
function validateEmailField(field) {
    const value = field.value.trim();
    const errorElement = field.parentElement.querySelector('.field-error');

    // Remove existing error
    field.classList.remove('error');
    if (errorElement) {
        errorElement.remove();
    }

    // If empty, it's valid (email is optional)
    if (value.length === 0) {
        return true;
    }

    // Check for spaces
    if (value.includes(' ')) {
        showFieldError(field, 'البريد الإلكتروني لا يجب أن يحتوي على مسافات');
        return false;
    }

    // Check for multiple @ symbols
    const atCount = (value.match(/@/g) || []).length;
    if (atCount > 1) {
        showFieldError(field, 'البريد الإلكتروني يجب أن يحتوي على @ واحد فقط');
        return false;
    }

    // Check for @ symbol presence
    if (!value.includes('@')) {
        showFieldError(field, 'البريد الإلكتروني يجب أن يحتوي على @');
        return false;
    }

    // Basic email format validation
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(value)) {
        showFieldError(field, 'يرجى إدخال بريد إلكتروني صحيح');
        return false;
    }

    // Check for valid characters only
    if (!/^[a-zA-Z0-9@._-]+$/.test(value)) {
        showFieldError(field, 'البريد الإلكتروني يحتوي على أحرف غير مسموحة');
        return false;
    }

    return true;
}

// Validate details length
function validateDetailsLength(field) {
    const value = field.value;
    const trimmedValue = value.trim();
    const errorElement = field.parentElement.querySelector('.field-error');

    // Remove existing error
    field.classList.remove('error');
    if (errorElement) {
        errorElement.remove();
    }

    // Update character counter
    const counterElement = document.getElementById('detailsCount');
    if (counterElement) {
        counterElement.textContent = value.length;
    }

    // Check if empty (for required fields)
    if (field.hasAttribute('required') && trimmedValue.length === 0) {
        return true; // Let the general validation handle required fields
    }

    // Check minimum length
    if (trimmedValue.length > 0 && trimmedValue.length < 30) {
        showFieldError(field, 'التفاصيل يجب أن تكون على الأقل 30 حرفاً');
        return false;
    }

    // Check maximum length (though maxlength attribute prevents this)
    if (value.length > 1000) {
        showFieldError(field, 'التفاصيل يجب ألا تتجاوز 1000 حرف');
        return false;
    }

    return true;
}

// Show field error
function showFieldError(field, message) {
    field.classList.add('error');
    field.parentElement.insertAdjacentHTML('beforeend', `
        <div class="field-error">
            <i class="fas fa-exclamation-circle"></i>
            <span>${message}</span>
        </div>
    `);
}


// Initialize image uploads
function initializeImageUploads() {
    // Scammer image upload
    initializeScammerImageUpload();

    // Evidence images upload
    initializeEvidenceImagesUpload();
}

// Initialize scammer image upload
function initializeScammerImageUpload() {
    const uploadContainer = document.getElementById('scammerImageUpload');
    const input = document.getElementById('scammerImageInput');
    const preview = document.getElementById('scammerImagePreview');

    if (uploadContainer && input && preview) {
        // Click to select - only on the circular preview (but not on the image itself)
        preview.addEventListener('click', (e) => {
            // If clicking on the image, open modal instead of file dialog
            if (e.target.tagName === 'IMG') {
                return; // Let the image click handler work for modal
            }

            // If clicking on placeholder or empty area, open file dialog
            if (!preview.classList.contains('has-image')) {
                e.preventDefault();
                e.stopPropagation();
                input.click();
            }
        });

        // File selection
        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                handleScammerImageSelection(file);
            }
        });

        // Drag and drop on the entire container
        uploadContainer.addEventListener('dragover', (e) => {
            e.preventDefault();
            preview.classList.add('drag-over');
        });

        uploadContainer.addEventListener('dragleave', (e) => {
            e.preventDefault();
            preview.classList.remove('drag-over');
        });

        uploadContainer.addEventListener('drop', (e) => {
            e.preventDefault();
            preview.classList.remove('drag-over');

            const files = e.dataTransfer.files;
            if (files.length > 0) {
                handleScammerImageSelection(files[0]);
            }
        });
    }
}

// Handle scammer image selection
function handleScammerImageSelection(file) {
    // Validate file
    if (!file.type.startsWith('image/')) {
        showNotification('يرجى اختيار ملف صورة صحيح', 'error');
        return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB
        showNotification('حجم الصورة يجب ألا يزيد عن 5 ميجابايت', 'error');
        return;
    }

    selectedScammerImage = file;
    displayScammerImagePreview(file);
}

// Display scammer image preview
function displayScammerImagePreview(file) {
    const reader = new FileReader();
    const preview = document.getElementById('scammerImagePreview');
    const removeBtn = document.getElementById('removeScammerImageBtn');

    reader.onload = (e) => {
        preview.innerHTML = `<img src="${e.target.result}" alt="صورة المشكو منه">`;
        preview.classList.add('has-image');

        // Add click handler for modal after image is loaded
        const img = preview.querySelector('img');
        if (img) {
            img.addEventListener('click', (event) => {
                event.stopPropagation();
                showImageModal(e.target.result, 'صورة المشكو منه');
            });
        }

        // Show remove button
        if (removeBtn) {
            removeBtn.style.display = 'inline-flex';
        }
    };

    reader.readAsDataURL(file);
}

// Initialize evidence images upload
function initializeEvidenceImagesUpload() {
    const dropZone = document.getElementById('evidenceDropZone');
    const input = document.getElementById('evidenceImagesInput');

    if (dropZone && input) {
        // Click to select - only on the drop zone content, not the whole zone
        const dropZoneContent = dropZone.querySelector('.drop-zone-content');
        if (dropZoneContent) {
            dropZoneContent.addEventListener('click', (e) => {
                e.stopPropagation();
                input.click();
            });
        }

        // File selection
        input.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            handleEvidenceImagesSelection(files);
        });

        // Drag and drop
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });

        dropZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');

            const files = Array.from(e.dataTransfer.files);
            handleEvidenceImagesSelection(files);
        });
    }
}

// Handle evidence images selection
function handleEvidenceImagesSelection(files) {
    const maxImages = 8;
    const currentCount = selectedEvidenceImages.length;

    if (currentCount + files.length > maxImages) {
        showNotification(`لا يمكن رفع أكثر من ${maxImages} صور`, 'warning');
        return;
    }

    // Validate files
    const validFiles = files.filter(file => {
        if (!file.type.startsWith('image/')) {
            showNotification(`تم تجاهل ${file.name}: ليس ملف صورة`, 'warning');
            return false;
        }

        if (file.size > 5 * 1024 * 1024) {
            showNotification(`تم تجاهل ${file.name}: حجم كبير جداً`, 'warning');
            return false;
        }

        return true;
    });

    selectedEvidenceImages.push(...validFiles);
    displayEvidenceImagesPreview();

    if (validFiles.length > 0) {
        showNotification(`تم رفع ${validFiles.length} صورة بنجاح`, 'success');
    }
}

// Display evidence images preview
function displayEvidenceImagesPreview() {
    const grid = document.getElementById('evidenceGrid');
    const count = document.getElementById('evidenceCount');

    if (grid) {
        grid.innerHTML = '';

        selectedEvidenceImages.forEach((file, index) => {
            const reader = new FileReader();
            const item = document.createElement('div');
            item.className = 'evidence-item';

            reader.onload = (e) => {
                item.innerHTML = `
                    <img src="${e.target.result}" alt="صورة دليل ${index + 1}" onclick="showImageModal('${e.target.result}', 'صورة دليل ${index + 1}')">
                    <button class="evidence-remove" onclick="removeEvidenceImage(${index})">
                        <i class="fas fa-trash"></i>
                    </button>
                `;
            };

            reader.readAsDataURL(file);
            grid.appendChild(item);
        });
    }

    if (count) {
        count.textContent = selectedEvidenceImages.length;
    }
}

// Remove scammer image
function removeScammerImage(event) {
    event.preventDefault();
    event.stopPropagation(); // Prevent triggering any other click handlers

    selectedScammerImage = null;

    const preview = document.getElementById('scammerImagePreview');
    const removeBtn = document.getElementById('removeScammerImageBtn');

    if (preview) {
        preview.innerHTML = `
            <div class="preview-placeholder">
                <i class="fas fa-user-plus"></i>
                <span>انقر لإضافة صورة</span>
            </div>
        `;
        preview.classList.remove('has-image');
    }

    // Hide remove button
    if (removeBtn) {
        removeBtn.style.display = 'none';
    }

    showNotification('تم حذف صورة المشكو منه', 'info');
}

// Remove evidence image
function removeEvidenceImage(index) {
    selectedEvidenceImages.splice(index, 1);
    displayEvidenceImagesPreview();
}

// Clear image previews
function clearImagePreviews() {
    // Clear scammer image
    const scammerPreview = document.getElementById('scammerImagePreview');
    const removeBtn = document.getElementById('removeScammerImageBtn');
    if (scammerPreview) {
        scammerPreview.innerHTML = `
            <div class="preview-placeholder">
                <i class="fas fa-user-plus"></i>
                <span>انقر لإضافة صورة</span>
            </div>
        `;
        scammerPreview.classList.remove('has-image');
    }

    // Hide remove button
    if (removeBtn) {
        removeBtn.style.display = 'none';
    }

    // Clear evidence images
    const evidenceGrid = document.getElementById('evidenceGrid');
    if (evidenceGrid) {
        evidenceGrid.innerHTML = '';
    }

    const evidenceCount = document.getElementById('evidenceCount');
    if (evidenceCount) {
        evidenceCount.textContent = '0';
    }
}

// ========================================
// SEARCH FUNCTIONALITY
// ========================================

// Initialize search
function initializeSearch() {
    // Phone search
    initializePhoneSearch();

    // Advanced search (phone + image)
    initializeAdvancedSearch();
}

// Initialize phone search
function initializePhoneSearch() {
    const searchBtn = document.getElementById('phoneSearchBtn');
    const input = document.getElementById('phoneSearchInput');

    if (searchBtn && input) {
        searchBtn.addEventListener('click', async () => {
            const phone = input.value.trim();
            if (!phone) {
                showNotification('يرجى إدخال رقم هاتف للبحث', 'warning');
                return;
            }

            // Show loading state on button
            const originalBtnContent = searchBtn.innerHTML;
            searchBtn.disabled = true;
            searchBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري البحث...';

            // Show loading
            showSearchLoading();

            try {
                // Add minimum loading time to ensure visibility
                const [result] = await Promise.all([
                    searchScamReportByPhone(phone),
                    new Promise(resolve => setTimeout(resolve, 1500)) // Minimum 1.5 seconds
                ]);

                hideSearchLoading();

                // Reset button
                searchBtn.disabled = false;
                searchBtn.innerHTML = originalBtnContent;

                if (result) {
                    const statusText = result.is_confirmed ? 'حالة مؤكدة' : 'تقرير قيد المراجعة';
                    displaySearchResults([result], `${statusText}: ${phone}`);
                    showNotification(result.is_confirmed ? 
                        'تم العثور على حالة مؤكدة' : 
                        'تم العثور على تقرير مشبوه (قيد المراجعة)', 
                        result.is_confirmed ? 'success' : 'warning');
                } else {
                    displaySearchResults([], `البحث برقم الهاتف: ${phone}`);
                    showNotification('لم يتم العثور على أي بيانات مطابقة لرقم الهاتف المدخل', 'info');
                }
            } catch (error) {
                hideSearchLoading();
                
                // Reset button
                searchBtn.disabled = false;
                searchBtn.innerHTML = originalBtnContent;
                
                console.error('Search error:', error);
                showNotification('حدث خطأ أثناء البحث: ' + error.message, 'error');
            }
        });
    }
}

// Initialize advanced search (image only)
function initializeAdvancedSearch() {
    const searchBtn = document.getElementById('advancedSearchBtn');
    const clearBtn = document.getElementById('clearAdvancedSearch');

    // Initialize image search functionality
    initializeAdvancedImageSearch();

    if (searchBtn) {
        searchBtn.addEventListener('click', async () => {
            const imageFile = selectedImageFile;

            if (!imageFile) {
                showNotification('يرجى اختيار صورة للبحث', 'warning');
                return;
            }

            // Show loading state on button
            const originalBtnContent = searchBtn.innerHTML;
            searchBtn.disabled = true;
            searchBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري البحث...';

            // Show loading
            showSearchLoading();

            try {
                // Add minimum loading time to ensure visibility
                const [result] = await Promise.all([
                    searchScamReportByImage(imageFile),
                    new Promise(resolve => setTimeout(resolve, 1500)) // Minimum 1.5 seconds
                ]);

                hideSearchLoading();

                // Reset button
                searchBtn.disabled = false;
                searchBtn.innerHTML = originalBtnContent;

                if (result) {
                    displaySearchResults([result], 'البحث المتقدم بالصورة في الحالات المؤكدة');
                    showNotification('تم العثور على حالة مؤكدة', 'success');
                } else {
                    displaySearchResults([], 'البحث المتقدم بالصورة في الحالات المؤكدة');
                    showNotification('لا توجد حالات مؤكدة مطابقة للصورة المحددة. جرب استخدام صورة مختلفة أو البحث الأساسي.', 'info');
                }
            } catch (error) {
                hideSearchLoading();
                
                // Reset button
                searchBtn.disabled = false;
                searchBtn.innerHTML = originalBtnContent;
                
                console.error('Advanced search error:', error);
                
                // Handle specific image search errors with clearer messages
                if (error.message.includes('حجم الصورة كبير')) {
                    showNotification('حجم الصورة كبير جداً. يرجى اختيار صورة أصغر (أقل من 5 ميجابايت).', 'warning');
                } else if (error.message.includes('انتهت مهلة البحث')) {
                    showNotification('انتهت مهلة البحث. يرجى المحاولة مرة أخرى مع صورة أصغر أو استخدام البحث الأساسي.', 'error');
                } else if (error.message.includes('URI too long') || error.message.includes('413')) {
                    showNotification('حجم الصورة كبير جداً للبحث. يرجى اختيار صورة أصغر.', 'warning');
                } else if (error.message.includes('لا توجد حالات مؤكدة مطابقة')) {
                    showNotification('لا توجد حالات مؤكدة مطابقة للصورة المحددة. جرب استخدام صورة مختلفة أو البحث الأساسي.', 'info');
                } else {
                    showNotification('حدث خطأ أثناء البحث. يرجى المحاولة مرة أخرى.', 'error');
                }
            }
        });
    }

    // Clear button
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            removeAdvancedSearchImage();
            showNotification('تم مسح البحث المتقدم', 'info');
        });
    }

    // Clear advanced search button
    const clearAdvancedBtn = document.getElementById('clearAdvancedSearch');
    if (clearAdvancedBtn) {
        clearAdvancedBtn.addEventListener('click', (e) => {
            // التحقق من أن الزر مفعل قبل التنفيذ
            if (clearAdvancedBtn.disabled) {
                e.preventDefault();
                return;
            }
            e.preventDefault();
            removeAdvancedSearchImage();
            showNotification('تم مسح البحث المتقدم', 'info');
        });
    }
}

// Initialize advanced image search
function initializeAdvancedImageSearch() {
    const uploadContainer = document.querySelector('.circular-image-search-upload');
    const input = document.getElementById('imageSearchInput');
    const preview = document.getElementById('imageSearchPreview');
    const browseBtn = document.getElementById('browseImageBtn');
    const clearBtn = document.getElementById('clearImageBtn');

    if (uploadContainer && input && preview) {
        // Click to select - only on the circular preview (but not on the image itself)
        preview.addEventListener('click', (e) => {
            // If clicking on the image, open modal instead of file dialog
            if (e.target.tagName === 'IMG') {
                return; // Let the image click handler work for modal
            }

            // If clicking on placeholder or empty area, open file dialog
            if (!preview.classList.contains('has-image')) {
                e.preventDefault();
                e.stopPropagation();
                input.click();
            }
        });

        // File selection
        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                handleImageSearchSelection(file);
            }
        });

        // Drag and drop on the entire container
        uploadContainer.addEventListener('dragover', (e) => {
            e.preventDefault();
            preview.classList.add('drag-over');
        });

        uploadContainer.addEventListener('dragleave', (e) => {
            e.preventDefault();
            preview.classList.remove('drag-over');
        });

        uploadContainer.addEventListener('drop', (e) => {
            e.preventDefault();
            preview.classList.remove('drag-over');

            const files = e.dataTransfer.files;
            if (files.length > 0) {
                handleImageSearchSelection(files[0]);
            }
        });
    }

    // Browse button
    if (browseBtn) {
        browseBtn.addEventListener('click', () => {
            input.click();
        });
    }

    // Clear image button
    if (clearBtn) {
        clearBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            removeAdvancedSearchImage();
        });
    }
}

// Show search loading
function showSearchLoading() {
    const loading = document.getElementById('searchLoading');
    if (loading) {
        const loadingText = loading.querySelector('p');
        if (loadingText) {
            // Detect search type
            const imageFile = selectedImageFile;
            if (imageFile) {
                loadingText.textContent = 'جاري البحث المتقدم بالصورة...';
            } else {
                loadingText.textContent = 'جاري البحث الأساسي...';
            }
        }
        loading.style.display = 'flex';
    }
}

// Hide search loading
function hideSearchLoading() {
    const loading = document.getElementById('searchLoading');
    if (loading) {
        const loadingText = loading.querySelector('p');
        if (loadingText) {
            loadingText.textContent = 'جاري البحث...';
        }
        loading.style.display = 'none';
    }
}

// Update clear image button state
function updateClearImageButtonState() {
    const clearAdvancedBtn = document.getElementById('clearAdvancedSearch');
    const hasImage = selectedImageFile !== null;
    
    if (clearAdvancedBtn) {
        clearAdvancedBtn.disabled = !hasImage;
    }
}

// Display search results with professional design
function displaySearchResults(results, searchQuery = '') {
    const resultsGrid = document.getElementById('resultsGrid');
    const resultsCount = document.getElementById('resultsCount');
    const clearBtn = document.getElementById('clearResultsBtn');
    const addNewBtn = document.getElementById('addNewReportBtn');
    const searchSummary = document.getElementById('searchSummary');
    const searchQueryDetails = document.getElementById('searchQueryDetails');
    const searchTimestamp = document.getElementById('searchTimestamp');

    if (!resultsGrid) return;

    // Clear previous results
    resultsGrid.innerHTML = '';

    // Update search summary
    if (searchSummary && searchQueryDetails && searchTimestamp) {
        searchQueryDetails.textContent = searchQuery;
        searchTimestamp.textContent = new Date().toLocaleString('ar-EG');
        searchSummary.style.display = 'block';
    }

    if (!results || results.length === 0) {
        displayProfessionalNoResults(resultsGrid, searchQuery, resultsCount, clearBtn, addNewBtn);
        return;
    }

    // Create professional results container
    const resultsContainer = createResultsContainer();
    const resultsList = resultsContainer.querySelector('.professional-results-list');
    
    // Update results count in header
    const resultsCountElement = resultsContainer.querySelector('#professionalResultsCount span');
    if (resultsCountElement) {
        resultsCountElement.textContent = `عثرنا على ${results.length} حالة مؤكدة`;
    }
    
    // Display results in professional format
    results.forEach((result, index) => {
        const resultCard = createProfessionalResultCard(result, index + 1);
        resultsList.appendChild(resultCard);
    });
    
    resultsGrid.appendChild(resultsContainer);

    // Update results count in the old format for compatibility
    if (resultsCount) {
        resultsCount.innerHTML = `عثرنا على <span class="results-number">${results.length}</span> نتيجة${searchQuery ? ` للبحث: ${searchQuery}` : ''}`;
    }

    // Update button visibility
    if (clearBtn) {
        clearBtn.style.display = 'inline-flex';
        clearBtn.removeEventListener('click', clearSearchResults);
        clearBtn.addEventListener('click', clearSearchResults);
    }
    
    if (addNewBtn) {
        addNewBtn.style.display = 'none';
        addNewBtn.removeEventListener('click', handleAddNewReport);
        addNewBtn.addEventListener('click', handleAddNewReport);
    }

    // Smooth scroll to results
    setTimeout(() => {
        resultsGrid.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start',
            inline: 'nearest'
        });
    }, 100);
}

// Create professional results container
function createResultsContainer() {
    const container = document.createElement('div');
    container.className = 'professional-results-container';
    
    const header = document.createElement('div');
    header.className = 'professional-results-header';
    header.innerHTML = `
        <div class="professional-results-header-content">
            <div class="professional-results-title">
                <i class="fas fa-shield-check"></i>
                <span>نتائج البحث المؤكدة</span>
            </div>
            <div class="professional-results-subtitle">
                جميع النتائج أدناه مؤكدة ومؤكدة رسمياً من قبل الإدارة
            </div>
            <div class="professional-results-count" id="professionalResultsCount">
                <i class="fas fa-database"></i>
                <span>جاري التحميل...</span>
            </div>
        </div>
    `;
    
    container.appendChild(header);
    
    const resultsList = document.createElement('div');
    resultsList.className = 'professional-results-list';
    container.appendChild(resultsList);
    
    return container;
}

// Handle add new report
function handleAddNewReport() {
    document.getElementById('report').style.display = 'block';
    scrollToSection('report');
}

// Keep backward compatibility - redirect to professional version
function displayNoResults(resultsGrid, searchQuery, resultsCount, clearBtn, addNewBtn) {
    displayProfessionalNoResults(resultsGrid, searchQuery, resultsCount, clearBtn, addNewBtn);
}

// Create professional result card
function createProfessionalResultCard(result, index) {
    const card = document.createElement('div');
    card.className = 'professional-result-card';
    card.setAttribute('data-result-id', index);

    // Check if this is a confirmed case
    const isConfirmed = result.is_confirmed || result.status === 'confirmed';
    
    // Create card header
    const header = createProfessionalCardHeader(result, isConfirmed, index);
    
    // Create card body
    const body = createProfessionalCardBody(result, isConfirmed);
    
    // Create card actions
    const actions = createProfessionalCardActions(result, isConfirmed);
    
    // Assemble card
    card.appendChild(header);
    card.appendChild(body);
    card.appendChild(actions);
    
    return card;
}

// Create professional card header
function createProfessionalCardHeader(result, isConfirmed, index) {
    const header = document.createElement('div');
    header.className = 'professional-card-header';
    
    // Scammer image
    const imageSection = createProfessionalScammerImage(result);
    
    // Info section
    const infoSection = createProfessionalScammerInfo(result, isConfirmed);
    
    // Confirmation badge
    const badgeSection = createProfessionalConfirmationBadge(isConfirmed);
    
    header.appendChild(imageSection);
    header.appendChild(infoSection);
    header.appendChild(badgeSection);
    
    return header;
}

// Create professional scammer image
function createProfessionalScammerImage(result) {
    const imageSection = document.createElement('div');
    imageSection.className = 'professional-scammer-image-section';
    
    if (result.scammer_image && result.scammer_image.image_base64) {
        const mimeType = result.scammer_image.mime_type || 'image/jpeg';
        const imageSrc = `data:${mimeType};base64,${result.scammer_image.image_base64}`;
        
        imageSection.innerHTML = `
            <div class="professional-scammer-image" onclick="showImageModal('${imageSrc}', 'صورة المشكو منه')">
                <img src="${imageSrc}" alt="صورة المشكو منه" class="scammer-image">
            </div>
        `;
    } else {
        imageSection.innerHTML = `
            <div class="professional-scammer-image-placeholder">
                <i class="fas fa-user-secret"></i>
            </div>
        `;
    }
    
    return imageSection;
}

// Create professional scammer info
function createProfessionalScammerInfo(result, isConfirmed) {
    const infoSection = document.createElement('div');
    infoSection.className = 'professional-scammer-info';
    
    const reportDate = result.created_at ? new Date(result.created_at).toLocaleDateString('ar-EG') : 'غير محدد';
    const confirmationDate = result.confirmation_date ? new Date(result.confirmation_date).toLocaleDateString('ar-EG') : null;
    
    infoSection.innerHTML = `
        <h3 class="professional-scammer-name">${result.scammer_name || 'غير معروف'}</h3>
        
        <div class="professional-scammer-details">
            <div class="professional-detail-item">
                <i class="fas fa-phone"></i>
                <span>${result.scammer_phone || 'غير معروف'}</span>
            </div>
            ${result.scammer_email ? `
                <div class="professional-detail-item">
                    <i class="fas fa-envelope"></i>
                    <span>${result.scammer_email}</span>
                </div>
            ` : ''}
            <div class="professional-detail-item">
                <i class="fas fa-calendar-check"></i>
                <span>${isConfirmed ? `تأكيد: ${confirmationDate || reportDate}` : `تسجيل: ${reportDate}`}</span>
            </div>
        </div>
    `;
    
    return infoSection;
}

// Create professional confirmation badge
function createProfessionalConfirmationBadge(isConfirmed) {
    const badgeSection = document.createElement('div');
    badgeSection.className = 'professional-confirmation-badge-section';
    
    if (isConfirmed) {
        badgeSection.innerHTML = `
            <div class="professional-confirmation-badge">
                <i class="fas fa-shield-check"></i>
                <span>حالة مؤكدة</span>
            </div>
        `;
    } else {
        badgeSection.innerHTML = `
            <div class="professional-confirmation-badge" style="background: linear-gradient(135deg, var(--warning) 0%, var(--warning-dark) 100%);">
                <i class="fas fa-clock"></i>
                <span>في الانتظار</span>
            </div>
        `;
    }
    
    return badgeSection;
}

// Create professional card body
function createProfessionalCardBody(result, isConfirmed) {
    const body = document.createElement('div');
    body.className = 'professional-card-body';
    
    // Main details grid
    const detailsGrid = createProfessionalDetailsGrid(result, isConfirmed);
    
    // Details section
    const detailsSection = createProfessionalDetailsSection(result);
    
    // Evidence section if available
    const evidenceSection = createProfessionalEvidenceSection(result);
    
    body.appendChild(detailsGrid);
    body.appendChild(detailsSection);
    if (evidenceSection) {
        body.appendChild(evidenceSection);
    }
    
    return body;
}

// Create professional details grid
function createProfessionalDetailsGrid(result, isConfirmed) {
    const detailsGrid = document.createElement('div');
    detailsGrid.className = 'professional-details-grid';
    
    // Scam type
    const scamTypeCard = createProfessionalDetailCard('نوع الشكوي', result.scam_type || 'غير محدد', 'fas fa-exclamation-triangle');
    
    // Reporter name
    const reporterCard = createProfessionalDetailCard('المبلغ', result.reporter_name || 'غير معروف', 'fas fa-user-check');
    
    // Confirmed by (if confirmed)
    if (isConfirmed && result.confirmed_by) {
        const confirmedByCard = createProfessionalDetailCard('تم التأكيد بواسطة', 'د/حسن عادل', 'fas fa-shield-alt');
        detailsGrid.appendChild(confirmedByCard);
    }
    
    // Phone number
    const phoneCard = createProfessionalDetailCard('رقم الهاتف', result.scammer_phone || 'غير معروف', 'fas fa-phone');
    
    detailsGrid.appendChild(scamTypeCard);
    detailsGrid.appendChild(reporterCard);
    detailsGrid.appendChild(phoneCard);
    
    return detailsGrid;
}

// Create professional detail card
function createProfessionalDetailCard(label, value, icon) {
    const card = document.createElement('div');
    card.className = 'professional-detail-card';
    
    card.innerHTML = `
        <div class="professional-detail-icon">
            <i class="${icon}"></i>
        </div>
        <div class="professional-detail-label">${label}</div>
        <div class="professional-detail-value">${value}</div>
    `;
    
    return card;
}

// Create professional details section
function createProfessionalDetailsSection(result) {
    const detailsSection = document.createElement('div');
    detailsSection.className = 'professional-details-section';
    
    detailsSection.innerHTML = `
        <div class="professional-detail-label">
            <i class="fas fa-info-circle"></i>
            <span>تفاصيل الشكوى</span>
        </div>
        <div class="professional-detail-content">
            ${result.details || 'لا توجد تفاصيل متاحة'}
        </div>
    `;
    
    return detailsSection;
}

// Create professional evidence section
function createProfessionalEvidenceSection(result) {
    if (!result.evidence_images || result.evidence_images.length === 0) {
        return null;
    }
    
    const evidence = document.createElement('div');
    evidence.className = 'professional-evidence-section';
    
    const evidenceHeader = document.createElement('div');
    evidenceHeader.className = 'professional-evidence-header';
    evidenceHeader.innerHTML = `
        <i class="fas fa-images"></i>
        <span>صور الأدلة (${result.evidence_images.length})</span>
    `;
    
    const evidenceGrid = document.createElement('div');
    evidenceGrid.className = 'professional-evidence-grid';
    
    // Display first 6 evidence images
    const displayImages = result.evidence_images.slice(0, 6);
    displayImages.forEach((img, index) => {
        const mimeType = img.mime_type || 'image/jpeg';
        const imageSrc = `data:${mimeType};base64,${img.image_base64}`;
        
        const evidenceItem = document.createElement('div');
        evidenceItem.className = 'professional-evidence-item';
        evidenceItem.setAttribute('data-evidence-index', index);
        
        evidenceItem.innerHTML = `
            <img src="${imageSrc}" alt="دليل ${index + 1}" class="evidence-image">
            <div class="professional-evidence-overlay">
                <i class="fas fa-search-plus"></i>
                <span>دليل ${index + 1}</span>
            </div>
        `;
        
        evidenceItem.addEventListener('click', () => {
            showImageModal(imageSrc, `صورة دليل ${index + 1}`);
        });
        
        evidenceGrid.appendChild(evidenceItem);
    });
    
    // Show "more" indicator if there are additional images
    if (result.evidence_images.length > 6) {
        const moreItem = document.createElement('div');
        moreItem.className = 'professional-evidence-item';
        moreItem.style.background = 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)';
        moreItem.style.color = 'var(--white)';
        moreItem.style.display = 'flex';
        moreItem.style.alignItems = 'center';
        moreItem.style.justifyContent = 'center';
        moreItem.style.flexDirection = 'column';
        moreItem.style.fontWeight = '600';
        
        moreItem.innerHTML = `
            <i class="fas fa-plus" style="font-size: 1.5rem; margin-bottom: 0.5rem;"></i>
            <span>+${result.evidence_images.length - 6}</span>
        `;
        
        moreItem.addEventListener('click', () => {
            viewAllEvidence(result.evidence_images);
        });
        
        evidenceGrid.appendChild(moreItem);
    }
    
    evidence.appendChild(evidenceHeader);
    evidence.appendChild(evidenceGrid);
    
    return evidence;
}

// Create professional card actions
function createProfessionalCardActions(result, isConfirmed) {
    const actions = document.createElement('div');
    actions.className = 'professional-card-actions';
    
    // No action buttons needed - removed as per user request
    // Buttons removed: "عرض الصورة", "عرض جميع الأدلة", "حالة مؤكدة"
    
    return actions;
}

// Display professional no results
function displayProfessionalNoResults(resultsGrid, searchQuery, resultsCount, clearBtn, addNewBtn) {
    const noResultsContainer = document.createElement('div');
    noResultsContainer.className = 'professional-no-results';
    
    noResultsContainer.innerHTML = `
        <div class="professional-no-results-icon">
            <i class="fas fa-search-minus"></i>
        </div>
        <h3 class="professional-no-results-title">لا توجد حالات مؤكدة</h3>
        <p class="professional-no-results-message">
            لم نعثر على أي مشكو منهم مؤكدين يتطابقون مع معايير البحث المحددة
        </p>
        
        <div class="professional-search-tips">
            <h5><i class="fas fa-lightbulb"></i> اقتراحات لتحسين البحث:</h5>
            <div class="professional-tips-grid">
                <div class="professional-tip-item">
                    <i class="fas fa-phone"></i>
                    <span>تأكد من صحة رقم الهاتف مع كود الدولة</span>
                </div>
                <div class="professional-tip-item">
                    <i class="fas fa-image"></i>
                    <span>استخدم صورة واضحة للمشكو منه</span>
                </div>
                <div class="professional-tip-item">
                    <i class="fas fa-shield-check"></i>
                    <span>تأكد من أن الحالة تم تأكيدها رسمياً</span>
                </div>
                <div class="professional-tip-item">
                    <i class="fas fa-redo"></i>
                    <span>جرب البحث بطرق مختلفة</span>
                </div>
            </div>
        </div>
    `;
    
    resultsGrid.appendChild(noResultsContainer);

    if (resultsCount) {
        resultsCount.innerHTML = `
            <span class="no-results-text">
                <i class="fas fa-info-circle"></i>
                ${searchQuery ? `لا توجد نتائج للبحث: ${searchQuery}` : 'لا توجد نتائج'}
            </span>
        `;
    }

    if (clearBtn) clearBtn.style.display = 'none';
    if (addNewBtn) {
        addNewBtn.style.display = 'inline-flex';
        addNewBtn.removeEventListener('click', handleAddNewReport);
        addNewBtn.addEventListener('click', handleAddNewReport);
    }
}

// Keep the original function for backward compatibility
function createEnhancedResultCard(result, index) {
    return createProfessionalResultCard(result, index);
}

// Remove old functions to avoid conflicts - using professional versions now

// Keep the original createResultCard function for backward compatibility
function createResultCard(result) {
    return createEnhancedResultCard(result, 1);
}

// View all evidence images
function viewAllEvidence(evidenceImages) {
    if (!evidenceImages || evidenceImages.length === 0) return;
    
    // Create a modal or navigate to a gallery view
    let galleryHtml = '<div class="evidence-gallery">';
    evidenceImages.forEach((img, index) => {
        const mimeType = img.mime_type || 'image/jpeg';
        const imageSrc = `data:${mimeType};base64,${img.image_base64}`;
        galleryHtml += `
            <div class="evidence-gallery-item" onclick="showImageModal('${imageSrc}', 'صورة دليل ${index + 1}')">
                <img src="${imageSrc}" alt="دليل ${index + 1}">
                <div class="evidence-number">${index + 1}</div>
            </div>
        `;
    });
    galleryHtml += '</div>';
    
    // You can implement a modal or use the existing image modal
    // For now, we'll show the first image
    if (evidenceImages[0]) {
        const mimeType = evidenceImages[0].mime_type || 'image/jpeg';
        const imageSrc = `data:${mimeType};base64,${evidenceImages[0].image_base64}`;
        showImageModal(imageSrc, `دليل 1 من ${evidenceImages.length}`);
    }
}

// Clear search results with enhanced structure
function clearSearchResults() {
    const resultsGrid = document.getElementById('resultsGrid');
    const resultsCount = document.getElementById('resultsCount');
    const clearBtn = document.getElementById('clearResultsBtn');
    const addNewBtn = document.getElementById('addNewReportBtn');
    const searchSummary = document.getElementById('searchSummary');

    if (resultsGrid) {
        // Create initial state with better structure
        const initialState = createInitialSearchState();
        resultsGrid.innerHTML = '';
        resultsGrid.appendChild(initialState);
    }

    if (resultsCount) {
        resultsCount.innerHTML = `
            <span class="initial-search-prompt">
                <i class="fas fa-search"></i>
                أدخل معايير البحث للعثور على المشكو منهم
            </span>
        `;
    }

    if (searchSummary) {
        searchSummary.style.display = 'none';
    }

    if (clearBtn) clearBtn.style.display = 'none';
    if (addNewBtn) {
        addNewBtn.style.display = 'inline-flex';
        addNewBtn.removeEventListener('click', handleAddNewReport);
        addNewBtn.addEventListener('click', handleAddNewReport);
    }
}

// Create initial search state with professional design
function createInitialSearchState() {
    const container = document.createElement('div');
    container.className = 'professional-no-results';
    
    container.innerHTML = `
        <div class="professional-no-results-icon">
            <i class="fas fa-search"></i>
        </div>
        <h3 class="professional-no-results-title">ابدأ بالبحث في الحالات المؤكدة</h3>
        <p class="professional-no-results-message">
            استخدم البحث الأساسي أو البحث المتقدم للعثور على المشكو منهم المؤكدين رسمياً
        </p>
        
        <div class="professional-search-tips">
            <h5><i class="fas fa-lightbulb"></i> نصائح للبحث الفعال:</h5>
            <div class="professional-tips-grid">
                <div class="professional-tip-item">
                    <i class="fas fa-phone"></i>
                    <span>استخدم رقم الهاتف مع كود الدولة</span>
                </div>
                <div class="professional-tip-item">
                    <i class="fas fa-image"></i>
                    <span>اختر صور واضحة للمشكو منه</span>
                </div>
                <div class="professional-tip-item">
                    <i class="fas fa-search-plus"></i>
                    <span>استخدم البحث المتقدم للحصول على دقة أكبر</span>
                </div>
                <div class="professional-tip-item">
                    <i class="fas fa-shield-check"></i>
                    <span>تأكد من أن الحالة مؤكدة رسمياً</span>
                </div>
            </div>
        </div>
        
        <div class="professional-search-tips" style="margin-top: 1.5rem;">
            <h5><i class="fas fa-compass"></i> طرق البحث المتاحة:</h5>
            <div class="professional-tips-grid">
                <div class="professional-tip-item">
                    <i class="fas fa-phone"></i>
                    <span><strong>البحث الأساسي:</strong> بحث برقم الهاتف</span>
                </div>
                <div class="professional-tip-item">
                    <i class="fas fa-image"></i>
                    <span><strong>البحث المتقدم:</strong> بحث بالصورة</span>
                </div>
            </div>
        </div>
    `;
    
    return container;
}

// ========================================
// DELETE REQUEST
// ========================================

// Initialize delete request
function initializeDeleteRequest() {
    // Verification step
    const verifyBtn = document.getElementById('verifyIdentityBtn');
    if (verifyBtn) {
        verifyBtn.addEventListener('click', handleIdentityVerification);
    }

    // Delete request step
    const submitDeleteBtn = document.getElementById('submitDeleteRequest');
    if (submitDeleteBtn) {
        submitDeleteBtn.addEventListener('click', handleDeleteRequestSubmission);
    }

    // Navigation
    const backToVerification = document.getElementById('backToVerification');
    if (backToVerification) {
        backToVerification.addEventListener('click', () => {
            switchDeleteStep('verification');
        });
    }

    // Preferred contact change
    const contactSelect = document.getElementById('preferredContact');
    if (contactSelect) {
        contactSelect.addEventListener('change', handlePreferredContactChange);
    }
}

// Handle identity verification
async function handleIdentityVerification() {
    console.log('Verification function called');

    const applicantWhatsApp = document.getElementById('verifyApplicantWhatsApp').value.trim();
    const verifyBtn = document.getElementById('verifyIdentityBtn');
    const whatsappField = document.getElementById('verifyApplicantWhatsApp');

    console.log('Applicant WhatsApp:', applicantWhatsApp);

    // التحقق من رقم الواتساب فقط
    if (!applicantWhatsApp) {
        console.log('Empty WhatsApp field detected');
        showNotification('يرجى إدخال رقم واتساب مقدم الطلب', 'error');
        return;
    }

    // التحقق من صحة رقم الواتساب مع كود الدولة
    if (!validatePhoneFieldForDelete(whatsappField)) {
        console.log('Invalid WhatsApp number detected');
        return; // سيتم عرض رسالة الخطأ من خلال validatePhoneFieldForDelete
    }

    try {
        // Show loading state on button
        const originalBtnContent = verifyBtn.innerHTML;
        verifyBtn.disabled = true;
        verifyBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري التحقق...';

        console.log('Calling checkApplicantExists...');
        // البحث برقم الواتساب فقط
        const result = await checkApplicantExists(applicantWhatsApp);
        console.log('Check result:', result);

        // Reset button
        verifyBtn.disabled = false;
        verifyBtn.innerHTML = originalBtnContent;

        if (result.exists) {
            console.log('Applicant found, switching to delete request step');
            // Store verified applicant data
            window.verifiedApplicant = result.details;
            const statusText = result.is_confirmed ? 'تقرير مؤكد' : 'تقرير قيد المراجعة';
            switchDeleteStep('deleteRequest');
            showNotification(`تم التحقق من هوية مقدم الطلب بنجاح (${statusText})`, 'success');
            // Clear verification fields after successful verification
            clearVerificationFields();
        } else {
            console.log('Applicant not found');
            const errorMsg = result.error ?
                `حدث خطأ أثناء التحقق: ${result.error}` :
                'رقم الواتساب هذا غير مسجل لدينا. يرجى التأكد من كتابة الرقم الصحيح مع كود الدولة';
            showNotification(errorMsg, result.error ? 'error' : 'error');
            // Clear verification fields after error
            clearVerificationFields();
        }
    } catch (error) {
        // Reset button on error
        verifyBtn.disabled = false;
        verifyBtn.innerHTML = '<i class="fas fa-user-check"></i> التحقق من الهوية';

        console.error('Verification error:', error);
        showNotification('حدث خطأ أثناء التحقق', 'error');
        // Clear verification fields after error
        clearVerificationFields();
    }
}

// Clear verification fields
function clearVerificationFields() {
    const fields = [
        'verifyApplicantName',
        'verifyApplicantWhatsApp'
    ];
    
    fields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.value = '';
            field.classList.remove('error');
        }
    });
}

// Switch delete step
function switchDeleteStep(step) {
    currentDeleteStep = step;

    const verificationStep = document.getElementById('verificationStep');
    const deleteRequestStep = document.getElementById('deleteRequestStep');

    if (step === 'verification') {
        if (verificationStep) verificationStep.classList.add('active');
        if (deleteRequestStep) deleteRequestStep.classList.remove('active');
    } else if (step === 'deleteRequest') {
        if (verificationStep) verificationStep.classList.remove('active');
        if (deleteRequestStep) deleteRequestStep.classList.add('active');
        
        // Auto-fill applicant information from verified data
        if (window.verifiedApplicant) {
            const applicantNameField = document.getElementById('applicantName');
            const applicantContactField = document.getElementById('applicantContact');
            
            // Fill applicant information
            if (applicantNameField) {
                applicantNameField.value = window.verifiedApplicant.reporter_name || '';
            }
            if (applicantContactField) {
                applicantContactField.value = window.verifiedApplicant.reporter_contact || '';
            }
            
            // Note: scammer WhatsApp field is left empty for user to fill manually
            // as user might have reported multiple different scammers
        }
    }
}

// Handle delete request submission
async function handleDeleteRequestSubmission() {
    const formData = {
        applicantName: document.getElementById('applicantName').value.trim(),
        applicantContact: document.getElementById('applicantContact').value.trim(),
        requestReason: document.getElementById('deleteReason').value.trim(),
        scammerWhatsApp: document.getElementById('scammerWhatsApp').value.trim()
    };

    // Validate required fields
    if (!formData.applicantContact || !formData.requestReason || !formData.scammerWhatsApp) {
        showNotification('يرجى ملء جميع الحقول المطلوبة', 'error');
        return;
    }

    // Validate applicant WhatsApp number
    const applicantContactField = document.getElementById('applicantContact');
    if (!validatePhoneFieldForDelete(applicantContactField)) {
        return; // سيتم عرض رسالة الخطأ من خلال validatePhoneFieldForDelete
    }

    // Validate scammer WhatsApp number
    const scammerWhatsAppField = document.getElementById('scammerWhatsApp');
    if (!validatePhoneFieldForDelete(scammerWhatsAppField)) {
        return; // سيتم عرض رسالة الخطأ من خلال validatePhoneFieldForDelete
    }

    // Check if applicant matches verified applicant
    if (window.verifiedApplicant && formData.applicantName !== window.verifiedApplicant.reporter_name) {
        showNotification('اسم مقدم الطلب لا يتطابق مع اسم مقدم الطلب الأصلي', 'error');
        return;
    }

    try {
        // Show loading state on button
        const submitBtn = document.getElementById('submitDeleteRequest');
        const originalBtnContent = submitBtn.innerHTML;
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري التحقق...';

        // Check for duplicate request
        const isDuplicate = await checkDuplicateDeleteRequest(formData.applicantContact, formData.scammerWhatsApp);
        if (isDuplicate) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnContent;
            showNotification('تم تقديم طلب حذف لهذا المشكو منه من قبل. يرجى الانتظار حتى يتم مراجعة الطلب السابق', 'warning');
            // Clear form fields after warning
            clearDeleteFormFields();
            return;
        }

        // Check if scammer is linked to applicant in confirmed scams
        const isLinked = await checkScammerApplicantLink(formData.applicantContact, formData.scammerWhatsApp);
        if (!isLinked) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnContent;
            showNotification('رقم المشكو منه المدخل غير مرتبط برقمك في قاعدة البيانات. يرجى التحقق من صحة الرقم', 'error');
            // Clear form fields after error
            clearDeleteFormFields();
            return;
        }

        // Update button to show saving state
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الحفظ...';

        // Submit request
        const requestData = {
            applicantName: formData.applicantName,
            applicantWhatsApp: formData.applicantContact,
            deleteScammerName: window.verifiedApplicant.scammer_name,
            deleteScammerWhatsApp: formData.scammerWhatsApp,
            requestReason: formData.requestReason
        };

        await insertDeleteRequest(requestData);

        // Show success
        showNotification('تم إرسال طلب المراجعة بنجاح. سيتم التواصل معك خلال 24-48 ساعة', 'success');

        // Reset button to success state briefly
        submitBtn.innerHTML = '<i class="fas fa-check"></i> تم الإرسال';
        submitBtn.style.background = 'linear-gradient(135deg, #28a745 0%, #20c997 100%)';
        submitBtn.style.borderColor = '#28a745';

        // Clear form fields after successful submission
        clearDeleteFormFields();

        // Smooth transition to verification step instead of hiding section
        setTimeout(() => {
            // Reset button back to normal
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> إرسال طلب الحذف';
            submitBtn.style.background = '';
            submitBtn.style.borderColor = '';

            // Switch back to verification step instead of hiding
            switchDeleteStep('verification');

            // Scroll to top of the site smoothly
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }, 2000);

    } catch (error) {
        console.error('Delete request error:', error);
        
        // Show error state on button
        const submitBtn = document.getElementById('submitDeleteRequest');
        submitBtn.innerHTML = '<i class="fas fa-exclamation-triangle"></i> حدث خطأ';
        submitBtn.style.background = 'linear-gradient(135deg, #dc3545 0%, #fd7e14 100%)';
        submitBtn.style.borderColor = '#dc3545';

        showNotification('حدث خطأ أثناء إرسال الطلب', 'error');
        
        // Clear form fields after error
        clearDeleteFormFields();
        
        // Reset button after error
        setTimeout(() => {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> إرسال طلب الحذف';
            submitBtn.style.background = '';
            submitBtn.style.borderColor = '';
        }, 3000);

    } finally {
        // Reset button if not already reset in catch block
        const submitBtn = document.getElementById('submitDeleteRequest');
        if (submitBtn.innerHTML.includes('جارٍ الإرسال') || submitBtn.innerHTML.includes('جارٍ الحفظ') || submitBtn.innerHTML.includes('جارٍ التحقق')) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> إرسال طلب الحذف';
            submitBtn.style.background = '';
            submitBtn.style.borderColor = '';
        }
    }
}

// Clear delete form fields
function clearDeleteFormFields() {
    const fields = [
        'applicantName',
        'applicantContact',
        'deleteReason',
        'scammerWhatsApp'
    ];
    
    fields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.value = '';
            field.classList.remove('error');
        }
    });
    
    // Clear preferred contact fields if they exist
    const preferredContact = document.getElementById('preferredContact');
    if (preferredContact) {
        preferredContact.value = 'whatsapp';
        handlePreferredContactChange(); // Reset conditional fields
    }
}

// Reset delete form
function resetDeleteForm() {
    const form = document.querySelector('#delete form');
    if (form) {
        form.reset();
    }

    // Reset steps
    switchDeleteStep('verification');

    // Clear verified data
    window.verifiedScammer = null;

    // Hide conditional fields
    const whatsappField = document.getElementById('whatsappContactField');
    const emailField = document.getElementById('emailContactField');

    if (whatsappField) whatsappField.style.display = 'none';
    if (emailField) emailField.style.display = 'none';
}

// Handle preferred contact change
function handlePreferredContactChange() {
    const selectedValue = document.getElementById('preferredContact').value;
    const whatsappField = document.getElementById('whatsappContactField');
    const emailField = document.getElementById('emailContactField');
    const whatsappInput = document.getElementById('preferredWhatsApp');
    const emailInput = document.getElementById('preferredEmail');

    // Hide all
    if (whatsappField) whatsappField.style.display = 'none';
    if (emailField) emailField.style.display = 'none';

    // Remove required
    if (whatsappInput) whatsappInput.required = false;
    if (emailInput) emailInput.required = false;

    // Show selected
    if (selectedValue === 'whatsapp' && whatsappField) {
        whatsappField.style.display = 'block';
        if (whatsappInput) whatsappInput.required = true;
    } else if (selectedValue === 'email' && emailField) {
        emailField.style.display = 'block';
        if (emailInput) emailInput.required = true;
    }
}

// Validate phone field specifically for delete request (WhatsApp validation)
function validatePhoneFieldForDelete(field) {
    const value = field.value.trim();
    const errorElement = field.parentElement.querySelector('.field-error');

    // Remove existing error
    field.classList.remove('error');
    if (errorElement) {
        errorElement.remove();
    }

    // If empty, it's invalid for delete request
    if (value.length === 0) {
        showFieldError(field, 'يرجى إدخال رقم واتساب مقدم الطلب');
        return false;
    }

    // Check for numbers only
    if (!/^[0-9]+$/.test(value)) {
        showFieldError(field, 'رقم واتساب مقدم الطلب يجب أن يحتوي على أرقام فقط');
        return false;
    }

    // Check minimum length (at least a country code)
    if (value.length < 2) {
        showFieldError(field, 'يرجى إدخال كود الدولة على الأقل');
        return false;
    }

    // Find matching Arab country code
    let matchedCountry = null;
    let expectedLength = 0;

    // Sort country codes by length (longest first) to match correctly
    const sortedCodes = Object.keys(ARAB_COUNTRIES_PHONE_DATA).sort((a, b) => b.length - a.length);

    for (const code of sortedCodes) {
        if (value.startsWith(code)) {
            matchedCountry = ARAB_COUNTRIES_PHONE_DATA[code];
            expectedLength = matchedCountry.totalLength;
            break;
        }
    }

    // Check if it's a valid Arab country code
    if (!matchedCountry) {
        showFieldError(field, 'يجب أن يبدأ الرقم بكود دولة عربية صحيحة (مثل: 20 لمصر، 966 للسعودية)');
        return false;
    }

    // Check exact length
    if (value.length !== expectedLength) {
        showFieldError(field, `رقم واتساب مقدم الطلب لـ${matchedCountry.country} يجب أن يكون ${expectedLength} رقم بالضبط (${matchedCountry.digitsAfterCode} أرقام بعد كود الدولة)`);
        return false;
    }

    // Check required prefix after country code
    const digitsAfterCode = value.substring(matchedCountry.totalLength - matchedCountry.digitsAfterCode);
    if (!digitsAfterCode.startsWith(matchedCountry.requiredPrefix)) {
        showFieldError(field, `${matchedCountry.prefixDescription} (${matchedCountry.country})`);
        return false;
    }

    return true;
}

// ========================================
// DATABASE OPERATIONS
// ========================================

// Insert scam report
async function insertScamReport(reportData) {
    try {
        const { data, error } = await supabaseClient
            .from('scam_reports')
            .insert([{
                scammer_name: reportData.name,
                scammer_phone: reportData.phone,
                scammer_email: reportData.email || null,
                scam_type: reportData.scamType,
                details: reportData.details,
                reporter_name: reportData.reporterName,
                reporter_contact: reportData.reporterContact || null
            }])
            .select();

        if (error) throw error;
        return data[0];
    } catch (error) {
        console.error('Error inserting scam report:', error);
        throw error;
    }
}

// Insert evidence images with compression and hash
async function insertEvidenceImages(reportId, images) {
    try {
        const imagePromises = images.map(async (file) => {
            const compressedBase64 = await compressImage(file, 800, 600, 0.7);
            const imageHash = generateImageHash(compressedBase64);
            const perceptualHash = generatePerceptualHash(compressedBase64);
            
            return {
                report_id: reportId,
                image_base64: compressedBase64,
                image_hash: imageHash,
                perceptual_hash: perceptualHash,
                mime_type: 'image/jpeg' // Always JPEG after compression
            };
        });

        const imageData = await Promise.all(imagePromises);

        const { data, error } = await supabaseClient
            .from('evidence_images')
            .insert(imageData)
            .select();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error inserting evidence images:', error);
        throw error;
    }
}

// Insert scammer image with compression and hash
async function insertScammerImage(reportId, image) {
    try {
        // Compress image before converting to base64
        const compressedBase64 = await compressImage(image, 600, 400, 0.7);
        
        // Generate hash for similarity detection
        const imageHash = generateImageHash(compressedBase64);
        const perceptualHash = generatePerceptualHash(compressedBase64);

        const { data, error } = await supabaseClient
            .from('scammer_images')
            .insert([{
                report_id: reportId,
                image_base64: compressedBase64,
                image_hash: imageHash,
                perceptual_hash: perceptualHash,
                mime_type: 'image/jpeg' // Always JPEG after compression
            }])
            .select();

        if (error) throw error;
        return data[0];
    } catch (error) {
        console.error('Error inserting scammer image:', error);
        throw error;
    }
}

// Search by phone (CONFIRMED SCAMS AND SCAM REPORTS)
async function searchScamReportByPhone(phone) {
    try {
        console.log('Searching for phone:', phone);
        
        // Search in confirmed_scams table first
        const { data: confirmedData, error: confirmedError } = await supabaseClient
            .from('confirmed_scams')
            .select('*')
            .eq('scammer_phone', phone)
            .limit(1);

        if (confirmedError) {
            console.error('Error searching confirmed_scams:', confirmedError);
            throw confirmedError;
        }

        console.log('Confirmed scams result:', confirmedData);

        if (confirmedData && confirmedData.length > 0) {
            const report = confirmedData[0];
            const processedReport = processConfirmedReportImages(report);
            
            return {
                ...processedReport,
                is_confirmed: true,
                name: report.scammer_name,
                phone: report.scammer_phone,
                email: report.scammer_email,
                scamType: report.scam_type,
                details: report.details,
                reporterName: report.reporter_name,
                reporterContact: report.reporter_contact
            };
        }

        // If not found in confirmed_scams, search in scam_reports
        console.log('Not found in confirmed_scams, searching in scam_reports...');
        const { data: scamReportsData, error: scamReportsError } = await supabaseClient
            .from('scam_reports')
            .select('*')
            .eq('scammer_phone', phone)
            .limit(1);

        if (scamReportsError) {
            console.error('Error searching scam_reports:', scamReportsError);
            throw scamReportsError;
        }

        console.log('Scam reports result:', scamReportsData);

        if (scamReportsData && scamReportsData.length > 0) {
            const report = scamReportsData[0];
            
            return {
                ...report,
                is_confirmed: false,
                name: report.scammer_name,
                phone: report.scammer_phone,
                email: report.scammer_email,
                scamType: report.scam_type,
                details: report.details,
                reporterName: report.reporter_name,
                reporterContact: report.reporter_contact
            };
        }

        // Also search by reporter_contact (in case user is searching with their own number)
        console.log('Not found by scammer phone, searching by reporter contact...');
        const { data: reporterData, error: reporterError } = await supabaseClient
            .from('confirmed_scams')
            .select('*')
            .eq('reporter_contact', phone)
            .limit(1);

        if (reporterError) {
            console.error('Error searching by reporter contact:', reporterError);
        }

        if (reporterData && reporterData.length > 0) {
            const report = reporterData[0];
            const processedReport = processConfirmedReportImages(report);
            
            return {
                ...processedReport,
                is_confirmed: true,
                name: report.scammer_name,
                phone: report.scammer_phone,
                email: report.scammer_email,
                scamType: report.scam_type,
                details: report.details,
                reporterName: report.reporter_name,
                reporterContact: report.reporter_contact
            };
        }

        console.log('No results found in any table');
        return null;
    } catch (error) {
        console.error('Error searching scams by phone:', error);
        throw error;
    }
}

// Process confirmed report images
function processConfirmedReportImages(report) {
    const processedReport = { ...report };

    // معالجة صورة المشكو منه
    if (report.scammer_image_base64) {
        processedReport.scammer_image = {
            image_base64: report.scammer_image_base64,
            mime_type: report.scammer_image_mime_type || 'image/jpeg'
        };
    } else {
        processedReport.scammer_image = null;
    }

    // معالجة صور الأدلة
    if (report.evidence_images && Array.isArray(report.evidence_images)) {
        processedReport.evidence_images = report.evidence_images.map(img => ({
            image_base64: img.image_base64,
            mime_type: img.mime_type || 'image/jpeg'
        }));
    } else {
        processedReport.evidence_images = [];
    }

    return processedReport;
}

// Compress image to reduce base64 size
function compressImage(file, maxWidth = 800, maxHeight = 600, quality = 0.8) {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = () => {
            // Calculate new dimensions
            let { width, height } = img;
            
            if (width > height) {
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }
            } else {
                if (height > maxHeight) {
                    width = (width * maxHeight) / height;
                    height = maxHeight;
                }
            }
            
            // Set canvas dimensions
            canvas.width = width;
            canvas.height = height;
            
            // Draw and compress
            ctx.drawImage(img, 0, 0, width, height);
            
            // Convert to base64 with compression
            const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
            const base64 = compressedBase64.split(',')[1];
            
            resolve(base64);
        };
        
        img.src = URL.createObjectURL(file);
    });
}

// Generate image hash for more efficient searching
function generateImageHash(base64) {
    // Simple hash function - in production, use a more sophisticated hash
    let hash = 0;
    const str = base64;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(16);
}

// Generate perceptual hash for image similarity detection
function generatePerceptualHash(base64) {
    // Create a simple perceptual hash based on image characteristics
    // This helps with finding similar/cropped images
    const str = base64;
    let sum = 0;
    let product = 1;
    
    // Calculate simple hash based on image data distribution
    for (let i = 0; i < str.length; i += 10) { // Sample every 10th character
        const char = str.charCodeAt(i);
        sum += char;
        product *= (char % 255) + 1;
    }
    
    // Create hash from sum and product
    const hash = (sum ^ product) & 0xFFFFFFFF;
    return hash.toString(16).padStart(8, '0');
}

// Generate multiple hashes for different image variations to handle cropping
function generateMultipleHashes(base64) {
    const hashes = [];
    
    // Generate main hash
    hashes.push(generateImageHash(base64));
    
    // Generate perceptual hash
    hashes.push(generatePerceptualHash(base64));
    
    // Generate hashes for different sampling patterns to handle cropping
    for (let step = 5; step <= 20; step += 5) {
        let sum = 0;
        for (let i = 0; i < base64.length; i += step) {
            sum += base64.charCodeAt(i);
        }
        hashes.push((sum & 0xFFFFFFFF).toString(16).padStart(8, '0'));
    }
    
    return hashes;
}

// Search by image (CONFIRMED SCAMS ONLY) - Enhanced with compression and flexible matching
async function searchScamReportByImage(imageFile) {
    try {
        // Compress image to reduce base64 size
        const compressedBase64 = await compressImage(imageFile, 600, 400, 0.7);
        
        // Generate hash for more efficient searching
        const imageHash = generateImageHash(compressedBase64);

        // Add timeout to prevent long-running requests
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds timeout

        try {
            // First try exact match with compressed base64
            let { data: exactMatchData, error: exactMatchError } = await supabaseClient
                .from('confirmed_scams')
                .select('*')
                .eq('scammer_image_base64', compressedBase64)
                .limit(1);

            if (exactMatchError) {
                // Handle specific image search errors gracefully
                if (exactMatchError.message.includes('URI too long') || exactMatchError.message.includes('413')) {
                    console.warn('Exact base64 match failed due to URI length, continuing with hash search');
                } else {
                    console.warn('Exact base64 match failed:', exactMatchError);
                }
            }

            // If exact match found, return it
            if (exactMatchData && exactMatchData.length > 0) {
                clearTimeout(timeoutId);
                const report = exactMatchData[0];
                const processedReport = processConfirmedReportImages(report);
                
                return {
                    ...processedReport,
                    is_confirmed: true,
                    name: report.scammer_name,
                    phone: report.scammer_phone,
                    email: report.scammer_email,
                    scamType: report.scam_type,
                    details: report.details,
                    reporterName: report.reporter_name,
                    reporterContact: report.reporter_contact
                };
            }

            // If no exact match, try hash-based search for similar images
            let { data: hashMatchData, error: hashMatchError } = await supabaseClient
                .from('confirmed_scams')
                .select('*')
                .eq('scammer_image_hash', imageHash)
                .limit(1);

            // If hash search fails, try perceptual hash for even more flexible matching
            if (!hashMatchData || hashMatchData.length === 0) {
                const perceptualHash = generatePerceptualHash(compressedBase64);
                let { data: perceptualMatchData, error: perceptualMatchError } = await supabaseClient
                    .from('confirmed_scams')
                    .select('*')
                    .eq('scammer_perceptual_hash', perceptualHash)
                    .limit(1);

                if (!perceptualMatchError && perceptualMatchData && perceptualMatchData.length > 0) {
                    hashMatchData = perceptualMatchData;
                }
            }

            // If still no match, try multiple hash variations for better flexibility with cropped images
            if (!hashMatchData || hashMatchData.length === 0) {
                const multipleHashes = generateMultipleHashes(compressedBase64);
                
                // Try each hash variation
                for (const hash of multipleHashes) {
                    let { data: variationMatchData, error: variationMatchError } = await supabaseClient
                        .from('confirmed_scams')
                        .select('*')
                        .or(`scammer_image_hash.eq.${hash},scammer_perceptual_hash.eq.${hash}`)
                        .limit(1);

                    if (!variationMatchError && variationMatchData && variationMatchData.length > 0) {
                        hashMatchData = variationMatchData;
                        break;
                    }
                }
            }

            if (hashMatchError) {
                // Don't throw error for hash search failure, just continue
                console.warn('Hash search failed:', hashMatchError);
            }

            // If hash match found, return it
            if (hashMatchData && hashMatchData.length > 0) {
                clearTimeout(timeoutId);
                const report = hashMatchData[0];
                const processedReport = processConfirmedReportImages(report);
                
                return {
                    ...processedReport,
                    is_confirmed: true,
                    name: report.scammer_name,
                    phone: report.scammer_phone,
                    email: report.scammer_email,
                    scamType: report.scam_type,
                    details: report.details,
                    reporterName: report.reporter_name,
                    reporterContact: report.reporter_contact
                };
            }

            // If no matches found, return null with clear message
            clearTimeout(timeoutId);
            return null;

        } catch (fetchError) {
            clearTimeout(timeoutId);
            
            // Handle connection errors
            if (fetchError.name === 'AbortError' || fetchError.message.includes('Connection')) {
                throw new Error('انتهت مهلة البحث. يرجى المحاولة مرة أخرى مع صورة أصغر.');
            }
            throw fetchError;
        }
    } catch (error) {
        console.error('Error searching confirmed scams by image:', error);
        throw error;
    }
}

// Insert delete request
async function insertDeleteRequest(requestData) {
    try {
        const { data, error } = await supabaseClient
            .from('delete_requests')
            .insert([{
                applicant_name: requestData.applicantName,
                applicant_whatsapp: requestData.applicantWhatsApp,
                delete_scammer_name: requestData.deleteScammerName,
                delete_scammer_whatsapp: requestData.deleteScammerWhatsApp,
                request_reason: requestData.requestReason,
                preferred_contact: requestData.preferredContact,
                preferred_whatsapp: requestData.preferredWhatsApp,
                preferred_email: requestData.preferredEmail
            }])
            .select();

        if (error) throw error;
        return data[0];
    } catch (error) {
        console.error('Error inserting delete request:', error);
        throw error;
    }
}

// Check if delete request already exists
async function checkDuplicateDeleteRequest(applicantWhatsApp, scammerWhatsApp) {
    try {
        const { data, error } = await supabaseClient
            .from('delete_requests')
            .select('*')
            .eq('applicant_whatsapp', applicantWhatsApp)
            .eq('delete_scammer_whatsapp', scammerWhatsApp)
            .limit(1);

        if (error) throw error;
        return data && data.length > 0;
    } catch (error) {
        console.error('Error checking duplicate delete request:', error);
        return false;
    }
}

// Check if scammer is linked to applicant in confirmed scams
async function checkScammerApplicantLink(applicantWhatsApp, scammerWhatsApp) {
    try {
        // التحقق من صحة أرقام الواتساب قبل البحث
        if (!applicantWhatsApp || !scammerWhatsApp) {
            return false;
        }

        const { data, error } = await supabaseClient
            .from('confirmed_scams')
            .select('*')
            .eq('reporter_contact', applicantWhatsApp)
            .eq('scammer_phone', scammerWhatsApp)
            .limit(1);

        if (error) throw error;
        return data && data.length > 0;
    } catch (error) {
        console.error('Error checking scammer-applicant link:', error);
        return false;
    }
}

// Add confirmed scam report with image compression and hash
async function addConfirmedScamReport(reportData, scammerImageFile = null, evidenceImageFiles = []) {
    try {
        let scammerImageBase64 = null;
        let scammerImageMimeType = 'image/jpeg';
        let scammerImageHash = null;
        let scammerPerceptualHash = null;
        let evidenceImages = [];

        // معالجة صورة المشكو منه مع الضغط والهاش
        if (scammerImageFile) {
            scammerImageBase64 = await compressImage(scammerImageFile, 600, 400, 0.7);
            scammerImageMimeType = 'image/jpeg';
            scammerImageHash = generateImageHash(scammerImageBase64);
            scammerPerceptualHash = generatePerceptualHash(scammerImageBase64);
        }

        // معالجة صور الأدلة مع الضغط والهاش
        if (evidenceImageFiles && evidenceImageFiles.length > 0) {
            evidenceImages = await Promise.all(
                evidenceImageFiles.map(async (file) => {
                    const compressedBase64 = await compressImage(file, 800, 600, 0.7);
                    const imageHash = generateImageHash(compressedBase64);
                    const perceptualHash = generatePerceptualHash(compressedBase64);
                    
                    return {
                        image_base64: compressedBase64,
                        image_hash: imageHash,
                        perceptual_hash: perceptualHash,
                        mime_type: 'image/jpeg'
                    };
                })
            );
        }

        // إضافة البيانات إلى الجدول
        const { data, error } = await supabaseClient
            .from('confirmed_scams')
            .insert([{
                scammer_name: reportData.name,
                scammer_phone: reportData.phone,
                scammer_email: reportData.email || null,
                scam_type: reportData.scamType,
                details: reportData.details,
                reporter_name: reportData.reporterName,
                reporter_contact: reportData.reporterContact || null,
                scammer_image_base64: scammerImageBase64,
                scammer_image_mime_type: scammerImageMimeType,
                scammer_image_hash: scammerImageHash,
                scammer_perceptual_hash: scammerPerceptualHash,
                evidence_images: evidenceImages.length > 0 ? evidenceImages : null,
                confirmed_by: reportData.confirmedBy || 'لجنة التحقق',
                confirmation_notes: reportData.confirmationNotes || 'تم التأكيد من قبل الإدارة'
            }])
            .select();

        if (error) throw error;
        return data[0];
    } catch (error) {
        console.error('Error adding confirmed scam report:', error);
        throw error;
    }
}

// Check applicant exists (CONFIRMED SCAMS AND SCAM REPORTS)
async function checkApplicantExists(whatsapp) {
    try {
        console.log('Checking applicant exists for WhatsApp:', whatsapp);

        // First search in confirmed_scams - check both reporter_contact and scammer_phone
        const { data: confirmedData, error: confirmedError } = await supabaseClient
            .from('confirmed_scams')
            .select('*')
            .or(`reporter_contact.eq.${whatsapp},scammer_phone.eq.${whatsapp}`)
            .limit(1);

        if (confirmedError) {
            console.error('Error checking confirmed_scams:', confirmedError);
            throw confirmedError;
        }

        if (confirmedData && confirmedData.length > 0) {
            const report = confirmedData[0];
            console.log('Found in confirmed_scams:', report);
            return {
                exists: true,
                is_confirmed: true,
                details: {
                    ...report,
                    name: report.scammer_name,
                    phone: report.scammer_phone,
                    email: report.scammer_email,
                    scamType: report.scam_type,
                    details: report.details,
                    reporterName: report.reporter_name,
                    reporterContact: report.reporter_contact
                }
            };
        }

        // Also search in scam_reports - check both reporter_contact and scammer_phone
        console.log('Not found in confirmed_scams, searching in scam_reports...');
        const { data: scamReportsData, error: scamReportsError } = await supabaseClient
            .from('scam_reports')
            .select('*')
            .or(`reporter_contact.eq.${whatsapp},scammer_phone.eq.${whatsapp}`)
            .limit(1);

        if (scamReportsError) {
            console.error('Error checking scam_reports:', scamReportsError);
            throw scamReportsError;
        }

        if (scamReportsData && scamReportsData.length > 0) {
            const report = scamReportsData[0];
            console.log('Found in scam_reports:', report);
            return {
                exists: true,
                is_confirmed: false,
                details: {
                    ...report,
                    name: report.scammer_name,
                    phone: report.scammer_phone,
                    email: report.scammer_email,
                    scamType: report.scam_type,
                    details: report.details,
                    reporterName: report.reporter_name,
                    reporterContact: report.reporter_contact
                }
            };
        }

        console.log('Applicant not found in any table');
        return { exists: false, is_confirmed: false };
    } catch (error) {
        console.error('Error checking applicant exists:', error);
        return { exists: false, is_confirmed: false, error: error.message };
    }
}

// Check scammer exists (CONFIRMED SCAMS ONLY)
async function checkScammerExists(name, phone) {
    try {
        let query = supabaseClient
            .from('confirmed_scams')
            .select('*')
            .limit(1);

        if (phone) {
            query = query.eq('scammer_phone', phone);
        } else {
            query = query.ilike('scammer_name', `%${name}%`);
        }

        const { data, error } = await query;

        if (error) throw error;

        if (data && data.length > 0) {
            const report = data[0];
            return {
                exists: true,
                details: {
                    ...report,
                    // Ensure compatibility with original field names
                    name: report.scammer_name,
                    phone: report.scammer_phone,
                    email: report.scammer_email,
                    scamType: report.scam_type,
                    details: report.details,
                    reporterName: report.reporter_name,
                    reporterContact: report.reporter_contact
                }
            };
        }

        return { exists: false };
    } catch (error) {
        console.error('Error checking confirmed scammer:', error);
        return { exists: false };
    }
}

// Submit complete report
async function submitCompleteScamReport(reportData, scammerImage, evidenceImages) {
    try {
        const report = await insertScamReport(reportData);

        if (scammerImage) {
            await insertScammerImage(report.id, scammerImage);
        }

        if (evidenceImages && evidenceImages.length > 0) {
            await insertEvidenceImages(report.id, evidenceImages);
        }

        return report;
    } catch (error) {
        console.error('Error submitting complete report:', error);
        throw error;
    }
}

// Update stats (CONFIRMED SCAMS ONLY)
async function updateStats() {
    try {
        // Get total confirmed reports count
        const { count: totalReports } = await supabaseClient
            .from('confirmed_scams')
            .select('*', { count: 'exact', head: true });

        // Update UI
        const totalReportsElement = document.getElementById('totalReports');
        if (totalReportsElement) {
            totalReportsElement.textContent = totalReports || 0;
        }

        // For now, set protected users to same as total confirmed reports
        const protectedUsersElement = document.getElementById('protectedUsers');
        if (protectedUsersElement) {
            protectedUsersElement.textContent = totalReports || 0;
        }
    } catch (error) {
        console.error('Error updating confirmed stats:', error);
    }
}

// Handle image search selection
function handleImageSearchSelection(file) {
    if (!file.type.startsWith('image/')) {
        showNotification('يرجى اختيار ملف صورة صحيح', 'error');
        return;
    }

    // Check file size before processing
    if (file.size > 5 * 1024 * 1024) {
        showNotification('حجم الصورة يجب ألا يزيد عن 5 ميجابايت للبحث المتقدم', 'warning');
        return;
    }

    // Additional check for very large base64 strings
    if (file.size > 2 * 1024 * 1024) { // 2MB warning
        showNotification('تحذير: سيتم ضغط الصورة تلقائياً لتسريع عملية البحث', 'warning');
    }

    selectedImageFile = file;
    displayAdvancedImageSearchPreview(file);

    const searchBtn = document.getElementById('advancedSearchBtn');
    const clearBtn = document.getElementById('clearImageBtn');
    if (searchBtn) {
        searchBtn.disabled = false;
    }
    if (clearBtn) {
        clearBtn.style.display = 'inline-flex';
    }
    
    // تحديث حالة زر مسح الصورة
    updateClearImageButtonState();
    
    showNotification('تم تحديد الصورة بنجاح. يمكنك الآن البحث', 'success');
}

// Display advanced image search preview
function displayAdvancedImageSearchPreview(file) {
    const reader = new FileReader();
    const preview = document.getElementById('imageSearchPreview');
    const clearBtn = document.getElementById('clearImageBtn');

    reader.onload = (e) => {
        preview.innerHTML = `
            <img src="${e.target.result}" alt="صورة البحث" onclick="showImageModal('${e.target.result}', 'صورة البحث')">
        `;
        preview.classList.add('has-image');

        // Add click handler for modal after image is loaded
        const img = preview.querySelector('img');
        if (img) {
            img.addEventListener('click', (event) => {
                event.stopPropagation();
                showImageModal(e.target.result, 'صورة البحث');
            });
        }
    };

    reader.readAsDataURL(file);
}

// Remove advanced search image
function removeAdvancedSearchImage() {
    selectedImageFile = null;

    const preview = document.getElementById('imageSearchPreview');
    const searchBtn = document.getElementById('advancedSearchBtn');
    const clearBtn = document.getElementById('clearImageBtn');

    if (preview) {
        preview.innerHTML = `
            <div class="preview-placeholder">
                <i class="fas fa-cloud-upload-alt"></i>
                <span>انقر لإضافة صورة</span>
            </div>
        `;
        preview.classList.remove('has-image');
    }

    if (searchBtn) {
        searchBtn.disabled = true;
    }

    if (clearBtn) {
        clearBtn.style.display = 'none';
    }

    // تحديث حالة زر مسح الصورة
    updateClearImageButtonState();

    showNotification('تم حذف الصورة', 'info');
}

// ========================================
// ADMIN FUNCTIONALITY
// ========================================

// Initialize admin panel
function initializeAdmin() {
    // Show admin link for demo (in real app, this would be based on authentication)
    const adminLinks = document.querySelectorAll('.admin-link');
    adminLinks.forEach(link => {
        link.style.display = 'block';
    });

    // Initialize admin tabs
    initializeAdminTabs();

    // Initialize admin functions
    initializePendingReports();
    initializeDeleteRequests();
    initializeConfirmedCases();
    initializeStatistics();
}

// Initialize admin tabs
function initializeAdminTabs() {
    const tabButtons = document.querySelectorAll('.admin-tab-btn');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-tab');
            switchAdminTab(targetTab);
        });
    });
}

// Switch admin tab
function switchAdminTab(targetTab) {
    // Update tab buttons
    const tabButtons = document.querySelectorAll('.admin-tab-btn');
    tabButtons.forEach(button => {
        if (button.getAttribute('data-tab') === targetTab) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });

    // Update tab content
    const tabContents = document.querySelectorAll('.admin-tab-content');
    tabContents.forEach(content => {
        if (content.id === targetTab) {
            content.classList.add('active');
        } else {
            content.classList.remove('active');
        }
    });
}

// Initialize pending reports management
function initializePendingReports() {
    const refreshBtn = document.getElementById('refreshPendingBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadPendingReports);
    }

    const searchInput = document.getElementById('pendingSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(loadPendingReports, 300));
    }

    const sortSelect = document.getElementById('pendingSortSelect');
    if (sortSelect) {
        sortSelect.addEventListener('change', loadPendingReports);
    }

    // Load initial data
    loadPendingReports();
}

// Load pending reports
async function loadPendingReports() {
    try {
        const { data, error } = await supabaseClient
            .from('scam_reports')
            .select('*')
            .eq('status', 'pending')
            .order('created_at', { ascending: false });

        if (error) throw error;

        displayPendingReports(data || []);
    } catch (error) {
        console.error('Error loading pending reports:', error);
        showNotification('حدث خطأ أثناء تحميل التقارير المعلقة', 'error');
    }
}

// Display pending reports
function displayPendingReports(reports) {
    const container = document.getElementById('pendingReportsList');
    if (!container) return;

    if (reports.length === 0) {
        container.innerHTML = `
            <div class="admin-empty-state">
                <i class="fas fa-inbox"></i>
                <h4>لا توجد تقارير معلقة</h4>
                <p>جميع التقارير تمت مراجعتها</p>
            </div>
        `;
        return;
    }

    container.innerHTML = '';
    
    reports.forEach(report => {
        const reportCard = createPendingReportCard(report);
        container.appendChild(reportCard);
    });
}

// Create pending report card
function createPendingReportCard(report) {
    const card = document.createElement('div');
    card.className = 'admin-item-card pending-report-card';
    
    const reportDate = new Date(report.created_at).toLocaleDateString('ar-EG');
    
    card.innerHTML = `
        <div class="admin-item-header">
            <div class="admin-item-info">
                <h4>${report.scammer_name || 'غير محدد'}</h4>
                <p class="admin-item-subtitle">رقم الهاتف: ${report.scammer_phone || 'غير محدد'}</p>
            </div>
            <div class="admin-item-meta">
                <span class="admin-item-date">${reportDate}</span>
                <span class="admin-item-type">${report.scam_type || 'غير محدد'}</span>
            </div>
        </div>
        
        <div class="admin-item-content">
            <div class="admin-item-details">
                <p><strong>المبلغ:</strong> ${report.reporter_name || 'غير محدد'}</p>
                <p><strong>تفاصيل:</strong> ${report.details || 'لا توجد تفاصيل'}</p>
            </div>
        </div>
        
        <div class="admin-item-actions">
            <button class="btn btn-success btn-sm" onclick="confirmReport(${report.id})">
                <i class="fas fa-check"></i> تأكيد
            </button>
            <button class="btn btn-danger btn-sm" onclick="rejectReport(${report.id})">
                <i class="fas fa-times"></i> رفض
            </button>
            <button class="btn btn-outline btn-sm" onclick="viewReportDetails(${report.id})">
                <i class="fas fa-eye"></i> تفاصيل
            </button>
        </div>
    `;
    
    return card;
}

// Confirm report with image compression
async function confirmReport(reportId) {
    if (!confirm('هل أنت متأكد من تأكيد هذا التقرير؟')) {
        return;
    }

    try {
        // Get report data
        const { data: report, error: reportError } = await supabaseClient
            .from('scam_reports')
            .select('*')
            .eq('id', reportId)
            .single();

        if (reportError) throw reportError;

        // Get scammer image and compress it
        const { data: scammerImage } = await supabaseClient
            .from('scammer_images')
            .select('*')
            .eq('report_id', reportId)
            .single();

        let compressedScammerImageBase64 = null;
        let compressedScammerImageMimeType = 'image/jpeg';
        
        if (scammerImage && scammerImage.image_base64) {
            // If we have an original file, compress it; otherwise use existing base64
            try {
                // Convert base64 back to blob for recompression
                const byteCharacters = atob(scammerImage.image_base64);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray], { type: scammerImage.mime_type || 'image/jpeg' });
                const file = new File([blob], 'image.jpg', { type: 'image/jpeg' });
                
                compressedScammerImageBase64 = await compressImage(file, 600, 400, 0.7);
            } catch (e) {
                // If conversion fails, use original base64
                compressedScammerImageBase64 = scammerImage.image_base64;
            }
        }

        // Get evidence images and compress them
        const { data: evidenceImages } = await supabaseClient
            .from('evidence_images')
            .select('*')
            .eq('report_id', reportId);

        let compressedEvidenceImages = [];
        if (evidenceImages && evidenceImages.length > 0) {
            compressedEvidenceImages = await Promise.all(
                evidenceImages.map(async (img) => {
                    try {
                        // Convert base64 back to blob for recompression
                        const byteCharacters = atob(img.image_base64);
                        const byteNumbers = new Array(byteCharacters.length);
                        for (let i = 0; i < byteCharacters.length; i++) {
                            byteNumbers[i] = byteCharacters.charCodeAt(i);
                        }
                        const byteArray = new Uint8Array(byteNumbers);
                        const blob = new Blob([byteArray], { type: img.mime_type || 'image/jpeg' });
                        const file = new File([blob], 'image.jpg', { type: 'image/jpeg' });
                        
                        const compressedBase64 = await compressImage(file, 800, 600, 0.7);
                        return {
                            image_base64: compressedBase64,
                            mime_type: 'image/jpeg',
                            description: img.image_description,
                            order: img.evidence_order
                        };
                    } catch (e) {
                        // If conversion fails, use original
                        return {
                            image_base64: img.image_base64,
                            mime_type: img.mime_type || 'image/jpeg',
                            description: img.image_description,
                            order: img.evidence_order
                        };
                    }
                })
            );
        }

        // Create confirmed scam entry
        const confirmedData = {
            original_report_id: reportId,
            scammer_name: report.scammer_name,
            scammer_phone: report.scammer_phone,
            scammer_email: report.scammer_email,
            scam_type: report.scam_type,
            details: report.details,
            reporter_name: report.reporter_name,
            reporter_contact: report.reporter_contact,
            scammer_image_base64: compressedScammerImageBase64,
            scammer_image_mime_type: compressedScammerImageMimeType,
            evidence_images: compressedEvidenceImages,
            confirmed_by: 'Admin',
            confirmation_notes: 'تم التأكيد من قبل الإدارة'
        };

        const { error: confirmError } = await supabaseClient
            .from('confirmed_scams')
            .insert([confirmedData]);

        if (confirmError) throw confirmError;

        // Update report status
        const { error: updateError } = await supabaseClient
            .from('scam_reports')
            .update({ status: 'confirmed' })
            .eq('id', reportId);

        if (updateError) throw updateError;

        showNotification('تم تأكيد التقرير بنجاح', 'success');
        loadPendingReports(); // Refresh list
        updateAdminStats(); // Update stats

    } catch (error) {
        console.error('Error confirming report:', error);
        showNotification('حدث خطأ أثناء تأكيد التقرير', 'error');
    }
}

// Reject report
async function rejectReport(reportId) {
    if (!confirm('هل أنت متأكد من رفض هذا التقرير؟')) {
        return;
    }

    try {
        const { error } = await supabaseClient
            .from('scam_reports')
            .update({ status: 'rejected' })
            .eq('id', reportId);

        if (error) throw error;

        showNotification('تم رفض التقرير', 'success');
        loadPendingReports(); // Refresh list
        updateAdminStats(); // Update stats

    } catch (error) {
        console.error('Error rejecting report:', error);
        showNotification('حدث خطأ أثناء رفض التقرير', 'error');
    }
}

// View report details
function viewReportDetails(reportId) {
    // Implement detailed view modal
    showNotification('سيتم عرض تفاصيل التقرير قريباً', 'info');
}

// Initialize delete requests management
function initializeDeleteRequests() {
    const refreshBtn = document.getElementById('refreshDeleteBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadDeleteRequests);
    }

    const searchInput = document.getElementById('deleteSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(loadDeleteRequests, 300));
    }

    const statusSelect = document.getElementById('deleteStatusSelect');
    if (statusSelect) {
        statusSelect.addEventListener('change', loadDeleteRequests);
    }

    // Load initial data
    loadDeleteRequests();
}

// Load delete requests
async function loadDeleteRequests() {
    try {
        const { data, error } = await supabaseClient
            .from('delete_requests')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        displayDeleteRequests(data || []);
    } catch (error) {
        console.error('Error loading delete requests:', error);
        showNotification('حدث خطأ أثناء تحميل طلبات الحذف', 'error');
    }
}

// Display delete requests
function displayDeleteRequests(requests) {
    const container = document.getElementById('deleteRequestsList');
    if (!container) return;

    if (requests.length === 0) {
        container.innerHTML = `
            <div class="admin-empty-state">
                <i class="fas fa-inbox"></i>
                <h4>لا توجد طلبات حذف</h4>
                <p>جميع طلبات الحذف تمت مراجعتها</p>
            </div>
        `;
        return;
    }

    container.innerHTML = '';
    
    requests.forEach(request => {
        const requestCard = createDeleteRequestCard(request);
        container.appendChild(requestCard);
    });
}

// Create delete request card
function createDeleteRequestCard(request) {
    const card = document.createElement('div');
    card.className = 'admin-item-card delete-request-card';
    
    const requestDate = new Date(request.created_at).toLocaleDateString('ar-EG');
    const statusClass = `status-${request.status}`;
    
    card.innerHTML = `
        <div class="admin-item-header">
            <div class="admin-item-info">
                <h4>${request.applicant_name || 'غير محدد'}</h4>
                <p class="admin-item-subtitle">طلب حذف: ${request.delete_scammer_name || 'غير محدد'}</p>
            </div>
            <div class="admin-item-meta">
                <span class="admin-item-date">${requestDate}</span>
                <span class="admin-item-status ${statusClass}">${getStatusText(request.status)}</span>
            </div>
        </div>
        
        <div class="admin-item-content">
            <div class="admin-item-details">
                <p><strong>رقم التواصل:</strong> ${request.applicant_whatsapp || 'غير محدد'}</p>
                <p><strong>سبب الطلب:</strong> ${request.request_reason || 'لا توجد تفاصيل'}</p>
                <p><strong>طريقة التواصل المفضلة:</strong> ${getContactMethodText(request.preferred_contact)}</p>
            </div>
        </div>
        
        <div class="admin-item-actions">
            ${request.status === 'pending' ? `
                <button class="btn btn-success btn-sm" onclick="approveDeleteRequest(${request.id})">
                    <i class="fas fa-check"></i> موافقة
                </button>
                <button class="btn btn-danger btn-sm" onclick="rejectDeleteRequest(${request.id})">
                    <i class="fas fa-times"></i> رفض
                </button>
            ` : ''}
            <button class="btn btn-outline btn-sm" onclick="viewDeleteRequestDetails(${request.id})">
                <i class="fas fa-eye"></i> تفاصيل
            </button>
        </div>
    `;
    
    return card;
}

// Get status text
function getStatusText(status) {
    const statusMap = {
        'pending': 'معلق',
        'approved': 'موافق عليه',
        'rejected': 'مرفوض',
        'processed': 'تم المعالجة'
    };
    return statusMap[status] || status;
}

// Get contact method text
function getContactMethodText(method) {
    const methodMap = {
        'whatsapp': 'واتساب',
        'email': 'بريد إلكتروني',
        'phone': 'مكالمة هاتفية'
    };
    return methodMap[method] || 'غير محدد';
}

// Approve delete request
async function approveDeleteRequest(requestId) {
    if (!confirm('هل أنت متأكد من الموافقة على طلب الحذف هذا؟')) {
        return;
    }

    try {
        const { error } = await supabaseClient
            .from('delete_requests')
            .update({ 
                status: 'approved',
                processed_at: new Date().toISOString(),
                processed_by: 'Admin'
            })
            .eq('id', requestId);

        if (error) throw error;

        showNotification('تم الموافقة على طلب الحذف', 'success');
        loadDeleteRequests(); // Refresh list
        updateAdminStats(); // Update stats

    } catch (error) {
        console.error('Error approving delete request:', error);
        showNotification('حدث خطأ أثناء الموافقة على الطلب', 'error');
    }
}

// Reject delete request
async function rejectDeleteRequest(requestId) {
    if (!confirm('هل أنت متأكد من رفض طلب الحذف هذا؟')) {
        return;
    }

    try {
        const { error } = await supabaseClient
            .from('delete_requests')
            .update({ 
                status: 'rejected',
                processed_at: new Date().toISOString(),
                processed_by: 'Admin'
            })
            .eq('id', requestId);

        if (error) throw error;

        showNotification('تم رفض طلب الحذف', 'success');
        loadDeleteRequests(); // Refresh list
        updateAdminStats(); // Update stats

    } catch (error) {
        console.error('Error rejecting delete request:', error);
        showNotification('حدث خطأ أثناء رفض الطلب', 'error');
    }
}

// View delete request details
function viewDeleteRequestDetails(requestId) {
    // Implement detailed view modal
    showNotification('سيتم عرض تفاصيل طلب الحذف قريباً', 'info');
}

// Initialize confirmed cases management
function initializeConfirmedCases() {
    const refreshBtn = document.getElementById('refreshConfirmedBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadConfirmedCases);
    }

    const searchInput = document.getElementById('confirmedSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(loadConfirmedCases, 300));
    }

    const sortSelect = document.getElementById('confirmedSortSelect');
    if (sortSelect) {
        sortSelect.addEventListener('change', loadConfirmedCases);
    }

    // Load initial data
    loadConfirmedCases();
}

// Load confirmed cases
async function loadConfirmedCases() {
    try {
        const { data, error } = await supabaseClient
            .from('confirmed_scams')
            .select('*')
            .order('confirmation_date', { ascending: false });

        if (error) throw error;

        displayConfirmedCases(data || []);
    } catch (error) {
        console.error('Error loading confirmed cases:', error);
        showNotification('حدث خطأ أثناء تحميل الحالات المؤكدة', 'error');
    }
}

// Display confirmed cases
function displayConfirmedCases(cases) {
    const container = document.getElementById('confirmedCasesList');
    if (!container) return;

    if (cases.length === 0) {
        container.innerHTML = `
            <div class="admin-empty-state">
                <i class="fas fa-shield-alt"></i>
                <h4>لا توجد حالات مؤكدة</h4>
                <p>قم بتأكيد بعض التقارير أولاً</p>
            </div>
        `;
        return;
    }

    container.innerHTML = '';
    
    cases.forEach(caseItem => {
        const caseCard = createConfirmedCaseCard(caseItem);
        container.appendChild(caseCard);
    });
}

// Create confirmed case card
function createConfirmedCaseCard(caseItem) {
    const card = document.createElement('div');
    card.className = 'admin-item-card confirmed-case-card';
    
    const confirmationDate = new Date(caseItem.confirmation_date).toLocaleDateString('ar-EG');
    
    card.innerHTML = `
        <div class="admin-item-header">
            <div class="admin-item-info">
                <h4>${caseItem.scammer_name || 'غير محدد'}</h4>
                <p class="admin-item-subtitle">رقم الهاتف: ${caseItem.scammer_phone || 'غير محدد'}</p>
            </div>
            <div class="admin-item-meta">
                <span class="admin-item-date">تأكيد: ${confirmationDate}</span>
                <span class="admin-item-type">${caseItem.scam_type || 'غير محدد'}</span>
            </div>
        </div>
        
        <div class="admin-item-content">
            <div class="admin-item-details">
                <p><strong>المبلغ:</strong> ${caseItem.reporter_name || 'غير محدد'}</p>
                <p><strong>تم التأكيد بواسطة:</strong> د/حسن عادل</p>
                <p><strong>تفاصيل:</strong> ${caseItem.details || 'لا توجد تفاصيل'}</p>
            </div>
        </div>
        
        <div class="admin-item-actions">
            <button class="btn btn-outline btn-sm" onclick="viewConfirmedCaseDetails(${caseItem.id})">
                <i class="fas fa-eye"></i> تفاصيل
            </button>
            <button class="btn btn-danger btn-sm" onclick="removeConfirmedCase(${caseItem.id})">
                <i class="fas fa-trash"></i> حذف
            </button>
        </div>
    `;
    
    return card;
}

// View confirmed case details
function viewConfirmedCaseDetails(caseId) {
    // Implement detailed view modal
    showNotification('سيتم عرض تفاصيل الحالة المؤكدة قريباً', 'info');
}

// Remove confirmed case
async function removeConfirmedCase(caseId) {
    if (!confirm('هل أنت متأكد من حذف هذه الحالة المؤكدة؟')) {
        return;
    }

    try {
        const { error } = await supabaseClient
            .from('confirmed_scams')
            .delete()
            .eq('id', caseId);

        if (error) throw error;

        showNotification('تم حذف الحالة المؤكدة', 'success');
        loadConfirmedCases(); // Refresh list
        updateAdminStats(); // Update stats

    } catch (error) {
        console.error('Error removing confirmed case:', error);
        showNotification('حدث خطأ أثناء حذف الحالة', 'error');
    }
}

// Initialize statistics
function initializeStatistics() {
    updateAdminStats();
}

// Update admin statistics
async function updateAdminStats() {
    try {
        // Get pending reports count
        const { count: pendingCount } = await supabaseClient
            .from('scam_reports')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'pending');

        // Get confirmed cases count
        const { count: confirmedCount } = await supabaseClient
            .from('confirmed_scams')
            .select('*', { count: 'exact', head: true });

        // Get delete requests count
        const { count: deleteCount } = await supabaseClient
            .from('delete_requests')
            .select('*', { count: 'exact', head: true });

        // Get today's reports count
        const today = new Date().toISOString().split('T')[0];
        const { count: todayCount } = await supabaseClient
            .from('scam_reports')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', today);

        // Update UI
        updateStatElement('totalPendingReports', pendingCount || 0);
        updateStatElement('totalConfirmedCases', confirmedCount || 0);
        updateStatElement('totalDeleteRequests', deleteCount || 0);
        updateStatElement('todayReports', todayCount || 0);

    } catch (error) {
        console.error('Error updating admin stats:', error);
    }
}

// Update stat element
function updateStatElement(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = value;
    }
}

// View all evidence images
function viewAllEvidence(evidenceImages) {
    if (!evidenceImages || evidenceImages.length === 0) {
        showNotification('لا توجد صور أدلة متاحة', 'info');
        return;
    }
    
    // Create modal for viewing all evidence
    const modal = document.createElement('div');
    modal.className = 'evidence-viewer-modal';
    modal.innerHTML = `
        <div class="evidence-viewer-content">
            <div class="evidence-viewer-header">
                <h3><i class="fas fa-images"></i> جميع صور الأدلة (${evidenceImages.length})</h3>
                <button class="evidence-viewer-close" onclick="closeEvidenceViewer()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="evidence-viewer-body">
                <div class="evidence-viewer-grid">
                    ${evidenceImages.map((img, index) => {
                        const mimeType = img.mime_type || 'image/jpeg';
                        const imageSrc = `data:${mimeType};base64,${img.image_base64}`;
                        return `
                            <div class="evidence-viewer-item" data-evidence-index="${index}">
                                <img src="${imageSrc}" alt="دليل ${index + 1}" 
                                     onclick="showImageModal('${imageSrc}', 'صورة دليل ${index + 1}')">
                                <div class="evidence-viewer-label">دليل ${index + 1}</div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        </div>
        <div class="evidence-viewer-overlay" onclick="closeEvidenceViewer()"></div>
    `;
    
    // Add to body
    document.body.appendChild(modal);
    
    // Add styles if not already present
    if (!document.querySelector('#evidence-viewer-styles')) {
        const styles = document.createElement('style');
        styles.id = 'evidence-viewer-styles';
        styles.textContent = `
            .evidence-viewer-modal {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 2rem;
            }
            
            .evidence-viewer-overlay {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.8);
            }
            
            .evidence-viewer-content {
                position: relative;
                background: var(--white);
                border-radius: var(--radius-lg);
                max-width: 90vw;
                max-height: 90vh;
                overflow: hidden;
                box-shadow: var(--shadow-xl);
            }
            
            .evidence-viewer-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 1.5rem 2rem;
                background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
                color: var(--white);
            }
            
            .evidence-viewer-header h3 {
                margin: 0;
                font-size: 1.25rem;
                font-weight: 600;
            }
            
            .evidence-viewer-close {
                background: rgba(255, 255, 255, 0.2);
                border: none;
                color: var(--white);
                width: 40px;
                height: 40px;
                border-radius: 50%;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s ease;
            }
            
            .evidence-viewer-close:hover {
                background: rgba(255, 255, 255, 0.3);
                transform: scale(1.1);
            }
            
            .evidence-viewer-body {
                padding: 2rem;
                max-height: calc(90vh - 120px);
                overflow-y: auto;
            }
            
            .evidence-viewer-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                gap: 1.5rem;
            }
            
            .evidence-viewer-item {
                position: relative;
                border-radius: var(--radius);
                overflow: hidden;
                cursor: pointer;
                transition: all 0.3s ease;
                box-shadow: var(--shadow-md);
            }
            
            .evidence-viewer-item:hover {
                transform: scale(1.05);
                box-shadow: var(--shadow-lg);
            }
            
            .evidence-viewer-item img {
                width: 100%;
                height: 200px;
                object-fit: cover;
            }
            
            .evidence-viewer-label {
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
                color: var(--white);
                padding: 1rem;
                text-align: center;
                font-weight: 600;
            }
            
            @media (max-width: 768px) {
                .evidence-viewer-grid {
                    grid-template-columns: repeat(2, 1fr);
                }
                
                .evidence-viewer-item img {
                    height: 150px;
                }
            }
            
            @media (max-width: 480px) {
                .evidence-viewer-modal {
                    padding: 1rem;
                }
                
                .evidence-viewer-grid {
                    grid-template-columns: 1fr;
                }
                
                .evidence-viewer-body {
                    padding: 1rem;
                }
            }
        `;
        document.head.appendChild(styles);
    }
    
    // Show modal with animation
    modal.style.opacity = '0';
    modal.style.transform = 'scale(0.9)';
    
    setTimeout(() => {
        modal.style.transition = 'all 0.3s ease';
        modal.style.opacity = '1';
        modal.style.transform = 'scale(1)';
    }, 10);
}

// Close evidence viewer
function closeEvidenceViewer() {
    const modal = document.querySelector('.evidence-viewer-modal');
    if (modal) {
        modal.style.opacity = '0';
        modal.style.transform = 'scale(0.9)';
        
        setTimeout(() => {
            modal.remove();
        }, 300);
    }
}

// ========================================
// ADVANCED SILENT PROTECTION SYSTEM
// ========================================

// Global protection state
let protectionState = {
    devToolsOpen: false,
    lastActivity: Date.now(),
    suspiciousActivities: [],
    rateLimitCounters: new Map(),
    integrityChecks: new Set()
};

// Rate limiting configuration
const RATE_LIMITS = {
    form_submissions: { max: 5, window: 60000 }, // 5 submissions per minute
    searches: { max: 10, window: 60000 }, // 10 searches per minute
    api_calls: { max: 30, window: 60000 }, // 30 API calls per minute
    file_uploads: { max: 3, window: 300000 } // 3 uploads per 5 minutes
};

// Initialize advanced silent protection system
function initializeAdvancedProtection() {
    console.log('🛡️ Advanced Silent Protection System - Initializing...');

    // Initialize all protection layers
    initializeContentProtection();
    initializeDeveloperToolsProtection();
    initializeNetworkProtection();
    initializeInputSanitization();
    initializeIntegrityMonitoring();
    initializeBehavioralAnalysis();

    // Start protection monitoring
    startProtectionMonitoring();

    console.log('✅ Advanced Silent Protection System - Fully Active');
}

// ========================================
// CONTENT PROTECTION - ENHANCED
// ========================================

// Initialize enhanced content protection
function initializeContentProtection() {
    // Prevent text selection on document
    document.addEventListener('selectstart', function(e) {
        // Allow selection on input fields, textareas, and contenteditable elements
        if (isAllowedInputElement(e.target)) {
            return true;
        }

        // Prevent selection on other elements
        e.preventDefault();
        logSuspiciousActivity('text_selection_attempt');
        return false;
    });

    // Prevent right-click context menu
    document.addEventListener('contextmenu', function(e) {
        // Allow context menu on input fields, textareas, and contenteditable elements
        if (isAllowedInputElement(e.target)) {
            return true;
        }

        // Prevent context menu on other elements
        e.preventDefault();
        logSuspiciousActivity('context_menu_attempt');
        showProtectionMessage('القائمة السياقية غير مسموحة');
        return false;
    });

    // Prevent copy, cut, and paste events
    document.addEventListener('copy', function(e) {
        if (isAllowedInputElement(e.target)) {
            return true;
        }
        e.preventDefault();
        logSuspiciousActivity('copy_attempt');
        showProtectionMessage('النسخ غير مسموح');
        return false;
    });

    document.addEventListener('cut', function(e) {
        if (isAllowedInputElement(e.target)) {
            return true;
        }
        e.preventDefault();
        logSuspiciousActivity('cut_attempt');
        showProtectionMessage('القص غير مسموح');
        return false;
    });

    document.addEventListener('paste', function(e) {
        if (isAllowedInputElement(e.target)) {
            // Additional validation for paste content
            const pastedText = (e.originalEvent || e).clipboardData.getData('text/plain');
            if (containsSuspiciousContent(pastedText)) {
                e.preventDefault();
                logSuspiciousActivity('suspicious_paste_attempt');
                showProtectionMessage('المحتوى المُلصق غير آمن');
                return false;
            }
            return true;
        }
        e.preventDefault();
        logSuspiciousActivity('paste_attempt');
        showProtectionMessage('اللصق غير مسموح');
        return false;
    });

    // Prevent drag and drop operations
    document.addEventListener('dragstart', function(e) {
        if (isAllowedInputElement(e.target)) {
            return true;
        }
        e.preventDefault();
        logSuspiciousActivity('drag_attempt');
        return false;
    });

    document.addEventListener('drop', function(e) {
        if (isAllowedInputElement(e.target)) {
            // Validate dropped files
            const files = e.dataTransfer.files;
            for (let file of files) {
                if (isSuspiciousFile(file)) {
                    e.preventDefault();
                    logSuspiciousActivity('suspicious_file_drop');
                    showProtectionMessage('نوع الملف غير آمن');
                    return false;
                }
            }
            return true;
        }
        e.preventDefault();
        logSuspiciousActivity('drop_attempt');
        showProtectionMessage('إسقاط الملفات غير مسموح');
        return false;
    });

    // Enhanced keyboard protection
    document.addEventListener('keydown', function(e) {
        const isInputElement = isAllowedInputElement(e.target);

        // Allow keyboard shortcuts in input elements
        if (isInputElement) {
            // Additional validation for input elements
            if (isSuspiciousKeyCombination(e)) {
                e.preventDefault();
                logSuspiciousActivity('suspicious_key_combination');
                showProtectionMessage('اختصار لوحة المفاتيح غير آمن');
                return false;
            }
            return true;
        }

        // Block dangerous keyboard shortcuts on other elements
        if (isDangerousKeyCombination(e)) {
            e.preventDefault();
            const action = getKeyActionDescription(e);
            logSuspiciousActivity('dangerous_key_combination', { key: e.key, ctrl: e.ctrlKey, alt: e.altKey, shift: e.shiftKey });
            showProtectionMessage(`${action} غير مسموح`);
            return false;
        }
    });

    // Prevent image saving via drag
    document.addEventListener('mousedown', function(e) {
        if (e.target.tagName === 'IMG') {
            e.target.draggable = false;
            // Allow normal image interaction but prevent drag
            if (e.button === 2) { // Right click
                e.preventDefault();
                logSuspiciousActivity('image_right_click');
                showProtectionMessage('النقر بالزر الأيمن على الصور غير مسموح');
                return false;
            }
        }
    });

    // Prevent source viewing attempts
    document.addEventListener('beforeunload', function(e) {
        // Clear any sensitive data from memory
        clearSensitiveData();
    });

    console.log('🔒 Enhanced Content Protection - Active');
}

// ========================================
// DEVELOPER TOOLS PROTECTION
// ========================================

// Initialize developer tools protection
function initializeDeveloperToolsProtection() {
    // Detect Developer Tools opening
    let devtoolsOpen = false;
    const threshold = 160;

    // Method 1: Check window dimensions
    setInterval(() => {
        if (window.outerHeight - window.innerHeight > threshold || window.outerWidth - window.innerWidth > threshold) {
            if (!devtoolsOpen) {
                devtoolsOpen = true;
                handleDevToolsDetected('dimension_change');
            }
        } else {
            devtoolsOpen = false;
        }
    }, 500);

    // Method 2: Check for console object tampering
    const _log = console.log;
    console.log = function(...args) {
        logSuspiciousActivity('console_usage', { method: 'log', args: args.length });
        return _log.apply(console, args);
    };

    // Method 3: Detect source map requests (indicates dev tools)
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
        const url = args[0];
        if (typeof url === 'string' && (url.includes('.map') || url.includes('source-map'))) {
            logSuspiciousActivity('source_map_request', { url: url });
            // Don't block, just log
        }
        return originalFetch.apply(this, args);
    };

    // Method 4: Prevent F12, Ctrl+Shift+I, Ctrl+U, etc.
    document.addEventListener('keydown', function(e) {
        if (isDevToolsShortcut(e)) {
            e.preventDefault();
            logSuspiciousActivity('dev_tools_shortcut', { key: e.key, ctrl: e.ctrlKey, shift: e.shiftKey, alt: e.altKey });
            showProtectionMessage('فتح أدوات المطور غير مسموح');

            // Additional measures
            blurWindow();
            return false;
        }
    });

    // Method 5: Detect debugger statements
    let debuggerCounter = 0;
    const originalDebugger = window.debugger;
    window.debugger = function() {
        debuggerCounter++;
        if (debuggerCounter > 3) {
            logSuspiciousActivity('debugger_statement_detected');
            showProtectionMessage('تم اكتشاف محاولة تصحيح');
            blurWindow();
        }
        if (originalDebugger) originalDebugger();
    };

    console.log('🔧 Developer Tools Protection - Active');
}

// ========================================
// NETWORK PROTECTION
// ========================================

// Initialize network protection
function initializeNetworkProtection() {
    // Rate limiting for API calls
    const originalSupabaseCall = supabaseClient.from;
    supabaseClient.from = function(table) {
        const tableName = table;
        return new Proxy(originalSupabaseCall.call(this, table), {
            get(target, prop) {
                if (typeof target[prop] === 'function') {
                    return function(...args) {
                        // Check rate limit before allowing the call
                        if (!checkRateLimit('api_calls', tableName)) {
                            logSuspiciousActivity('rate_limit_exceeded', { table: tableName, method: prop });
                            throw new Error('تم تجاوز حد الطلبات المسموح به');
                        }

                        // Log API call
                        logSuspiciousActivity('api_call', { table: tableName, method: prop, argsCount: args.length });

                        return target[prop].apply(target, args);
                    };
                }
                return target[prop];
            }
        });
    };

    // Protect against suspicious network requests
    const originalXMLHttpRequest = window.XMLHttpRequest;
    window.XMLHttpRequest = function() {
        const xhr = new originalXMLHttpRequest();
        const originalOpen = xhr.open;

        xhr.open = function(method, url, ...args) {
            // Check for suspicious URLs
            if (isSuspiciousUrl(url)) {
                logSuspiciousActivity('suspicious_network_request', { method, url });
                throw new Error('طلب شبكة مشبوه');
            }

            // Log network request
            logSuspiciousActivity('network_request', { method, url: url.substring(0, 100) });

            return originalOpen.call(this, method, url, ...args);
        };

        return xhr;
    };

    // Protect fetch API
    const originalFetch = window.fetch;
    window.fetch = function(input, init) {
        const url = typeof input === 'string' ? input : input.url;

        if (isSuspiciousUrl(url)) {
            logSuspiciousActivity('suspicious_fetch_request', { url });
            return Promise.reject(new Error('طلب fetch مشبوه'));
        }

        logSuspiciousActivity('fetch_request', { url: url.substring(0, 100) });

        return originalFetch.call(this, input, init);
    };

    console.log('🌐 Network Protection - Active');
}

// ========================================
// INPUT SANITIZATION
// ========================================

// Initialize input sanitization
function initializeInputSanitization() {
    // Enhanced input validation for all forms
    document.addEventListener('input', function(e) {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            const sanitizedValue = sanitizeInput(e.target.value, e.target.type);
            if (sanitizedValue !== e.target.value) {
                e.target.value = sanitizedValue;
                logSuspiciousActivity('input_sanitized', { field: e.target.name || e.target.id });
            }
        }
    });

    // Prevent form submission with suspicious data
    document.addEventListener('submit', function(e) {
        const form = e.target;
        const formData = new FormData(form);

        // Check rate limit for form submissions
        if (!checkRateLimit('form_submissions', form.id || 'general_form')) {
            e.preventDefault();
            logSuspiciousActivity('form_rate_limit_exceeded', { formId: form.id });
            showNotification('تم تجاوز حد الطلبات المسموح به. يرجى الانتظار قليلاً.', 'error');
            return false;
        }

        // Validate all form inputs
        for (let [name, value] of formData.entries()) {
            if (containsSQLInjection(value) || containsXSS(value)) {
                e.preventDefault();
                logSuspiciousActivity('suspicious_form_data', { field: name, type: 'sql_injection_or_xss' });
                showNotification('تم اكتشاف بيانات مشبوهة في النموذج', 'error');
                return false;
            }
        }

        logSuspiciousActivity('form_submission', { formId: form.id, fieldsCount: formData.getAll.length });
    });

    // File upload protection
    document.addEventListener('change', function(e) {
        if (e.target.type === 'file') {
            const files = e.target.files;

            for (let file of files) {
                if (isSuspiciousFile(file)) {
                    e.target.value = ''; // Clear the file input
                    logSuspiciousActivity('suspicious_file_upload', { fileName: file.name, fileType: file.type });
                    showNotification('نوع الملف غير آمن وتم رفضه', 'error');
                    return;
                }

                // Check file size
                if (file.size > 10 * 1024 * 1024) { // 10MB limit
                    e.target.value = '';
                    logSuspiciousActivity('file_too_large', { fileName: file.name, size: file.size });
                    showNotification('حجم الملف كبير جداً', 'error');
                    return;
                }
            }

            if (!checkRateLimit('file_uploads', 'file_upload')) {
                e.target.value = '';
                logSuspiciousActivity('file_upload_rate_limit_exceeded');
                showNotification('تم تجاوز حد رفع الملفات المسموح به', 'error');
                return;
            }

            logSuspiciousActivity('file_upload', { count: files.length });
        }
    });

    console.log('🧹 Input Sanitization - Active');
}

// ========================================
// INTEGRITY MONITORING
// ========================================

// Initialize integrity monitoring
function initializeIntegrityMonitoring() {
    // Monitor DOM manipulation attempts
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(function(node) {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        if (containsSuspiciousScript(node)) {
                            logSuspiciousActivity('suspicious_dom_manipulation', { tagName: node.tagName });
                            node.remove(); // Remove suspicious element
                        }
                    }
                });
            } else if (mutation.type === 'attributes') {
                if (mutation.attributeName === 'src' || mutation.attributeName === 'href') {
                    const newValue = mutation.target.getAttribute(mutation.attributeName);
                    if (isSuspiciousUrl(newValue)) {
                        logSuspiciousActivity('suspicious_attribute_change', {
                            attribute: mutation.attributeName,
                            value: newValue.substring(0, 100)
                        });
                        mutation.target.removeAttribute(mutation.attributeName);
                    }
                }
            }
        });
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['src', 'href', 'onclick', 'onload']
    });

    // Monitor local storage and session storage
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function(key, value) {
        if (containsSuspiciousContent(value)) {
            logSuspiciousActivity('suspicious_storage_write', { key, valueLength: value.length });
            throw new Error('محتوى storage مشبوه');
        }
        return originalSetItem.call(this, key, value);
    };

    console.log('🔍 Integrity Monitoring - Active');
}

// ========================================
// BEHAVIORAL ANALYSIS
// ========================================

// Initialize behavioral analysis
function initializeBehavioralAnalysis() {
    let mouseMovements = [];
    let keyPresses = [];
    let lastMousePosition = { x: 0, y: 0 };

    // Track mouse movements for bot detection
    document.addEventListener('mousemove', function(e) {
        const currentPos = { x: e.clientX, y: e.clientY, time: Date.now() };
        mouseMovements.push(currentPos);

        // Keep only last 100 movements
        if (mouseMovements.length > 100) {
            mouseMovements.shift();
        }

        // Analyze mouse movement patterns
        if (mouseMovements.length >= 10) {
            const pattern = analyzeMousePattern(mouseMovements);
            if (pattern.isSuspicious) {
                logSuspiciousActivity('suspicious_mouse_pattern', pattern);
            }
        }

        lastMousePosition = currentPos;
    });

    // Track keyboard patterns
    document.addEventListener('keydown', function(e) {
        keyPresses.push({ key: e.key, time: Date.now() });

        // Keep only last 50 key presses
        if (keyPresses.length > 50) {
            keyPresses.shift();
        }

        // Analyze typing patterns
        if (keyPresses.length >= 20) {
            const pattern = analyzeTypingPattern(keyPresses);
            if (pattern.isSuspicious) {
                logSuspiciousActivity('suspicious_typing_pattern', pattern);
            }
        }
    });

    // Track focus changes
    document.addEventListener('focusin', function(e) {
        logSuspiciousActivity('element_focus', { tagName: e.target.tagName, id: e.target.id });
    });

    // Track scroll behavior
    document.addEventListener('scroll', throttle(function(e) {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight;
        const clientHeight = document.documentElement.clientHeight;

        if (scrollTop > 0) {
            logSuspiciousActivity('page_scroll', {
                position: scrollTop,
                percentage: Math.round((scrollTop / (scrollHeight - clientHeight)) * 100)
            });
        }
    }, 1000));

    console.log('🧠 Behavioral Analysis - Active');
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

// Check if element is allowed for input operations
function isAllowedInputElement(element) {
    return element.tagName === 'INPUT' ||
           element.tagName === 'TEXTAREA' ||
           element.contentEditable === 'true' ||
           element.closest('input, textarea, [contenteditable="true"]');
}

// Check if content contains suspicious patterns
function containsSuspiciousContent(content) {
    if (typeof content !== 'string') return false;

    const suspiciousPatterns = [
        /<script/i,
        /javascript:/i,
        /vbscript:/i,
        /onload=/i,
        /onerror=/i,
        /eval\(/i,
        /document\.cookie/i,
        /localStorage/i,
        /sessionStorage/i,
        /innerHTML/i,
        /outerHTML/i
    ];

    return suspiciousPatterns.some(pattern => pattern.test(content));
}

// Check if file is suspicious
function isSuspiciousFile(file) {
    const suspiciousTypes = [
        'application/x-msdownload', // .exe
        'application/x-executable',
        'application/octet-stream',
        'application/x-dosexec'
    ];

    const suspiciousExtensions = [
        '.exe', '.bat', '.cmd', '.scr', '.pif', '.com',
        '.vbs', '.js', '.jar', '.php', '.asp', '.jsp'
    ];

    return suspiciousTypes.includes(file.type) ||
           suspiciousExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
}

// Check for dangerous key combinations
function isDangerousKeyCombination(e) {
    const { ctrlKey, altKey, shiftKey, key } = e;

    // Developer tools shortcuts
    if (isDevToolsShortcut(e)) return true;

    // System shortcuts
    if (ctrlKey && key === 'u') return true; // View source
    if (ctrlKey && shiftKey && key === 'J') return true; // Console
    if (ctrlKey && shiftKey && key === 'C') return true; // Inspect element
    if (ctrlKey && key === 's') return true; // Save page
    if (ctrlKey && key === 'p') return true; // Print

    return false;
}

// Check if it's a developer tools shortcut
function isDevToolsShortcut(e) {
    const { key, ctrlKey, shiftKey, altKey } = e;

    return (
        key === 'F12' ||
        (ctrlKey && shiftKey && key === 'I') ||
        (ctrlKey && shiftKey && key === 'J') ||
        (ctrlKey && shiftKey && key === 'C') ||
        (ctrlKey && key === 'u')
    );
}

// Get description for key action
function getKeyActionDescription(e) {
    const { key, ctrlKey, shiftKey } = e;

    if (key === 'F12') return 'فتح أدوات المطور';
    if (ctrlKey && shiftKey && key === 'I') return 'فتح أدوات المطور';
    if (ctrlKey && shiftKey && key === 'J') return 'فتح وحدة التحكم';
    if (ctrlKey && shiftKey && key === 'C') return 'فحص العنصر';
    if (ctrlKey && key === 'u') return 'عرض المصدر';
    if (ctrlKey && key === 's') return 'حفظ الصفحة';
    if (ctrlKey && key === 'p') return 'طباعة الصفحة';

    return 'الاختصار غير مسموح';
}

// Check for suspicious URLs
function isSuspiciousUrl(url) {
    if (typeof url !== 'string') return false;

    const suspiciousPatterns = [
        /127\.0\.0\.1/i,
        /localhost/i,
        /192\.168\./i,
        /10\.0\./i,
        /172\./i,
        /\.local/i,
        /ngrok/i,
        /burp/i,
        /fiddler/i,
        /charles/i
    ];

    return suspiciousPatterns.some(pattern => pattern.test(url));
}

// Sanitize input based on type
function sanitizeInput(value, type) {
    if (typeof value !== 'string') return value;

    // Remove null bytes and other dangerous characters
    let sanitized = value.replace(/[\x00-\x1F\x7F-\x9F]/g, '');

    // Type-specific sanitization
    switch (type) {
        case 'email':
            sanitized = sanitized.replace(/[^a-zA-Z0-9@._-]/g, '');
            break;
        case 'tel':
        case 'phone':
            sanitized = sanitized.replace(/[^0-9+\-\s()]/g, '');
            break;
        case 'text':
        case 'textarea':
            // Allow Arabic, English, numbers, and basic punctuation
            sanitized = sanitized.replace(/[^a-zA-Z\u0600-\u06FF0-9\s.,!؟?@#$%^&*()_+\-=\[\]{}|;':"<>,.\/\\]/g, '');
            break;
        default:
            // Conservative approach - only allow safe characters
            sanitized = sanitized.replace(/[^a-zA-Z\u0600-\u06FF0-9\s]/g, '');
    }

    return sanitized;
}

// Check for SQL injection patterns
function containsSQLInjection(value) {
    if (typeof value !== 'string') return false;

    const sqlPatterns = [
        /(\bUNION\b|\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bDROP\b|\bCREATE\b|\bALTER\b)/i,
        /('|(\\x27)|(\\x2D\\x2D)|(\\#)|(\-\-)|(\;)|(\*\/)|(\*))/i,
        /(\bor\b|\band\b|\bxor\b)/i,
        /('|(\\x27)|(\\x2D\\x2D)|(\;)|(\*\/)|(\*))/i
    ];

    return sqlPatterns.some(pattern => pattern.test(value));
}

// Check for XSS patterns
function containsXSS(value) {
    if (typeof value !== 'string') return false;

    const xssPatterns = [
        /<script/i,
        /javascript:/i,
        /vbscript:/i,
        /onload=/i,
        /onerror=/i,
        /onclick=/i,
        /<iframe/i,
        /<object/i,
        /<embed/i,
        /<form/i,
        /<input/i,
        /document\.cookie/i,
        /eval\(/i,
        /alert\(/i
    ];

    return xssPatterns.some(pattern => pattern.test(value));
}

// Check rate limit
function checkRateLimit(action, identifier) {
    const key = `${action}_${identifier}`;
    const now = Date.now();
    const limit = RATE_LIMITS[action];

    if (!limit) return true; // No limit defined

    const counter = protectionState.rateLimitCounters.get(key) || { count: 0, windowStart: now };

    // Reset window if needed
    if (now - counter.windowStart > limit.window) {
        counter.count = 0;
        counter.windowStart = now;
    }

    // Check if limit exceeded
    if (counter.count >= limit.max) {
        return false;
    }

    // Increment counter
    counter.count++;
    protectionState.rateLimitCounters.set(key, counter);

    return true;
}

// Log suspicious activity
function logSuspiciousActivity(type, details = {}) {
    const activity = {
        type,
        timestamp: Date.now(),
        details,
        userAgent: navigator.userAgent,
        url: window.location.href,
        referrer: document.referrer
    };

    protectionState.suspiciousActivities.push(activity);

    // Keep only last 100 activities
    if (protectionState.suspiciousActivities.length > 100) {
        protectionState.suspiciousActivities.shift();
    }

    // In production, send to server for monitoring
    console.warn(`🚨 Suspicious Activity: ${type}`, details);

    // If too many suspicious activities, take action
    if (protectionState.suspiciousActivities.length > 20) {
        const recentActivities = protectionState.suspiciousActivities.filter(a => a.timestamp > Date.now() - 60000); // Last minute
        if (recentActivities.length > 10) {
            handleSecurityBreach();
        }
    }
}

// Handle developer tools detected
function handleDevToolsDetected(method) {
    protectionState.devToolsOpen = true;
    logSuspiciousActivity('dev_tools_detected', { method });

    // Blur the window to make it harder to inspect
    blurWindow();

    // Show warning
    showProtectionMessage('تم اكتشاف فتح أدوات المطور - هذا قد يؤثر على أداء الموقع');
}

// Blur window to prevent inspection
function blurWindow() {
    document.body.style.filter = 'blur(2px)';
    document.body.style.userSelect = 'none';
    document.body.style.pointerEvents = 'none';

    // Restore after 3 seconds
    setTimeout(() => {
        document.body.style.filter = '';
        document.body.style.userSelect = '';
        document.body.style.pointerEvents = '';
    }, 3000);
}

// Handle security breach
function handleSecurityBreach() {
    logSuspiciousActivity('security_breach_detected');

    // Clear all sensitive data
    clearSensitiveData();

    // Redirect to safe page or show lockdown message
    document.body.innerHTML = `
        <div style="
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            font-family: Arial, sans-serif;
        ">
            <div style="text-align: center; padding: 2rem;">
                <h1 style="font-size: 3rem; margin-bottom: 1rem;">🚨</h1>
                <h2>تم اكتشاف نشاط مشبوه</h2>
                <p>لأسباب أمنية، تم تعليق الوصول مؤقتاً</p>
                <p style="font-size: 0.9rem; margin-top: 2rem; opacity: 0.8;">
                    يرجى إعادة تحميل الصفحة وتجنب استخدام أدوات المطور
                </p>
            </div>
        </div>
    `;

    // Prevent any further interactions
    document.addEventListener('keydown', e => e.preventDefault());
    document.addEventListener('click', e => e.preventDefault());
    document.addEventListener('contextmenu', e => e.preventDefault());
}

// Clear sensitive data
function clearSensitiveData() {
    // Clear any sensitive data from memory
    if (window.verifiedApplicant) {
        window.verifiedApplicant = null;
    }

    // Clear form data
    const forms = document.querySelectorAll('form');
    forms.forEach(form => form.reset());

    // Clear local storage
    try {
        localStorage.clear();
        sessionStorage.clear();
    } catch (e) {
        // Ignore errors
    }
}

// Analyze mouse movement patterns for bot detection
function analyzeMousePattern(movements) {
    if (movements.length < 10) return { isSuspicious: false };

    let totalDistance = 0;
    let totalTime = 0;
    let straightLines = 0;

    for (let i = 1; i < movements.length; i++) {
        const prev = movements[i-1];
        const curr = movements[i];

        const distance = Math.sqrt(Math.pow(curr.x - prev.x, 2) + Math.pow(curr.y - prev.y, 2));
        const time = curr.time - prev.time;

        totalDistance += distance;
        totalTime += time;

        // Check for straight line movements (bots often move in straight lines)
        if (i >= 2) {
            const prev2 = movements[i-2];
            const slope1 = (prev.y - prev2.y) / (prev.x - prev2.x || 1);
            const slope2 = (curr.y - prev.y) / (curr.x - prev.x || 1);

            if (Math.abs(slope1 - slope2) < 0.1) {
                straightLines++;
            }
        }
    }

    const avgSpeed = totalDistance / totalTime;
    const straightLineRatio = straightLines / (movements.length - 2);

    return {
        isSuspicious: straightLineRatio > 0.8 || avgSpeed > 1000, // Very fast or too straight
        avgSpeed,
        straightLineRatio
    };
}

// Analyze typing patterns for bot detection
function analyzeTypingPattern(keyPresses) {
    if (keyPresses.length < 20) return { isSuspicious: false };

    let intervals = [];
    for (let i = 1; i < keyPresses.length; i++) {
        intervals.push(keyPresses[i].time - keyPresses[i-1].time);
    }

    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length;
    const stdDev = Math.sqrt(variance);

    // Very consistent typing (bots) or very erratic (suspicious)
    const isSuspicious = stdDev < 10 || stdDev > 200;

    return {
        isSuspicious,
        avgInterval,
        stdDev
    };
}

// Check for suspicious script elements
function containsSuspiciousScript(element) {
    if (element.tagName === 'SCRIPT') {
        const src = element.getAttribute('src');
        return isSuspiciousUrl(src);
    }

    if (element.tagName === 'IFRAME') {
        const src = element.getAttribute('src');
        return isSuspiciousUrl(src);
    }

    // Check for event handlers
    const eventAttributes = ['onclick', 'onload', 'onerror', 'onsubmit'];
    for (let attr of eventAttributes) {
        if (element.hasAttribute(attr)) {
            const value = element.getAttribute(attr);
            if (containsSuspiciousContent(value)) {
                return true;
            }
        }
    }

    return false;
}

// Check for suspicious key combinations in inputs
function isSuspiciousKeyCombination(e) {
    const { ctrlKey, key, target } = e;

    // Allow normal shortcuts in inputs
    if (ctrlKey && (key === 'c' || key === 'v' || key === 'x' || key === 'a' || key === 'z')) {
        return false;
    }

    // Suspicious combinations
    if (ctrlKey && key === 'u') return true; // View source while typing
    if (ctrlKey && key === 's') return true; // Save while typing

    return false;
}

// Start protection monitoring
function startProtectionMonitoring() {
    // Periodic cleanup
    setInterval(() => {
        // Clean old rate limit counters
        const now = Date.now();
        for (let [key, counter] of protectionState.rateLimitCounters) {
            if (now - counter.windowStart > Math.max(...Object.values(RATE_LIMITS).map(l => l.window)) * 2) {
                protectionState.rateLimitCounters.delete(key);
            }
        }

        // Clean old activities
        protectionState.suspiciousActivities = protectionState.suspiciousActivities.filter(
            activity => now - activity.timestamp < 3600000 // Keep last hour
        );

        // Update last activity
        protectionState.lastActivity = now;
    }, 60000); // Every minute

    // Heartbeat check
    setInterval(() => {
        if (Date.now() - protectionState.lastActivity > 300000) { // 5 minutes of inactivity
            logSuspiciousActivity('inactivity_detected');
        }
    }, 300000);
}

// ========================================
// INITIALIZATION
// ========================================

// Replace the old initialization with the new advanced system
function initializeContentProtection() {
    initializeAdvancedProtection();
}

// Show protection message (silent notification)
function showProtectionMessage(message) {
    // Create a temporary notification that disappears quickly
    const notification = document.createElement('div');
    notification.className = 'protection-notification';
    notification.innerHTML = `
        <i class="fas fa-shield-alt"></i>
        <span>${message}</span>
    `;

    // Add to notifications container if exists, otherwise create temporary one
    let container = document.getElementById('notificationsContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'notificationsContainer';
        container.style.cssText = 'position: fixed; top: 90px; right: 20px; z-index: 9998; max-width: 400px; width: 100%;';
        document.body.appendChild(container);
    }

    container.appendChild(notification);

    // Remove after 2 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 2000);

    // Add styles if not already present
    if (!document.querySelector('#protection-notification-styles')) {
        const styles = document.createElement('style');
        styles.id = 'protection-notification-styles';
        styles.textContent = `
            .protection-notification {
                background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
                color: white;
                padding: 0.75rem 1rem;
                border-radius: 0.5rem;
                margin-bottom: 0.5rem;
                box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
                display: flex;
                align-items: center;
                gap: 0.5rem;
                font-size: 0.875rem;
                font-weight: 500;
                animation: slideInProtection 0.3s ease;
                border: 1px solid rgba(255, 255, 255, 0.2);
            }

            .protection-notification i {
                font-size: 1rem;
                opacity: 0.9;
            }

            @keyframes slideInProtection {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(styles);
    }
}

// Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
