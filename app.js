// js/app.js - Ultra Premium Edition (Part 1 - 100% Fixed Routes & Content)

import { API } from './api.js';
import { globalPlayer } from './player.js';
import { Router } from './router.js';
import { SettingsManager } from './theme.js';
import { StorageManager } from './storage.js';
import { initCustomCursor } from './cursor.js';

// ==========================================
// 1. نظام الأذان التلقائي (صوت المؤذن + إعدادات + تشغيل يومي)
// ==========================================
class AdhanManager {
    static init() {
        this.prayers = {};
        this.hasPlayed = {};
        this.coords = null;
        this.dateKey = new Date().toDateString();
        this.adhanAudio = new Audio();
        this.adhanAudio.preload = 'auto';
        this._setupUnlock();

        if ("Notification" in window && Notification.permission === "default") {
            try { Notification.requestPermission(); } catch (e) {}
        }

        this.refreshTimes();
        setInterval(() => this.checkPrayerTime(), 20000);
    }

    // ---------- الإعدادات (محفوظة في المتصفح) ----------
    static isEnabled() {
        try { return localStorage.getItem('adhan_enabled') !== '0'; } catch (e) { return true; }
    }
    static setEnabled(v) {
        try { localStorage.setItem('adhan_enabled', v ? '1' : '0'); } catch (e) {}
    }
    static getVoice() {
        try { return localStorage.getItem('adhan_voice') || 'makkah'; } catch (e) { return 'makkah'; }
    }
    static setVoice(v) {
        try { localStorage.setItem('adhan_voice', v); } catch (e) {}
    }

    // ---------- مواقيت الصلاة ----------
    static refreshTimes() {
        if (this.coords) { this.fetchPrayerTimesByLocation(this.coords.lat, this.coords.lng); return; }
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (p) => {
                    this.coords = { lat: p.coords.latitude, lng: p.coords.longitude };
                    this.fetchPrayerTimesByLocation(this.coords.lat, this.coords.lng);
                },
                () => this.fetchPrayerTimesByCity("Cairo", "Egypt"),
                { timeout: 8000 }
            );
        } else {
            this.fetchPrayerTimesByCity("Cairo", "Egypt");
        }
    }

    static async fetchPrayerTimesByLocation(lat, lng) {
        try {
            const res = await fetch(`https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lng}&method=5`);
            const data = await res.json();
            this.setPrayers(data.data.timings);
        } catch (e) { console.error("Adhan Location Error", e); }
    }

    static async fetchPrayerTimesByCity(city, country) {
        const timings = await API.getPrayerTimes(city, country);
        if (timings) this.setPrayers(timings);
    }

    static setPrayers(timings) {
        const t = (v) => String(v || '').slice(0, 5); // "05:12 (EET)" -> "05:12"
        this.prayers = { 'الفجر': t(timings.Fajr), 'الظهر': t(timings.Dhuhr), 'العصر': t(timings.Asr), 'المغرب': t(timings.Maghrib), 'العشاء': t(timings.Isha) };
        this.hasPlayed = {};
    }

    static checkPrayerTime() {
        const now = new Date();
        const todayKey = now.toDateString();
        // لو اليوم اتغير، نحدّث المواقيت (عشان الأذان يشتغل كل يوم من غير ريفريش)
        if (todayKey !== this.dateKey) {
            this.dateKey = todayKey;
            this.hasPlayed = {};
            this.refreshTimes();
            return;
        }
        if (!this.isEnabled()) return;
        if (!this.prayers || Object.keys(this.prayers).length === 0) return;
        const currentTime = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
        for (const [name, time] of Object.entries(this.prayers)) {
            if (time === currentTime && !this.hasPlayed[name]) {
                this.hasPlayed[name] = true;
                this.playAdhan(name);
            }
        }
    }

    // ---------- تشغيل الأذان ----------
    // ملفات الصوت بتتدوّر عليها بالترتيب ده، وأول ملف شغال هو اللي بيتشغّل
    static candidates(prayerName) {
        const v = this.getVoice();
        const list = [];
        if (prayerName === 'الفجر') list.push(`assets/audio/adhan-${v}-fajr.mp3`, 'assets/audio/adhan-fajr.mp3');
        list.push(`assets/audio/adhan-${v}.mp3`, 'assets/audio/adhan.mp3');
        list.push('https://download.quranicaudio.com/adhan/makkah.mp3'); // رابط احتياطي (الرابط الأصلي)
        return list;
    }

    static async _playList(list) {
        for (const url of list) {
            try {
                this.adhanAudio.src = url;
                this.adhanAudio.load();
                await this.adhanAudio.play();
                return url;
            } catch (e) {
                if (e && e.name === 'NotAllowedError') { console.warn('المتصفح منع تشغيل الأذان لحد ما تتفاعل مع الصفحة'); return null; }
                // الملف مش موجود أو مش شغال -> نجرب اللي بعده
            }
        }
        console.warn('مفيش ملف أذان شغال. حط ملفات الأذان في assets/audio');
        return null;
    }

    static playAdhan(prayerName) {
        // لو في تلاوة شغالة نوقفها عشان الأذان يتسمع
        try { if (globalPlayer && globalPlayer.isPlaying) globalPlayer.togglePlay(); } catch (e) {}
        this._playList(this.candidates(prayerName));
        if ("Notification" in window && Notification.permission === "granted") {
            try {
                new Notification(`حان الآن موعد أذان ${prayerName}`, { body: "حي على الصلاة، حي على الفلاح", icon: "assets/images/icon-192.png" });
            } catch (e) {}
        }
    }

    static test(prayerName = 'الظهر') { this.playAdhan(prayerName); }
    static stop() { try { this.adhanAudio.pause(); this.adhanAudio.currentTime = 0; } catch (e) {} }

    // المتصفحات (خصوصًا موبايل) بتمنع الصوت التلقائي، فبنفتحه أول لمسة من المستخدم
    static _setupUnlock() {
        const SILENT = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
        const events = ['click', 'touchstart', 'keydown'];
        const unlock = () => {
            events.forEach(ev => document.removeEventListener(ev, unlock, true));
            const a = this.adhanAudio;
            try {
                a.muted = true; a.src = SILENT;
                const p = a.play();
                const done = () => { try { a.pause(); } catch (e) {} a.muted = false; };
                if (p && p.then) p.then(done).catch(() => { a.muted = false; }); else done();
            } catch (e) { a.muted = false; }
        };
        events.forEach(ev => document.addEventListener(ev, unlock, true));
    }
}
AdhanManager.VOICES = {
    makkah: 'الحرم المكي',
    madinah: 'الحرم النبوي',
    egypt: 'الأذان المصري'
};

const ISLAMIC_FALLBACK_IMG = 'https://images.unsplash.com/photo-1608501821300-4f99e58bba77?auto=format&fit=crop&w=1200&q=80';
const ISLAMIC_MOSQUE_IMG = 'https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?auto=format&fit=crop&w=1200&q=80';

window.handleImageError = function(imgElement) {
    if (imgElement && imgElement.src !== ISLAMIC_FALLBACK_IMG) {
        imgElement.onerror = null; imgElement.src = ISLAMIC_FALLBACK_IMG;
    }
};

document.addEventListener('DOMContentLoaded', () => { initApp(); });

async function initApp() {
    try {
        SettingsManager.init();
        initCustomCursor();
        AdhanManager.init();
        if(typeof window.AOS !== 'undefined') window.AOS.init({ once: true, offset: 50, duration: 800 });
        let config = null;
        try { config = await API.getConfig(); } catch(e) {}
        if(config && config.developer) {
            const footerText = document.querySelector('footer p.small');
            if(footerText) footerText.innerHTML = `${config.developer.copyright} <br> <span class="fw-bold text-secondary">${config.developer.name}</span>`;
        }

        setupRoutes(); // المنظومة الكاملة للمسارات
        Router.init();
        
        if (!window.location.hash || window.location.hash === '') window.location.hash = '#/home';
        document.querySelectorAll('[aria-label="Search"]').forEach(btn => {
            btn.addEventListener('click', (e) => { e.preventDefault(); window.location.hash = '#/search'; });
        });
    } catch (error) { console.error("Init Error:", error); }
}

function formatAMPM(time24) {
    let [hours, minutes] = time24.split(':');
    hours = parseInt(hours);
    let ampm = hours >= 12 ? 'م' : 'ص';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return hours + ':' + minutes + ' ' + ampm;
}

