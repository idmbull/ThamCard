import { shuffle } from '../utils.js';

export default {
    id: 'recall',
    data: [], settings: {}, currentItem: null, isChecked: false, index: 0, saveProgress: null,

    template() {
        return `
        <div class="flex flex-col w-full max-w-max-app-width mx-auto px-gutter-mobile lg:px-gutter-desktop py-space-lg items-center animate-fadeIn">
            <div class="w-full max-w-max-card-width flex items-center justify-between mb-space-md">
                <div class="flex items-center gap-space-xs"><span class="px-space-xs py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed font-label-caps uppercase tracking-wider">Active Recall</span></div>
                <div class="flex items-center gap-space-xxs text-on-surface-variant"><span class="font-label-md text-primary font-bold">Câu <span id="rc-current">1</span> / <span id="rc-total">0</span></span></div>
            </div>
            <div class="w-full max-w-max-card-width mb-space-xl text-center">
                <h2 class="font-headline-sm text-on-surface font-bold mb-space-sm">Đọc định nghĩa và chọn từ đúng</h2>
                <div class="w-full bg-surface-container-lowest p-space-xl rounded-2xl shadow-md border border-outline-variant/30 flex flex-col items-center">
                    <span id="rc-pos" class="px-2 py-0.5 rounded-md bg-primary-fixed text-on-primary-fixed font-label-md italic mb-4">pos</span>
                    <p id="rc-meaning" class="font-headline-sm text-on-surface font-bold text-center leading-relaxed">Nghĩa tiếng Việt</p>
                </div>
            </div>
            <div id="rc-grid" class="w-full max-w-max-card-width grid grid-cols-1 md:grid-cols-2 gap-space-md mb-space-xl"></div>
            <button id="rc-next-btn" class="px-space-2xl py-3 rounded-lg bg-primary text-on-primary font-headline-sm font-bold shadow-md hover:bg-primary-container transition-all hidden">Tiếp tục ➔</button>
        </div>
        `;
    },

    init(data, settings, savedIndex, saveProgressFn) {
        this.data = shuffle(data);
        this.settings = settings;
        this.index = savedIndex || 0;
        this.saveProgress = saveProgressFn;

        document.getElementById('rc-next-btn').onclick = () => {
            this.index++;
            if (this.saveProgress) this.saveProgress(this.index);
            this.loadQuestion();
        };
        this.loadQuestion();
    },

    loadQuestion() {
        if (window.autoNextTimer) clearTimeout(window.autoNextTimer);

        if (this.index >= this.data.length) { alert("Chúc mừng bạn đã hoàn thành bài tập Đoán từ!"); return; }

        this.isChecked = false;
        this.currentItem = this.data[this.index];

        document.getElementById('rc-current').textContent = this.index + 1;
        document.getElementById('rc-total').textContent = this.data.length;

        document.getElementById('rc-meaning').textContent = this.currentItem.meaning;
        const elPos = document.getElementById('rc-pos');
        if (this.currentItem.pos) { elPos.textContent = `(${this.currentItem.pos})`; elPos.classList.remove('hidden'); } else elPos.classList.add('hidden');

        document.getElementById('rc-next-btn').classList.add('hidden');

        let pool = this.data.filter(f => f.word !== this.currentItem.word);
        let options = shuffle(pool).slice(0, 3);
        options.push(this.currentItem);
        options = shuffle(options);

        const grid = document.getElementById('rc-grid');
        grid.innerHTML = '';

        options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'p-4 rounded-xl border-2 border-outline-variant/40 bg-surface-container-lowest font-headline-sm font-bold text-on-surface hover:border-primary hover:bg-surface-container transition-all';
            btn.textContent = opt.word;
            btn.onclick = () => this.checkAnswer(btn, opt.word);
            grid.appendChild(btn);
        });
    },

    checkAnswer(btnEl, selectedWord) {
        if (this.isChecked) return;
        this.isChecked = true;
        const isCorrect = (selectedWord === this.currentItem.word);

        Array.from(document.getElementById('rc-grid').children).forEach(btn => {
            btn.classList.add('pointer-events-none');
            if (btn.textContent === this.currentItem.word) {
                btn.className = 'p-4 rounded-xl border-2 border-secondary bg-secondary-fixed/50 font-headline-sm font-bold text-secondary pointer-events-none';
            } else if (btn.textContent === selectedWord && !isCorrect) {
                btn.className = 'p-4 rounded-xl border-2 border-error bg-error-container/50 font-headline-sm font-bold text-error pointer-events-none animate-shake';
            } else {
                btn.classList.add('opacity-50');
            }
        });

        const nextBtn = document.getElementById('rc-next-btn');
        nextBtn.classList.remove('hidden');

        if (isCorrect && this.settings && this.settings.autoNext) {
            window.autoNextTimer = setTimeout(() => { nextBtn.click(); }, this.settings.autoNextDelay);
        }
    },

    handleKeydown(e) {
        if (e.key === 'Enter' && this.isChecked) {
            e.preventDefault(); document.getElementById('rc-next-btn').click();
        }
    }
};