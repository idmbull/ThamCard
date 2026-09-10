import { speak } from '../utils.js';

export default {
    id: 'flashcard',
    data: [], settings: {}, currentIndex: 0, saveProgress: null,

    template() {
        return `
        <div class="max-w-[760px] mx-auto px-gutter-desktop py-space-xl flex flex-col items-center justify-center w-full animate-fadeIn">
            <div class="w-full flex items-center justify-between text-body-sm text-on-surface-variant mb-space-xs px-1">
                <span class="font-label-md uppercase tracking-wider font-semibold text-primary">Flashcard Mode</span>
                <div class="flex items-center gap-space-xs font-bold text-primary"><span id="fc-current">0</span> / <span id="fc-total">0</span></div>
            </div>
            <div class="w-full bg-surface-container-lowest rounded-2xl shadow-md border border-outline-variant/30 p-space-xl transition-all relative">
                <div class="flex items-center justify-between pb-space-sm border-b border-outline-variant/20">
                    <div class="flex items-center gap-space-xs">
                        <span id="fc-level" class="px-2.5 py-0.5 rounded-md bg-primary-fixed text-on-primary-fixed font-label-caps uppercase font-bold text-[11px]">Level</span>
                        <span id="fc-pos" class="px-2 py-0.5 rounded-md bg-surface-container-low text-on-surface-variant font-label-md italic">pos</span>
                    </div>
                </div>
                <div class="pt-space-md pb-space-sm flex flex-col items-center text-center">
                    <h1 id="fc-word" class="font-display-hero text-[40px] md:text-display-hero text-primary font-bold tracking-tight mb-1">Word</h1>
                    <div class="flex items-center gap-space-xs mt-1">
                        <span id="fc-phonetic" class="font-phonetic-display text-on-surface-variant font-medium">/phonetic/</span>
                        <button id="fc-audio" class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container-low hover:bg-surface-container text-primary transition-all active:scale-95 ml-1">
                            <span class="material-symbols-outlined text-[18px]">volume_up</span><span class="font-label-caps uppercase font-bold">US</span>
                        </button>
                    </div>
                </div>
                <div class="mt-space-md flex flex-col gap-space-md border-t border-outline-variant/20 pt-space-md">
                    <div class="bg-surface-container-low/70 p-space-md rounded-xl" id="fc-box-meaning">
                        <div class="font-label-caps text-primary uppercase font-bold tracking-wider mb-1 flex items-center gap-1"><span class="material-symbols-outlined text-[15px]">translate</span><span>Định nghĩa</span></div>
                        <p id="fc-meaning" class="font-body-lg text-on-surface font-semibold leading-relaxed">Meaning</p>
                    </div>
                    <div class="p-space-md rounded-xl bg-surface-variant/20" id="fc-box-ex">
                        <div class="font-label-caps text-on-surface-variant uppercase font-bold tracking-wider mb-1.5 flex items-center gap-1"><span class="material-symbols-outlined text-[15px] text-secondary">menu_book</span><span>Ví dụ ngữ cảnh</span></div>
                        <p id="fc-ex-en" class="font-body-md text-on-surface italic leading-normal">Example EN</p>
                        <p id="fc-ex-vi" class="font-body-sm text-on-surface-variant mt-1.5 font-normal">Example VI</p>
                    </div>
                    <div class="flex flex-col gap-1.5 px-1 mt-2" id="fc-box-collo">
                        <div class="font-label-caps text-on-surface-variant uppercase font-bold tracking-wider">Collocations</div>
                        <div id="fc-collocations" class="flex flex-wrap gap-space-xs"></div>
                    </div>
                </div>
            </div>
            <div class="w-full flex items-center justify-between gap-space-md mt-space-lg">
                <button id="fc-prev" class="flex-1 flex items-center justify-center gap-space-xs py-space-sm px-space-md rounded-xl bg-surface-container-lowest hover:bg-surface-container-low border border-outline-variant/40 text-on-surface font-label-lg shadow-sm transition-all active:translate-y-0.5"><span class="material-symbols-outlined text-[20px]">arrow_back</span><span class="font-bold">Trước</span></button>
                <button id="fc-audio-btn" class="px-space-md py-space-sm rounded-xl bg-surface-container-low hover:bg-surface-container text-primary font-label-md flex items-center gap-1.5 border border-outline-variant/30 transition-all active:translate-y-0.5"><span class="material-symbols-outlined text-[20px]">volume_up</span><span class="hidden sm:inline font-semibold">Nghe</span></button>
                <button id="fc-next" class="flex-1 flex items-center justify-center gap-space-xs py-space-sm px-space-md rounded-xl bg-primary hover:bg-primary-container text-on-primary font-label-lg shadow-md transition-all active:translate-y-0.5"><span class="font-bold">Sau</span><span class="material-symbols-outlined text-[20px]">arrow_forward</span></button>
            </div>
        </div>
        `;
    },

    init(data, settings, savedIndex, saveProgressFn) {
        this.data = data;
        this.settings = settings;
        this.currentIndex = savedIndex || 0; // Đọc tiến độ
        this.saveProgress = saveProgressFn;  // Callback lưu tiến độ

        this.bindEvents();
        this.render();
    },

    bindEvents() {
        document.getElementById('fc-next').onclick = () => {
            if (this.currentIndex < this.data.length - 1) {
                this.currentIndex++;
                if (this.saveProgress) this.saveProgress(this.currentIndex);
                this.render();
            }
        };
        document.getElementById('fc-prev').onclick = () => {
            if (this.currentIndex > 0) {
                this.currentIndex--;
                if (this.saveProgress) this.saveProgress(this.currentIndex);
                this.render();
            }
        };

        const playAud = () => speak(this.data[this.currentIndex].word);
        document.getElementById('fc-audio').onclick = playAud;
        document.getElementById('fc-audio-btn').onclick = playAud;
    },

    render() {
        if (this.data.length === 0) return;
        const item = this.data[this.currentIndex];

        document.getElementById('fc-word').textContent = item.word;

        const elPhonetic = document.getElementById('fc-phonetic');
        if (item.phonetic) { elPhonetic.textContent = item.phonetic; elPhonetic.classList.remove('hidden'); } else elPhonetic.classList.add('hidden');

        const elPos = document.getElementById('fc-pos');
        if (item.pos) { elPos.textContent = item.pos; elPos.classList.remove('hidden'); } else elPos.classList.add('hidden');

        const elLevel = document.getElementById('fc-level');
        if (item.level) { elLevel.textContent = item.level; elLevel.classList.remove('hidden'); } else elLevel.classList.add('hidden');

        const boxMeaning = document.getElementById('fc-box-meaning');
        if (item.meaning) { document.getElementById('fc-meaning').textContent = item.meaning; boxMeaning.style.display = 'block'; } else boxMeaning.style.display = 'none';

        const boxEx = document.getElementById('fc-box-ex');
        const elExEn = document.getElementById('fc-ex-en');
        const elExVi = document.getElementById('fc-ex-vi');
        if (item.ex_en) {
            boxEx.style.display = 'block';
            const regex = new RegExp(`(${item.word}[a-z]*)`, 'gi');
            elExEn.innerHTML = `“${item.ex_en.replace(regex, '<strong class="text-primary not-italic">$1</strong>')}”`;
            if (item.ex_vi) { elExVi.textContent = `→ ${item.ex_vi}`; elExVi.classList.remove('hidden'); } else elExVi.classList.add('hidden');
        } else boxEx.style.display = 'none';

        const boxCollo = document.getElementById('fc-box-collo');
        const colEl = document.getElementById('fc-collocations');
        if (item.collocations) {
            boxCollo.style.display = 'flex';
            colEl.innerHTML = '';
            item.collocations.split('|').forEach(col => {
                const parts = col.split(':');
                if (parts.length >= 2) {
                    colEl.innerHTML += `<span class="px-space-sm py-1 bg-surface-container-low text-on-surface rounded-lg font-label-md text-body-sm"><strong class="text-primary font-semibold">${parts[0].trim()}</strong> <span class="text-on-surface-variant">(${parts[1].trim()})</span></span>`;
                }
            });
        } else boxCollo.style.display = 'none';

        document.getElementById('fc-current').textContent = this.currentIndex + 1;
        document.getElementById('fc-total').textContent = this.data.length;
    },

    handleKeydown(e) {
        if (e.key === 'ArrowLeft') document.getElementById('fc-prev').click();
        if (e.key === 'ArrowRight') document.getElementById('fc-next').click();
        if (e.code === 'Space' || e.key === 'r') { e.preventDefault(); document.getElementById('fc-audio').click(); }
    }
};