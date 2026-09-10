import { speak, shuffle } from '../utils.js';

export default {
    id: 'recall-typing',
    data: [], settings: {}, currentItem: null, isChecked: false, index: 0, hintClicks: 0, saveProgress: null,

    template() {
        return `
        <div class="flex flex-col w-full max-w-max-app-width mx-auto px-gutter-mobile lg:px-gutter-desktop py-space-xl items-center animate-fadeIn">
            <div class="w-full max-w-max-card-width flex items-center justify-between mb-space-md">
                <div class="flex items-center gap-space-xs"><span class="px-space-xs py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed font-label-caps uppercase tracking-wider">Active Recall Typing</span></div>
                <div class="flex items-center gap-space-xxs text-on-surface-variant"><span class="font-label-md text-primary font-bold">Câu <span id="rct-current">1</span> / <span id="rct-total">0</span></span></div>
            </div>

            <div class="w-full max-w-max-card-width bg-surface-container-lowest rounded-xl p-space-xl shadow-sm flex flex-col items-center relative overflow-hidden mb-space-lg">
                <div class="w-full flex items-center justify-between mb-space-md">
                    <span id="rct-pos" class="font-label-md italic text-primary bg-primary-fixed/30 px-2 py-0.5 rounded">pos</span>
                    <span id="rct-char-count" class="font-label-caps px-space-xs py-1 rounded bg-surface-container text-on-surface-variant font-semibold">0 KÝ TỰ</span>
                </div>
                
                <p id="rct-meaning" class="font-headline-sm text-on-surface font-bold text-center leading-relaxed my-space-md">Nghĩa tiếng Việt</p>

                <div class="w-full relative mt-space-lg">
                    <div class="relative flex items-center bg-surface-container-low rounded-xl px-space-md py-space-sm focus-within:bg-surface-container-lowest focus-within:shadow-md transition-all border border-transparent focus-within:border-primary/30">
                        <span class="material-symbols-outlined text-outline mr-space-sm">keyboard</span>
                        <input id="rct-input" type="text" spellcheck="false" autocomplete="off" class="w-full bg-transparent font-headline-sm text-on-surface placeholder:text-outline-variant font-medium focus:outline-none text-center" placeholder="Gõ từ tiếng Anh tương ứng..." />
                    </div>
                    <div id="rct-alert" class="w-full mt-space-sm p-space-sm rounded-lg text-center hidden transition-all"><span id="rct-alert-text" class="font-label-lg font-bold"></span></div>
                </div>

                <div id="rct-panel-en" class="w-full bg-surface-container-low/70 rounded-lg p-space-sm mt-space-md text-left hidden animate-fadeIn">
                    <div class="flex items-center gap-1.5 mb-1"><span class="material-symbols-outlined text-xs text-primary">menu_book</span><span class="font-label-caps text-on-surface-variant uppercase">Ví dụ ngữ cảnh</span></div>
                    <p id="rct-val-en" class="font-body-sm text-on-surface italic"></p>
                </div>

                <div class="w-full mt-space-md flex items-center justify-end">
                    <button id="rct-give-hint" class="font-label-md text-primary font-semibold hover:underline">Gợi ý 1 chữ cái</button>
                </div>
            </div>

            <div class="w-full max-w-max-card-width flex flex-col sm:flex-row items-center justify-between gap-space-sm">
                <button id="rct-skip-btn" class="w-full sm:w-auto px-space-md py-space-sm rounded-lg bg-surface-container-lowest text-outline font-label-lg shadow-sm hover:bg-surface-container-low transition-all flex items-center justify-center gap-1"><span>Bỏ qua</span><span class="material-symbols-outlined text-base">skip_next</span></button>
                <button id="rct-check-btn" class="w-full sm:w-auto px-space-xl py-space-sm rounded-lg bg-primary text-on-primary font-label-lg font-bold shadow-md hover:bg-primary-container transition-all flex items-center justify-center gap-1"><span>Kiểm tra</span><span class="material-symbols-outlined text-base">arrow_forward</span></button>
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
        document.getElementById('rct-skip-btn').onclick = () => {
            this.index++;
            if (this.saveProgress) this.saveProgress(this.index);
            this.loadQuestion();
        };
        document.getElementById('rct-check-btn').onclick = () => this.checkAnswer();

        const inputField = document.getElementById('rct-input');
        document.getElementById('rct-give-hint').onclick = () => {
            this.hintClicks++;
            const w = this.currentItem.word;
            if (this.hintClicks <= w.length) inputField.value = w.slice(0, this.hintClicks);
            inputField.focus();
        };
    },

    loadQuestion() {
        if (window.autoNextTimer) clearTimeout(window.autoNextTimer);
        if (this.index >= this.data.length) { alert("Hoàn thành bài tập gõ từ!"); return; }

        this.isChecked = false; this.hintClicks = 0;
        this.currentItem = this.data[this.index];
        const word = this.currentItem.word;

        document.getElementById('rct-current').textContent = this.index + 1;
        document.getElementById('rct-total').textContent = this.data.length;
        document.getElementById('rct-char-count').textContent = `${word.length} KÝ TỰ`;

        document.getElementById('rct-meaning').textContent = this.currentItem.meaning;

        const elPos = document.getElementById('rct-pos');
        if (this.currentItem.pos) { elPos.textContent = `(${this.currentItem.pos})`; elPos.classList.remove('hidden'); } else elPos.classList.add('hidden');

        const inputField = document.getElementById('rct-input');
        inputField.value = ''; inputField.disabled = false; inputField.classList.remove('text-secondary', 'text-error');

        document.getElementById('rct-alert').classList.add('hidden');
        document.getElementById('rct-panel-en').classList.add('hidden');

        const checkBtn = document.getElementById('rct-check-btn');
        checkBtn.innerHTML = `<span>Kiểm tra</span><span class="material-symbols-outlined text-base">arrow_forward</span>`;
        checkBtn.className = 'w-full sm:w-auto px-space-xl py-space-sm rounded-lg bg-primary text-on-primary font-label-lg font-bold shadow-md hover:bg-primary-container flex items-center justify-center gap-1 transition-all';

        if (window.innerWidth > 768) inputField.focus();
    },

    checkAnswer() {
        if (this.isChecked) {
            this.index++;
            if (this.saveProgress) this.saveProgress(this.index);
            this.loadQuestion();
            return;
        }

        const inputField = document.getElementById('rct-input');
        const userAnswer = inputField.value.trim().toLowerCase();
        if (!userAnswer) return;

        this.isChecked = true; inputField.disabled = true;

        const alertBox = document.getElementById('rct-alert');
        const alertText = document.getElementById('rct-alert-text');
        alertBox.classList.remove('hidden');

        const checkBtn = document.getElementById('rct-check-btn');

        if (userAnswer === this.currentItem.word.toLowerCase()) {
            inputField.classList.add('text-secondary');
            alertBox.className = "w-full mt-space-sm p-space-sm rounded-lg text-center bg-secondary-container text-on-secondary-container transition-all";
            alertText.textContent = "Chính xác! Bạn nhớ từ rất tốt.";

            if (this.currentItem.ex_en) {
                document.getElementById('rct-val-en').innerHTML = this.currentItem.ex_en.replace(new RegExp(`(${this.currentItem.word}[a-z]*)`, 'gi'), '<strong class="text-primary not-italic">$1</strong>');
                document.getElementById('rct-panel-en').classList.remove('hidden');
            }

            checkBtn.innerHTML = `<span>Kế tiếp</span><span class="material-symbols-outlined text-base">check_circle</span>`;
            checkBtn.classList.replace('bg-primary', 'bg-secondary');
            checkBtn.classList.replace('hover:bg-primary-container', 'hover:bg-secondary');

            speak(this.currentItem.word, 1.0);

            if (this.settings && this.settings.autoNext) {
                window.autoNextTimer = setTimeout(() => { checkBtn.click(); }, this.settings.autoNextDelay + 500);
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
            speak(this.currentItem.word, 1.0);
        }
    },

    handleKeydown(e) {
        if (e.key === 'Enter') { e.preventDefault(); document.getElementById('rct-check-btn').click(); }
    }
};