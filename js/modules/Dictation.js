import { speak, shuffle } from '../utils.js';

export default {
    id: 'dictation',
    data: [], settings: {}, currentItem: null, isChecked: false, audioSpeed: 1.0, index: 0, hintClicks: 0, saveProgress: null,

    template() {
        return `
        <div class="flex flex-col w-full max-w-max-app-width mx-auto px-gutter-mobile lg:px-gutter-desktop py-space-xl items-center animate-fadeIn">
            <div class="w-full max-w-max-card-width flex items-center justify-between mb-space-md">
                <div class="flex items-center gap-space-xs"><span class="px-space-xs py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed font-label-caps uppercase tracking-wider">Dictation Mode</span></div>
                <div class="flex items-center gap-space-xxs text-on-surface-variant"><span class="font-label-md text-primary font-bold">Câu <span id="dict-current">1</span> / <span id="dict-total">0</span></span></div>
            </div>
            
            <div class="w-full max-w-max-card-width bg-surface-container-lowest rounded-xl p-space-xl shadow-sm flex flex-col items-center relative overflow-hidden">
                <div class="absolute -top-24 -right-24 w-56 h-56 rounded-full bg-primary-fixed/30 blur-3xl pointer-events-none"></div>
                <div class="absolute -bottom-24 -left-24 w-56 h-56 rounded-full bg-secondary-container/40 blur-3xl pointer-events-none"></div>
                
                <div class="w-full flex items-center justify-between mb-space-lg z-10">
                    <div class="flex items-center bg-surface-container-low p-1 rounded-full shadow-inner">
                        <button id="dict-speed-10" class="px-space-sm py-1 rounded-full font-label-md bg-surface-container-lowest text-primary font-bold shadow-sm flex items-center gap-1 transition-all"><span class="material-symbols-outlined text-sm">play_arrow</span>1.0x</button>
                        <button id="dict-speed-08" class="px-space-sm py-1 rounded-full font-label-md text-on-surface-variant hover:text-on-surface flex items-center gap-1 transition-all"><span class="material-symbols-outlined text-sm">cruelty_free</span>0.75x</button>
                    </div>
                    <span id="dict-char-count" class="font-label-caps px-space-xs py-1 rounded bg-surface-container text-on-surface-variant font-semibold">0 KÝ TỰ</span>
                </div>

                <div class="flex flex-col items-center my-space-md z-10">
                    <button id="dict-play-btn" class="group relative flex items-center justify-center w-28 h-28 rounded-full bg-primary-container text-on-primary shadow-lg hover:shadow-xl transition-all active:translate-y-0.5 cursor-pointer">
                        <div id="dict-pulse" class="absolute inset-0 rounded-full bg-primary-container opacity-25 pointer-events-none hidden"></div>
                        <div class="flex flex-col items-center"><span class="material-symbols-outlined text-4xl transition-transform group-hover:scale-110">volume_up</span><span class="font-label-caps tracking-wider text-primary-fixed mt-0.5">[Space]</span></div>
                    </button>
                </div>

                <div id="dict-slots" class="w-full flex justify-center items-center gap-space-xs my-space-md z-10 flex-wrap"></div>

                <div class="w-full relative mt-space-sm z-10">
                    <div class="relative flex items-center bg-surface-container-low rounded-xl px-space-md py-space-sm focus-within:bg-surface-container-lowest focus-within:shadow-md transition-all">
                        <span class="material-symbols-outlined text-outline mr-space-sm">edit_note</span>
                        <input id="dict-input" type="text" spellcheck="false" autocomplete="off" class="w-full bg-transparent font-headline-sm text-on-surface placeholder:text-outline-variant font-medium focus:outline-none" placeholder="Gõ từ bạn nghe được... (Enter)" />
                    </div>
                    <div id="dict-alert" class="w-full mt-space-sm p-space-sm rounded-lg text-center hidden transition-all"><span id="dict-alert-text" class="font-label-lg font-bold"></span></div>
                </div>

                <div class="w-full flex flex-col sm:flex-row items-center justify-center gap-space-sm mt-space-lg pt-space-md border-t-0 z-10" id="dict-hint-buttons">
                    <button id="dict-hint-ipa" class="px-space-md py-space-xs rounded-full bg-surface-container-low hover:bg-surface-container text-on-surface-variant font-label-md flex items-center gap-1 transition-all"><span class="material-symbols-outlined text-sm">record_voice_over</span>IPA</button>
                    <button id="dict-hint-vi" class="px-space-md py-space-xs rounded-full bg-surface-container-low hover:bg-surface-container text-on-surface-variant font-label-md flex items-center gap-1 transition-all"><span class="material-symbols-outlined text-sm">lightbulb</span>Nghĩa TV</button>
                </div>
                
                <div id="dict-panel-ipa" class="w-full mt-space-sm p-space-sm rounded-lg bg-surface-container text-center hidden animate-fadeIn"><span id="dict-val-ipa" class="font-phonetic-display text-primary font-semibold"></span></div>
                <div id="dict-panel-vi" class="w-full mt-space-sm p-space-sm rounded-lg bg-surface-container text-center hidden animate-fadeIn"><p id="dict-val-vi" class="font-body-md text-on-surface"></p></div>

                <div class="w-full bg-surface-container-low/70 rounded-lg p-space-sm mt-space-md text-left z-10" id="dict-box-context">
                    <div class="flex items-center gap-1.5 mb-1"><span class="material-symbols-outlined text-xs text-primary">menu_book</span><span class="font-label-caps text-on-surface-variant uppercase">Ngữ cảnh</span></div>
                    <p id="dict-context" class="font-body-sm text-on-surface italic"></p>
                </div>

                <div class="w-full mt-space-md flex items-center justify-end z-10">
                    <button id="dict-give-hint" class="font-label-md text-primary font-semibold hover:underline">Gợi ý 1 chữ cái</button>
                </div>
            </div>
            
            <div class="w-full max-w-max-card-width mt-space-lg flex flex-col sm:flex-row items-center justify-between gap-space-sm">
                <button id="dict-skip-btn" class="w-full sm:w-auto px-space-md py-space-sm rounded-lg bg-surface-container-lowest text-outline font-label-lg shadow-sm hover:bg-surface-container-low transition-all flex items-center justify-center gap-1"><span>Bỏ qua</span><span class="material-symbols-outlined text-base">skip_next</span></button>
                <button id="dict-check-btn" class="w-full sm:w-auto px-space-xl py-space-sm rounded-lg bg-primary text-on-primary font-label-lg font-bold shadow-md hover:bg-primary-container transition-all flex items-center justify-center gap-1 cursor-pointer"><span>Kiểm tra</span><span class="material-symbols-outlined text-base">arrow_forward</span></button>
            </div>
        </div>
        `;
    },

    init(data, settings, savedIndex, saveProgressFn) {
        this.data = shuffle(data);
        this.settings = settings;
        this.index = savedIndex || 0;
        this.saveProgress = saveProgressFn;

        this.bindEvents();
        this.loadQuestion();
    },

    bindEvents() {
        document.getElementById('dict-play-btn').onclick = () => this.playAudio();
        document.getElementById('dict-skip-btn').onclick = () => {
            this.index++;
            if (this.saveProgress) this.saveProgress(this.index);
            this.loadQuestion();
        };
        document.getElementById('dict-check-btn').onclick = () => this.checkAnswer();

        const s10 = document.getElementById('dict-speed-10');
        const s08 = document.getElementById('dict-speed-08');
        s10.onclick = () => { this.audioSpeed = 1.0; s10.className = 'px-space-sm py-1 rounded-full font-label-md bg-surface-container-lowest text-primary font-bold shadow-sm flex items-center gap-1 transition-all'; s08.className = 'px-space-sm py-1 rounded-full font-label-md text-on-surface-variant hover:text-on-surface flex items-center gap-1 transition-all'; this.playAudio(); };
        s08.onclick = () => { this.audioSpeed = 0.75; s08.className = 'px-space-sm py-1 rounded-full font-label-md bg-surface-container-lowest text-primary font-bold shadow-sm flex items-center gap-1 transition-all'; s10.className = 'px-space-sm py-1 rounded-full font-label-md text-on-surface-variant hover:text-on-surface flex items-center gap-1 transition-all'; this.playAudio(); };

        document.getElementById('dict-hint-ipa').onclick = () => document.getElementById('dict-panel-ipa').classList.toggle('hidden');
        document.getElementById('dict-hint-vi').onclick = () => document.getElementById('dict-panel-vi').classList.toggle('hidden');

        const inputField = document.getElementById('dict-input');
        document.getElementById('dict-give-hint').onclick = () => {
            this.hintClicks++;
            const w = this.currentItem.word;
            if (this.hintClicks <= w.length) { inputField.value = w.slice(0, this.hintClicks); }
            inputField.focus();
        };
    },

    loadQuestion() {
        if (window.autoNextTimer) clearTimeout(window.autoNextTimer);
        if (this.index >= this.data.length) { alert("Chúc mừng! Bạn đã hoàn thành bài tập Gõ Chính Tả."); return; }

        this.isChecked = false; this.hintClicks = 0;
        this.currentItem = this.data[this.index];
        const word = this.currentItem.word;

        document.getElementById('dict-current').textContent = this.index + 1;
        document.getElementById('dict-total').textContent = this.data.length;
        document.getElementById('dict-char-count').textContent = `${word.length} KÝ TỰ`;

        const slotCont = document.getElementById('dict-slots');
        slotCont.innerHTML = '';
        const wUpper = word.toUpperCase();
        slotCont.innerHTML += `<div class="w-8 h-10 rounded-lg bg-surface-container flex items-center justify-center font-headline-sm font-bold text-primary shadow-inner">${wUpper[0]}</div>`;
        for (let i = 1; i < word.length - 1; i++) {
            slotCont.innerHTML += `<div class="w-8 h-10 rounded-lg bg-surface-container-low flex items-center justify-center font-headline-sm font-semibold text-on-surface-variant/40">_</div>`;
        }
        if (word.length > 1) {
            slotCont.innerHTML += `<div class="w-8 h-10 rounded-lg bg-surface-container flex items-center justify-center font-headline-sm font-bold text-primary shadow-inner">${wUpper[word.length - 1]}</div>`;
        }

        const boxContext = document.getElementById('dict-box-context');
        const elContext = document.getElementById('dict-context');
        if (this.currentItem.ex_en) {
            boxContext.style.display = 'block';
            const regex = new RegExp(`(${word}[a-z]*)`, 'gi');
            elContext.innerHTML = `"${this.currentItem.ex_en.replace(regex, '<span class="font-bold text-primary underline decoration-dotted">___________</span>')}"`;
        } else {
            boxContext.style.display = 'none';
        }

        const btnIpa = document.getElementById('dict-hint-ipa');
        if (this.currentItem.phonetic) {
            btnIpa.classList.remove('hidden');
            document.getElementById('dict-val-ipa').textContent = this.currentItem.phonetic;
        } else btnIpa.classList.add('hidden');

        const btnVi = document.getElementById('dict-hint-vi');
        if (this.currentItem.meaning) {
            btnVi.classList.remove('hidden');
            let posHTML = this.currentItem.pos ? `<span class="font-bold text-secondary">${this.currentItem.pos.split(' ')[0]}</span>. ` : '';
            document.getElementById('dict-val-vi').innerHTML = `${posHTML}${this.currentItem.meaning}`;
        } else btnVi.classList.add('hidden');

        document.getElementById('dict-panel-ipa').classList.add('hidden');
        document.getElementById('dict-panel-vi').classList.add('hidden');

        const inputField = document.getElementById('dict-input');
        inputField.value = ''; inputField.disabled = false;
        inputField.classList.remove('text-secondary', 'text-error');
        document.getElementById('dict-alert').classList.add('hidden');

        const checkBtn = document.getElementById('dict-check-btn');
        checkBtn.innerHTML = `<span>Kiểm tra</span><span class="material-symbols-outlined text-base">arrow_forward</span>`;
        checkBtn.className = 'w-full sm:w-auto px-space-xl py-space-sm rounded-lg bg-primary text-on-primary font-label-lg font-bold shadow-md hover:bg-primary-container flex items-center justify-center gap-1 transition-all';

        if (window.innerWidth > 768) inputField.focus();
        setTimeout(() => this.playAudio(), 500);
    },

    checkAnswer() {
        if (this.isChecked) {
            this.index++;
            if (this.saveProgress) this.saveProgress(this.index);
            this.loadQuestion();
            return;
        }

        const inputField = document.getElementById('dict-input');
        const userAnswer = inputField.value.trim().toLowerCase();
        if (!userAnswer) return;

        this.isChecked = true; inputField.disabled = true;
        const alertBox = document.getElementById('dict-alert');
        const alertText = document.getElementById('dict-alert-text');
        alertBox.classList.remove('hidden');

        const checkBtn = document.getElementById('dict-check-btn');

        if (userAnswer === this.currentItem.word.toLowerCase()) {
            inputField.classList.add('text-secondary');
            alertBox.className = "w-full mt-space-sm p-space-sm rounded-lg text-center bg-secondary-container text-on-secondary-container transition-all";
            alertText.textContent = "Tuyệt vời! Bạn đã gõ đúng.";

            checkBtn.innerHTML = `<span>Kế tiếp</span><span class="material-symbols-outlined text-base">check_circle</span>`;
            checkBtn.classList.replace('bg-primary', 'bg-secondary');
            checkBtn.classList.replace('hover:bg-primary-container', 'hover:bg-secondary');

            if (this.settings && this.settings.autoNext) {
                window.autoNextTimer = setTimeout(() => { checkBtn.click(); }, this.settings.autoNextDelay);
            }
        } else {
            inputField.classList.add('text-error');
            inputField.value = this.currentItem.word;
            alertBox.className = "w-full mt-space-sm p-space-sm rounded-lg text-center bg-error-container text-on-error-container transition-all animate-shake";
            alertText.textContent = "Chưa chính xác! Đáp án đúng đã hiển thị.";

            inputField.parentElement.classList.add("translate-x-1");
            setTimeout(() => inputField.parentElement.classList.remove("translate-x-1"), 100);
            setTimeout(() => inputField.parentElement.classList.add("-translate-x-1"), 200);
            setTimeout(() => inputField.parentElement.classList.remove("-translate-x-1"), 300);

            checkBtn.innerHTML = `<span>Kế tiếp ➔</span>`;
        }

        if (this.settings) {
            if (this.settings.autoShowIpa && this.currentItem.phonetic) document.getElementById('dict-panel-ipa').classList.remove('hidden');
            if (this.settings.autoShowVi && this.currentItem.meaning) document.getElementById('dict-panel-vi').classList.remove('hidden');
        }
    },

    playAudio() {
        const p = document.getElementById('dict-pulse');
        if (p) { p.classList.remove('hidden'); p.classList.add('animate-ping'); }
        speak(this.currentItem.word, this.audioSpeed);
        setTimeout(() => { if (p) { p.classList.add('hidden'); p.classList.remove('animate-ping'); } }, 1200);
    },

    handleKeydown(e) {
        const inputField = document.getElementById('dict-input');
        if (e.key === 'Enter') { e.preventDefault(); document.getElementById('dict-check-btn').click(); }
        if (e.code === 'Space' && document.activeElement !== inputField) {
            e.preventDefault(); this.playAudio();
        }
    }
};