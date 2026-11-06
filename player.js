// js/player.js - Premium Audio Engine (Production Ready - Smart & Offline Supported)

import { StorageManager } from './storage.js';

class AudioPlayer {
    constructor() {
        this.audio = new Audio();
        this.audio.preload = 'none';
        
        this.isPlaying = false;
        this.isLoading = false;
        this.currentMode = null; // 'SURAH' أو 'RADIO'
        this.currentSurah = null;
        this.currentReciter = null;
        this.currentRadio = null;
        this.playPromise = null; // لمنع خطأ AbortError
        this.queue = [];         // قائمة التشغيل الحالية
        this.queueIndex = -1;
        this.radioUrls = [];     // روابط احتياطية للإذاعة
        this.radioUrlIndex = 0;
        
        // استهداف عناصر الـ UI بأمان
        this.elements = {
            playBtn: document.querySelector('.btn-play-circle'),
            playIcon: document.querySelector('.btn-play-circle i'),
            progressBar: document.querySelector('.player-progress .progress-bar'),
            progressContainer: document.querySelector('.player-progress'),
            currentTimeEl: document.getElementById('current-time'),
            durationEl: document.getElementById('total-duration'),
            titleEl: document.getElementById('current-surah'),
            subtitleEl: document.getElementById('current-reader'),
            volumeInput: document.getElementById('volume'),
            coverImage: document.getElementById('player-cover'),
            fallbackIcon: document.getElementById('player-fallback-icon'),
            // استهداف أزرار التقديم والتأخير من الواجهة
            nextBtn: document.querySelector('.fa-forward-step') ? document.querySelector('.fa-forward-step').closest('button') : null,
            prevBtn: document.querySelector('.fa-backward-step') ? document.querySelector('.fa-backward-step').closest('button') : null
        };

        this.initEventListeners();
    }

    initEventListeners() {
        // زرار التشغيل والإيقاف
        if (this.elements.playBtn) {
            this.elements.playBtn.addEventListener('click', () => this.togglePlay());
        }

        // أزرار التقديم والتأخير 15 ثانية (الميزة الجديدة)
        if (this.elements.nextBtn) {
            this.elements.nextBtn.addEventListener('click', () => this.queue.length ? this.playNext() : this.skipTime(15));
        }
        if (this.elements.prevBtn) {
            this.elements.prevBtn.addEventListener('click', () => this.queue.length ? this.playPrev() : this.skipTime(-15));
        }

        this.audio.addEventListener('timeupdate', () => this.updateProgress());
        
        this.audio.addEventListener('waiting', () => this.setLoadingState(true));
        this.audio.addEventListener('playing', () => this.setLoadingState(false));
        this.audio.addEventListener('canplay', () => this.setLoadingState(false));

        this.audio.addEventListener('loadedmetadata', () => {
            if (this.elements.durationEl && this.currentMode !== 'RADIO') {
                this.elements.durationEl.textContent = this.formatTime(this.audio.duration);
            }
        });

        if (this.elements.progressContainer) {
            this.elements.progressContainer.addEventListener('click', (e) => this.seek(e));
        }

        if (this.elements.volumeInput) {
            this.elements.volumeInput.addEventListener('input', (e) => {
                this.audio.volume = e.target.value / 100;
            });
            this.audio.volume = 0.8;
        }

        this.audio.addEventListener('ended', () => {
            this.isPlaying = false;
            this.updatePlayIcon();
            if (this.elements.progressBar) this.elements.progressBar.style.width = '0%';
            // تشغيل المقطع التالي تلقائيًا لو في قائمة تشغيل
            if (this.currentMode === 'SURAH' && this.queue.length && this.queueIndex < this.queue.length - 1) {
                this.playNext();
                return;
            }
            if (this.currentMode === 'SURAH') {
                if(window.StorageManager) {
                    StorageManager.incrementSurahsCompleted();
                    StorageManager.clearContinueListening();
                }
            }
        });

        // Error Handling احترافي يمنع كراش المتصفح ويدعم الأوفلاين
        this.audio.addEventListener('error', (e) => {
            console.warn("Audio Stream Error:", e);
            if (this._radioFallback()) return; // جرّب رابط الإذاعة البديل
            this.setLoadingState(false);
            this.isPlaying = false;
            this.updatePlayIcon();
            
            // لو مفيش نت
            if (!navigator.onLine) {
                if(window.StorageManager) StorageManager.showToast('أنت غير متصل بالإنترنت. يرجى التحقق من الشبكة.', 'error');
            } else {
                if(window.StorageManager) StorageManager.showToast('عذراً، البث أو التسجيل غير متوفر حالياً.', 'error');
            }
        });
    }

