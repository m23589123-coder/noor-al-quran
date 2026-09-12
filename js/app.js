// js/app.js - Ultimate Premium Application Engine (Final Release - Fixed Search & Islamic UI)

import { API } from './api.js';
import { globalPlayer } from './player.js';
import { Router } from './router.js';
import { SettingsManager } from './theme.js';
import { StorageManager } from './storage.js';
import { initCustomCursor } from './cursor.js';

// ==========================================
// 1. نظام حماية الصور المركزي
// ==========================================
window.handleImageError = function(imgElement, type = 'avatar') {
    const fallbackImage = type === 'cover' 
        ? 'https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=1200&q=80'
        : 'assets/images/default-reciter.webp';

    if (imgElement && imgElement.src !== fallbackImage && !imgElement.src.includes('default')) {
        imgElement.onerror = null; 
        imgElement.src = fallbackImage;
    } else {
        imgElement.style.display = 'none';
        if (imgElement.nextElementSibling && imgElement.nextElementSibling.classList.contains('fallback-icon')) {
            imgElement.nextElementSibling.classList.remove('d-none');
        }
    }
};

// ==========================================
// 2. التهيئة الأساسية (Initialization)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

async function initApp() {
    try {
        SettingsManager.init();
        initCustomCursor();
        
        if(typeof window.AOS !== 'undefined') window.AOS.init({ once: true, offset: 50, duration: 800 });
        
        let config = null;
        try { config = await API.getConfig(); } catch(e) {}
        
        if(config && config.developer) {
            const footerText = document.querySelector('footer p.small');
            if(footerText) {
                footerText.innerHTML = `${config.developer.copyright} <br> <span class="fw-bold text-secondary">${config.developer.name}</span>`;
            }
        }

        setupRoutes();
        Router.init();

        if (!window.location.hash || window.location.hash === '') {
            window.location.hash = '#/home';
        }

        document.querySelectorAll('[aria-label="Search"]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                window.location.hash = '#/search';
            });
        });

        if(typeof gsap !== 'undefined') {
            gsap.from(".navbar-brand", { opacity: 0, x: 20, duration: 1, delay: 0.2 });
            gsap.set("#global-player", { y: 100, opacity: 0 }); 
        }
    } catch (error) {
        console.error("Init Error:", error);
    }
}

