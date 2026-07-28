// js/app.js - Ultimate Premium Application Engine (PART 1)

import { API } from './api.js';
import { globalPlayer } from './player.js';
import { Router } from './router.js';
import { SettingsManager } from './theme.js';
import { StorageManager } from './storage.js';
import { initCustomCursor } from './cursor.js';

// ==========================================
// 1. التهيئة الأساسية (Initialization)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

async function initApp() {
    SettingsManager.init();
    initCustomCursor();
    
    if(typeof window.AOS !== 'undefined') window.AOS.init({ once: true, offset: 50, duration: 800 });
    
    // ضبط الفوتر ديناميكياً
    const config = await API.getConfig();
    if(config) {
        const footerText = document.querySelector('footer p.small');
        if(footerText) {
            footerText.innerHTML = `${config.developer.copyright} <br> <span class="fw-bold text-secondary">${config.developer.name}</span>`;
        }
    }

    setupRoutes();
    Router.init();

    // تفعيل أيقونات البحث لفتح صفحة البحث المتقدمة
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
}

// ==========================================
// 2. إدارة المسارات (Router Setup)
// ==========================================
function setupRoutes() {
    
    // ----------------------------------------
    // مسار الصفحة الرئيسية (Home)
    // ----------------------------------------
    Router.addRoute('#/home', async (container) => {
        const surahs = await API.getSurahs();
        const reciters = await API.getReciters();
        const playlists = await API.getPlaylists();
        const defaultReciter = reciters[0] || null;
        const continueData = StorageManager.getContinueListening();
        const stats = StorageManager.getStats();

        let heroHtml = `
            <section class="hero-section text-center py-5 mb-5" data-aos="fade-up">
                <div class="badge bg-secondary text-dark rounded-pill px-3 py-2 mb-4 fw-bold shadow-soft slide-up-animation">
                    <i class="fa-solid fa-crown me-1"></i> الإصدار المميز (Premium)
                </div>
                <h1 class="display-3 fw-bold text-white mb-3">استمع للقرآن <span class="text-secondary">بنقاء وصفاء</span></h1>
                <p class="lead text-muted-custom mb-5">تجربة استماع فاخرة، بدون إعلانات، ومجانية بالكامل.</p>
                <div class="d-flex justify-content-center gap-3 flex-wrap">
                    <a href="#/egyptian" class="btn btn-secondary rounded-pill px-4 py-2 fw-bold shadow-soft text-dark"><i class="fa-solid fa-landmark me-2"></i> مكتبة العمالقة</a>
                    <a href="#/quran" class="btn btn-primary-custom rounded-pill px-4 py-2 fw-bold shadow-soft"><i class="fa-solid fa-play ms-2"></i> تصفح السور</a>
                    <a href="#/tafsir" class="btn btn-outline-custom rounded-pill px-4 py-2 fw-bold"><i class="fa-solid fa-book-open ms-2"></i> التفسير</a>
                    <a href="#/playlists" class="btn btn-outline-custom rounded-pill px-4 py-2 fw-bold"><i class="fa-solid fa-list-music ms-2"></i> القوائم</a>
                </div>
            </section>
        `;

        if (continueData) {
            heroHtml += `
                <section class="container mb-5" data-aos="fade-up">
                    <div class="card bg-glass border-0 rounded-4 p-4 shadow-sm" style="border-left: 4px solid var(--secondary-color) !important;">
                        <div class="d-flex justify-content-between align-items-center flex-wrap gap-3">
                            <div>
                                <h6 class="text-secondary fw-bold mb-1"><i class="fa-solid fa-rotate-right me-2"></i> استكمال الاستماع</h6>
                                <h4 class="text-white font-cairo mb-0">سورة ${continueData.surah.nameArabic}</h4>
                                <small class="text-muted-custom">بصوت ${continueData.reciter.nameArabic}</small>
                            </div>
                            <button class="btn btn-primary-custom rounded-pill px-4 py-2 fw-bold" id="continueBtn">
                                <i class="fa-solid fa-play ms-2"></i> متابعة
                            </button>
                        </div>
                    </div>
                </section>
            `;
        }

        let statsHtml = `
            <section class="container mb-5" data-aos="fade-up" data-aos-delay="100">
                <div class="row g-4">
                    <div class="col-md-4">
                        <div class="card bg-glass border-0 rounded-4 p-4 text-center shadow-sm h-100">
                            <i class="fa-solid fa-headphones text-secondary fs-1 mb-3"></i>
                            <h3 class="text-white fw-bold">${Math.floor(stats.totalListeningSeconds / 60)}</h3>
                            <span class="text-muted-custom">دقيقة استماع</span>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="card bg-glass border-0 rounded-4 p-4 text-center shadow-sm h-100">
                            <i class="fa-solid fa-book-open-reader text-secondary fs-1 mb-3"></i>
                            <h3 class="text-white fw-bold">${stats.surahsCompleted}</h3>
                            <span class="text-muted-custom">سورة مكتملة</span>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="card bg-glass border-0 rounded-4 p-4 text-center shadow-sm h-100">
                            <i class="fa-solid fa-calendar-check text-secondary fs-1 mb-3"></i>
                            <h3 class="text-white fw-bold">${stats.daysActive}</h3>
                            <span class="text-muted-custom">أيام نشطة</span>
                        </div>
                    </div>
                </div>
            </section>
        `;

        let playlistSection = ``;
        if (playlists && playlists.length > 0) {
            playlistSection = `
                <section class="container mb-5" data-aos="fade-up">
                    <div class="d-flex justify-content-between align-items-center mb-4">
                        <h3 class="fw-bold text-white mb-0">قوائم مختارة</h3>
                        <a href="#/playlists" class="text-secondary text-decoration-none small">عرض الكل <i class="fa-solid fa-chevron-left ms-1"></i></a>
                    </div>
                    <div class="row g-4">
            `;
            playlists.slice(0, 3).forEach(pl => playlistSection += buildPlaylistCard(pl));
            playlistSection += `</div></section>`;
        }

        let surahsHtml = `
            <section class="container py-5" data-aos="fade-up" data-aos-delay="200">
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h3 class="fw-bold text-white mb-0">ترشيحات السور <span class="text-secondary fs-6 ms-2">(بصوت ${defaultReciter ? defaultReciter.nameArabic : ''})</span></h3>
                    <a href="#/quran" class="text-secondary text-decoration-none small">عرض الكل <i class="fa-solid fa-chevron-left ms-1"></i></a>
                </div>
                <div class="row g-4">
        `;
        const featuredSurahs = surahs.sort(() => 0.5 - Math.random()).slice(0, 6);
        featuredSurahs.forEach(surah => surahsHtml += buildSurahCard(surah));
        surahsHtml += `</div></section>`;
        
        container.innerHTML = heroHtml + statsHtml + playlistSection + surahsHtml;
        attachCardEvents(surahs, defaultReciter);

        if (continueData) {
            document.getElementById('continueBtn').addEventListener('click', () => {
                globalPlayer.playTrack(continueData.surah, continueData.reciter, continueData.time);
                showPlayerUI();
            });
        }
    });

    // ----------------------------------------
    // مسار المكتبة المصرية (Egyptian Library)
    // ----------------------------------------
    Router.addRoute('#/egyptian', async (container) => {
        const reciters = await API.getReciters();
        const egyptianReciters = reciters.filter(r => r.isEgyptianLibrary);

        let egyHtml = `
            <section class="container py-5" data-aos="fade-in">
                <div class="card bg-glass border-0 rounded-4 p-5 mb-5 shadow-lg text-center" style="background: linear-gradient(45deg, rgba(22, 49, 38, 0.8), rgba(200, 167, 90, 0.2)); border: 1px solid var(--secondary-color) !important;">
                    <i class="fa-solid fa-landmark text-secondary mb-3" style="font-size: 4rem;"></i>
                    <h1 class="fw-bold text-white font-cairo mb-3">مكتبة العمالقة المصريين</h1>
                    <p class="text-muted-custom fs-5 mb-0" style="max-width: 700px; margin: auto;">أرشيف حصري يضم أساطير التلاوة، وتلاوات المحافل والمجود النادرة التي شكلت وجدان العالم الإسلامي.</p>
                </div>
                <div class="row g-4">
        `;
        if(egyptianReciters.length > 0){
            egyptianReciters.forEach(r => egyHtml += buildReciterCard(r, true));
        } else {
            egyHtml += `<div class="col-12 text-center text-muted-custom py-5">لا توجد بيانات حالياً.</div>`;
        }
        egyHtml += `</div></section>`;
        container.innerHTML = egyHtml;
    });

    // ----------------------------------------
    // مسار القوائم الذكية (Playlists & Collections)
    // ----------------------------------------
    Router.addRoute('#/playlists', async (container) => {
        const collections = await API.getCollections();
        const appPlaylists = await API.getPlaylists();
        const userPlaylists = StorageManager.getPlaylists();

        let html = `
            <section class="container py-5" data-aos="fade-in">
                <div class="text-center mb-5">
                    <h2 class="fw-bold text-white mb-2"><i class="fa-solid fa-list-music text-secondary me-2"></i> المجموعات والقوائم</h2>
                    <p class="text-muted-custom">تصفح التلاوات حسب النوع، المناسبة، وقوائمك المفضلة</p>
                </div>
        `;

        if (appPlaylists && appPlaylists.length > 0) {
            html += `<h4 class="text-secondary fw-bold mb-4 mt-5"><i class="fa-solid fa-star me-2"></i> قوائم مختارة</h4><div class="row g-4">`;
            appPlaylists.forEach(pl => html += buildPlaylistCard(pl));
            html += `</div>`;
        }

        if (collections && collections.length > 0) {
            html += `<h4 class="text-secondary fw-bold mb-4 mt-5"><i class="fa-solid fa-layer-group me-2"></i> المناسبات والمجموعات</h4><div class="row g-4">`;
            collections.forEach(cat => {
                const cover = 'https://images.unsplash.com/photo-1574044943916-2581699f8c65?auto=format&fit=crop&w=800&q=80';
                html += `
                    <div class="col-lg-4 col-md-6 slide-up-animation">
                        <div class="card bg-glass text-white border-0 shadow-sm p-5 text-center h-100 premium-card" onclick="window.location.hash='#/collection?id=${cat.id}'" style="cursor: pointer; border-bottom: 4px solid var(--secondary-color) !important; background: linear-gradient(to top, rgba(7,26,19,0.9), rgba(7,26,19,0.7)), url('${cover}'); background-size: cover;">
                            <i class="fa-solid ${cat.icon} mb-3" style="font-size: 3rem; color: var(--secondary-color);"></i>
                            <h4 class="fw-bold font-cairo mb-2 text-white">${cat.title}</h4>
                            <small class="text-light">${cat.description || ''}</small>
                        </div>
                    </div>
                `;
            });
            html += `</div>`;
        }

        if (userPlaylists && Object.keys(userPlaylists).length > 0) {
            html += `<h4 class="text-secondary fw-bold mb-4 mt-5"><i class="fa-solid fa-bookmark me-2"></i> قوائمك الخاصة</h4><div class="row g-4">`;
            Object.keys(userPlaylists).forEach(key => {
                const list = userPlaylists[key];
                if(list.items.length > 0) {
                    html += `
                        <div class="col-lg-4 col-md-6 slide-up-animation">
                            <div class="card bg-glass border-0 rounded-4 p-4 h-100 shadow-sm premium-card" onclick="window.location.hash='#/user-playlist?id=${key}'" style="cursor:pointer;">
                                <div class="d-flex align-items-center mb-3">
                                    <div class="bg-dark rounded-circle d-flex justify-content-center align-items-center me-3" style="width: 60px; height: 60px;"><i class="fa-solid fa-music text-secondary fs-4"></i></div>
                                    <div><h5 class="fw-bold text-white font-cairo mb-1">${list.name}</h5><small class="text-muted-custom">${list.items.length} مقطع</small></div>
                                </div>
                            </div>
                        </div>
                    `;
                }
            });
            html += `</div>`;
        }

        html += `</section>`;
        container.innerHTML = html;
    });

    // ----------------------------------------
    // مسار المجموعة الديناميكية (Collection View)
    // ----------------------------------------
    Router.addRoute('#/collection', async (container, params) => {
        const collectionId = params.get('id');
        const collections = await API.getCollections();
        const collectionMeta = collections.find(c => c.id === collectionId);
        
        if (!collectionMeta) return container.innerHTML = `<div class="container py-5 text-center text-white"><h4>القسم غير متوفر</h4></div>`;

        const surahs = await API.getSurahs();
        const reciters = await API.getReciters();
        
        let pageHtml = `
            <section class="container py-5" data-aos="fade-in">
                <div class="text-center mb-5">
                    <i class="fa-solid ${collectionMeta.icon} text-secondary mb-3" style="font-size: 4rem;"></i>
                    <h1 class="fw-bold text-white mb-2 font-cairo">${collectionMeta.title}</h1>
                    <p class="text-muted-custom">${collectionMeta.description || ''}</p>
                </div>
        `;

        if (collectionMeta.featuredReciters && collectionMeta.featuredReciters.length > 0) {
            pageHtml += `<h4 class="fw-bold text-white mb-4">قراء مقترحون</h4><div class="row g-4 mb-5">`;
            const fReciters = reciters.filter(r => collectionMeta.featuredReciters.includes(r.id));
            fReciters.forEach(r => pageHtml += buildReciterCard(r));
            pageHtml += `</div>`;
        }

        if (collectionMeta.featuredSurahs && collectionMeta.featuredSurahs.length > 0) {
            pageHtml += `<h4 class="fw-bold text-white mb-4">تلاوات مقترحة</h4><div class="row g-4">`;
            const fSurahs = surahs.filter(s => collectionMeta.featuredSurahs.includes(s.id));
            fSurahs.forEach(s => pageHtml += buildSurahCard(s));
            pageHtml += `</div>`;
        }

        if (!collectionMeta.featuredReciters && !collectionMeta.featuredSurahs) {
            const randomSurahs = await API.getSmartRecommendations('surahs', 6);
            pageHtml += `<h4 class="fw-bold text-white mb-4">تلاوات ذات صلة</h4><div class="row g-4">`;
            randomSurahs.forEach(s => pageHtml += buildSurahCard(s));
            pageHtml += `</div>`;
        }

        pageHtml += `</section>`;
        container.innerHTML = pageHtml;
        attachCardEvents(surahs, reciters[0]);
    });

    // ----------------------------------------
    // مسار عرض قائمة تشغيل التطبيق (App Playlist)
    // ----------------------------------------
    Router.addRoute('#/playlist', async (container, params) => {
        const id = params.get('id');
        const playlists = await API.getPlaylists();
        const pl = playlists.find(p => p.id === id);
        
        if (!pl) return container.innerHTML = `<div class="container py-5 text-center text-white"><h4>القائمة غير موجودة</h4></div>`;

        const surahs = await API.getSurahs();
        const reciters = await API.getReciters();

        let html = `
            <section class="container py-5" data-aos="fade-in">
                <div class="card bg-glass border-0 rounded-4 p-4 p-md-5 mb-5 shadow-lg position-relative overflow-hidden">
                    <div class="position-absolute top-0 start-0 w-100 h-100" style="background: url('${pl.cover}') center/cover; opacity: 0.2; z-index: 0;"></div>
                    <div class="position-relative" style="z-index: 1;">
                        <h1 class="fw-bold text-secondary font-cairo mb-2">${pl.title}</h1>
                        <p class="text-white fs-5">${pl.description}</p>
                        <button class="btn btn-primary-custom rounded-pill px-5 py-3 fw-bold shadow-lg mt-3" id="playAllBtn"><i class="fa-solid fa-play ms-2"></i> تشغيل القائمة</button>
                    </div>
                </div>
                <div class="row g-3">
        `;

        const tracksToPlay = [];
        pl.items.forEach((item, index) => {
            const s = surahs.find(x => x.id === item.surahId);
            const r = reciters.find(x => x.id === item.reciterId);
            if(s && r) {
                tracksToPlay.push({surah: s, reciter: r});
                html += `
                    <div class="col-12">
                        <div class="card bg-glass text-white border-0 shadow-sm p-3 rounded-4 d-flex flex-row align-items-center justify-content-between history-item premium-card" data-index="${index}" style="cursor: pointer;">
                            <div class="d-flex align-items-center gap-3">
                                <div class="bg-dark rounded-circle d-flex justify-content-center align-items-center text-secondary fw-bold" style="width: 50px; height: 50px;">${index + 1}</div>
                                <div><h5 class="mb-0 fw-bold font-cairo">سورة ${s.nameArabic}</h5><small class="text-muted-custom font-inter">بصوت ${r.nameArabic}</small></div>
                            </div>
                            <button class="btn btn-glass shadow-none border-0"><i class="fa-solid fa-play"></i></button>
                        </div>
                    </div>
                `;
            }
        });

        html += `</div></section>`;
        container.innerHTML = html;

        document.querySelectorAll('.history-item').forEach(card => {
            card.addEventListener('click', () => {
                const idx = parseInt(card.getAttribute('data-index'));
                globalPlayer.playTrack(tracksToPlay[idx].surah, tracksToPlay[idx].reciter);
                showPlayerUI();
            });
        });

        document.getElementById('playAllBtn').addEventListener('click', () => {
            if(tracksToPlay.length > 0) {
                globalPlayer.playTrack(tracksToPlay[0].surah, tracksToPlay[0].reciter);
                showPlayerUI();
            }
        });
    });

    // ----------------------------------------
    // مسار التفسير المتقدم (Tafsir)
    // ----------------------------------------
    Router.addRoute('#/tafsir', async (container) => {
        const surahs = await API.getSurahs();
        const tafsirData = await API.getTafsir();

        let tafsirHtml = `
            <section class="container py-5" data-aos="fade-in">
                <div class="text-center mb-5">
                    <h2 class="fw-bold text-white mb-2"><i class="fa-solid fa-book-open text-secondary me-2"></i> موسوعة التفسير</h2>
                    <p class="text-muted-custom">تفسير القرآن الكريم بعدة كتب معتمدة</p>
                </div>
                <div class="row justify-content-center mb-5">
                    <div class="col-md-6">
                        <select id="surahSelect" class="form-select bg-glass text-white border-secondary shadow-none fs-5 py-3 rounded-pill text-center font-cairo">
                            <option value="" disabled selected>-- اختر السورة لعرض التفسير --</option>
                            ${surahs.map(s => `<option value="${s.id}" class="text-dark">سورة ${s.nameArabic}</option>`).join('')}
                        </select>
                    </div>
                </div>
                <div id="tafsirContentArea" class="d-none slide-up-animation">
                    <ul class="nav nav-pills justify-content-center mb-4 gap-2" id="tafsirTabs" role="tablist">
                        <li class="nav-item"><button class="nav-link active rounded-pill bg-glass text-white px-4" data-book="muyassar">الميسر</button></li>
                        <li class="nav-item"><button class="nav-link rounded-pill bg-glass text-white px-4" data-book="saadi">السعدي</button></li>
                        <li class="nav-item"><button class="nav-link rounded-pill bg-glass text-white px-4" data-book="katheer">ابن كثير</button></li>
                        <li class="nav-item"><button class="nav-link rounded-pill bg-glass text-white px-4" data-book="tabari">الطبري</button></li>
                    </ul>
                    <div class="card bg-glass text-white border-0 shadow-lg p-4 p-md-5 rounded-4 position-relative">
                        <div class="position-absolute top-0 end-0 p-3 d-flex gap-2">
                            <button class="btn btn-glass btn-sm" id="increaseFont" title="تكبير"><i class="fa-solid fa-a"></i>+</button>
                            <button class="btn btn-glass btn-sm" id="decreaseFont" title="تصغير"><i class="fa-solid fa-a"></i>-</button>
                            <button class="btn btn-glass btn-sm text-secondary" id="copyTafsir" title="نسخ"><i class="fa-solid fa-copy"></i></button>
                        </div>
                        <h3 class="fw-bold text-secondary font-cairo border-bottom border-secondary pb-3 mb-4 mt-2" id="tafsirTitle"></h3>
                        <div id="tafsirText" class="lh-lg font-cairo fs-5" style="transition: font-size 0.3s; min-height: 200px;"></div>
                    </div>
                </div>
            </section>
        `;

        container.innerHTML = tafsirHtml;

        let currentFontSize = 1.25;
        let currentSurahId = null;
        let currentBook = 'muyassar';

        const updateTafsirText = () => {
            if(!currentSurahId) return;
            const tData = tafsirData.find(t => t.surahId === currentSurahId && t.book === currentBook);
            const textEl = document.getElementById('tafsirText');
            if(tData) {
                textEl.innerHTML = `<p>${tData.text}</p>`;
            } else {
                textEl.innerHTML = `<div class="text-center py-5 text-muted-custom"><i class="fa-solid fa-hourglass-empty fs-1 mb-3"></i><br>جاري استكمال إضافة هذا التفسير.</div>`;
            }
        };

        document.getElementById('surahSelect').addEventListener('change', (e) => {
            currentSurahId = parseInt(e.target.value);
            const surah = surahs.find(s => s.id === currentSurahId);
            document.getElementById('tafsirContentArea').classList.remove('d-none');
            document.getElementById('tafsirTitle').textContent = `سورة ${surah.nameArabic}`;
            updateTafsirText();
        });

        document.querySelectorAll('#tafsirTabs .nav-link').forEach(tab => {
            tab.addEventListener('click', (e) => {
                document.querySelectorAll('#tafsirTabs .nav-link').forEach(t => t.classList.remove('bg-secondary', 'text-dark', 'active'));
                tab.classList.add('bg-secondary', 'text-dark', 'active');
                currentBook = e.target.getAttribute('data-book');
                const tText = document.getElementById('tafsirText');
                tText.style.opacity = '0';
                setTimeout(() => {
                    updateTafsirText();
                    tText.style.opacity = '1';
                }, 300);
            });
        });

        document.getElementById('increaseFont').addEventListener('click', () => { currentFontSize += 0.1; document.getElementById('tafsirText').style.fontSize = `${currentFontSize}rem`; });
        document.getElementById('decreaseFont').addEventListener('click', () => { currentFontSize -= 0.1; document.getElementById('tafsirText').style.fontSize = `${currentFontSize}rem`; });
        document.getElementById('copyTafsir').addEventListener('click', () => {
            navigator.clipboard.writeText(document.getElementById('tafsirText').innerText).then(() => StorageManager.showToast('تم نسخ التفسير'));
        });
    });

// ----------------------------------------
// (نهاية الجزء الأول)
// ----------------------------------------// ----------------------------------------
    // مسار ملف القارئ المتقدم (Reader Profile + Smart Recommendations)
    // ----------------------------------------
 // ----------------------------------------
    // مسار ملف القارئ المتقدم (Smart Filtering)
    // ----------------------------------------
    Router.addRoute('#/reader', async (container, params) => {
        const reciterId = params.get('id');
        const reciters = await API.getReciters();
        const allSurahs = await API.getSurahs();
        const reciter = reciters.find(r => r.id === reciterId);

        if (!reciter) return container.innerHTML = `<div class="container py-5 text-center text-white"><h4>القارئ غير موجود</h4></div>`;

        // === الفلترة الذكية للسور (Smart Filtering) ===
        let displaySurahs = allSurahs;
        if (reciter.availableSurahs && Array.isArray(reciter.availableSurahs)) {
            // إذا كان القارئ من أصحاب التسجيلات النادرة، اعرض السور المتاحة فقط
            displaySurahs = allSurahs.filter(s => reciter.availableSurahs.includes(s.id));
        }

        let profileHtml = `
            <section class="container py-5" data-aos="fade-in">
                <div class="position-relative rounded-4 overflow-hidden mb-5 shadow-lg" style="height: 350px;">
                    <img src="${reciter.displayCover}" loading="lazy" onerror="handleImageError(this, 'cover')" class="w-100 h-100 object-fit-cover" style="filter: brightness(0.3);">
                    <div class="position-absolute bottom-0 start-0 w-100 p-4 p-md-5 d-flex align-items-end flex-wrap gap-4" style="background: linear-gradient(to top, rgba(7,26,19,1), transparent);">
                        <img src="${reciter.displayPhoto}" loading="lazy" onerror="handleImageError(this, 'avatar')" alt="${reciter.nameArabic}" class="rounded-circle shadow-lg border border-3 border-secondary bg-dark" style="width: 160px; height: 160px; object-fit: cover;">
                        <div class="pb-2">
                            <h1 class="fw-bold text-white font-cairo mb-2">${reciter.nameArabic} <i class="fa-solid fa-circle-check text-secondary fs-4" title="موثق"></i></h1>
                            <div class="d-flex flex-wrap gap-2 mb-2">
                                <span class="badge bg-glass text-white px-3 py-2 border border-secondary"><i class="fa-solid fa-microphone-lines me-1"></i> ${reciter.style}</span>
                                <span class="badge bg-glass text-white px-3 py-2 border border-secondary"><i class="fa-solid fa-layer-group me-1"></i> ${displaySurahs.length} تلاوة متاحة</span>
                            </div>
                        </div>
                        <div class="ms-md-auto pb-2 d-flex gap-2">
                            <button class="btn btn-primary-custom rounded-pill px-5 py-3 fw-bold shadow-lg fs-5" id="playFirstSurahBtn"><i class="fa-solid fa-play ms-2"></i> تشغيل أول تلاوة</button>
                        </div>
                    </div>
                </div>

                <div class="row mb-5">
                    <div class="col-12">
                        <div class="card bg-glass border-0 rounded-4 p-4 shadow-sm">
                            <h5 class="text-secondary fw-bold mb-3"><i class="fa-solid fa-address-card me-2"></i> السيرة الذاتية</h5>
                            <p class="text-muted-custom lh-lg mb-0 font-cairo fs-5">${reciter.biography || 'سيرة القارئ قيد التحديث.'}</p>
                        </div>
                    </div>
                </div>

                <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
                    <h3 class="fw-bold text-white mb-0">التلاوات المتوفرة (${displaySurahs.length})</h3>
                    <div class="search-box glass-nav rounded-pill px-3 py-2 d-flex align-items-center" style="max-width: 300px;">
                        <i class="fa-solid fa-search text-muted-custom ms-2"></i>
                        <input type="text" id="reader-surah-search" class="form-control bg-transparent border-0 text-white shadow-none" placeholder="ابحث في السور...">
                    </div>
                </div>
                
                <div class="row g-4 mb-5" id="reader-surahs-container">
        `;

        // بناء بطاقات السور المفلترة فقط
        if(displaySurahs.length > 0) {
            displaySurahs.forEach(surah => profileHtml += buildSurahCard(surah));
        } else {
            profileHtml += `<div class="col-12 text-center py-5 text-muted-custom">لا توجد تلاوات مضافة حالياً لهذا القارئ.</div>`;
        }
        
        profileHtml += `</div>`;

        // اقتراحات قراء مشابهين
        let similar = reciters.filter(r => r.id !== reciter.id).sort(() => 0.5 - Math.random()).slice(0, 4);
        if(similar.length > 0) {
            profileHtml += `
                <div class="mt-5 pt-5 border-top border-secondary" style="border-color: rgba(255,255,255,0.05) !important;">
                    <h3 class="fw-bold text-white mb-4"><i class="fa-solid fa-wand-magic-sparkles text-secondary me-2"></i> قراء مشابهون</h3>
                    <div class="row g-4">
            `;
            similar.forEach(sim => profileHtml += buildReciterCard(sim));
            profileHtml += `</div></div>`;
        }

        profileHtml += `</section>`;
        container.innerHTML = profileHtml;

        // ربط الأحداث بالسرد المفلتر فقط
        attachCardEvents(displaySurahs, reciter);

        document.getElementById('playFirstSurahBtn').addEventListener('click', () => {
            if(displaySurahs.length > 0) {
                globalPlayer.playTrack(displaySurahs[0], reciter);
                showPlayerUI();
            } else {
                StorageManager.showToast('لا توجد تلاوات متوفرة لتشغيلها.');
            }
        });

        document.getElementById('reader-surah-search').addEventListener('input', (e) => {
            const term = e.target.value;
            document.querySelectorAll('#reader-surahs-container .surah-item-card').forEach(card => {
                const name = card.getAttribute('data-name');
                card.style.display = name.includes(term) ? 'block' : 'none';
            });
        });
    });
    // ----------------------------------------
    // مسار القرآن الكريم (Quran)
    // ----------------------------------------
    Router.addRoute('#/quran', async (container) => {
        const surahs = await API.getSurahs();
        const reciters = await API.getReciters();
        const defaultReciter = reciters[0] || null;

        let quranHtml = `
            <section class="container py-5" data-aos="fade-in">
                <div class="d-flex justify-content-between align-items-center mb-5 flex-wrap gap-3">
                    <div>
                        <h2 class="fw-bold text-white mb-1">القرآن الكريم</h2>
                        <p class="text-muted-custom mb-0">تصفح 114 سورة واستمع لها</p>
                    </div>
                    <div class="search-box glass-nav rounded-pill px-3 py-2 d-flex align-items-center w-100" style="max-width: 300px;">
                        <i class="fa-solid fa-search text-muted-custom ms-2"></i>
                        <input type="text" id="surah-search" class="form-control bg-transparent border-0 text-white shadow-none" placeholder="بحث عن سورة...">
                    </div>
                </div>
                <div class="row g-4">
        `;
        surahs.forEach(surah => quranHtml += buildSurahCard(surah));
        quranHtml += `</div></section>`;
        container.innerHTML = quranHtml;
        attachCardEvents(surahs, defaultReciter);

        document.getElementById('surah-search').addEventListener('input', (e) => {
            const term = e.target.value;
            document.querySelectorAll('.surah-item-card').forEach(card => {
                const name = card.getAttribute('data-name');
                card.style.display = name.includes(term) ? 'block' : 'none';
            });
        });
    });

    // ----------------------------------------
    // مسار القراء (Reciters)
    // ----------------------------------------
    Router.addRoute('#/readers', async (container) => {
        const reciters = await API.getReciters();
        let readersHtml = `
            <section class="container py-5" data-aos="fade-in">
                <div class="d-flex justify-content-between align-items-center mb-5 flex-wrap gap-3">
                    <div>
                        <h2 class="fw-bold text-white mb-1">القراء</h2>
                        <p class="text-muted-custom mb-0">استمع إلى كبار قراء العالم الإسلامي</p>
                    </div>
                    <div class="search-box glass-nav rounded-pill px-3 py-2 d-flex align-items-center w-100" style="max-width: 300px;">
                        <i class="fa-solid fa-search text-muted-custom ms-2"></i>
                        <input type="text" id="reader-search" class="form-control bg-transparent border-0 text-white shadow-none" placeholder="بحث...">
                    </div>
                </div>
                <div class="row g-4">
        `;
        reciters.forEach(reciter => readersHtml += buildReciterCard(reciter));
        readersHtml += `</div></section>`;
        container.innerHTML = readersHtml;

        document.getElementById('reader-search').addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            document.querySelectorAll('.reciter-item-card').forEach(card => {
                const name = card.getAttribute('data-name').toLowerCase();
                card.style.display = name.includes(term) ? 'block' : 'none';
            });
        });
    });

    // ----------------------------------------
    // مسار الإذاعة (Radio)
    // ----------------------------------------
    Router.addRoute('#/radio', async (container) => {
        const radios = await API.getRadios();
        let radioHtml = `
            <section class="container py-5" data-aos="fade-in">
                <div class="mb-5 text-center">
                    <h2 class="fw-bold text-white mb-2"><i class="fa-solid fa-tower-broadcast text-secondary me-2"></i> إذاعة القرآن الكريم</h2>
                </div>
                <div class="row g-4 justify-content-center">
        `;
        radios.forEach(radio => {
            radioHtml += `
                <div class="col-lg-5 col-md-6">
                    <div class="card bg-glass text-white border-0 shadow-sm h-100 p-4 premium-card radio-card" data-radio-id="${radio.id}" style="cursor: pointer;">
                        <div class="d-flex align-items-center gap-4">
                            <img src="${radio.image}" loading="lazy" onerror="handleImageError(this, 'avatar')" alt="${radio.nameArabic}" class="rounded-circle shadow" style="width: 80px; height: 80px; object-fit: cover; border: 2px solid var(--secondary-color);">
                            <div class="flex-grow-1">
                                <h5 class="mb-1 fw-bold font-cairo">${radio.nameArabic}</h5>
                                <button class="btn btn-outline-custom rounded-pill btn-sm fw-bold px-4 mt-2"><i class="fa-solid fa-play me-1"></i> تشغيل البث</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });
        radioHtml += `</div></section>`;
        container.innerHTML = radioHtml;

        document.querySelectorAll('.radio-card').forEach(card => {
            card.addEventListener('click', () => {
                const radioId = card.getAttribute('data-radio-id');
                const selectedRadio = radios.find(r => r.id === radioId);
                globalPlayer.playTrack({ nameArabic: selectedRadio.nameArabic, fileName: '' }, { nameArabic: 'البث المباشر', serverUrl: selectedRadio.url, displayPhoto: selectedRadio.image });
                showPlayerUI();
            });
        });
    });

    // ----------------------------------------
    // مسار الأذكار (Azkar)
    // ----------------------------------------
    Router.addRoute('#/azkar', async (container) => {
        const azkarData = await API.getAzkar();
        let azkarHtml = `
            <section class="container py-5" data-aos="fade-in" style="max-width: 900px;">
                <div class="text-center mb-5">
                    <h2 class="fw-bold text-white mb-2"><i class="fa-solid fa-hands-praying text-secondary me-2"></i> حصن المسلم</h2>
                </div>
                <div class="accordion custom-accordion" id="azkarAccordion">
        `;
        azkarData.forEach((category, index) => {
            const isFirst = index === 0;
            azkarHtml += `
                <div class="accordion-item bg-transparent border-0 mb-3">
                    <h2 class="accordion-header" id="heading${index}">
                        <button class="accordion-button ${isFirst ? '' : 'collapsed'} bg-glass text-white fw-bold font-cairo rounded-4 shadow-sm" type="button" data-bs-toggle="collapse" data-bs-target="#collapse${index}">
                            <i class="fa-solid ${category.icon} text-secondary me-3 ms-2 fs-5"></i> ${category.title}
                        </button>
                    </h2>
                    <div id="collapse${index}" class="accordion-collapse collapse ${isFirst ? 'show' : ''}" data-bs-parent="#azkarAccordion">
                        <div class="accordion-body p-0 pt-3">
                            <div class="row g-3">
            `;
            category.items.forEach(item => {
                azkarHtml += `
                    <div class="col-12">
                        <div class="card bg-glass border-0 rounded-4 p-4">
                            <p class="text-white fs-5 lh-lg mb-4 text-center font-cairo">${item.text}</p>
                            <div class="d-flex justify-content-between align-items-center mt-auto border-top border-secondary pt-3" style="border-color: rgba(255,255,255,0.05) !important;">
                                <span class="badge bg-secondary text-dark rounded-pill px-3 py-2"><i class="fa-solid fa-repeat ms-1"></i> التكرار: ${item.count}</span>
                            </div>
                        </div>
                    </div>
                `;
            });
            azkarHtml += `</div></div></div></div>`;
        });
        azkarHtml += `</div></section>`;
        container.innerHTML = azkarHtml;
    });

    // ----------------------------------------
    // مسار البحث الشامل (Global Search)
    // ----------------------------------------
    Router.addRoute('#/search', async (container) => {
        container.innerHTML = `
            <section class="container py-5" data-aos="fade-in">
                <div class="text-center mb-5">
                    <h2 class="fw-bold text-white mb-3"><i class="fa-solid fa-search text-secondary me-2"></i> البحث الشامل</h2>
                    <div class="search-box glass-nav rounded-pill px-4 py-3 d-flex align-items-center mx-auto" style="max-width: 600px;">
                        <i class="fa-solid fa-search text-secondary fs-5 ms-3"></i>
                        <input type="text" id="global-search-input" class="form-control bg-transparent border-0 text-white shadow-none fs-5" placeholder="ابحث عن سورة، قارئ، أو إذاعة..." autofocus>
                    </div>
                </div>
                <div id="search-results-container">
                    <div class="text-center py-5 text-muted-custom">
                        <i class="fa-solid fa-keyboard mb-3" style="font-size: 4rem;"></i><h5>ابدأ الكتابة للبحث</h5>
                    </div>
                </div>
            </section>
        `;

        const input = document.getElementById('global-search-input');
        const resultsContainer = document.getElementById('search-results-container');
        const surahs = await API.getSurahs();
        const reciters = await API.getReciters();
        const radios = await API.getRadios();
        const defaultReciter = reciters[0];

        input.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase().trim();
            if (term.length === 0) {
                resultsContainer.innerHTML = `<div class="text-center py-5 text-muted-custom"><i class="fa-solid fa-keyboard mb-3" style="font-size: 4rem;"></i><h5>ابدأ الكتابة للبحث</h5></div>`;
                return;
            }

            const matchedSurahs = surahs.filter(s => s.nameArabic.includes(term) || s.nameEnglish.toLowerCase().includes(term));
            const matchedReciters = reciters.filter(r => r.nameArabic.includes(term) || (r.nameEnglish && r.nameEnglish.toLowerCase().includes(term)));
            const matchedRadios = radios.filter(r => r.nameArabic.includes(term));

            let resultsHtml = '';
            if (matchedReciters.length > 0) {
                resultsHtml += `<h4 class="text-secondary fw-bold mb-3 mt-4">القراء</h4><div class="row g-4">`;
                matchedReciters.forEach(r => resultsHtml += buildReciterCard(r));
                resultsHtml += `</div>`;
            }
            if (matchedSurahs.length > 0) {
                resultsHtml += `<h4 class="text-secondary fw-bold mb-3 mt-4">السور القرآنية</h4><div class="row g-4">`;
                matchedSurahs.forEach(s => resultsHtml += buildSurahCard(s));
                resultsHtml += `</div>`;
            }
            if (matchedRadios.length > 0) {
                resultsHtml += `<h4 class="text-secondary fw-bold mb-3 mt-4">محطات الإذاعة</h4><div class="row g-4">`;
                matchedRadios.forEach(r => {
                    resultsHtml += `<div class="col-lg-4 col-md-6"><div class="card bg-glass text-white border-0 shadow-sm p-3 premium-card radio-search-card" data-radio-id="${r.id}" style="cursor: pointer;"><div class="d-flex align-items-center gap-3"><img src="${r.image}" loading="lazy" onerror="handleImageError(this, 'avatar')" class="rounded-circle" style="width: 50px; height: 50px; object-fit: cover;"><h6 class="mb-0 fw-bold font-cairo">${r.nameArabic}</h6></div></div></div>`;
                });
                resultsHtml += `</div>`;
            }
            if(resultsHtml === '') resultsHtml = `<div class="text-center py-5 text-muted-custom"><i class="fa-solid fa-face-frown mb-3" style="font-size: 4rem;"></i><h5>لم يتم العثور على نتائج مطابقة</h5></div>`;

            resultsContainer.innerHTML = resultsHtml;
            attachCardEvents(surahs, defaultReciter);
            document.querySelectorAll('.radio-search-card').forEach(card => {
                card.addEventListener('click', () => {
                    const selectedRadio = radios.find(x => x.id === card.getAttribute('data-radio-id'));
                    globalPlayer.playTrack({ nameArabic: selectedRadio.nameArabic, fileName: '' }, { nameArabic: 'البث المباشر', serverUrl: selectedRadio.url, displayPhoto: selectedRadio.image });
                    showPlayerUI();
                });
            });
        });
    });

    // ----------------------------------------
    // مسار المفضلة (Favorites)
    // ----------------------------------------
    Router.addRoute('#/favorites', async (container) => {
        const favs = StorageManager.getFavorites();
        const reciters = await API.getReciters();
        const defaultReciter = reciters[0] || null;

        let favHtml = `<section class="container py-5" data-aos="fade-in"><div class="mb-5"><h2 class="fw-bold text-white mb-2"><i class="fa-solid fa-heart text-danger me-2"></i> المفضلة</h2></div>`;
        if (favs.length === 0) {
            favHtml += `<div class="text-center py-5"><i class="fa-regular fa-folder-open text-muted-custom" style="font-size: 4rem;"></i><h5 class="text-white mt-4">قائمة فارغة</h5></div>`;
        } else {
            favHtml += `<div class="row g-4">`;
            favs.forEach(surah => favHtml += buildSurahCard(surah));
            favHtml += `</div>`;
        }
        favHtml += `</section>`;
        container.innerHTML = favHtml;
        if(favs.length > 0) attachCardEvents(favs, defaultReciter);
    });

    // ----------------------------------------
    // مسار سجل الاستماع (History)
    // ----------------------------------------
    Router.addRoute('#/history', (container) => {
        const history = StorageManager.getHistory();
        let historyHtml = `<section class="container py-5" data-aos="fade-in"><div class="mb-5"><h2 class="fw-bold text-white mb-2"><i class="fa-solid fa-clock-rotate-left text-secondary me-2"></i> سجل الاستماع</h2></div>`;
        if (history.length === 0) {
            historyHtml += `<div class="text-center py-5"><i class="fa-solid fa-list-ul text-muted-custom mb-3" style="font-size: 4rem;"></i><h5 class="text-white">لا يوجد سجل استماع بعد</h5></div>`;
        } else {
            historyHtml += `<div class="row g-3">`;
            history.forEach(item => {
                const dateObj = new Date(item.date);
                const dateString = `${dateObj.getDate()}/${dateObj.getMonth()+1}/${dateObj.getFullYear()}`;
                historyHtml += `
                    <div class="col-12">
                        <div class="card bg-glass text-white border-0 shadow-sm p-3 rounded-4 d-flex flex-row align-items-center justify-content-between history-item premium-card" data-surah-id="${item.surah.id}" data-reciter-id="${item.reciter.id}" style="cursor: pointer;">
                            <div class="d-flex align-items-center gap-3">
                                <div class="bg-dark rounded-circle d-flex justify-content-center align-items-center" style="width: 50px; height: 50px;"><i class="fa-solid fa-music text-secondary"></i></div>
                                <div><h5 class="mb-0 fw-bold font-cairo">سورة ${item.surah.nameArabic}</h5><small class="text-muted-custom font-inter">${item.reciter.nameArabic} • ${dateString}</small></div>
                            </div>
                            <button class="btn btn-glass shadow-none border-0"><i class="fa-solid fa-play"></i></button>
                        </div>
                    </div>
                `;
            });
            historyHtml += `</div>`;
        }
        historyHtml += `</section>`;
        container.innerHTML = historyHtml;

        document.querySelectorAll('.history-item').forEach(card => {
            card.addEventListener('click', async () => {
                const surahs = await API.getSurahs();
                const reciters = await API.getReciters();
                const surahId = parseInt(card.getAttribute('data-surah-id'));
                const reciterId = card.getAttribute('data-reciter-id');
                const s = surahs.find(x => x.id === surahId);
                const r = reciters.find(x => x.id === reciterId);
                if(s && r) { globalPlayer.playTrack(s, r); showPlayerUI(); }
            });
        });
    });

    // ----------------------------------------
    // مسار مواقيت الصلاة (Prayer Times)
    // ----------------------------------------
    Router.addRoute('#/prayer', async (container) => {
        container.innerHTML = `<section class="container py-5 text-center" data-aos="fade-in"><h2 class="fw-bold text-white mb-2"><i class="fa-solid fa-clock text-secondary me-2"></i> مواقيت الصلاة</h2><div class="spinner-border text-secondary mt-5"></div></section>`;
        try {
            const res = await fetch('https://api.aladhan.com/v1/timingsByCity?city=Zagazig&country=Egypt&method=5');
            const data = await res.json();
            const timings = data.data.timings;
            const hijri = data.data.date.hijri;
            const prayers = [
                { name: "الفجر", time: timings.Fajr, icon: "fa-cloud-moon" },
                { name: "الشروق", time: timings.Sunrise, icon: "fa-sun" },
                { name: "الظهر", time: timings.Dhuhr, icon: "fa-sun" },
                { name: "العصر", time: timings.Asr, icon: "fa-cloud-sun" },
                { name: "المغرب", time: timings.Maghrib, icon: "fa-cloud-sun-rain" },
                { name: "العشاء", time: timings.Isha, icon: "fa-moon" }
            ];
            let prayerHtml = `<section class="container py-5" data-aos="fade-in"><div class="text-center mb-5"><h2 class="fw-bold text-white mb-2"><i class="fa-solid fa-clock text-secondary me-2"></i> مواقيت الصلاة (الزقازيق)</h2><h5 class="text-secondary font-cairo">${hijri.weekday.ar} ${hijri.day} ${hijri.month.ar} ${hijri.year} هـ</h5></div><div class="row g-4 justify-content-center">`;
            prayers.forEach(p => {
                prayerHtml += `<div class="col-lg-4 col-md-6"><div class="card bg-glass text-white border-0 shadow-sm p-4 text-center h-100" style="border-radius: 20px;"><i class="fa-solid ${p.icon} text-secondary mb-3" style="font-size: 2.5rem;"></i><h4 class="fw-bold font-cairo mb-2">${p.name}</h4><h2 class="mb-0 text-white font-inter" dir="ltr">${p.time}</h2></div></div>`;
            });
            prayerHtml += `</div></section>`;
            container.innerHTML = prayerHtml;
        } catch (error) {
            container.innerHTML = `<div class="text-center py-5"><h5 class="text-white">حدث خطأ في جلب المواقيت</h5></div>`;
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
                <div class="card bg-glass border-0 rounded-4 p-4 shadow-sm">
                    <h5 class="text-secondary fw-bold mb-4"><i class="fa-solid fa-hard-drive me-2"></i> النظام والتخزين</h5>
                    <div class="d-flex justify-content-between align-items-center">
                        <div><h6 class="text-white mb-1">مسح الذاكرة المؤقتة</h6><small class="text-muted-custom">يساعد في حل المشاكل</small></div>
                        <button class="btn btn-outline-danger rounded-pill px-4" id="clearCacheBtn">مسح البيانات</button>
                    </div>
                </div>
            </section>
        `;
        document.getElementById('themeSwitch').addEventListener('change', (e) => SettingsManager.saveSetting('theme', e.target.checked ? 'dark' : 'light'));
        document.getElementById('autoPlaySwitch').addEventListener('change', (e) => SettingsManager.saveSetting('autoPlayNext', e.target.checked));
        document.getElementById('clearCacheBtn').addEventListener('click', () => { if(confirm("تأكيد المسح؟")) SettingsManager.clearCache(); });
    });
}

// ==========================================
// 3. دوال بناء الواجهات الذكية (Smart UI Builders)
// ==========================================

window.handleImageError = function(imgElement, type = 'avatar') {
    const fallback = type === 'cover' 
        ? 'https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=1200&q=80'
        : 'https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?auto=format&fit=crop&w=300&q=80';
    if (imgElement.src !== fallback) {
        imgElement.src = fallback;
    }
};

function buildSurahCard(surah) {
    const isFav = StorageManager.isFavorite(surah.id);
    const heartClass = isFav ? 'fa-solid text-danger' : 'fa-regular text-muted-custom';
    return `
        <div class="col-lg-4 col-md-6 surah-item-card slide-up-animation" data-name="${surah.nameArabic} ${surah.nameEnglish}">
            <div class="card bg-glass text-white border-0 shadow-sm h-100 p-3 premium-card" data-surah-id="${surah.id}" style="cursor: pointer;">
                <div class="d-flex align-items-center justify-content-between">
                    <div class="d-flex align-items-center gap-3">
                        <div class="surah-number text-secondary fw-bold fs-4">${surah.id}</div>
                        <div>
                            <h5 class="mb-0 fw-bold font-cairo">سورة ${surah.nameArabic}</h5>
                            <small class="text-muted-custom font-inter">${surah.nameEnglish} • ${surah.type}</small>
                        </div>
                    </div>
                    <div class="d-flex align-items-center gap-2">
                        <button class="btn btn-glass fav-btn border-0 shadow-none" title="المفضلة"><i class="${heartClass}"></i></button>
                        <button class="btn btn-glass add-playlist-btn border-0 shadow-none d-none d-md-flex" title="إضافة لقائمة"><i class="fa-solid fa-plus text-muted-custom"></i></button>
                        <button class="btn btn-glass play-surah-btn"><i class="fa-solid fa-play"></i></button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function buildReciterCard(reciter, useCoverStyle = false) {
    const defaultCover = 'https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=1200&q=80';
    if (useCoverStyle) {
        return `
            <div class="col-lg-6 reciter-item-card slide-up-animation" data-name="${reciter.nameArabic} ${reciter.nameEnglish}">
                <div class="card bg-glass text-white border-0 shadow-sm overflow-hidden h-100 premium-card p-0" onclick="window.location.hash='#/reader?id=${reciter.id}'" style="cursor: pointer;">
                    <div class="row g-0 h-100">
                        <div class="col-4">
                            <img src="${reciter.displayPhoto}" loading="lazy" onerror="handleImageError(this, 'avatar')" class="w-100 h-100 object-fit-cover" alt="${reciter.nameArabic}">
                        </div>
                        <div class="col-8 p-4 d-flex flex-column justify-content-center" style="background: linear-gradient(to left, rgba(7,26,19,0.9), rgba(7,26,19,0.4)), url('${reciter.displayCover || defaultCover}'); background-size: cover;">
                            <h4 class="fw-bold font-cairo text-white mb-1" style="text-shadow: 0 2px 4px rgba(0,0,0,0.5);">${reciter.nameArabic}</h4>
                            <small class="text-secondary mb-3 fw-bold">${reciter.style}</small>
                            <p class="text-light small mb-0 d-none d-md-block text-truncate-2" style="text-shadow: 0 1px 2px rgba(0,0,0,0.8);">${reciter.biography || ''}</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    return `
        <div class="col-xl-3 col-lg-4 col-md-6 reciter-item-card slide-up-animation" data-name="${reciter.nameArabic} ${reciter.nameEnglish}">
            <div class="card reciter-card bg-glass border-0 text-center p-4 h-100">
                <div class="reciter-avatar mx-auto mb-3">
                    <img src="${reciter.displayPhoto}" loading="lazy" onerror="handleImageError(this, 'avatar')" alt="${reciter.nameArabic}" class="img-fluid rounded-circle shadow-soft bg-dark" style="object-fit: cover; width: 140px; height: 140px; border: 3px solid rgba(255,255,255,0.1);">
                    <button class="btn btn-play-circle hover-play-btn shadow" onclick="window.location.hash='#/reader?id=${reciter.id}'"><i class="fa-solid fa-play"></i></button>
                </div>
                <h5 class="text-white fw-bold font-cairo mb-1">${reciter.nameArabic}</h5>
                <small class="text-muted-custom mb-3 d-block">${reciter.style} • ${reciter.country}</small>
                <a href="#/reader?id=${reciter.id}" class="btn btn-outline-custom rounded-pill btn-sm w-100 fw-bold mt-auto">الصفحة الرسمية</a>
            </div>
        </div>
    `;
}

function buildPlaylistCard(playlist) {
    return `
        <div class="col-lg-4 col-md-6 slide-up-animation">
            <div class="card bg-glass border-0 rounded-4 overflow-hidden h-100 shadow-sm premium-card" onclick="window.location.hash='#/playlist?id=${playlist.id}'" style="cursor:pointer;">
                <div class="position-relative" style="height: 160px;">
                    <img src="${playlist.cover}" loading="lazy" onerror="handleImageError(this, 'cover')" class="w-100 h-100 object-fit-cover" style="filter: brightness(0.6);">
                    <div class="position-absolute bottom-0 start-0 w-100 p-3" style="background: linear-gradient(to top, rgba(7,26,19,0.9), transparent);">
                        <h5 class="fw-bold text-white mb-0 font-cairo">${playlist.title}</h5>
                    </div>
                    <div class="position-absolute top-0 end-0 m-3 badge bg-secondary text-dark rounded-pill fw-bold">
                        ${playlist.items.length} مقطع
                    </div>
                </div>
                <div class="p-3"><p class="text-muted-custom small mb-0">${playlist.description}</p></div>
            </div>
        </div>
    `;
}

function attachCardEvents(surahs, reciterToPlay) {
    document.querySelectorAll('.play-surah-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const card = btn.closest('.premium-card');
            const surahId = parseInt(card.getAttribute('data-surah-id'));
            const selectedSurah = surahs.find(s => s.id === surahId);
            let finalReciter = reciterToPlay;
            if(!finalReciter) { const reciters = await API.getReciters(); finalReciter = reciters[0]; }

            globalPlayer.playTrack(selectedSurah, finalReciter);
            showPlayerUI();
            StorageManager.incrementSurahsCompleted();
        });
    });

    document.querySelectorAll('.fav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation(); 
            const card = btn.closest('.premium-card');
            const surahId = parseInt(card.getAttribute('data-surah-id'));
            const selectedSurah = surahs.find(s => s.id === surahId);
            const isAdded = StorageManager.toggleFavorite(selectedSurah);
            const icon = btn.querySelector('i');
            
            if (isAdded) {
                icon.className = 'fa-solid text-danger';
                StorageManager.showToast('تمت الإضافة للمفضلة');
            } else {
                icon.className = 'fa-regular text-muted-custom';
                if(window.location.hash === '#/favorites') card.parentElement.style.display = 'none';
            }
        });
    });

    document.querySelectorAll('.add-playlist-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const card = btn.closest('.premium-card');
            const surahId = parseInt(card.getAttribute('data-surah-id'));
            const selectedSurah = surahs.find(s => s.id === surahId);
            let finalReciter = reciterToPlay;
            if(!finalReciter) { const reciters = await API.getReciters(); finalReciter = reciters[0]; }
            StorageManager.addToPlaylist('my_playlist', selectedSurah, finalReciter);
        });
    });
}

function showPlayerUI() {
    const p = document.getElementById('global-player');
    if (p && (p.style.opacity === '0' || !p.classList.contains('active'))) {
        p.classList.add('active');
        if(typeof gsap !== 'undefined') gsap.to(p, { y: 0, opacity: 1, duration: 0.5 });
    }
}