// ==========================================
// مساعدات القوائم: ربط اسم القارئ المكتوب في ملفات البيانات بالقارئ الحقيقي
// ==========================================
function normAr(s) {
    return String(s || '')
        .replace(/[\u064B-\u065F\u0670]/g, '')
        .replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه')
        .replace(/\s+/g, ' ').trim();
}

const RECITER_ALIASES = {
    banna: 'البنا', basit: 'عبد الباسط', minshawi: 'المنشاوي', husary: 'الحصري', husari: 'الحصري',
    mishary: 'العفاسي', muaiqly: 'المعيقلي', jaber: 'جابر', jibreel: 'جبريل', laythi: 'الليثي',
    saeed: 'سعيد', shahat: 'شحات', ajmi: 'العجمي', mustafa: 'مصطفى اسماعيل', rifaat: 'رفعت',
    bahtimi: 'البهتيمي', fashni: 'الفشني', sharqawi: 'الشرقاوي', shuaisha: 'شعيشع', dosari: 'الدوسري'
};

function findReciter(reciters, key) {
    if (!key || !Array.isArray(reciters)) return null;
    const needle = normAr(RECITER_ALIASES[String(key).toLowerCase()] || key);
    return reciters.find(r => normAr(r.nameArabic).includes(needle)) || null;
}

function pickDefaultReciter(reciters) {
    if (!Array.isArray(reciters) || !reciters.length) return null;
    try {
        const saved = localStorage.getItem('last_reciter_id');
        const found = saved && reciters.find(r => String(r.id) === String(saved));
        if (found) return found;
    } catch (e) {}
    return reciters[0];
}