// ==========================================
// 3. إدارة المسارات
// ==========================================
function setupRoutes() {
    
    // ----------------------------------------
    // مسار الصفحة الرئيسية
    // ----------------------------------------
    const homeRouteHandler = async (container) => {
        try {
            let surahs = [];
            let reciters = [];
            try { surahs = await API.getSurahs(); if(!Array.isArray(surahs)) surahs = []; } catch(e) {}
            try { reciters = await API.getReciters(); if(!Array.isArray(reciters)) reciters = []; } catch(e) {}
            
            const topSurahs = surahs.slice(0, 6);
            const topReciters = reciters.slice(0, 4);

            let homeHtml = `
                <section class="position-relative d-flex align-items-center justify-content-center mb-5 overflow-hidden rounded-4 mt-2 shadow-lg" style="min-height: 75vh; border: 1px solid rgba(212, 175, 55, 0.1);">
                    <div class="position-absolute top-0 start-0 w-100 h-100" style="background: url('https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?auto=format&fit=crop&w=1920&q=80') center/cover; filter: brightness(0.3);"></div>
                    <div class="position-absolute top-50 start-50 translate-middle w-100 h-100" style="background: radial-gradient(circle at center, rgba(212, 175, 55, 0.15) 0%, transparent 60%);"></div>

                    <div class="container z-1 position-relative text-center" data-aos="zoom-out" data-aos-duration="1500">
                        <div class="mx-auto p-4 p-md-5" style="max-width: 850px; border-radius: 30px; background: rgba(12, 38, 28, 0.4); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 1px solid rgba(212, 175, 55, 0.2); box-shadow: 0 20px 50px rgba(0,0,0,0.5);">
                            <div class="d-inline-flex p-3 rounded-circle mb-4 shadow-lg" style="background: linear-gradient(135deg, var(--accent-gold), #8A6D1C);">
                                <i class="fa-solid fa-book-quran text-white" style="font-size: 2.5rem;"></i>
                            </div>
                            <h1 class="fw-bold mb-2" style="font-family: 'Amiri', serif; font-size: 3.5rem; text-shadow: 0 4px 15px rgba(0,0,0,0.5); color: #FFF;">نــور <span style="color: var(--accent-gold);">القــرآن</span></h1>
                            <h2 class="text-white fw-bold mb-4 mt-3 font-cairo" style="font-size: 2rem; text-shadow: 0 2px 10px rgba(0,0,0,0.5);">استمع للقرآن بنقاء وصفاء..</h2>
                            <p class="fs-5 text-light mb-5 font-cairo lh-lg px-md-4" style="opacity: 0.9;">
                                تجربة روحانية تأخذك في رحلة من السكينة والطمأنينة، مع نخبة من كبار قراء العالم الإسلامي في منصة صُممت لتريح العين وتلامس القلب.
                            </p>
                            <div class="d-flex justify-content-center gap-3 flex-wrap">
                                <button class="btn btn-primary-custom rounded-pill px-5 py-3 fw-bold fs-5 shadow-lg d-flex align-items-center gap-2" onclick="window.location.hash='#/quran'"><i class="fa-solid fa-headphones-simple"></i> ابدأ الاستماع</button>
                                <button class="btn btn-outline-light rounded-pill px-5 py-3 fw-bold fs-5 shadow-sm d-flex align-items-center gap-2 bg-glass border-2" onclick="window.location.hash='#/radio'"><i class="fa-solid fa-tower-broadcast text-warning"></i> الإذاعة المباشرة</button>
                            </div>
                        </div>
                    </div>
                </section>

                <section class="container py-5" data-aos="fade-up">
                    <div class="d-flex justify-content-between align-items-end mb-4 border-bottom border-secondary pb-3" style="border-color: rgba(255,255,255,0.05) !important;">
                        <h3 class="fw-bold mb-0 text-white"><i class="fa-solid fa-star text-secondary me-2"></i> سور مختارة</h3>
                        <a href="#/quran" class="text-secondary text-decoration-none fw-bold hover-lift">عرض الكل <i class="fa-solid fa-arrow-left ms-1"></i></a>
                    </div>
                    <div class="row g-4 mb-5">
            `;
            
            if(topSurahs.length > 0) topSurahs.forEach(s => homeHtml += buildSurahCard(s));
            else homeHtml += `<div class="col-12 text-center text-muted-custom">لا توجد بيانات حالياً.</div>`;
            
            homeHtml += `
                    </div>
                    <div class="d-flex justify-content-between align-items-end mb-4 border-bottom border-secondary pb-3 mt-5" style="border-color: rgba(255,255,255,0.05) !important;">
                        <h3 class="fw-bold mb-0 text-white"><i class="fa-solid fa-microphone-lines text-secondary me-2"></i> قراء مميزون</h3>
                        <a href="#/readers" class="text-secondary text-decoration-none fw-bold hover-lift">عرض الكل <i class="fa-solid fa-arrow-left ms-1"></i></a>
                    </div>
                    <div class="row g-4">
            `;
            
            if(topReciters.length > 0) topReciters.forEach(r => homeHtml += buildReciterCard(r));
            
            homeHtml += `</div></section>`;
            container.innerHTML = homeHtml;
            if(topSurahs.length > 0) attachCardEvents(topSurahs, null);
        } catch (error) {
            container.innerHTML = `<div class="alert alert-danger text-center m-5">خطأ في تحميل الصفحة الرئيسية.</div>`;
        }
    };
    Router.addRoute('#/home', homeRouteHandler);
    Router.addRoute('#/', homeRouteHandler);
    Router.addRoute('', homeRouteHandler);

    // ----------------------------------------
    // مسار البحث الشامل (المسار الجديد الفخم) 🔍
    // ----------------------------------------
    Router.addRoute('#/search', async (container) => {
        try {
            let surahs = []; let reciters = [];
            try { surahs = await API.getSurahs(); if(!Array.isArray(surahs)) surahs = []; } catch(e){}
            try { reciters = await API.getReciters(); if(!Array.isArray(reciters)) reciters = []; } catch(e){}
            
            container.innerHTML = `
                <section class="container py-5" data-aos="fade-in">
                    <div class="text-center mb-5">
                        <h2 class="fw-bold text-white mb-3 font-cairo"><i class="fa-solid fa-search text-warning me-2"></i> البحث الشامل</h2>
                        <div class="search-box bg-dark rounded-pill px-4 py-3 d-flex align-items-center mx-auto shadow-lg" style="max-width: 600px; border: 1px solid var(--accent-gold);">
                            <i class="fa-solid fa-search text-warning fs-5 ms-3"></i>
                            <input type="text" id="global-search-input" class="form-control bg-transparent border-0 text-white shadow-none fs-5 font-cairo" placeholder="ابحث عن اسم السورة أو القارئ..." autofocus>
                        </div>
                    </div>
                    <div id="search-results-container" class="d-none">
                        <h4 class="text-white fw-bold mb-4 border-bottom border-secondary pb-2"><i class="fa-solid fa-book-open me-2 text-secondary"></i>النتائج في السور القرآنية</h4>
                        <div class="row g-4 mb-5" id="surahs-results"></div>
                        <h4 class="text-white fw-bold mb-4 border-bottom border-secondary pb-2"><i class="fa-solid fa-users me-2 text-secondary"></i>النتائج في القراء</h4>
                        <div class="row g-4" id="reciters-results"></div>
                    </div>
                    <div id="search-empty-state" class="text-center py-5 text-muted-custom">
                        <i class="fa-solid fa-keyboard fs-1 mb-3 opacity-50" style="font-size: 4rem;"></i>
                        <h5 class="font-cairo">اكتب اسم السورة أو القارئ لعرض النتائج فوراً</h5>
                    </div>
                </section>
            `;

            const input = document.getElementById('global-search-input');
            const resultsContainer = document.getElementById('search-results-container');
            const emptyState = document.getElementById('search-empty-state');
            const surahsResults = document.getElementById('surahs-results');
            const recitersResults = document.getElementById('reciters-results');

            input.addEventListener('input', (e) => {
                const term = e.target.value.toLowerCase().trim();
                if (term === '') {
                    resultsContainer.classList.add('d-none');
                    emptyState.classList.remove('d-none');
                    return;
                }
                resultsContainer.classList.remove('d-none');
                emptyState.classList.add('d-none');

                const filteredSurahs = surahs.filter(s => s.nameArabic.includes(term) || s.nameEnglish.toLowerCase().includes(term));
                surahsResults.innerHTML = filteredSurahs.length > 0 ? filteredSurahs.map(s => buildSurahCard(s)).join('') : '<div class="col-12 text-muted-custom">لا توجد سور مطابقة للبحث.</div>';

                const filteredReciters = reciters.filter(r => r.nameArabic.includes(term));
                recitersResults.innerHTML = filteredReciters.length > 0 ? filteredReciters.map(r => buildReciterCard(r)).join('') : '<div class="col-12 text-muted-custom">لا يوجد قراء مطابقين للبحث.</div>';

                attachCardEvents(surahs, null);
            });
        } catch (error) {
            container.innerHTML = `<div class="alert alert-danger m-5">حدث خطأ في تحميل البحث.</div>`;
        }
    });

    // ----------------------------------------
    // مسار الإذاعة
    // ----------------------------------------
    Router.addRoute('#/radio', async (container) => {
        try {
            let radios = [];
            try { radios = await API.getRadios(); if(!Array.isArray(radios)) radios = []; } catch(e) {}
            
            let html = `
                <section class="container py-5" data-aos="fade-up">
                    <div class="d-flex align-items-center mb-5">
                        <i class="fa-solid fa-radio fs-1 text-warning me-3"></i>
                        <div><h2 class="fw-bold mb-0">إذاعة القرآن الكريم</h2><p class="text-muted-custom mt-1">بث مباشر على مدار الساعة</p></div>
                    </div>
                    <div class="row g-4">
            `;
            if (radios.length > 0) {
                radios.forEach(radio => {
                    html += `
                        <div class="col-md-6 col-lg-3">
                            <div class="card premium-card border-0 text-center p-4 h-100 shadow-sm hover-lift">
                                <div class="position-relative d-inline-block mx-auto mb-4">
                                    <img src="${radio.image || 'assets/images/default-reciter.webp'}" onerror="handleImageError(this, 'avatar')" class="rounded-circle shadow" style="width: 120px; height: 120px; object-fit: cover; border: 4px solid var(--border-color);">
                                </div>
                                <h5 class="fw-bold mb-3">${radio.nameArabic}</h5>
                                <button class="btn btn-primary-custom w-100 rounded-pill py-2 fw-bold play-radio-btn" data-url="${radio.url}" data-name="${radio.nameArabic}" data-image="${radio.image}"><i class="fa-solid fa-play me-2"></i> تشغيل البث</button>
                            </div>
                        </div>
                    `;
                });
            } else { html += `<div class="col-12 text-center py-5 text-muted-custom">لا توجد محطات متاحة حالياً.</div>`; }
            html += `</div></section>`;
            container.innerHTML = html;

            container.querySelectorAll('.play-radio-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const target = e.currentTarget;
                    const radioData = { nameArabic: target.getAttribute('data-name'), url: target.getAttribute('data-url'), image: target.getAttribute('data-image') };
                    if (window.globalPlayer || globalPlayer) {
                        const playerToUse = window.globalPlayer || globalPlayer;
                        playerToUse.playRadio(radioData); showPlayerUI();
                        const originalHtml = target.innerHTML;
                        target.innerHTML = '<i class="fa-solid fa-spinner fa-spin me-2"></i> جاري الاتصال...';
                        setTimeout(() => { target.innerHTML = originalHtml; }, 2000);
                    }
                });
            });
        } catch(e) { container.innerHTML = `<div class="alert alert-danger m-5">خطأ في الإذاعة.</div>`; }
    });

    // ----------------------------------------
    // مسار التفسير
    // ----------------------------------------
    Router.addRoute('#/tafsir', async (container) => {
        const surahsList = ["الفاتحة","البقرة","آل عمران","النساء","المائدة","الأنعام","الأعراف","الأنفال","التوبة","يونس","هود","يوسف","الرعد","إبراهيم","الحجر","النحل","الإسراء","الكهف","مريم","طه","الأنبياء","الحج","المؤمنون","النور","الفرقان","الشعراء","النمل","القصص","العنكبوت","الروم","لقمان","السجدة","الأحزاب","سبأ","فاطر","يس","الصافات","ص","الزمر","غافر","فصلت","الشورى","الزخرف","الدخان","الجاثية","الأحقاف","محمد","الفتح","الحجرات","ق","الذاريات","الطور","النجم","القمر","الرحمن","الواقعة","الحديد","المجادلة","الحشر","الممتحنة","الصف","الجمعة","المنافقون","التغابن","الطلاق","التحريم","الملك","القلم","الحاقة","المعارج","نوح","الجن","المزمل","المدثر","القيامة","الإنسان","المرسلات","النبأ","النازعات","عبس","التكوير","الانفطار","المطففين","الانشقاق","البروج","الطارق","الأعلى","الغاشية","الفجر","البلد","الشمس","الليل","الضحى","الشرح","التين","العلق","القدر","البينة","الزلزلة","العاديات","القارعة","التكاثر","العصر","الهمزة","الفيل","قريش","الماعون","الكوثر","الكافرون","النصر","المسد","الإخلاص","الفلق","الناس"];
        let optionsHtml = '<option value="" disabled selected style="color: #000;">-- ابحث واختر السورة لعرض التفسير --</option>';
        surahsList.forEach((name, index) => { optionsHtml += `<option value="${index + 1}" style="color: #000;">${index + 1}. سورة ${name}</option>`; });

        let tafsirHtml = `
            <section class="container py-5" data-aos="fade-in">
                <div class="position-relative rounded-4 overflow-hidden mb-5 shadow-lg d-flex align-items-center justify-content-center" style="height: 250px; background: linear-gradient(135deg, rgba(7,26,19,0.9), rgba(212,175,55,0.2)), url('https://images.unsplash.com/photo-1585036156171-384164a8c675?auto=format&fit=crop&w=1200&q=80') center/cover;">
                    <div class="text-center z-1 position-relative px-3"><i class="fa-solid fa-book-open-reader text-warning mb-3" style="font-size: 3rem;"></i><h1 class="fw-bold text-white font-cairo mb-2">موسوعة التفسير</h1><p class="text-light fs-5 mb-0 font-inter">اكتشف معاني القرآن الكريم من أوثق التفاسير المعتمدة</p></div>
                </div>
                <div class="row justify-content-center mb-5" data-aos="fade-up">
                    <div class="col-lg-8">
                        <div class="card bg-glass border-0 shadow-lg p-4 rounded-4" style="border: 1px solid rgba(212,175,55,0.2) !important;">
                            <div class="d-flex align-items-center bg-dark rounded-pill px-3 py-2 border border-secondary shadow-inner">
                                <i class="fa-solid fa-magnifying-glass text-warning me-3 ms-2 fs-5"></i>
                                <select id="surahSelect" class="form-select bg-transparent text-white border-0 shadow-none fs-5 py-2 font-cairo fw-bold" style="cursor: pointer;">${optionsHtml}</select>
                            </div>
                        </div>
                    </div>
                </div>
                <div id="tafsirContentArea" class="d-none slide-up-animation">
                    <ul class="nav nav-pills justify-content-center mb-4 gap-2 gap-md-3 custom-pills" id="tafsirTabs" role="tablist">
                        <li class="nav-item"><button class="nav-link active rounded-pill px-4 py-2 fw-bold shadow-sm" data-book="ar.muyassar">التفسير الميسر</button></li>
                        <li class="nav-item"><button class="nav-link rounded-pill px-4 py-2 fw-bold shadow-sm" data-book="ar.jalalayn">تفسير الجلالين</button></li>
                    </ul>
                    <div class="card bg-glass text-white border-0 shadow-lg p-4 p-md-5 rounded-4 position-relative overflow-hidden" style="border-top: 4px solid var(--accent-gold) !important;">
                        <div class="position-absolute top-0 end-0 p-3 d-flex gap-2 bg-dark rounded-bottom-4 shadow ms-4">
                            <button class="btn btn-outline-warning btn-sm rounded-circle" id="increaseFont" title="تكبير الخط" style="width: 35px; height: 35px;"><i class="fa-solid fa-plus"></i></button>
                            <button class="btn btn-outline-warning btn-sm rounded-circle" id="decreaseFont" title="تصغير الخط" style="width: 35px; height: 35px;"><i class="fa-solid fa-minus"></i></button>
                        </div>
                        <div class="text-center mb-4 mt-3"><h2 class="fw-bold text-warning font-cairo border-bottom border-secondary d-inline-block pb-3 px-5" id="tafsirTitle"></h2></div>
                        <div id="tafsirLoader" class="text-center py-5 d-none"><div class="spinner-border text-warning mb-3" role="status" style="width: 3rem; height: 3rem;"></div><h5 class="font-cairo" id="loaderText">جاري جلب التفسير...</h5></div>
                        <div id="tafsirText" class="px-md-4 py-3" style="transition: all 0.3s ease; min-height: 300px; font-family: 'Amiri', serif; font-size: 1.5rem; line-height: 2.2 !important; text-align: justify;"></div>
                    </div>
                </div>
            </section>
        `;
        container.innerHTML = tafsirHtml;

        let currentFontSize = 1.5; let currentSurahId = null; let currentBook = 'ar.muyassar'; 
        const textEl = document.getElementById('tafsirText'); const loaderEl = document.getElementById('tafsirLoader'); const loaderText = document.getElementById('loaderText');

        const fetchTafsir = async () => {
            if(!currentSurahId) return;
            textEl.innerHTML = ''; loaderEl.classList.remove('d-none'); loaderText.innerText = "جاري جلب التفسير...";
            try {
                const response = await fetch(`https://api.alquran.cloud/v1/sura/${currentSurahId}/${currentBook}`);
                if(!response.ok) throw new Error("Primary API Failed");
                const jsonResponse = await response.json(); let htmlContent = '';
                if(jsonResponse.code === 200 && jsonResponse.data && jsonResponse.data.ayahs) {
                    jsonResponse.data.ayahs.forEach(ayah => {
                        htmlContent += `<div class="mb-5 pb-3 border-bottom border-secondary" style="border-color: rgba(255,255,255,0.05) !important;"><div class="d-flex align-items-center justify-content-between mb-3"><span class="badge bg-warning text-dark rounded-pill px-3 py-2 fs-6"><i class="fa-solid fa-book-quran me-1"></i> الآية ${ayah.numberInSurah}</span><button class="btn btn-sm btn-glass rounded-circle copy-ayah-btn shadow-sm" data-text="${ayah.text}"><i class="fa-solid fa-copy text-secondary"></i></button></div><p class="text-white m-0 lh-lg">${ayah.text}</p></div>`;
                    });
                    textEl.innerHTML = htmlContent;
                } else throw new Error("No Data");
            } catch (error) {
                try {
                    const backupResponse = await fetch(`https://quranenc.com/api/v1/translation/sura/arabic_moyassar/${currentSurahId}`);
                    if(!backupResponse.ok) throw new Error("Backup API Failed");
                    const backupData = await backupResponse.json(); let htmlContent = '';
                    if(backupData.result && backupData.result.length > 0) {
                        backupData.result.forEach(ayah => {
                            htmlContent += `<div class="mb-5 pb-3 border-bottom border-secondary" style="border-color: rgba(255,255,255,0.05) !important;"><div class="d-flex align-items-center justify-content-between mb-3"><span class="badge bg-warning text-dark rounded-pill px-3 py-2 fs-6"><i class="fa-solid fa-book-quran me-1"></i> الآية ${ayah.aya}</span><button class="btn btn-sm btn-glass rounded-circle copy-ayah-btn shadow-sm" data-text="${ayah.translation}"><i class="fa-solid fa-copy text-secondary"></i></button></div><p class="text-white m-0 lh-lg">${ayah.translation}</p></div>`;
                        });
                        textEl.innerHTML = htmlContent;
                    } else throw new Error("No Data");
                } catch (backupError) {
                    textEl.innerHTML = `<div class="text-center py-5 text-muted-custom"><i class="fa-solid fa-wifi fs-1 mb-4 text-secondary"></i><h4 class="font-cairo">عذراً، الاتصال بخوادم التفسير محظور من شبكتك الحالية.</h4></div>`;
                }
            } finally {
                loaderEl.classList.add('d-none'); 
                document.querySelectorAll('.copy-ayah-btn').forEach(btn => {
                    btn.addEventListener('click', () => { navigator.clipboard.writeText(btn.getAttribute('data-text')).then(() => { if(window.StorageManager) StorageManager.showToast('تم نسخ التفسير بنجاح ✅'); else alert('تم نسخ التفسير بنجاح ✅'); }); });
                });
            }
        };

        document.getElementById('surahSelect').addEventListener('change', (e) => { currentSurahId = e.target.value; document.getElementById('tafsirContentArea').classList.remove('d-none'); document.getElementById('tafsirTitle').textContent = `تفسير سورة ${surahsList[currentSurahId - 1]}`; fetchTafsir(); });
        document.querySelectorAll('#tafsirTabs .nav-link').forEach(tab => { tab.addEventListener('click', (e) => { document.querySelectorAll('#tafsirTabs .nav-link').forEach(t => t.classList.remove('active')); tab.classList.add('active'); currentBook = e.target.getAttribute('data-book'); fetchTafsir(); }); });
        document.getElementById('increaseFont').addEventListener('click', () => { if(currentFontSize < 3) currentFontSize += 0.2; document.getElementById('tafsirText').style.fontSize = `${currentFontSize}rem`; });
        document.getElementById('decreaseFont').addEventListener('click', () => { if(currentFontSize > 1) currentFontSize -= 0.2; document.getElementById('tafsirText').style.fontSize = `${currentFontSize}rem`; });
    });

    // ----------------------------------------
    // مسار الأذكار (Azkar)
    // ----------------------------------------
    Router.addRoute('#/azkar', async (container) => {
        try {
            const azkarData = (await API.getAzkar().catch(() => [])) || [];
            let azkarHtml = `<section class="container py-5" data-aos="fade-in"><div class="position-relative rounded-4 overflow-hidden mb-5 shadow-lg d-flex align-items-center justify-content-center" style="height: 250px; background: linear-gradient(135deg, rgba(7,26,19,0.9), rgba(212,175,55,0.3)), url('https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&w=1200&q=80') center/cover;"><div class="text-center z-1 position-relative px-3"><i class="fa-solid fa-hands-praying text-warning mb-3" style="font-size: 3.5rem;"></i><h1 class="fw-bold text-white font-cairo mb-2">حصن المسلم</h1></div></div><ul class="nav nav-pills justify-content-center mb-5 gap-2 custom-pills" id="azkarTabs" role="tablist">`;
            azkarData.forEach((cat, index) => { azkarHtml += `<li class="nav-item"><button class="nav-link ${index === 0 ? 'active' : ''} rounded-pill px-4 py-2 fw-bold font-cairo shadow-sm" data-bs-toggle="pill" data-bs-target="#azkar-cat-${index}"><i class="fa-solid ${cat.icon || 'fa-star'} me-2"></i> ${cat.title}</button></li>`; });
            azkarHtml += `</ul><div class="tab-content" id="azkarTabContent">`;
            azkarData.forEach((cat, index) => {
                azkarHtml += `<div class="tab-pane fade ${index === 0 ? 'show active' : ''}" id="azkar-cat-${index}"><div class="row g-4 justify-content-center">`;
                cat.items.forEach((item, itemIdx) => {
                    const count = item.count || 1;
                    azkarHtml += `<div class="col-lg-8" data-aos="fade-up" data-aos-delay="${itemIdx * 50}"><div class="card bg-glass text-white border-0 shadow-sm p-0 rounded-4 premium-card zikr-interactive-card" data-count="${count}" style="cursor: pointer; border-right: 5px solid var(--accent-gold) !important; overflow: hidden; position: relative;"><div class="zikr-progress position-absolute top-0 end-0 h-100" style="width: 0%; background: rgba(212, 175, 55, 0.15); transition: width 0.3s ease; z-index: 0;"></div><div class="p-4 p-md-5 position-relative z-1 text-center"><p class="fs-4 lh-lg mb-4 font-cairo">${item.text}</p><div class="d-flex justify-content-between align-items-center mt-4 pt-3 border-top border-secondary"><button class="btn btn-glass btn-sm rounded-circle copy-zikr-btn" data-text="${item.text}"><i class="fa-solid fa-copy text-secondary"></i></button><div class="d-flex align-items-center gap-3"><span class="text-muted-custom small">اضغط للتسبيح</span><div class="bg-dark rounded-pill px-4 py-2 border border-warning shadow d-flex align-items-center gap-2"><i class="fa-solid fa-arrows-rotate text-warning"></i><span class="fw-bold fs-5 zikr-count-display">${count}</span></div></div></div></div><div class="done-overlay position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center opacity-0" style="background: rgba(12, 38, 28, 0.85); transition: all 0.4s ease; z-index: 2;"><div class="text-center"><i class="fa-solid fa-circle-check text-success mb-2" style="font-size: 4rem;"></i><h4 class="font-cairo fw-bold text-white">اكتمل</h4></div></div></div></div>`;
                });
                azkarHtml += `</div></div>`;
            });
            azkarHtml += `</div></section>`;
            container.innerHTML = azkarHtml;

            document.querySelectorAll('.zikr-interactive-card').forEach(card => {
                let currentCount = parseInt(card.getAttribute('data-count'));
                const initialCount = currentCount;
                card.addEventListener('click', (e) => {
                    if(e.target.closest('.copy-zikr-btn')) return;
                    if (currentCount > 0) {
                        currentCount--; card.querySelector('.zikr-count-display').innerText = currentCount;
                        card.querySelector('.zikr-progress').style.width = `${((initialCount - currentCount) / initialCount) * 100}%`;
                        card.style.transform = 'scale(0.98)'; setTimeout(() => card.style.transform = 'scale(1)', 100);
                        if (currentCount === 0) { card.querySelector('.done-overlay').classList.remove('opacity-0'); if(window.navigator && window.navigator.vibrate) window.navigator.vibrate(50); }
                    }
                });
            });
            document.querySelectorAll('.copy-zikr-btn').forEach(btn => { btn.addEventListener('click', (e) => { e.stopPropagation(); navigator.clipboard.writeText(btn.getAttribute('data-text')).then(() => { StorageManager.showToast('تم نسخ الذكر بنجاح 📋'); }); }); });
        } catch (error) { container.innerHTML = `<div class="alert alert-danger m-5">حدث خطأ في تحميل الأذكار.</div>`; }
    });

    // ----------------------------------------
    // مسار الفئات والقوائم (Playlists)
    // ----------------------------------------
    const playlistsRouteHandler = async (container) => {
        try {
            let collections = []; let appPlaylists = [];
            try { collections = await API.getCollections(); if(!Array.isArray(collections)) collections = []; } catch(e) {}
            try { appPlaylists = await API.getPlaylists(); if(!Array.isArray(appPlaylists)) appPlaylists = []; } catch(e) {}
            const userPlaylists = StorageManager.getPlaylists() || {};

            let html = `
                <section class="container py-4" data-aos="fade-in">
                    <div class="position-relative rounded-4 overflow-hidden mb-5 shadow-lg d-flex align-items-center justify-content-center" style="height: 280px; background: linear-gradient(135deg, rgba(7,26,19,0.9), rgba(212,175,55,0.3)), url('https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?auto=format&fit=crop&w=1200&q=80') center/cover;">
                        <div class="text-center z-1 position-relative px-3"><div class="d-inline-flex p-3 rounded-circle mb-3 shadow" style="background: rgba(212, 175, 55, 0.2);"><i class="fa-solid fa-layer-group text-warning" style="font-size: 2.5rem;"></i></div><h1 class="fw-bold text-white font-cairo mb-2">القوائم والفئات الخاصة</h1></div>
                    </div>
                    <ul class="nav nav-pills justify-content-center mb-5 gap-2 custom-pills" id="playlistTabs" role="tablist">
                        <li class="nav-item"><button class="nav-link active rounded-pill px-4 py-2 fw-bold font-cairo shadow-sm" data-bs-toggle="pill" data-bs-target="#tab-collections"><i class="fa-solid fa-tags me-2"></i> المناسبات</button></li>
                        <li class="nav-item"><button class="nav-link rounded-pill px-4 py-2 fw-bold font-cairo shadow-sm" data-bs-toggle="pill" data-bs-target="#tab-app-playlists"><i class="fa-solid fa-star me-2"></i> مختارات المنصة</button></li>
                        <li class="nav-item"><button class="nav-link rounded-pill px-4 py-2 fw-bold font-cairo shadow-sm" data-bs-toggle="pill" data-bs-target="#tab-user-playlists"><i class="fa-solid fa-bookmark me-2"></i> قوائمي الخاصة</button></li>
                    </ul>
                    <style>.custom-pills .nav-link { color: var(--text-secondary); background: var(--surface); border: 1px solid var(--border-color); } .custom-pills .nav-link.active { background: var(--accent-gold); color: #fff; border-color: var(--accent-gold); }</style>
                    <div class="tab-content" id="pills-tabContent">
            `;

            html += `<div class="tab-pane fade show active" id="tab-collections"><div class="row g-4">`;
            if (collections.length > 0) {
                collections.forEach(cat => { html += `<div class="col-lg-4 col-md-6" data-aos="fade-up"><div class="card bg-glass text-white border-0 shadow-sm text-center h-100 premium-card playlist-card overflow-hidden" onclick="window.location.hash='#/collection?id=${cat.id}'" style="cursor: pointer; border-bottom: 4px solid var(--accent-gold) !important; border-radius: 20px;"><div class="position-absolute w-100 h-100 top-0 start-0" style="background: url('https://images.unsplash.com/photo-1574044943916-2581699f8c65?auto=format&fit=crop&w=800&q=80') center/cover; opacity: 0.15;"></div><div class="position-relative z-1 p-5 d-flex flex-column align-items-center justify-content-center h-100"><div class="p-3 rounded-circle mb-3" style="background: rgba(212, 175, 55, 0.15);"><i class="fa-solid ${cat.icon || 'fa-folder'} text-warning" style="font-size: 2.5rem;"></i></div><h4 class="fw-bold font-cairo mb-2">${cat.title}</h4></div></div></div>`; });
            } else { html += `<div class="col-12 text-center text-muted-custom">لا توجد فئات حالياً</div>`; }
            html += `</div></div>`;

            html += `<div class="tab-pane fade" id="tab-app-playlists"><div class="row g-4">`;
            if (appPlaylists.length > 0) {
                appPlaylists.forEach(pl => { html += `<div class="col-lg-4 col-md-6"><div class="card bg-glass border-0 rounded-4 overflow-hidden h-100 shadow-sm premium-card" onclick="window.location.hash='#/playlist?id=${pl.id}'" style="cursor:pointer;"><img src="${pl.cover}" onerror="handleImageError(this, 'cover')" class="w-100 object-fit-cover" style="height: 180px;"><div class="p-3"><h5 class="fw-bold text-white mb-0 font-cairo">${pl.title}</h5></div></div></div>`; });
            } else { html += `<div class="col-12 text-center text-muted-custom">لا توجد قوائم حالياً</div>`; }
            html += `</div></div>`;

            html += `<div class="tab-pane fade" id="tab-user-playlists"><div class="row g-4">`;
            if (Object.keys(userPlaylists).length > 0) {
                Object.keys(userPlaylists).forEach(key => { if(userPlaylists[key].items.length > 0) { html += `<div class="col-lg-4 col-md-6"><div class="card bg-glass border-0 rounded-4 p-4 h-100 shadow-sm premium-card" onclick="window.location.hash='#/user-playlist?id=${key}'" style="cursor:pointer; border-right: 4px solid var(--accent-gold) !important;"><h5 class="fw-bold text-white font-cairo">${userPlaylists[key].name}</h5><span class="badge bg-secondary text-dark rounded-pill">${userPlaylists[key].items.length} مقطع</span></div></div>`; } });
            } else { html += `<div class="col-12 text-center text-muted-custom">لا توجد قوائم خاصة بك</div>`; }
            html += `</div></div></div></section>`;
            container.innerHTML = html;
        } catch(e) {}
    };
    Router.addRoute('#/playlists', playlistsRouteHandler);
    Router.addRoute('#/categories', playlistsRouteHandler);

    // ----------------------------------------
    // مسار القرآن والقراء
    // ----------------------------------------
    Router.addRoute('#/quran', async (container) => {
        try {
            let surahs = []; let reciters = [];
            try { surahs = await API.getSurahs(); if(!Array.isArray(surahs)) surahs = []; } catch(e){}
            try { reciters = await API.getReciters(); if(!Array.isArray(reciters)) reciters = []; } catch(e){}
            
            let quranHtml = `
                <section class="container py-5" data-aos="fade-in">
                    <div class="d-flex justify-content-between align-items-center mb-5 flex-wrap gap-3">
                        <div><h2 class="fw-bold text-white mb-1">القرآن الكريم</h2></div>
                        <div class="search-box glass-nav rounded-pill px-3 py-2 d-flex align-items-center w-100" style="max-width: 300px;"><i class="fa-solid fa-search text-muted-custom ms-2"></i><input type="text" id="surah-search" class="form-control bg-transparent border-0 text-white shadow-none" placeholder="بحث عن سورة..."></div>
                    </div>
                    <div class="row g-4">`;
            surahs.forEach(s => quranHtml += buildSurahCard(s));
            quranHtml += `</div></section>`;
            container.innerHTML = quranHtml;

            if(surahs.length > 0) attachCardEvents(surahs, null);

            document.getElementById('surah-search').addEventListener('input', (e) => {
                const term = e.target.value.toLowerCase();
                document.querySelectorAll('.surah-item-card').forEach(card => {
                    const name = card.getAttribute('data-name');
                    card.style.display = name.includes(term) ? 'block' : 'none';
                });
            });
        } catch(e) {}
    });

    Router.addRoute('#/readers', async (container) => {
        try {
            let reciters = [];
            try { reciters = await API.getReciters(); if(!Array.isArray(reciters)) reciters = []; } catch(e){}
            let readersHtml = `
                <section class="container py-5" data-aos="fade-in">
                    <div class="d-flex justify-content-between align-items-center mb-5 flex-wrap gap-3">
                        <div><h2 class="fw-bold text-white mb-1">القراء</h2><p class="text-muted-custom mb-0">أكثر من 200 قارئ من جميع أنحاء العالم</p></div>
                        <div class="search-box glass-nav rounded-pill px-3 py-2 d-flex align-items-center w-100" style="max-width: 300px;"><i class="fa-solid fa-search text-muted-custom ms-2"></i><input type="text" id="reader-search" class="form-control bg-transparent border-0 text-white shadow-none" placeholder="ابحث عن قارئ..."></div>
                    </div>
                    <div class="row g-4">`;
            reciters.forEach(r => readersHtml += buildReciterCard(r));
            readersHtml += `</div></section>`;
            container.innerHTML = readersHtml;

            document.getElementById('reader-search').addEventListener('input', (e) => {
                const term = e.target.value.toLowerCase();
                document.querySelectorAll('.reciter-item-card').forEach(card => {
                    const name = card.getAttribute('data-name').toLowerCase();
                    card.style.display = name.includes(term) ? 'block' : 'none';
                });
            });
        } catch(e) {}
    });

    // ----------------------------------------
    // مسار صفحة القارئ 🎙️
    // ----------------------------------------
    Router.addRoute('#/reader', async (container) => {
        try {
            const reciterId = localStorage.getItem('current_view_reciter');
            if (!reciterId) { window.location.hash = '#/readers'; return; }

            let reciters = await API.getReciters();
            const reciter = reciters.find(r => String(r.id) === String(reciterId));
            if (!reciter) { container.innerHTML = `<div class="alert alert-danger m-5">القارئ غير موجود.</div>`; return; }

            localStorage.setItem('last_reciter_id', reciter.id);
            let surahs = await API.getSurahs();
            
            let readerHtml = `
                <section class="container py-5" data-aos="fade-in">
                    <div class="card bg-glass border-0 rounded-4 p-4 p-md-5 mb-5 shadow-lg overflow-hidden position-relative">
                        <div class="position-absolute top-0 start-0 w-100 h-100" style="background: url('${reciter.displayPhoto}') center/cover; opacity: 0.15; filter: blur(15px);"></div>
                        <div class="row align-items-center position-relative z-1">
                            <div class="col-md-3 text-center mb-4 mb-md-0">
                                <img src="${reciter.displayPhoto}" onerror="handleImageError(this)" class="rounded-4 shadow-lg border border-warning" style="width: 200px; height: 200px; object-fit: cover; border-width: 3px !important;">
                            </div>
                            <div class="col-md-9 text-center text-md-end">
                                <h1 class="fw-bold text-white mb-2 font-cairo text-shadow">${reciter.nameArabic}</h1>
                                <p class="text-muted-custom fs-5 mb-3">${reciter.style}</p>
                                <span class="badge bg-secondary text-dark rounded-pill px-4 py-2 fs-6"><i class="fa-solid fa-list-ol me-2"></i> ${surahs.length} سورة</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="d-flex justify-content-between align-items-center mb-4">
                        <h4 class="fw-bold text-white mb-0">التلاوات</h4>
                        <div class="search-box glass-nav rounded-pill px-3 py-2 d-flex align-items-center w-100" style="max-width: 300px;">
                            <i class="fa-solid fa-search text-muted-custom ms-2"></i>
                            <input type="text" id="reader-surah-search" class="form-control bg-transparent border-0 text-white shadow-none" placeholder="بحث عن سورة...">
                        </div>
                    </div>
                    <div class="row g-4" id="reader-surahs-container">
            `;
            surahs.forEach(s => readerHtml += buildSurahCard(s));
            readerHtml += `</div></section>`;
            container.innerHTML = readerHtml;
            
            attachCardEvents(surahs, reciter);

            document.getElementById('reader-surah-search').addEventListener('input', (e) => {
                const term = e.target.value.toLowerCase();
                container.querySelectorAll('.surah-item-card').forEach(card => {
                    const name = card.getAttribute('data-name');
                    card.style.display = name.includes(term) ? 'block' : 'none';
                });
            });

        } catch (error) {
            container.innerHTML = `<div class="alert alert-danger m-5">خطأ في تحميل صفحة القارئ.</div>`;
        }
    });

    // ----------------------------------------
    // مسار المكتبة المصرية
    // ----------------------------------------
    Router.addRoute('#/egyptian', async (container) => {
        try {
            let reciters = await API.getReciters();
            if(!Array.isArray(reciters)) reciters = [];
            const egyptianReciters = reciters.filter(r => r.isEgyptianLibrary);

            let egyHtml = `
                <section class="container py-5" data-aos="fade-in">
                    <div class="card bg-glass border-0 rounded-4 p-5 mb-5 shadow-lg text-center" style="background: linear-gradient(45deg, rgba(22, 49, 38, 0.8), rgba(200, 167, 90, 0.2)); border: 1px solid var(--secondary-color) !important;">
                        <i class="fa-solid fa-landmark text-secondary mb-3" style="font-size: 4rem;"></i>
                        <h1 class="fw-bold text-white font-cairo mb-3">مكتبة العمالقة المصريين</h1>
                        <p class="text-muted-custom fs-5 mb-0" style="max-width: 700px; margin: auto;">أرشيف حصري يضم أساطير التلاوة والمجود.</p>
                    </div>
                    <div class="row g-4">
            `;
            egyptianReciters.forEach(r => egyHtml += buildReciterCard(r));
            egyHtml += `</div></section>`;
            container.innerHTML = egyHtml;
        } catch(e) {}
    });

    // ----------------------------------------
    // مسار الإحصائيات (User Dashboard)
    // ----------------------------------------
    Router.addRoute('#/dashboard', (container) => {
        const history = StorageManager.getHistory() || [];
        let totalListens = history.length;
        let mostPlayedSurah = "غير متوفر";
        let mostPlayedReciter = "غير متوفر";

        if(totalListens > 0) {
            const surahCounts = {}; const reciterCounts = {};
            history.forEach(item => {
                if(item.surah && item.surah.nameArabic) surahCounts[item.surah.nameArabic] = (surahCounts[item.surah.nameArabic] || 0) + 1;
                if(item.reciter && item.reciter.nameArabic) reciterCounts[item.reciter.nameArabic] = (reciterCounts[item.reciter.nameArabic] || 0) + 1;
            });
            mostPlayedSurah = Object.keys(surahCounts).reduce((a, b) => surahCounts[a] > surahCounts[b] ? a : b);
            mostPlayedReciter = Object.keys(reciterCounts).reduce((a, b) => reciterCounts[a] > reciterCounts[b] ? a : b);
        }

        container.innerHTML = `
            <section class="container py-5" data-aos="fade-in">
                <div class="text-center mb-5">
                    <h2 class="fw-bold text-white mb-2"><i class="fa-solid fa-chart-pie text-warning me-2"></i> إحصائيات نشاطك</h2>
                    <p class="text-muted-custom">تتبع تقدمك في استماع القرآن الكريم</p>
                </div>
                <div class="row g-4 mb-5">
                    <div class="col-md-4"><div class="card bg-glass border-0 rounded-4 p-4 text-center shadow-lg"><i class="fa-solid fa-headphones text-secondary mb-3 fs-1"></i><h3 class="fw-bold text-white mb-1">${totalListens}</h3><p class="text-muted-custom mb-0">المقاطع المستمعة</p></div></div>
                    <div class="col-md-4"><div class="card bg-glass border-0 rounded-4 p-4 text-center shadow-lg"><i class="fa-solid fa-book-quran text-secondary mb-3 fs-1"></i><h3 class="fw-bold text-white mb-1 font-cairo text-truncate">${mostPlayedSurah}</h3><p class="text-muted-custom mb-0">أكثر سورة استماعاً</p></div></div>
                    <div class="col-md-4"><div class="card bg-glass border-0 rounded-4 p-4 text-center shadow-lg"><i class="fa-solid fa-microphone-lines text-secondary mb-3 fs-1"></i><h3 class="fw-bold text-white mb-1 font-cairo text-truncate">${mostPlayedReciter}</h3><p class="text-muted-custom mb-0">القارئ المفضل</p></div></div>
                </div>
                <div class="card bg-glass border-0 rounded-4 p-4 p-md-5 shadow-lg"><h4 class="fw-bold text-white mb-4 font-cairo">نشاطك الأخير</h4><canvas id="listeningChart" height="100"></canvas></div>
            </section>
        `;
        setTimeout(() => {
            const ctx = document.getElementById('listeningChart');
            if(ctx && window.Chart) {
                new Chart(ctx, { type: 'bar', data: { labels: ['اليوم', 'أمس', 'منذ يومين', 'منذ 3 أيام', 'منذ 4 أيام'], datasets: [{ label: 'عدد التلاوات', data: [totalListens > 5 ? 5 : totalListens, 3, 2, 4, 1], backgroundColor: 'rgba(212, 175, 55, 0.7)', borderColor: 'rgba(212, 175, 55, 1)', borderWidth: 1, borderRadius: 10 }] }, options: { scales: { y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#bbb' } }, x: { grid: { display: false }, ticks: { color: '#bbb' } } }, plugins: { legend: { labels: { color: '#fff' } } } } });
            }
        }, 300);
    });

    // ----------------------------------------
    // مسار بوصلة القبلة الذكية (التصميم الفخم)
    // ----------------------------------------
    Router.addRoute('#/qibla', (container) => {
        container.innerHTML = `
            <section class="container py-5 text-center" data-aos="fade-in">
                <div class="mb-5">
                    <h2 class="fw-bold text-white mb-2"><i class="fa-solid fa-kaaba text-warning me-2"></i> اتجاه القبلة</h2>
                    <p class="text-muted-custom">حدد اتجاه القبلة بدقة باستخدام مستشعرات هاتفك</p>
                </div>
                <div class="card bg-glass border-0 rounded-4 p-4 p-md-5 mx-auto shadow-lg position-relative overflow-hidden" style="max-width: 450px; border: 1px solid rgba(212,175,55,0.2) !important;">
                    <div id="qibla-compass-container" class="position-relative d-flex justify-content-center align-items-center mx-auto mb-4" style="width: 280px; height: 280px; border-radius: 50%; background: radial-gradient(circle, rgba(12,38,28,0.9) 0%, rgba(4,16,12,1) 100%); border: 6px solid rgba(212, 175, 55, 0.2); box-shadow: 0 0 40px rgba(212, 175, 55, 0.15), inset 0 0 30px rgba(0,0,0,0.8); transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);">
                        <div class="position-absolute w-100 h-100 rounded-circle" style="border: 2px dashed rgba(212, 175, 55, 0.3); padding: 15px; transform: scale(0.9);"></div>
                        <div id="compass-rose" class="position-absolute w-100 h-100 d-flex flex-column align-items-center justify-content-between py-3" style="transition: transform 0.2s ease-out; z-index: 5;">
                            <span class="text-danger fw-bold fs-3 font-inter" style="text-shadow: 0 0 10px red;">N</span>
                            <div class="d-flex w-100 justify-content-between px-3 position-absolute top-50 translate-middle-y"><span class="text-white fw-bold fs-5 font-inter opacity-50">W</span><span class="text-white fw-bold fs-5 font-inter opacity-50">E</span></div>
                            <span class="text-white fw-bold fs-5 font-inter opacity-50">S</span>
                        </div>
                        <div id="qibla-arrow" class="position-absolute d-flex flex-column align-items-center justify-content-start" style="width: 100%; height: 100%; transition: transform 0.2s ease-out; z-index: 10;">
                            <div class="d-flex flex-column align-items-center" style="transform: translateY(-20px);">
                                <div class="bg-dark rounded p-2 shadow-lg mb-1 d-flex align-items-center justify-content-center" style="border: 2px solid var(--accent-gold); width: 60px; height: 60px;"><i class="fa-solid fa-kaaba" style="font-size: 2.5rem; color: var(--accent-gold);"></i></div>
                                <i class="fa-solid fa-caret-down" style="font-size: 2rem; color: var(--accent-gold); text-shadow: 0 5px 10px rgba(0,0,0,0.5); transform: translateY(-10px);"></i>
                            </div>
                        </div>
                        <div class="rounded-circle position-relative" style="width: 16px; height: 16px; background: var(--accent-gold); box-shadow: 0 0 15px rgba(212,175,55,1); z-index: 11; border: 3px solid #111;"></div>
                    </div>
                    <div id="qibla-status" class="mt-3 mb-4 text-white font-cairo fs-5">جاري التحقق من المستشعرات...</div>
                    <button class="btn btn-primary-custom rounded-pill w-100 py-3 fw-bold fs-5 shadow-lg" id="start-compass-btn"><i class="fa-solid fa-location-crosshairs me-2"></i> تحديد القبلة الآن</button>
                </div>
            </section>
        `;
        const btn = document.getElementById('start-compass-btn'); const status = document.getElementById('qibla-status'); const compassRose = document.getElementById('compass-rose'); const qiblaArrow = document.getElementById('qibla-arrow');
        btn.addEventListener('click', () => {
            status.innerText = "جاري الاتصال بالأقمار الصناعية...";
            if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
                DeviceOrientationEvent.requestPermission().then(permissionState => { if (permissionState === 'granted') getLocation(); else status.innerText = "تم رفض إذن البوصلة."; }).catch(console.error);
            } else { getLocation(); }
        });
        function getLocation() {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(position => {
                    const lat = position.coords.latitude * Math.PI / 180.0; const lng = position.coords.longitude * Math.PI / 180.0;
                    const MECCA_LAT = 21.422487 * Math.PI / 180.0; const MECCA_LNG = 39.826206 * Math.PI / 180.0;
                    let qiblaHeading = Math.atan2(Math.sin(MECCA_LNG - lng), Math.cos(lat) * Math.tan(MECCA_LAT) - Math.sin(lat) * Math.cos(MECCA_LNG - lng));
                    qiblaHeading = (qiblaHeading * 180.0 / Math.PI + 360) % 360;
                    status.innerHTML = `<span class="text-success"><i class="fa-solid fa-check-circle me-1"></i> تمت المطابقة! ضع الموبايل مسطحاً ولفه مع الكعبة.</span>`;
                    window.addEventListener("deviceorientationabsolute", (event) => handleOrientation(event, qiblaHeading), true); window.addEventListener("deviceorientation", (event) => handleOrientation(event, qiblaHeading), true);
                }, () => { status.innerHTML = `<span class="text-danger"><i class="fa-solid fa-triangle-exclamation me-1"></i> يرجى تشغيل الـ GPS (الموقع)</span>`; });
            }
        }
        function handleOrientation(event, qiblaAngle) {
            let compass = event.webkitCompassHeading || Math.abs(event.alpha - 360);
            if (compass) { compassRose.style.transform = `rotate(${-compass}deg)`; qiblaArrow.style.transform = `rotate(${qiblaAngle - compass}deg)`; }
        }
    });

    // ----------------------------------------
    // مسار الإعدادات (Settings)
    // ----------------------------------------
    Router.addRoute('#/settings', (container) => {
        const currentTheme = SettingsManager.getSetting('theme');
        const autoPlay = SettingsManager.getSetting('autoPlayNext');
        container.innerHTML = `
            <section class="container py-5" data-aos="fade-in" style="max-width: 800px;">
                <h2 class="fw-bold text-white mb-4">الإعدادات</h2>
                <div class="card bg-glass border-0 rounded-4 p-4 mb-4 shadow-sm">
                    <h5 class="text-secondary fw-bold mb-4"><i class="fa-solid fa-palette me-2"></i> المظهر والتصميم</h5>
                    <div class="d-flex justify-content-between align-items-center mb-3 border-bottom border-secondary pb-3" style="border-color: rgba(255,255,255,0.1) !important;">
                        <div><h6 class="text-white mb-1">الوضع الليلي</h6><small class="text-muted-custom">تفعيل المظهر الداكن</small></div>
                        <div class="form-check form-switch fs-4"><input class="form-check-input shadow-none" type="checkbox" id="themeSwitch" ${currentTheme === 'dark' ? 'checked' : ''}></div>
                    </div>
                </div>
                <div class="card bg-glass border-0 rounded-4 p-4 mb-4 shadow-sm">
                    <h5 class="text-secondary fw-bold mb-4"><i class="fa-solid fa-circle-play me-2"></i> خيارات التشغيل</h5>
                    <div class="d-flex justify-content-between align-items-center border-bottom border-secondary pb-3 mb-3" style="border-color: rgba(255,255,255,0.1) !important;">
                        <div><h6 class="text-white mb-1">التشغيل التلقائي</h6><small class="text-muted-custom">تشغيل السورة التالية تلقائياً</small></div>
                        <div class="form-check form-switch fs-4"><input class="form-check-input shadow-none" type="checkbox" id="autoPlaySwitch" ${autoPlay ? 'checked' : ''}></div>
                    </div>
                </div>
            </section>
        `;
        document.getElementById('themeSwitch').addEventListener('change', (e) => SettingsManager.saveSetting('theme', e.target.checked ? 'dark' : 'light'));
        document.getElementById('autoPlaySwitch').addEventListener('change', (e) => SettingsManager.saveSetting('autoPlayNext', e.target.checked));
    });
}

// ==========================================
// 4. دوال بناء الواجهات (UI Builders)
// ==========================================

function buildSurahCard(surah) {
    const isFav = StorageManager.isFavorite(surah.id);
    const heartClass = isFav ? 'fa-solid text-danger' : 'fa-regular text-muted-custom';
    return `
        <div class="col-lg-4 col-md-6 surah-item-card" data-name="${surah.nameArabic} ${surah.nameEnglish}">
            <div class="card bg-glass text-white border-0 shadow-sm h-100 p-3 premium-card" data-surah-id="${surah.id}">
                <div class="d-flex align-items-center justify-content-between">
                    <div class="d-flex align-items-center gap-3">
                        <div class="surah-number text-secondary fw-bold fs-4">${surah.id}</div>
                        <div>
                            <h5 class="mb-0 fw-bold">سورة ${surah.nameArabic}</h5>
                            <small class="text-muted-custom">${surah.nameEnglish}</small>
                        </div>
                    </div>
                    <div class="d-flex align-items-center gap-2">
                        <button class="btn btn-glass fav-btn border-0"><i class="${heartClass}"></i></button>
                        <button class="btn btn-glass play-surah-btn"><i class="fa-solid fa-play"></i></button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// الكارت الجديد الفخم للقرّاء (صورة مربعة مدورة الحواف + أيقونة ذهبية) 🕌
function buildReciterCard(reciter) {
    return `
        <div class="col-xl-3 col-lg-4 col-md-6 reciter-item-card" data-name="${reciter.nameArabic}">
            <div class="card reciter-card bg-glass border-0 text-center p-4 h-100 premium-card hover-lift" style="cursor:pointer;" onclick="localStorage.setItem('current_view_reciter', '${reciter.id}'); window.location.hash='#/reader'">
                <div class="position-relative mx-auto mb-3" style="width: 140px; height: 140px;">
                    <img src="${reciter.displayPhoto}" onerror="handleImageError(this)" alt="صورة إسلامية" class="w-100 h-100 object-fit-cover rounded-4 shadow-lg" style="border: 2px solid var(--accent-gold);">
                    <div class="position-absolute bottom-0 end-0 bg-dark rounded-circle d-flex align-items-center justify-content-center shadow-lg" style="width: 40px; height: 40px; transform: translate(25%, 25%); border: 2px solid var(--accent-gold);">
                        <i class="fa-solid fa-microphone-lines text-warning fs-6"></i>
                    </div>
                </div>
                <h5 class="text-white fw-bold mb-1 font-cairo">${reciter.nameArabic}</h5>
                <small class="text-muted-custom mb-3 d-block text-truncate px-2">${reciter.style}</small>
                <button class="btn btn-outline-custom w-100 mt-auto rounded-pill fw-bold"><i class="fa-solid fa-book-quran me-2"></i> استعرض السور</button>
            </div>
        </div>
    `;
}

function attachCardEvents(surahs, explicitReciter = null) {
    document.querySelectorAll('.play-surah-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const card = btn.closest('.premium-card');
            const surahId = parseInt(card.getAttribute('data-surah-id'));
            const selectedSurah = surahs.find(s => s.id === surahId);
            
            let finalReciter = explicitReciter;
            if (!finalReciter) {
                const reciters = await API.getReciters();
                const savedReciterId = localStorage.getItem('last_reciter_id');
                if (savedReciterId) {
                    const found = reciters.find(r => String(r.id) === String(savedReciterId));
                    if (found) finalReciter = found;
                }
                if (!finalReciter) finalReciter = reciters[0];
            }

            const playerToUse = window.globalPlayer || globalPlayer;
            playerToUse.playTrack(selectedSurah, finalReciter);
            showPlayerUI();
        });
    });

    document.querySelectorAll('.fav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation(); 
            const card = btn.closest('.premium-card');
            const surahId = parseInt(card.getAttribute('data-surah-id'));
            const selectedSurah = surahs.find(s => s.id === surahId);
            const isAdded = StorageManager.toggleFavorite(selectedSurah);
            btn.querySelector('i').className = isAdded ? 'fa-solid text-danger' : 'fa-regular text-muted-custom';
        });
    });
}

function showPlayerUI() {
    const p = document.getElementById('global-player');
    if (p && !p.classList.contains('active')) {
        p.classList.add('active');
        p.style.opacity = '1';
        p.style.transform = 'translateY(0)';
    }
}

// ==========================================
// 5. نظام المظهر (Theme)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const toggleBtn = document.getElementById('themeToggleBtn');
    const toggleIcon = document.getElementById('themeToggleIcon');
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            if(toggleIcon) toggleIcon.className = newTheme === 'light' ? 'fa-solid fa-moon fs-4' : 'fa-solid fa-sun fs-4';
        });
    }
});