// js/cursor.js - Premium Custom Cursor for Desktop

export function initCustomCursor() {
    // تعطيل المؤشر المخصص على الهواتف والشاشات التي تعمل باللمس
    if (window.innerWidth < 992 || 'ontouchstart' in window) return;

    // إنشاء عنصر المؤشر
    const cursor = document.createElement('div');
    cursor.classList.add('custom-cursor');
    document.body.appendChild(cursor);

    // تتبع حركة الماوس
    document.addEventListener('mousemove', (e) => {
        cursor.style.left = e.clientX + 'px';
        cursor.style.top = e.clientY + 'px';
    });

    // دالة لإضافة تأثير التمدد (Hover) على كل العناصر القابلة للنقر
    const attachHoverEffects = () => {
        const interactables = document.querySelectorAll('a, button, .premium-card, input, .form-check-input, .accordion-button');
        
        interactables.forEach(el => {
            // إزالة الأحداث القديمة لتجنب التكرار
            el.removeEventListener('mouseenter', handleMouseEnter);
            el.removeEventListener('mouseleave', handleMouseLeave);
            
            // إضافة الأحداث الجديدة
            el.addEventListener('mouseenter', handleMouseEnter);
            el.addEventListener('mouseleave', handleMouseLeave);
        });
    };

    const handleMouseEnter = () => cursor.classList.add('hover');
    const handleMouseLeave = () => cursor.classList.remove('hover');

    // إعادة تفعيل التأثيرات عند تغيير الصفحة (لأننا نستخدم SPA)
    window.addEventListener('hashchange', () => {
        setTimeout(attachHoverEffects, 500); // ننتظر حتى يتم رسم الصفحة
    });

    // التفعيل الأولي
    setTimeout(attachHoverEffects, 500);
}