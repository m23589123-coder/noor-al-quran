// js/player.js - Premium Audio Engine (Production Ready)

import { StorageManager } from './storage.js';

class AudioPlayer {
    constructor() {
        this.audio = new Audio();
        this.audio.preload = 'none';
        
        this.isPlaying = false;
        this.isLoading = false;
        this.currentMode = null; // 'SURAH' or 'RADIO'
        this.currentSurah = null;
        this.currentReciter = null;
        this.currentRadio = null;
        this.playPromise = null; // لمنع خطأ AbortError
        
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
            fallbackIcon: document.getElementById('player-fallback-icon')
        };

        this.initEventListeners();
    }

    initEventListeners() {
        if (this.elements.playBtn) {
            this.elements.playBtn.addEventListener('click', () => this.togglePlay());
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
            if (this.currentMode === 'SURAH') {
                StorageManager.incrementSurahsCompleted();
                StorageManager.clearContinueListening();
            }
        });

        // Error Handling احترافي يمنع كراش المتصفح
        this.audio.addEventListener('error', (e) => {
            console.warn("Audio Stream Unavailable:", e);
            this.setLoadingState(false);
            this.isPlaying = false;
            this.updatePlayIcon();
            StorageManager.showToast('عذراً، البث أو التسجيل غير متوفر حالياً.', 'error');
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
                if (error.name !== 'AbortError') {
                    console.warn("Playback prevented:", error);
                    StorageManager.showToast('تعذر التشغيل، يرجى المحاولة لاحقاً.', 'error');
                }
            });
        }
    }

    playTrack(surah, reciter, startTime = 0) {
        if (!surah || !reciter) return;
        this.currentMode = 'SURAH';
        this.currentSurah = surah;
        this.currentReciter = reciter;
        this.updateUI(surah.nameArabic, reciter.nameArabic, reciter.displayPhoto || reciter.photo);

        const surahNum = surah.id || surah.number || 1;
        const fileName = String(surahNum).padStart(3, '0') + '.mp3';
        const baseUrl = reciter.serverUrl.endsWith('/') ? reciter.serverUrl : reciter.serverUrl + '/';
        
        this.safePlay(`${baseUrl}${fileName}`).then(() => {
            if (startTime > 0) this.audio.currentTime = startTime;
            this.updateMediaSession(surah.nameArabic, reciter.nameArabic, reciter.photo);
            StorageManager.addToHistory(surah, reciter);
        });
    }

    playRadio(radio) {
        if (!radio || !radio.url) return;
        this.currentMode = 'RADIO';
        this.currentRadio = radio;
        
        this.updateUI(radio.nameArabic, 'البث المباشر', radio.image || 'assets/images/radio-default.webp');
        
        if (this.elements.durationEl) this.elements.durationEl.textContent = 'مباشر';
        if (this.elements.progressBar) this.elements.progressBar.style.width = '100%';

        this.safePlay(radio.url).then(() => {
            this.updateMediaSession(radio.nameArabic, 'إذاعة القرآن الكريم', radio.image);
        });
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
                this.elements.coverImage.src = 'assets/images/default-reciter.webp'; // Fallback
            };
            this.elements.coverImage.classList.remove('d-none');
            if (this.elements.fallbackIcon) this.elements.fallbackIcon.classList.add('d-none');
        }
    }

    updateProgress() {
        if (this.currentMode === 'RADIO') return; // لا يوجد تقدم في البث المباشر
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

    updateMediaSession(title, artist, artwork) {
        if ('mediaSession' in navigator) {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: title,
                artist: artist,
                album: 'نور القرآن',
                artwork: [{ src: artwork || 'assets/images/default-reciter.webp', sizes: '512x512', type: 'image/webp' }]
            });
            navigator.mediaSession.setActionHandler('play', () => this.togglePlay());
            navigator.mediaSession.setActionHandler('pause', () => this.togglePlay());
        }
    }
}

export const globalPlayer = new AudioPlayer();