// js/router.js - Premium Hash-based SPA Router

export const Router = {
    routes: {},
    
    init() {
        window.addEventListener('hashchange', () => this.handleRoute());
        this.handleRoute(); // تشغيل الراوتر عند أول تحميل للصفحة
    },

    addRoute(hash, renderFunction) {
        this.routes[hash] = renderFunction;
    },

    handleRoute() {
        // استخراج المسار والمعاملات (Parameters) إن وجدت مثل id
        let hash = window.location.hash || '#/home';
        let routePath = hash.split('?')[0];
        let queryString = hash.split('?')[1] || '';
        let params = new URLSearchParams(queryString);
        
        // جلب دالة العرض المناسبة، وإذا لم توجد نعود للرئيسية
        const renderFunc = this.routes[routePath] || this.routes['#/home'];
        
        // تحديث الروابط الفعالة (Active) في النافبار
        document.querySelectorAll('.nav-link, .dropdown-item').forEach(link => {
            link.classList.remove('active', 'text-secondary', 'fw-bold');
            if(link.getAttribute('href') === routePath) {
                link.classList.add('active', 'text-secondary', 'fw-bold');
            }
        });

        // إفراغ الشاشة وبناء المحتوى الجديد
        const mainContent = document.getElementById('app-content');
        if (mainContent) {
            mainContent.innerHTML = `
                <div class="d-flex justify-content-center align-items-center" style="min-height: 50vh;">
                    <div class="spinner-border text-secondary" role="status" style="width: 3rem; height: 3rem;"></div>
                </div>
            `;
            
            // تنفيذ الدالة مع إرسال البارامترات
            renderFunc(mainContent, params).then(() => {
                // إعادة تفعيل حركات الـ Scroll
                if(typeof window.AOS !== 'undefined') {
                    window.AOS.refresh();
                }
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }).catch(err => {
                console.error("Route Rendering Error:", err);
                mainContent.innerHTML = `<div class="container py-5 text-center text-white"><h3 class="text-danger">حدث خطأ أثناء تحميل الصفحة</h3></div>`;
            });
        }
    }
};