    async safePlay(audioUrl) {
        // منع AbortError بانتظار الـ Promise القديم
        if (this.playPromise !== undefined && this.playPromise !== null) {
            try {
                await this.playPromise;
            } catch (err) { /* تجاهل الأخطاء القديمة */ }
        }

        this.audio.pause();
        this.audio.src = audioUrl;
        this.audio.load();
        
        this.setLoadingState(true);
        
        this.playPromise = this.audio.play();
        
        if (this.playPromise !== undefined) {
            this.playPromise.then(() => {
                this.isPlaying = true;
                this.updatePlayIcon();
                this.setLoadingState(false);
            }).catch(error => {
                this.setLoadingState(false);
                this.isPlaying = false;
                this.updatePlayIcon();
                if (error.name !== 'AbortError' && !this._radioFallback()) {
                    console.warn("Playback prevented:", error);
                    if(navigator.onLine && window.StorageManager) {
                        StorageManager.showToast('تعذر التشغيل، يرجى المحاولة لاحقاً.', 'error');
                    }
                }
            });
        }
    }

    playTrack(surah, reciter, startTime = 0, fromQueue = false) {
        if (!surah || !reciter) return;
        if (!fromQueue) { this.queue = []; this.queueIndex = -1; }
        this.showUI();
        this.currentMode = 'SURAH';
        this.currentSurah = surah;
        this.currentReciter = reciter;
        this.updateUI(surah.nameArabic, reciter.nameArabic + (fromQueue && this.queue.length > 1 ? ` • ${this.queueIndex + 1}/${this.queue.length}` : ''), reciter.displayPhoto || reciter.photo);

        const surahNum = surah.id || surah.number || 1;
        const fileName = String(surahNum).padStart(3, '0') + '.mp3';
        const baseUrl = reciter.serverUrl.endsWith('/') ? reciter.serverUrl : reciter.serverUrl + '/';
        
        this.safePlay(`${baseUrl}${fileName}`).then(() => {
            if (startTime > 0) this.audio.currentTime = startTime;
            // تحديث شاشة القفل بكل البيانات
            this.updateMediaSession(surah.nameArabic, reciter.nameArabic, reciter.displayPhoto || reciter.photo);
            if(window.StorageManager) StorageManager.addToHistory(surah, reciter);
        });
    }

    playRadio(radio) {
        const urls = (radio && Array.isArray(radio.urls) && radio.urls.length) ? radio.urls : (radio && radio.url ? [radio.url] : []);
        if (!urls.length) return;
        this.queue = []; this.queueIndex = -1;
        this.radioUrls = urls; this.radioUrlIndex = 0; this._fallbackFrom = null;
        this.showUI();
        this.currentMode = 'RADIO';
        this.currentRadio = radio;
        
        this.updateUI(radio.nameArabic, 'البث المباشر', radio.image || 'assets/images/icon-192.png');
        
        if (this.elements.durationEl) this.elements.durationEl.textContent = 'مباشر';
        if (this.elements.progressBar) this.elements.progressBar.style.width = '100%';

        this.safePlay(this.radioUrls[0]).then(() => {
            // تحديث شاشة القفل بكل البيانات
            this.updateMediaSession(radio.nameArabic, 'إذاعة القرآن الكريم', radio.image);
        });
    }

    // ---- قوائم التشغيل (تشغيل متتابع) ----
    playQueue(items, startIndex = 0) {
        const list = (items || []).filter(i => i && i.surah && i.reciter);
        if (!list.length) return;
        this.queue = list;
        this.queueIndex = Math.max(0, Math.min(startIndex, list.length - 1));
        this._playQueueItem();
    }

    _playQueueItem() {
        const it = this.queue[this.queueIndex];
        if (it) this.playTrack(it.surah, it.reciter, 0, true);
    }

    playNext() {
        if (this.queueIndex < this.queue.length - 1) { this.queueIndex++; this._playQueueItem(); }
    }

    playPrev() {
        if (this.audio.currentTime > 5 || this.queueIndex <= 0) { this.audio.currentTime = 0; return; }
        this.queueIndex--; this._playQueueItem();
    }

    // لو رابط الإذاعة وقع، نجرب الرابط اللي بعده
    _radioFallback() {
        if (this.currentMode !== 'RADIO' || this.radioUrlIndex >= this.radioUrls.length - 1) return false;
        const cur = this.radioUrls[this.radioUrlIndex];
        if (this._fallbackFrom === cur) return true;
        this._fallbackFrom = cur;
        this.radioUrlIndex++;
        this.safePlay(this.radioUrls[this.radioUrlIndex]);
        return true;
    }