// ==========================================
// 2. منظومة المسارات الشاملة (جميع الأقسام)
// ==========================================
function setupRoutes() {
    
    // --- 1. الرئيسية ---
    const homeRouteHandler = async (container) => {
        try {
            let surahs = []; let reciters = [];
            try { surahs = await API.getSurahs(); if(!Array.isArray(surahs)) surahs = []; } catch(e) {}
            try { reciters = await API.getReciters(); if(!Array.isArray(reciters)) reciters = []; } catch(e) {}
            const topSurahs = surahs.slice(0, 6); const topReciters = reciters.slice(0, 4);

            let homeHtml = `
                <section class="position-relative d-flex align-items-center justify-content-center mb-5 overflow-hidden rounded-4 mt-2 shadow-lg" style="min-height: 75vh; border: 1px solid rgba(212, 175, 55, 0.1);">
                    <div class="position-absolute top-0 start-0 w-100 h-100 hero-bg"></div>
                    <div class="position-absolute top-50 start-50 translate-middle w-100 h-100" style="background: radial-gradient(circle at center, rgba(212, 175, 55, 0.15) 0%, transparent 60%);"></div>
                    <div class="container z-1 position-relative text-center" data-aos="zoom-out" data-aos-duration="1500">
                        <div class="mx-auto p-4 p-md-5" style="max-width: 850px; border-radius: 30px; background: rgba(12, 38, 28, 0.4); backdrop-filter: blur(16px); border: 1px solid rgba(212, 175, 55, 0.2); box-shadow: 0 20px 50px rgba(0,0,0,0.5);">
                            <div class="home-verse mb-3">﴿ وَرَتِّلِ الْقُرْآنَ تَرْتِيلًا ﴾</div>
                            <h1 class="fw-bold mb-2 home-title">تــرتــيــل</h1>
                            <p class="fs-5 text-light mb-4 font-cairo lh-lg px-md-4">استمع للقرآن بنقاء وصفاء، بأصوات أكثر من 200 قارئ</p>
                            <div class="d-flex justify-content-center gap-2 gap-md-3 flex-wrap mb-5">
                                <span class="home-chip"><i class="fa-solid fa-book-quran"></i> 114 سورة</span>
                                <span class="home-chip"><i class="fa-solid fa-microphone-lines"></i> +200 قارئ</span>
                                <span class="home-chip"><i class="fa-solid fa-tower-broadcast"></i> بث مباشر</span>
                            </div>
                            <div class="d-flex justify-content-center gap-3 flex-wrap">
                                <button class="btn btn-primary-custom rounded-pill px-5 py-3 fw-bold fs-5 shadow-lg d-flex align-items-center gap-2" onclick="window.location.hash='#/quran'"><i class="fa-solid fa-headphones-simple"></i> ابدأ الاستماع</button>
                                <button class="btn btn-outline-light rounded-pill px-5 py-3 fw-bold fs-5 shadow-sm d-flex align-items-center gap-2 bg-glass border-2" onclick="window.location.hash='#/radio'"><i class="fa-solid fa-tower-broadcast text-warning"></i> الإذاعة المباشرة</button>
                            </div>
                        </div>
                    </div>
                </section>
                <section class="container pt-2 pb-0" data-aos="fade-up">
                    <div class="quick-grid"><a href="#/prayer" class="quick-tile text-decoration-none"><i class="fa-solid fa-clock"></i><span>مواقيت الصلاة</span></a><a href="#/qibla" class="quick-tile text-decoration-none"><i class="fa-solid fa-compass"></i><span>القبلة</span></a><a href="#/azkar" class="quick-tile text-decoration-none"><i class="fa-solid fa-hands-praying"></i><span>حصن المسلم</span></a><a href="#/playlists" class="quick-tile text-decoration-none"><i class="fa-solid fa-layer-group"></i><span>القوائم</span></a><a href="#/tafsir" class="quick-tile text-decoration-none"><i class="fa-solid fa-book-open"></i><span>التفسير</span></a><a href="#/readers" class="quick-tile text-decoration-none"><i class="fa-solid fa-microphone-lines"></i><span>القرّاء</span></a></div>
                </section>
                <section class="container py-5" data-aos="fade-up">
                    <div class="d-flex justify-content-between align-items-end mb-4 border-bottom border-secondary pb-3" style="border-color: rgba(255,255,255,0.05) !important;">
                        <h3 class="fw-bold mb-0 text-white"><i class="fa-solid fa-star text-secondary me-2"></i> سور مختارة</h3>
                        <a href="#/quran" class="text-secondary text-decoration-none fw-bold hover-lift">عرض الكل <i class="fa-solid fa-arrow-left ms-1"></i></a>
                    </div>
                    <div class="row g-4 mb-5">
            `;
            if(topSurahs.length > 0) topSurahs.forEach(s => homeHtml += buildSurahCard(s));
            homeHtml += `</div><div class="d-flex justify-content-between align-items-end mb-4 border-bottom border-secondary pb-3 mt-5"><h3 class="fw-bold mb-0 text-white"><i class="fa-solid fa-microphone-lines text-secondary me-2"></i> قراء مميزون</h3><a href="#/readers" class="text-secondary text-decoration-none fw-bold hover-lift">عرض الكل <i class="fa-solid fa-arrow-left ms-1"></i></a></div><div class="row g-4">`;
            if(topReciters.length > 0) topReciters.forEach(r => homeHtml += buildReciterCard(r));
            homeHtml += `</div></section>`;
            container.innerHTML = homeHtml;
            if(topSurahs.length > 0) attachCardEvents(topSurahs, null);
        } catch (error) {}
    };
    Router.addRoute('#/home', homeRouteHandler); Router.addRoute('#/', homeRouteHandler); Router.addRoute('', homeRouteHandler);

    // --- 2. الإذاعة ---
    Router.addRoute('#/radio', async (container) => {
        try {
            const radios = await API.getRadios();
            let html = `
                <section class="container py-5" data-aos="fade-up">
                    <div class="position-relative rounded-4 overflow-hidden mb-5 shadow-lg d-flex align-items-center justify-content-center" style="height: 250px; background: linear-gradient(135deg, rgba(7,26,19,0.9), rgba(212,175,55,0.3)), url('${ISLAMIC_MOSQUE_IMG}') center/cover;">
                        <div class="text-center z-1 position-relative px-3"><i class="fa-solid fa-tower-broadcast text-warning mb-3" style="font-size: 3.5rem;"></i><h1 class="fw-bold text-white font-cairo mb-2">الإذاعة المباشرة</h1></div>
                    </div>
                    <div class="row g-4">
            `;
            radios.forEach(radio => {
                html += `
                    <div class="col-md-6 col-lg-4">
                        <div class="card premium-card border-0 p-4 h-100 shadow-lg d-flex flex-row align-items-center" style="background: linear-gradient(145deg, #0c261c, #071a13); border: 1px solid rgba(212,175,55,0.2) !important; border-radius: 20px;">
                            <div class="position-relative me-4" style="width: 80px; height: 80px;">
                                <img src="${radio.image}" onerror="handleImageError(this)" class="rounded-circle shadow-lg w-100 h-100 object-fit-cover" style="border: 3px solid var(--accent-gold);">
                            </div>
                            <div class="flex-grow-1">
                                <h5 class="fw-bold mb-1 text-white font-cairo">${radio.nameArabic}</h5>
                                <div class="d-flex align-items-center gap-2 mt-2"><span class="spinner-grow spinner-grow-sm text-danger" role="status"></span><small class="text-warning fw-bold">بث مباشر</small></div>
                            </div>
                            <button class="btn btn-primary-custom rounded-circle play-radio-btn d-flex align-items-center justify-content-center shadow-lg" style="width: 55px; height: 55px; border: 2px solid #fff;" data-url="${radio.url}" data-urls='${JSON.stringify(radio.urls || [radio.url])}' data-name="${radio.nameArabic}" data-image="${radio.image}"><i class="fa-solid fa-play fs-4" style="margin-left:4px;"></i></button>
                        </div>
                    </div>
                `;
            });
            html += `</div></section>`;
            container.innerHTML = html;
            container.querySelectorAll('.play-radio-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const target = e.currentTarget;
                    if (window.globalPlayer || globalPlayer) {
                        const playerToUse = window.globalPlayer || globalPlayer;
                        let urls = [];
                        try { urls = JSON.parse(target.getAttribute('data-urls') || '[]'); } catch (err) {}
                        playerToUse.playRadio({ nameArabic: target.getAttribute('data-name'), url: target.getAttribute('data-url'), urls, image: target.getAttribute('data-image') });
                        showPlayerUI();
                    }
                });
            });
        } catch(e) {}
    });// --- 3. القرآن الكريم (تصميم زجاجي فاخر بصور إسلامية) ---
    Router.addRoute('#/quran', async (container) => {
        try {
            let surahs = []; try { surahs = await API.getSurahs(); } catch(e){}
            let quranHtml = `
                <section class="container py-5" data-aos="fade-in">
                    <div class="position-relative rounded-4 overflow-hidden mb-5 shadow-lg d-flex align-items-center justify-content-center" style="height: 250px; background: linear-gradient(135deg, rgba(7,26,19,0.9), rgba(212,175,55,0.3)), url('${ISLAMIC_MOSQUE_IMG}') center/cover;">
                        <div class="text-center z-1 position-relative px-3">
                            <i class="fa-solid fa-book-quran text-warning mb-3" style="font-size: 3.5rem;"></i>
                            <h1 class="fw-bold text-white font-cairo mb-2">المصحف الشامل</h1>
                        </div>
                    </div>
                    <div class="d-flex justify-content-between align-items-center mb-5 flex-wrap gap-3">
                        <div class="search-box glass-nav rounded-pill px-3 py-2 d-flex align-items-center w-100" style="max-width: 400px; margin: auto; border: 1px solid var(--accent-gold);">
                            <i class="fa-solid fa-search text-warning ms-3 fs-5"></i>
                            <input type="text" id="surah-search" class="form-control bg-transparent border-0 text-white shadow-none fs-5 font-cairo" placeholder="ابحث عن سورة...">
                        </div>
                    </div>
                    <div class="row g-4" id="surahs-list-container">`;
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

    // --- 4. البحث الشامل ---
    Router.addRoute('#/search', async (container) => {
        try {
            let surahs = []; let reciters = [];
            try { surahs = await API.getSurahs(); } catch(e){}
            try { reciters = await API.getReciters(); } catch(e){}
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
                </section>
            `;
            const input = document.getElementById('global-search-input');
            const resultsContainer = document.getElementById('search-results-container');
            const surahsResults = document.getElementById('surahs-results');
            const recitersResults = document.getElementById('reciters-results');

            input.addEventListener('input', (e) => {
                const term = e.target.value.toLowerCase().trim();
                if (term === '') { resultsContainer.classList.add('d-none'); return; }
                resultsContainer.classList.remove('d-none');
                const filteredSurahs = surahs.filter(s => s.nameArabic.includes(term) || s.nameEnglish.toLowerCase().includes(term));
                surahsResults.innerHTML = filteredSurahs.length > 0 ? filteredSurahs.map(s => buildSurahCard(s)).join('') : '<div class="col-12 text-muted-custom">لا توجد سور مطابقة.</div>';
                const filteredReciters = reciters.filter(r => r.nameArabic.includes(term));
                recitersResults.innerHTML = filteredReciters.length > 0 ? filteredReciters.map(r => buildReciterCard(r)).join('') : '<div class="col-12 text-muted-custom">لا يوجد قراء مطابقين.</div>';
                attachCardEvents(surahs, null);
            });
        } catch (error) {}
    });

    // --- 5. القراء (جميع القراء بتصميم ملكي) ---
    Router.addRoute('#/readers', async (container) => {
        try {
            let reciters = []; try { reciters = await API.getReciters(); } catch(e){}
            let readersHtml = `
                <section class="container py-5" data-aos="fade-in">
                    <div class="position-relative rounded-4 overflow-hidden mb-5 shadow-lg d-flex align-items-center justify-content-center" style="height: 250px; background: linear-gradient(135deg, rgba(7,26,19,0.9), rgba(212,175,55,0.3)), url('${ISLAMIC_FALLBACK_IMG}') center/cover;">
                        <div class="text-center z-1 position-relative px-3">
                            <i class="fa-solid fa-microphone-lines text-warning mb-3" style="font-size: 3.5rem;"></i>
                            <h1 class="fw-bold text-white font-cairo mb-2">أصوات من الجنة</h1>
                        </div>
                    </div>
                    <div class="d-flex justify-content-between align-items-center mb-5 flex-wrap gap-3">
                        <div class="search-box glass-nav rounded-pill px-3 py-2 d-flex align-items-center w-100" style="max-width: 400px; margin: auto; border: 1px solid var(--accent-gold);">
                            <i class="fa-solid fa-search text-warning ms-3 fs-5"></i>
                            <input type="text" id="reader-search" class="form-control bg-transparent border-0 text-white shadow-none fs-5 font-cairo" placeholder="ابحث عن قارئ...">
                        </div>
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

    // --- 6. مكتبة العمالقة (تصميم أسطوري خاص) ---
    Router.addRoute('#/egyptian', async (container) => {
        try {
            let reciters = await API.getReciters();
            const egyptianReciters = reciters.filter(r => r.isEgyptianLibrary);

            let egyHtml = `
                <section class="container py-5" data-aos="fade-in">
                    <div class="card bg-glass border-0 rounded-4 p-5 mb-5 shadow-lg text-center position-relative overflow-hidden" style="border: 2px solid var(--accent-gold) !important; box-shadow: 0 0 40px rgba(212,175,55,0.2) !important;">
                        <div class="position-absolute w-100 h-100 top-0 start-0" style="background: url('${ISLAMIC_MOSQUE_IMG}') center/cover; opacity: 0.1;"></div>
                        <div class="position-relative z-1">
                            <i class="fa-solid fa-crown text-warning mb-3" style="font-size: 5rem; filter: drop-shadow(0 0 10px rgba(212,175,55,0.8));"></i>
                            <h1 class="fw-bold text-white font-cairo mb-3" style="letter-spacing: 2px;">مكتبة العمالقة المصريين</h1>
                            <p class="text-muted-custom fs-5 mb-0" style="max-width: 700px; margin: auto;">أرشيف حصري يضم أساطير التلاوة وصناع المجد في العالم الإسلامي.</p>
                        </div>
                    </div>
                    <div class="row g-4">
            `;
            egyptianReciters.forEach(r => egyHtml += buildGiantCard(r));
            egyHtml += `</div></section>`;
            container.innerHTML = egyHtml;
        } catch(e) {}
    });

    // --- 7. بوصلة القبلة (The Royal 3D Qibla) ---
    Router.addRoute('#/qibla', (container) => {
        container.innerHTML = `
            <section class="container py-5 text-center" data-aos="fade-in">
                <div class="mb-5">
                    <h2 class="fw-bold text-white mb-2 font-cairo" style="font-size: 3rem; text-shadow: 0 0 15px rgba(212,175,55,0.5);"><i class="fa-solid fa-kaaba text-warning me-3"></i> اتجاه القبلة</h2>
                    <p class="text-muted-custom fs-5">مستشعرات ذكية لتحديد قبلتك أينما كنت</p>
                </div>
                <div class="card bg-glass border-0 rounded-4 p-4 p-md-5 mx-auto shadow-lg position-relative overflow-hidden" style="max-width: 500px; background: linear-gradient(145deg, #0c261c, #04100c); border: 2px solid rgba(212,175,55,0.3) !important;">
                    
                    <!-- إطار البوصلة الفخم -->
                    <div id="qibla-compass-container" class="position-relative d-flex justify-content-center align-items-center mx-auto mb-5" style="width: 320px; height: 320px; border-radius: 50%; background: radial-gradient(circle, rgba(12,38,28,0.9) 0%, rgba(0,0,0,1) 100%); border: 8px solid rgba(212, 175, 55, 0.4); box-shadow: 0 0 50px rgba(212, 175, 55, 0.3), inset 0 0 40px rgba(0,0,0,0.9);">
                        
                        <!-- زخرفة داخلية -->
                        <div class="position-absolute w-100 h-100 rounded-circle" style="border: 2px dashed rgba(212, 175, 55, 0.5); transform: scale(0.85);"></div>
                        <div class="position-absolute w-100 h-100 rounded-circle" style="border: 1px solid rgba(212, 175, 55, 0.2); transform: scale(0.7);"></div>

                        <!-- الاتجاهات الرئيسية (N, S, E, W) -->
                        <div id="compass-rose" class="position-absolute w-100 h-100 d-flex flex-column align-items-center justify-content-between py-2" style="transition: transform 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94); z-index: 5;">
                            <span class="text-danger fw-bold fs-2 font-inter" style="text-shadow: 0 0 15px red;">N</span>
                            <div class="d-flex w-100 justify-content-between px-3 position-absolute top-50 translate-middle-y">
                                <span class="text-warning fw-bold fs-4 font-inter opacity-75">W</span>
                                <span class="text-warning fw-bold fs-4 font-inter opacity-75">E</span>
                            </div>
                            <span class="text-warning fw-bold fs-4 font-inter opacity-75">S</span>
                        </div>

                        <!-- سهم القبلة الملكي -->
                        <div id="qibla-arrow" class="position-absolute d-flex flex-column align-items-center justify-content-start" style="width: 100%; height: 100%; transition: transform 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94); z-index: 10;">
                            <div class="d-flex flex-column align-items-center" style="transform: translateY(-30px);">
                                <div class="rounded-circle d-flex align-items-center justify-content-center mb-1" style="width: 80px; height: 80px; background: linear-gradient(135deg, #d4af37, #8A6D1C); box-shadow: 0 10px 20px rgba(0,0,0,0.8), inset 0 0 10px rgba(255,255,255,0.5); border: 3px solid #000;">
                                    <i class="fa-solid fa-kaaba text-dark" style="font-size: 3rem;"></i>
                                </div>
                                <i class="fa-solid fa-caret-down" style="font-size: 3rem; color: var(--accent-gold); filter: drop-shadow(0 5px 5px rgba(0,0,0,0.8)); transform: translateY(-15px);"></i>
                            </div>
                        </div>

                        <!-- نقطة المركز -->
                        <div class="rounded-circle position-relative" style="width: 24px; height: 24px; background: radial-gradient(circle, #fff, #d4af37); box-shadow: 0 0 20px rgba(212,175,55,1); z-index: 11; border: 4px solid #000;"></div>
                    </div>

                    <div id="qibla-status" class="mt-4 mb-4 p-3 rounded-3 text-white font-cairo fs-5 fw-bold" style="background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1);">
                        يرجى تفعيل الـ GPS لبدء التحديد
                    </div>
                    
                    <button class="btn btn-primary-custom rounded-pill w-100 py-3 fw-bold fs-4 shadow-lg" id="start-compass-btn">
                        <i class="fa-solid fa-satellite-dish me-2"></i> ربط بالأقمار الصناعية
                    </button>
                </div>
            </section>
        `;

        const btn = document.getElementById('start-compass-btn'); 
        const status = document.getElementById('qibla-status'); 
        const compassRose = document.getElementById('compass-rose'); 
        const qiblaArrow = document.getElementById('qibla-arrow');

        btn.addEventListener('click', () => {
            status.innerHTML = `<span class="text-warning"><i class="fa-solid fa-spinner fa-spin me-2"></i> جاري الاتصال...</span>`;
            if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
                DeviceOrientationEvent.requestPermission().then(p => { if (p === 'granted') getLocation(); else status.innerHTML = "<span class='text-danger'>تم رفض إذن البوصلة.</span>"; }).catch(console.error);
            } else { getLocation(); }
        });

        function getLocation() {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(position => {
                    const lat = position.coords.latitude * Math.PI / 180.0; const lng = position.coords.longitude * Math.PI / 180.0;
                    const MECCA_LAT = 21.422487 * Math.PI / 180.0; const MECCA_LNG = 39.826206 * Math.PI / 180.0;
                    let qiblaHeading = Math.atan2(Math.sin(MECCA_LNG - lng), Math.cos(lat) * Math.tan(MECCA_LAT) - Math.sin(lat) * Math.cos(MECCA_LNG - lng));
                    qiblaHeading = (qiblaHeading * 180.0 / Math.PI + 360) % 360;
                    status.innerHTML = `<span class="text-success"><i class="fa-solid fa-check-circle me-2 fs-4"></i> تمت المطابقة! ضع الهاتف بشكل مسطح.</span>`;
                    
                    window.addEventListener("deviceorientationabsolute", (event) => handleOrientation(event, qiblaHeading), true); 
                    window.addEventListener("deviceorientation", (event) => handleOrientation(event, qiblaHeading), true);
                }, () => { status.innerHTML = `<span class="text-danger"><i class="fa-solid fa-triangle-exclamation me-2"></i> يرجى تشغيل الـ GPS (الموقع)</span>`; });
            }
        }

        function handleOrientation(event, qiblaAngle) {
            let compass = event.webkitCompassHeading || Math.abs(event.alpha - 360);
            if (compass) { 
                compassRose.style.transform = `rotate(${-compass}deg)`; 
                qiblaArrow.style.transform = `rotate(${qiblaAngle - compass}deg)`; 
            }
        }
    });

    // --- 8. مواقيت الصلاة (تحديد تلقائي + 12 ساعة) ---
    Router.addRoute('#/prayer', async (container) => {
        container.innerHTML = `<div class="text-center py-5"><div class="spinner-border text-warning" role="status"></div><h4 class="text-white mt-3 font-cairo">جاري تحديد الموقع وحساب المواقيت...</h4></div>`;
        
        const renderPrayerTimes = (timings, locationText) => {
            const prayers = [
                { id: 'Fajr', name: 'الفجر', icon: 'fa-cloud-moon', time: timings.Fajr },
                { id: 'Sunrise', name: 'الشروق', icon: 'fa-sun', time: timings.Sunrise },
                { id: 'Dhuhr', name: 'الظهر', icon: 'fa-sun', time: timings.Dhuhr },
                { id: 'Asr', name: 'العصر', icon: 'fa-cloud-sun', time: timings.Asr },
                { id: 'Maghrib', name: 'المغرب', icon: 'fa-moon', time: timings.Maghrib },
                { id: 'Isha', name: 'العشاء', icon: 'fa-star-and-crescent', time: timings.Isha }
            ];

            let html = `
                <section class="container py-5" data-aos="fade-in">
                    <div class="position-relative rounded-4 overflow-hidden mb-5 shadow-lg d-flex align-items-center justify-content-center" style="height: 300px; background: linear-gradient(to top, rgba(7,26,19,1), rgba(212,175,55,0.1)), url('${ISLAMIC_MOSQUE_IMG}') center/cover;">
                        <div class="text-center z-1 position-relative px-3">
                            <h2 class="fw-bold text-warning mb-2 font-cairo" style="text-shadow: 0 4px 10px rgba(0,0,0,0.8);">مواقيت الصلاة</h2>
                            <p class="text-light fs-5 mb-4 font-inter"><i class="fa-solid fa-location-dot me-1"></i> ${locationText}</p>
                            <div class="bg-dark rounded-pill px-5 py-3 border border-warning shadow-lg">
                                <h5 class="text-muted-custom mb-1 fs-6">الوقت المتبقي للصلاة القادمة</h5>
                                <h1 class="fw-bold text-white mb-0 font-inter" id="prayer-countdown" style="letter-spacing: 2px;">--:--:--</h1>
                            </div>
                        </div>
                    </div>
                    <div class="row g-3 justify-content-center">
            `;
            prayers.forEach(p => {
                html += `
                    <div class="col-6 col-md-4 col-lg-2">
                        <div class="card bg-glass border-0 text-center p-4 h-100 premium-card shadow-sm prayer-card" style="border-top: 3px solid rgba(255,255,255,0.1) !important; border-radius: 20px;">
                            <i class="fa-solid ${p.icon} mb-3" style="font-size: 2.5rem; color: var(--text-secondary);"></i>
                            <h4 class="fw-bold text-white mb-2 font-cairo">${p.name}</h4>
                            <h5 class="text-warning mb-0 font-inter fw-bold">${formatAMPM(p.time)}</h5>
                        </div>
                    </div>
                `;
            });
            html += `</div></section>`;
            container.innerHTML = html;

            const updateCountdown = () => {
                const now = new Date();
                const currentTime = now.getHours() * 60 + now.getMinutes();
                let nextPrayerTime = null;
                for (let p of prayers) {
                    const [hours, mins] = p.time.split(':').map(Number);
                    if ((hours * 60 + mins) > currentTime) { nextPrayerTime = (hours * 60 + mins); break; }
                }
                if (!nextPrayerTime) {
                    const [fHours, fMins] = prayers[0].time.split(':').map(Number);
                    nextPrayerTime = (fHours + 24) * 60 + fMins;
                }
                const diffMins = nextPrayerTime - currentTime;
                const hrs = Math.floor(diffMins / 60); const mns = diffMins % 60; const secs = 59 - now.getSeconds();
                const displayEl = document.getElementById('prayer-countdown');
                if (displayEl) displayEl.innerText = `${hrs.toString().padStart(2, '0')}:${mns.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
            };
            setInterval(updateCountdown, 1000); updateCountdown();
        };

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    try {
                        const res = await fetch(`https://api.aladhan.com/v1/timings?latitude=${position.coords.latitude}&longitude=${position.coords.longitude}&method=5`);
                        const data = await res.json();
                        renderPrayerTimes(data.data.timings, "تم التحديد عبر GPS 📍");
                    } catch (e) {
                        const fallback = await API.getPrayerTimes("Hurghada", "Egypt");
                        renderPrayerTimes(fallback, "افتراضي (خطأ اتصال)");
                    }
                },
                async () => {
                    const fallback = await API.getPrayerTimes("Hurghada", "Egypt");
                    renderPrayerTimes(fallback, "التحديد التلقائي غير مفعل");
                }
            );
        } else {
            const fallback = await API.getPrayerTimes("Hurghada", "Egypt");
            renderPrayerTimes(fallback, "متصفحك لا يدعم الموقع");
        }
    });// --- 9. التفسير (معزز بنظام الخوادم الاحتياطية) ---
    Router.addRoute('#/tafsir', async (container) => {
        const surahsList = ["الفاتحة","البقرة","آل عمران","النساء","المائدة","الأنعام","الأعراف","الأنفال","التوبة","يونس","هود","يوسف","الرعد","إبراهيم","الحجر","النحل","الإسراء","الكهف","مريم","طه","الأنبياء","الحج","المؤمنون","النور","الفرقان","الشعراء","النمل","القصص","العنكبوت","الروم","لقمان","السجدة","الأحزاب","سبأ","فاطر","يس","الصافات","ص","الزمر","غافر","فصلت","الشورى","الزخرف","الدخان","الجاثية","الأحقاف","محمد","الفتح","الحجرات","ق","الذاريات","الطور","النجم","القمر","الرحمن","الواقعة","الحديد","المجادلة","الحشر","الممتحنة","الصف","الجمعة","المنافقون","التغابن","الطلاق","التحريم","الملك","القلم","الحاقة","المعارج","نوح","الجن","المزمل","المدثر","القيامة","الإنسان","المرسلات","النبأ","النازعات","عبس","التكوير","الانفطار","المطففين","الانشقاق","البروج","الطارق","الأعلى","الغاشية","الفجر","البلد","الشمس","الليل","الضحى","الشرح","التين","العلق","القدر","البينة","الزلزلة","العاديات","القارعة","التكاثر","العصر","الهمزة","الفيل","قريش","الماعون","الكوثر","الكافرون","النصر","المسد","الإخلاص","الفلق","الناس"];
        let optionsHtml = '<option value="" disabled selected>-- اختر سورة لعرض التفسير --</option>';
        surahsList.forEach((name, index) => { optionsHtml += `<option value="${index + 1}" style="color: #000;">${index + 1}. سورة ${name}</option>`; });

        let tafsirHtml = `
            <section class="container py-5" data-aos="fade-in">
                <div class="position-relative rounded-4 overflow-hidden mb-5 shadow-lg d-flex align-items-center justify-content-center" style="height: 250px; background: linear-gradient(135deg, rgba(7,26,19,0.9), rgba(212,175,55,0.2)), url('${ISLAMIC_MOSQUE_IMG}') center/cover;">
                    <div class="text-center z-1 position-relative px-3">
                        <i class="fa-solid fa-book-open-reader text-warning mb-3" style="font-size: 3.5rem;"></i>
                        <h2 class="fw-bold text-white font-cairo mb-2">موسوعة التفسير المعتمد</h2>
                    </div>
                </div>
                <div class="row justify-content-center mb-5"><div class="col-lg-8"><select id="surahSelect" class="form-select bg-dark text-white border-warning fs-5 py-3 font-cairo shadow-lg">${optionsHtml}</select></div></div>
                <div id="tafsirContentArea" class="d-none">
                    <ul class="nav nav-pills justify-content-center mb-4 gap-2 custom-pills" id="tafsirTabs">
                        <li class="nav-item"><button class="nav-link active rounded-pill px-4 py-2 fw-bold" data-book="ar.muyassar">التفسير الميسر</button></li>
                        <li class="nav-item"><button class="nav-link rounded-pill px-4 py-2 fw-bold" data-book="ar.jalalayn">تفسير الجلالين</button></li>
                    </ul>
                    <div class="card bg-glass text-white border-0 shadow-lg p-4 p-md-5 rounded-4" style="border-top: 4px solid var(--accent-gold) !important;">
                        <h3 class="fw-bold text-warning font-cairo text-center mb-4" id="tafsirTitle"></h3>
                        <div id="tafsirLoader" class="text-center py-5 d-none"><div class="spinner-border text-warning mb-3"></div><p>جاري جلب الآيات والتفسير...</p></div>
                        <div id="tafsirText" class="px-md-4 py-3" style="font-family: 'Amiri', serif; font-size: 1.5rem; line-height: 2.3 !important;"></div>
                    </div>
                </div>
            </section>
        `;
        container.innerHTML = tafsirHtml;

        let currentSurahId = null; let currentBook = 'ar.muyassar'; 
        const fetchTafsir = async () => {
            if(!currentSurahId) return;
            document.getElementById('tafsirText').innerHTML = ''; 
            document.getElementById('tafsirLoader').classList.remove('d-none');
            try {
                const response = await fetch(`https://api.alquran.cloud/v1/sura/${currentSurahId}/${currentBook}`);
                const data = await response.json(); 
                if (data.code !== 200) throw new Error("API Failed");
                
                let htmlContent = '';
                data.data.ayahs.forEach(ayah => {
                    htmlContent += `<div class="mb-4 pb-3 border-bottom border-secondary"><span class="badge bg-warning text-dark mb-2">الآية ${ayah.numberInSurah}</span><p class="text-white m-0 lh-lg">${ayah.text}</p></div>`;
                });
                document.getElementById('tafsirText').innerHTML = htmlContent;
            } catch (error) { 
                 try {
                    const backupResponse = await fetch(`https://quranenc.com/api/v1/translation/sura/arabic_moyassar/${currentSurahId}`);
                    const backupData = await backupResponse.json();
                    let htmlContent = '';
                    if(backupData.result && backupData.result.length > 0) {
                        backupData.result.forEach(ayah => {
                            htmlContent += `<div class="mb-4 pb-3 border-bottom border-secondary"><span class="badge bg-warning text-dark mb-2">الآية ${ayah.aya}</span><p class="text-white m-0 lh-lg">${ayah.translation}</p></div>`;
                        });
                        document.getElementById('tafsirText').innerHTML = htmlContent;
                    } else { throw new Error(); }
                 } catch(e) {
                     document.getElementById('tafsirText').innerHTML = `<p class="text-danger text-center">عذراً، حدث خطأ في الاتصال بالخوادم. تحقق من الإنترنت.</p>`; 
                 }
            } finally { 
                document.getElementById('tafsirLoader').classList.add('d-none'); 
            }
        };

        document.getElementById('surahSelect').addEventListener('change', (e) => { 
            currentSurahId = e.target.value; 
            document.getElementById('tafsirContentArea').classList.remove('d-none'); 
            document.getElementById('tafsirTitle').textContent = `تفسير سورة ${surahsList[currentSurahId - 1]}`; 
            fetchTafsir(); 
        });
        document.querySelectorAll('#tafsirTabs .nav-link').forEach(tab => { 
            tab.addEventListener('click', (e) => { 
                document.querySelectorAll('#tafsirTabs .nav-link').forEach(t => t.classList.remove('active')); 
                tab.classList.add('active'); 
                currentBook = e.target.getAttribute('data-book'); 
                fetchTafsir(); 
            }); 
        });
    });

    // --- 10. القوائم والفئات الخاصة (كل بطاقة بتشغّل سورها الحقيقية بالترتيب) ---
    const playlistsRouteHandler = async (container) => {
        try {
            const [collections, appPlaylists, surahs, reciters] = await Promise.all([
                API.getCollections(), API.getPlaylists(), API.getSurahs(), API.getReciters()
            ]);
            const defaultReciter = pickDefaultReciter(reciters);
            const surahById = (id) => surahs.find(s => s.id === Number(id));
            const registry = {}; // key -> مقاطع التشغيل

            const makeTracks = (pairs) => pairs
                .map(([sid, rkey]) => ({ surah: surahById(sid), reciter: (rkey && findReciter(reciters, rkey)) || defaultReciter }))
                .filter(t => t.surah && t.reciter);

            const buildCard = (key, title, desc, img, icon, tracks) => {
                if (!tracks.length) return '';
                registry[key] = tracks;
                const rows = tracks.map((t, i) => `
                    <li class="play-track d-flex align-items-center gap-2 py-2 px-2 rounded-3" data-key="${key}" data-idx="${i}" style="cursor:pointer; border-bottom: 1px solid rgba(255,255,255,0.06);">
                        <span class="text-warning fw-bold" style="width: 28px;">${i + 1}</span>
                        <span class="flex-grow-1 text-white small">${t.surah.nameArabic} <span class="text-muted-custom">— ${t.reciter.nameArabic}</span></span>
                        <i class="fa-solid fa-play text-warning small"></i>
                    </li>`).join('');
                return `
                    <div class="col-lg-4 col-md-6">
                        <div class="card bg-glass border-0 rounded-4 overflow-hidden h-100 shadow-lg premium-card">
                            <div class="position-relative" style="height: 150px;">
                                <img src="${img}" onerror="handleImageError(this)" class="w-100 h-100 object-fit-cover" alt="">
                                <div class="position-absolute top-0 start-0 w-100 h-100" style="background: linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(7,26,19,0.95));"></div>
                                <div class="position-absolute bottom-0 start-0 w-100 p-3 d-flex align-items-center gap-3">
                                    <div class="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0" style="width:46px;height:46px;background: rgba(212,175,55,0.2);"><i class="fa-solid ${icon} text-warning fs-5"></i></div>
                                    <h5 class="fw-bold text-white font-cairo mb-0">${title}</h5>
                                </div>
                            </div>
                            <div class="p-4 d-flex flex-column flex-grow-1">
                                <p class="text-muted-custom small mb-3">${desc || ''}</p>
                                <div class="small text-warning mb-3"><i class="fa-solid fa-list-ol me-1"></i> ${tracks.length} مقاطع</div>
                                <div class="d-flex gap-2 mb-2">
                                    <button class="btn btn-primary-custom flex-grow-1 rounded-pill fw-bold play-all" data-key="${key}"><i class="fa-solid fa-play me-2"></i> تشغيل الكل</button>
                                    <button class="btn btn-outline-custom rounded-pill" type="button" data-bs-toggle="collapse" data-bs-target="#list-${key}" aria-expanded="false" title="عرض المقاطع"><i class="fa-solid fa-chevron-down"></i></button>
                                </div>
                                <ul class="list-unstyled collapse mb-0 mt-2" id="list-${key}">${rows}</ul>
                            </div>
                        </div>
                    </div>`;
            };

            let collectionsHtml = '';
            collections.forEach((cat, i) => {
                const ids = cat.featuredSurahs || cat.surahs || [];
                const keys = cat.featuredReciters || [];
                const tracks = makeTracks(ids.map((id, n) => [id, keys.length ? keys[n % keys.length] : null]));
                collectionsHtml += buildCard('c' + i, cat.title, cat.description, cat.image || ISLAMIC_MOSQUE_IMG, cat.icon || 'fa-folder', tracks);
            });

            let playlistsHtml = '';
            appPlaylists.forEach((pl, i) => {
                const pairs = Array.isArray(pl.items)
                    ? pl.items.map(it => [it.surahId, it.reciterId])
                    : (pl.surahs || []).map(id => [id, null]);
                playlistsHtml += buildCard('p' + i, pl.title, pl.description, pl.cover || ISLAMIC_FALLBACK_IMG, 'fa-star', makeTracks(pairs));
            });

            container.innerHTML = `
                <section class="container py-5" data-aos="fade-in">
                    <div class="position-relative rounded-4 overflow-hidden mb-5 shadow-lg d-flex align-items-center justify-content-center hero-bg" style="height: 280px;">
                        <div class="position-absolute top-0 start-0 w-100 h-100" style="background: rgba(7,26,19,0.55);"></div>
                        <div class="text-center z-1 position-relative px-3">
                            <i class="fa-solid fa-layer-group text-warning mb-3" style="font-size: 3.5rem;"></i>
                            <h1 class="fw-bold text-white font-cairo mb-2">القوائم والفئات الخاصة</h1>
                            <p class="text-muted-custom">مختارات قرآنية مميزة وقوائم تشغيل مخصصة</p>
                        </div>
                    </div>
                    <ul class="nav nav-pills justify-content-center mb-5 gap-2 custom-pills" id="playlistTabs" role="tablist">
                        <li class="nav-item"><button class="nav-link active rounded-pill px-4 py-2 fw-bold font-cairo shadow-sm" data-bs-toggle="pill" data-bs-target="#tab-collections"><i class="fa-solid fa-tags me-2"></i> المناسبات</button></li>
                        <li class="nav-item"><button class="nav-link rounded-pill px-4 py-2 fw-bold font-cairo shadow-sm" data-bs-toggle="pill" data-bs-target="#tab-app-playlists"><i class="fa-solid fa-star me-2"></i> مختارات القوائم</button></li>
                    </ul>
                    <div class="tab-content" id="pills-tabContent">
                        <div class="tab-pane fade show active" id="tab-collections"><div class="row g-4">${collectionsHtml}</div></div>
                        <div class="tab-pane fade" id="tab-app-playlists"><div class="row g-4">${playlistsHtml}</div></div>
                    </div>
                </section>`;

            container.onclick = (e) => {
                const all = e.target.closest('.play-all');
                const one = e.target.closest('.play-track');
                const player = window.globalPlayer || globalPlayer;
                if (all && registry[all.dataset.key]) {
                    player.playQueue(registry[all.dataset.key], 0);
                    showPlayerUI();
                } else if (one && registry[one.dataset.key]) {
                    player.playQueue(registry[one.dataset.key], Number(one.dataset.idx));
                    showPlayerUI();
                }
            };
        } catch (e) {
            console.error("Playlists Error:", e);
        }
    };
    Router.addRoute('#/playlists', playlistsRouteHandler);
    Router.addRoute('#/categories', playlistsRouteHandler);

    // --- 11. حصن المسلم (الأذكار التفاعلية بالكامل) ---
    Router.addRoute('#/azkar', async (container) => {
        try {
            const azkarData = await API.getAzkar();
            let azkarHtml = `
                <section class="container py-5" data-aos="fade-in">
                    <div class="position-relative rounded-4 overflow-hidden mb-5 shadow-lg d-flex align-items-center justify-content-center" style="height: 250px; background: linear-gradient(135deg, rgba(7,26,19,0.9), rgba(212,175,55,0.3)), url('${ISLAMIC_MOSQUE_IMG}') center/cover;">
                        <div class="text-center z-1 position-relative px-3">
                            <i class="fa-solid fa-hands-praying text-warning mb-3" style="font-size: 3.5rem;"></i>
                            <h1 class="fw-bold text-white font-cairo mb-2">حصن المسلم (الأذكار اليومية)</h1>
                        </div>
                    </div>
                    <ul class="nav nav-pills justify-content-center mb-5 gap-2 custom-pills" id="azkarTabs" role="tablist">
            `;
            
            azkarData.forEach((category, index) => {
                const isFirst = index === 0;
                azkarHtml += `<li class="nav-item" role="presentation"><button class="nav-link ${isFirst ? 'active' : ''} rounded-pill px-4 py-2 fw-bold font-cairo shadow-sm" data-bs-toggle="pill" data-bs-target="#azkar-cat-${index}" type="button"><i class="fa-solid ${category.icon || 'fa-star'} me-2"></i> ${category.title}</button></li>`;
            });
            azkarHtml += `</ul><div class="tab-content" id="azkarTabContent">`;

            azkarData.forEach((category, index) => {
                const isFirst = index === 0;
                azkarHtml += `<div class="tab-pane fade ${isFirst ? 'show active' : ''}" id="azkar-cat-${index}"><div class="row g-4 justify-content-center">`;
                
                category.items.forEach((item, itemIdx) => {
                    const count = item.count || 1;
                    azkarHtml += `
                        <div class="col-lg-8" data-aos="fade-up" data-aos-delay="${itemIdx * 50}">
                            <div class="card bg-glass text-white border-0 shadow-lg p-0 rounded-4 premium-card zikr-interactive-card" data-count="${count}" style="cursor: pointer; border-right: 5px solid var(--accent-gold) !important; overflow: hidden; position: relative;">
                                <div class="zikr-progress position-absolute top-0 end-0 h-100" style="width: 0%; background: rgba(212, 175, 55, 0.15); transition: width 0.3s ease; z-index: 0;"></div>
                                <div class="p-4 p-md-5 position-relative z-1 text-center">
                                    <p class="fs-4 lh-lg mb-4 font-cairo" style="font-family: 'Amiri', serif !important;">${item.text}</p>
                                    <div class="d-flex justify-content-between align-items-center mt-4 pt-3 border-top border-secondary">
                                        <button class="btn btn-glass btn-sm rounded-circle copy-zikr-btn" data-text="${item.text}"><i class="fa-solid fa-copy text-secondary"></i></button>
                                        <div class="d-flex align-items-center gap-3">
                                            <span class="text-muted-custom small">اضغط للتسبيح</span>
                                            <div class="bg-dark rounded-pill px-4 py-2 border border-warning shadow d-flex align-items-center gap-2"><i class="fa-solid fa-arrows-rotate text-warning"></i><span class="fw-bold fs-5 zikr-count-display">${count}</span></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                });
                azkarHtml += `</div></div>`;
            });

            azkarHtml += `</div></section>`;
            container.innerHTML = azkarHtml;

            document.querySelectorAll('.zikr-interactive-card').forEach(card => {
                let initialCount = parseInt(card.getAttribute('data-count'));
                let currentCount = initialCount;
                const countDisplay = card.querySelector('.zikr-count-display');
                const progressBar = card.querySelector('.zikr-progress');
                
                card.addEventListener('click', (e) => {
                    if(e.target.closest('.copy-zikr-btn')) return;
                    if (currentCount > 0) {
                        currentCount--; countDisplay.innerText = currentCount;
                        let percent = ((initialCount - currentCount) / initialCount) * 100;
                        progressBar.style.width = `${percent}%`;
                        if(window.navigator && window.navigator.vibrate) window.navigator.vibrate(40);
                    }
                });
            });

            document.querySelectorAll('.copy-zikr-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    navigator.clipboard.writeText(btn.getAttribute('data-text'));
                });
            });
        } catch (error) {}
    });

    // --- 12. صفحة القارئ الفردية ---
    Router.addRoute('#/reader', async (container) => {
        try {
            const reciterId = localStorage.getItem('current_view_reciter');
            if (!reciterId) { window.location.hash = '#/readers'; return; }
            let reciters = await API.getReciters();
            const reciter = reciters.find(r => String(r.id) === String(reciterId));
            if (!reciter) { window.location.hash = '#/readers'; return; }

            localStorage.setItem('last_reciter_id', reciter.id);
            let surahs = await API.getSurahs();
            
            let readerHtml = `
                <section class="container py-5" data-aos="fade-in">
                    <div class="card bg-glass border-0 rounded-4 p-4 p-md-5 mb-5 shadow-lg overflow-hidden position-relative" style="border: 1px solid var(--accent-gold) !important;">
                        <div class="position-absolute top-0 start-0 w-100 h-100" style="background: url('${reciter.displayPhoto}') center/cover; opacity: 0.15; filter: blur(15px);"></div>
                        <div class="row align-items-center position-relative z-1">
                            <div class="col-md-3 text-center mb-4 mb-md-0"><img src="${reciter.displayPhoto}" class="rounded-circle shadow-lg border border-warning" style="width: 160px; height: 160px; object-fit: cover; border-width: 3px !important;"></div>
                            <div class="col-md-9 text-center text-md-end"><h1 class="fw-bold text-white mb-2 font-cairo">${reciter.nameArabic}</h1><p class="text-muted-custom fs-5 mb-0">${reciter.style}</p></div>
                        </div>
                    </div>
                    <div class="row g-4">
            `;
            surahs.forEach(s => readerHtml += buildSurahCard(s));
            readerHtml += `</div></section>`;
            container.innerHTML = readerHtml;
            attachCardEvents(surahs, reciter);
        } catch (error) {}
    });

    // --- 13. الإحصائيات (Dashboard) ---
    Router.addRoute('#/dashboard', (container) => {
        const history = StorageManager.getHistory() || [];
        let totalListens = history.length;
        let mostPlayedSurah = "لا يوجد بيانات بعد";
        let mostPlayedReciter = "لا يوجد بيانات بعد";

        if(totalListens > 0) {
            const surahCounts = {}; const reciterCounts = {};
            history.forEach(item => {
                if(item.surah && item.surah.nameArabic) surahCounts[item.surah.nameArabic] = (surahCounts[item.surah.nameArabic] || 0) + 1;
                if(item.reciter && item.reciter.nameArabic) reciterCounts[item.reciter.nameArabic] = (reciterCounts[item.reciter.nameArabic] || 0) + 1;
            });
            if (Object.keys(surahCounts).length > 0) mostPlayedSurah = Object.keys(surahCounts).reduce((a, b) => surahCounts[a] > surahCounts[b] ? a : b);
            if (Object.keys(reciterCounts).length > 0) mostPlayedReciter = Object.keys(reciterCounts).reduce((a, b) => reciterCounts[a] > reciterCounts[b] ? a : b);
        }

        container.innerHTML = `
            <section class="container py-5" data-aos="fade-in">
                <div class="text-center mb-5"><h2 class="fw-bold text-white mb-2"><i class="fa-solid fa-chart-pie text-warning me-2"></i> إحصائيات نشاطك</h2></div>
                <div class="row g-4 mb-5">
                    <div class="col-md-4"><div class="card bg-glass border-0 rounded-4 p-4 text-center shadow-lg"><i class="fa-solid fa-headphones text-secondary mb-3 fs-1"></i><h3 class="fw-bold text-white mb-1">${totalListens}</h3><p class="text-muted-custom mb-0">المقاطع المستمعة</p></div></div>
                    <div class="col-md-4"><div class="card bg-glass border-0 rounded-4 p-4 text-center shadow-lg"><i class="fa-solid fa-book-quran text-secondary mb-3 fs-1"></i><h3 class="fw-bold text-white mb-1 font-cairo text-truncate">${mostPlayedSurah}</h3><p class="text-muted-custom mb-0">أكثر سورة استماعاً</p></div></div>
                    <div class="col-md-4"><div class="card bg-glass border-0 rounded-4 p-4 text-center shadow-lg"><i class="fa-solid fa-microphone-lines text-secondary mb-3 fs-1"></i><h3 class="fw-bold text-white mb-1 font-cairo text-truncate">${mostPlayedReciter}</h3><p class="text-muted-custom mb-0">القارئ المفضل</p></div></div>
                </div>
            </section>
        `;
    });

    // --- 14. الإعدادات ---
    Router.addRoute('#/settings', (container) => {
        const currentTheme = SettingsManager.getSetting('theme');
        const autoPlay = SettingsManager.getSetting('autoPlayNext');
        container.innerHTML = `
            <section class="container py-5" data-aos="fade-in" style="max-width: 800px;">
                <h2 class="fw-bold text-white mb-4">الإعدادات</h2>
                <div class="card bg-glass border-0 rounded-4 p-4 mb-4 shadow-sm">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <div><h6 class="text-white mb-1">الوضع الليلي</h6></div>
                        <div class="form-check form-switch fs-4"><input class="form-check-input shadow-none" type="checkbox" id="themeSwitch" ${currentTheme === 'dark' ? 'checked' : ''}></div>
                    </div>
                    <div class="d-flex justify-content-between align-items-center">
                        <div><h6 class="text-white mb-1">التشغيل التلقائي</h6></div>
                        <div class="form-check form-switch fs-4"><input class="form-check-input shadow-none" type="checkbox" id="autoPlaySwitch" ${autoPlay ? 'checked' : ''}></div>
                    </div>
                </div>
                <div class="card bg-glass border-0 rounded-4 p-4 mb-4 shadow-sm">
                    <h5 class="text-white fw-bold mb-3 font-cairo"><i class="fa-solid fa-bell text-warning me-2"></i> أذان أوقات الصلاة</h5>
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <div><h6 class="text-white mb-1">تشغيل الأذان تلقائيًا</h6></div>
                        <div class="form-check form-switch fs-4"><input class="form-check-input shadow-none" type="checkbox" id="adhanSwitch" ${AdhanManager.isEnabled() ? 'checked' : ''}></div>
                    </div>
                    <div class="mb-3">
                        <label class="text-white mb-2" for="adhanVoice">صوت المؤذن</label>
                        <select id="adhanVoice" class="form-select bg-dark text-white border-secondary">
                            ${Object.entries(AdhanManager.VOICES).map(([k, n]) => `<option value="${k}" ${AdhanManager.getVoice() === k ? 'selected' : ''}>${n}</option>`).join('')}
                        </select>
                    </div>
                    <div class="d-flex gap-2">
                        <button class="btn btn-primary-custom rounded-pill px-4" id="adhanTest"><i class="fa-solid fa-play me-2"></i> تجربة الأذان</button>
                        <button class="btn btn-outline-custom rounded-pill px-4" id="adhanStop"><i class="fa-solid fa-stop me-2"></i> إيقاف</button>
                    </div>
                    <small class="text-muted-custom d-block mt-3">الأذان بيشتغل طول ما الموقع مفتوح في المتصفح، وبيوقّف أي تلاوة شغالة وقت الأذان.</small>
                </div>
            </section>
        `;
        document.getElementById('themeSwitch').addEventListener('change', (e) => SettingsManager.saveSetting('theme', e.target.checked ? 'dark' : 'light'));
        document.getElementById('autoPlaySwitch').addEventListener('change', (e) => SettingsManager.saveSetting('autoPlayNext', e.target.checked));
        document.getElementById('adhanSwitch').addEventListener('change', (e) => AdhanManager.setEnabled(e.target.checked));
        document.getElementById('adhanVoice').addEventListener('change', (e) => AdhanManager.setVoice(e.target.value));
        document.getElementById('adhanTest').addEventListener('click', () => AdhanManager.test());
        document.getElementById('adhanStop').addEventListener('click', () => AdhanManager.stop());
    });

} // =================== نهاية دالة setupRoutes =================== //

// ==========================================
// 3. دوال بناء الواجهات (UI Builders) بصور إسلامية مضمونة 100%
// ==========================================

function buildSurahCard(surah) {
    const isFav = StorageManager.isFavorite(surah.id);
    const heartClass = isFav ? 'fa-solid text-danger' : 'fa-regular text-muted-custom';
    return `
        <div class="col-lg-4 col-md-6 surah-item-card" data-name="${surah.nameArabic} ${surah.nameEnglish}">
            <div class="card border-0 shadow-lg h-100 premium-card hover-lift overflow-hidden position-relative" data-surah-id="${surah.id}" style="border: 1px solid rgba(212,175,55,0.2) !important; background: linear-gradient(145deg, #0c261c, #071a13); border-radius: 20px;">
                <div class="position-absolute w-100 h-100 top-0 start-0" style="background: url('${ISLAMIC_MOSQUE_IMG}') center/cover; opacity: 0.1; z-index: 0;"></div>
                <div class="d-flex align-items-center justify-content-between position-relative p-4" style="z-index: 2;">
                    <div class="d-flex align-items-center gap-3">
                        <div class="surah-number text-warning fw-bold fs-4 d-flex align-items-center justify-content-center" style="background: rgba(0,0,0,0.4); width: 50px; height: 50px; border-radius: 50%; border: 2px solid var(--accent-gold);">${surah.id}</div>
                        <div><h5 class="mb-0 fw-bold font-cairo text-white">${surah.nameArabic}</h5><small class="text-muted-custom">${surah.nameEnglish}</small></div>
                    </div>
                    <div class="d-flex align-items-center gap-2">
                        <button class="btn btn-glass fav-btn border-0"><i class="${heartClass} fs-5"></i></button>
                        <button class="btn btn-primary-custom rounded-circle play-surah-btn d-flex align-items-center justify-content-center shadow-lg" style="width: 45px; height: 45px; border: 1px solid #fff;"><i class="fa-solid fa-play" style="margin-left: 3px;"></i></button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function buildReciterCard(reciter) {
    return `
        <div class="col-xl-3 col-lg-4 col-md-6 reciter-item-card" data-name="${reciter.nameArabic}">
            <div class="card reciter-card bg-glass border-0 text-center p-4 h-100 premium-card hover-lift" style="cursor:pointer; border: 1px solid rgba(212,175,55,0.15) !important; background: linear-gradient(to bottom, rgba(12,38,28,0.8), rgba(0,0,0,0.6)); border-radius: 25px;" onclick="localStorage.setItem('current_view_reciter', '${reciter.id}'); window.location.hash='#/reader'">
                <div class="position-relative mx-auto mb-4" style="width: 130px; height: 130px;">
                    <img src="${reciter.displayPhoto}" onerror="handleImageError(this)" class="w-100 h-100 object-fit-cover rounded-circle shadow-lg" style="border: 4px solid var(--accent-gold);">
                </div>
                <h5 class="text-white fw-bold mb-1 font-cairo">${reciter.nameArabic}</h5>
                <small class="text-muted-custom mb-3 d-block px-2">${reciter.style}</small>
                <div class="mt-auto d-inline-block px-4 py-2 rounded-pill bg-dark text-warning border border-warning shadow-sm"><i class="fa-solid fa-headphones me-2"></i> استمع</div>
            </div>
        </div>
    `;
}

function buildGiantCard(reciter) {
    return `
        <div class="col-lg-6 col-md-12 reciter-item-card" data-name="${reciter.nameArabic}">
            <div class="card bg-glass border-0 p-4 h-100 premium-card hover-lift d-flex flex-row align-items-center overflow-hidden position-relative" style="cursor:pointer; border: 1px solid rgba(212,175,55,0.3) !important; background: linear-gradient(145deg, #0c261c, #000); border-radius: 20px;" onclick="localStorage.setItem('current_view_reciter', '${reciter.id}'); window.location.hash='#/reader'">
                <div class="position-absolute w-100 h-100 top-0 start-0" style="background: url('${ISLAMIC_MOSQUE_IMG}') center/cover; opacity: 0.05; z-index: 1;"></div>
                <div class="position-relative z-2 me-4" style="width: 100px; height: 100px; flex-shrink: 0;">
                    <img src="${reciter.displayPhoto}" onerror="handleImageError(this)" class="w-100 h-100 object-fit-cover rounded-3 shadow-lg" style="border: 2px solid var(--accent-gold);">
                </div>
                <div class="text-start flex-grow-1 ms-3 position-relative z-2">
                    <h4 class="text-white fw-bold mb-2 font-cairo">${reciter.nameArabic}</h4>
                    <span class="badge bg-dark text-warning rounded-pill px-3 py-2 border border-warning shadow-sm"><i class="fa-solid fa-microphone-lines me-2"></i> ${reciter.style}</span>
                </div>
                <div class="ms-auto pe-2 position-relative z-2">
                    <div class="bg-dark rounded-circle d-flex align-items-center justify-content-center shadow-lg border border-secondary" style="width: 50px; height: 50px;">
                        <i class="fa-solid fa-chevron-left text-warning fs-4"></i>
                    </div>
                </div>
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
        p.classList.add('active'); p.style.opacity = '1'; p.style.transform = 'translateY(0)';
    }
}