    // إظهار المشغّل (بيبقى مخفي لحد ما تشغّل حاجة)
    showUI() {
        const p = document.getElementById('global-player');
        if (p) { p.classList.add('active'); p.style.opacity = '1'; p.style.transform = 'translateY(0)'; }
        document.body.classList.add('has-player');
    }

    togglePlay() {
        if (!this.audio.src) return;
        if (this.isPlaying) {
            this.audio.pause();
            this.isPlaying = false;
        } else {
            this.safePlay(this.audio.src);
        }
        this.updatePlayIcon();
    }

    // دالة التقديم والتأخير (الميزة الجديدة)
    skipTime(seconds) {
        if (this.currentMode === 'RADIO') return; // لا يوجد تقديم في البث المباشر
        if (!isNaN(this.audio.duration)) {
            let newTime = this.audio.currentTime + seconds;
            // حماية عشان الوقت ميزيدش عن طول المقطع أو يقل عن صفر
            newTime = Math.max(0, Math.min(newTime, this.audio.duration));
            this.audio.currentTime = newTime;
        }
    }

    setLoadingState(isLoading) {
        this.isLoading = isLoading;
        if (!this.elements.playIcon) return;
        if (isLoading) {
            this.elements.playIcon.className = 'fa-solid fa-spinner fa-spin ms-1';
        } else {
            this.updatePlayIcon();
        }
    }

    updatePlayIcon() {
        if (this.isLoading || !this.elements.playIcon) return;
        this.elements.playIcon.className = this.isPlaying ? 'fa-solid fa-pause ms-1' : 'fa-solid fa-play ms-1';
    }

    updateUI(title, subtitle, imageSrc) {
        if (this.elements.titleEl) this.elements.titleEl.textContent = title || 'غير معروف';
        if (this.elements.subtitleEl) this.elements.subtitleEl.textContent = subtitle || '';
        
        if (imageSrc && this.elements.coverImage) {
            this.elements.coverImage.src = imageSrc;
            this.elements.coverImage.onerror = () => {
                this.elements.coverImage.src = 'https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=300&q=80'; // Fallback
            };
            this.elements.coverImage.classList.remove('d-none');
            if (this.elements.fallbackIcon) this.elements.fallbackIcon.classList.add('d-none');
        }
    }

    updateProgress() {
        if (this.currentMode === 'RADIO') return; 
        const { currentTime, duration } = this.audio;
        if (isNaN(duration) || !isFinite(duration)) return;

        if (this.elements.progressBar) {
            this.elements.progressBar.style.width = `${(currentTime / duration) * 100}%`;
        }
        if (this.elements.currentTimeEl) {
            this.elements.currentTimeEl.textContent = this.formatTime(currentTime);
        }
    }

    seek(e) {
        if (this.currentMode === 'RADIO') return;
        const width = this.elements.progressContainer.clientWidth;
        const duration = this.audio.duration;
        if (isNaN(duration) || !isFinite(duration)) return;
        const clickPercent = document.dir === 'rtl' ? (width - e.offsetX) / width : e.offsetX / width;
        this.audio.currentTime = clickPercent * duration;
    }

    formatTime(seconds) {
        if (isNaN(seconds) || !isFinite(seconds)) return "00:00";
        const min = Math.floor(seconds / 60);
        const sec = Math.floor(seconds % 60);
        return `${min < 10 ? '0' + min : min}:${sec < 10 ? '0' + sec : sec}`;
    }

    // دعم شاشة القفل وسماعات البلوتوث والإشعارات (Media Session API)
    updateMediaSession(title, artist, artwork) {
        if ('mediaSession' in navigator) {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: title,
                artist: artist,
                album: 'ترتيل',
                artwork: [
                    { src: artwork || 'https://images.unsplash.com/photo-1600121848594-d8644e57abab?auto=format&fit=crop&w=512&q=80', sizes: '512x512', type: 'image/jpeg' }
                ]
            });

            // ربط أزرار سماعة البلوتوث وشاشة القفل بوظائف الموقع
            navigator.mediaSession.setActionHandler('play', () => this.togglePlay());
            navigator.mediaSession.setActionHandler('pause', () => this.togglePlay());
            
            // التقديم والتأخير من شاشة القفل (15 ثانية)
            navigator.mediaSession.setActionHandler('seekforward', () => this.skipTime(15));
            navigator.mediaSession.setActionHandler('seekbackward', () => this.skipTime(-15));
            try {
                navigator.mediaSession.setActionHandler('nexttrack', this.queue.length ? () => this.playNext() : null);
                navigator.mediaSession.setActionHandler('previoustrack', this.queue.length ? () => this.playPrev() : null);
            } catch (e) {}
        }
    }
}

export const globalPlayer = new AudioPlayer();