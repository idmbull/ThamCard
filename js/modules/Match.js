import { shuffle } from '../utils.js';

export default {
    id: 'match',
    data: [], selectedBlocks: [], matchedCount: 0, index: 0, currentRoundItems: [], saveProgress: null,

    template() {
        return `
        <div class="flex flex-col w-full max-w-max-app-width mx-auto px-gutter-mobile lg:px-gutter-desktop py-space-lg items-center animate-fadeIn">
            <div class="w-full max-w-[900px] flex justify-between items-center mb-space-lg">
                <span class="font-headline-sm font-bold text-on-surface">Nối từ với nghĩa tương ứng</span>
                <div class="font-label-lg font-bold bg-surface-container text-on-surface-variant px-space-sm py-1 rounded-full flex items-center gap-1">
                    <span>Đã nối xong:</span>
                    <span id="match-progress" class="text-primary">0</span> / <span id="match-total">0</span> từ
                </div>
            </div>
            <div class="w-full max-w-[900px] grid grid-cols-2 gap-space-md md:gap-space-2xl mb-space-sm text-center">
                <div class="font-label-caps uppercase text-primary font-bold tracking-wider">Tiếng Anh</div>
                <div class="font-label-caps uppercase text-secondary font-bold tracking-wider">Tiếng Việt</div>
            </div>
            <div class="w-full max-w-[900px] grid grid-cols-2 gap-space-md md:gap-space-2xl">
                <div id="match-col-en" class="flex flex-col gap-space-sm"></div>
                <div id="match-col-vi" class="flex flex-col gap-space-sm"></div>
            </div>
            <button id="match-restart" class="mt-space-xl px-space-2xl py-3 rounded-lg bg-primary text-on-primary font-headline-sm font-bold shadow-md hover:bg-primary-container transition-all hidden">Màn tiếp theo ➔</button>
        </div>
        `;
    },

    init(data, settings, savedIndex, saveProgressFn) {
        this.data = shuffle(data);
        this.index = savedIndex || 0;
        this.saveProgress = saveProgressFn;

        document.getElementById('match-total').textContent = this.data.length;

        document.getElementById('match-restart').onclick = () => {
            this.index += this.currentRoundItems.length;
            if (this.saveProgress) this.saveProgress(this.index);
            this.startRound();
        };
        this.startRound();
    },

    startRound() {
        if (this.index >= this.data.length) {
            alert("Chúc mừng bạn đã hoàn thành bài tập Nối Từ cho tất cả danh sách!");
            return;
        }

        this.selectedBlocks = [];
        this.matchedCount = 0;

        document.getElementById('match-progress').textContent = this.index;
        document.getElementById('match-restart').classList.add('hidden');

        this.currentRoundItems = this.data.slice(this.index, this.index + 5);

        let enBlocks = [];
        let viBlocks = [];

        this.currentRoundItems.forEach(item => {
            enBlocks.push({ id: item.id, text: item.word, type: 'en' });
            let shortMeaning = item.meaning.length > 70 ? item.meaning.substring(0, 70) + "..." : item.meaning;
            viBlocks.push({ id: item.id, text: shortMeaning, type: 'vi' });
        });

        enBlocks = shuffle(enBlocks);
        viBlocks = shuffle(viBlocks);

        const colEn = document.getElementById('match-col-en');
        const colVi = document.getElementById('match-col-vi');
        colEn.innerHTML = ''; colVi.innerHTML = '';

        enBlocks.forEach(blk => colEn.appendChild(this.createCardElement(blk)));
        viBlocks.forEach(blk => colVi.appendChild(this.createCardElement(blk)));
    },

    createCardElement(blk) {
        const div = document.createElement('div');
        div.className = 'match-card p-4 bg-surface-container-lowest border-2 border-outline-variant/40 rounded-xl cursor-pointer flex items-center justify-center text-center font-label-lg font-bold text-on-surface hover:shadow-md transition-all min-h-[80px] select-none';
        div.textContent = blk.text;
        if (blk.type === 'vi') { div.classList.replace('font-label-lg', 'font-body-sm'); div.classList.replace('font-bold', 'font-semibold'); }
        div.dataset.id = blk.id; div.dataset.type = blk.type;
        div.onclick = () => this.handleSelect(div, blk.id, blk.type);
        return div;
    },

    handleSelect(el, wordId, type) {
        if (el.classList.contains('matched') || el.classList.contains('selected')) return;

        const sameTypeIndex = this.selectedBlocks.findIndex(b => b.type === type);
        if (sameTypeIndex !== -1) {
            const oldBlock = this.selectedBlocks[sameTypeIndex];
            oldBlock.el.className = 'match-card p-4 bg-surface-container-lowest border-2 border-outline-variant/40 rounded-xl cursor-pointer flex items-center justify-center text-center font-bold text-on-surface hover:shadow-md transition-all min-h-[80px] select-none';
            if (oldBlock.type === 'vi') { oldBlock.el.classList.replace('font-bold', 'font-semibold'); oldBlock.el.classList.replace('font-label-lg', 'font-body-sm'); }
            this.selectedBlocks.splice(sameTypeIndex, 1);
        }

        el.classList.add('selected', 'border-primary', 'bg-primary-fixed/30', 'text-primary');
        this.selectedBlocks.push({ el, wordId, type });

        if (this.selectedBlocks.length === 2) {
            document.getElementById('match-col-en').style.pointerEvents = 'none';
            document.getElementById('match-col-vi').style.pointerEvents = 'none';
            const [first, second] = this.selectedBlocks;

            if (first.wordId === second.wordId) {
                setTimeout(() => {
                    const cls = 'match-card p-4 bg-secondary-fixed/50 border-2 border-secondary text-secondary rounded-xl flex items-center justify-center text-center font-bold min-h-[80px] matched opacity-40 pointer-events-none';
                    first.el.className = cls; second.el.className = cls;
                    this.matchedCount++;

                    if (this.matchedCount === this.currentRoundItems.length) {
                        document.getElementById('match-progress').textContent = this.index + this.matchedCount;
                        if (this.index + this.matchedCount >= this.data.length) document.getElementById('match-restart').textContent = "Hoàn thành bài tập 🎉";
                        document.getElementById('match-restart').classList.remove('hidden');
                    }
                    this.resetSelection();
                }, 300);
            } else {
                first.el.classList.replace('border-primary', 'border-error'); first.el.classList.replace('bg-primary-fixed/30', 'bg-error-container/50'); first.el.classList.replace('text-primary', 'text-error'); first.el.classList.add('animate-shake');
                second.el.classList.replace('border-primary', 'border-error'); second.el.classList.replace('bg-primary-fixed/30', 'bg-error-container/50'); second.el.classList.replace('text-primary', 'text-error'); second.el.classList.add('animate-shake');

                setTimeout(() => {
                    const cls = 'match-card p-4 bg-surface-container-lowest border-2 border-outline-variant/40 rounded-xl cursor-pointer flex items-center justify-center text-center font-bold text-on-surface hover:shadow-md transition-all min-h-[80px] select-none';
                    first.el.className = cls; second.el.className = cls;
                    if (first.el.dataset.type === 'vi') { first.el.classList.replace('font-bold', 'font-semibold'); first.el.classList.replace('font-label-lg', 'font-body-sm'); }
                    if (second.el.dataset.type === 'vi') { second.el.classList.replace('font-bold', 'font-semibold'); second.el.classList.replace('font-label-lg', 'font-body-sm'); }
                    this.resetSelection();
                }, 600);
            }
        }
    },

    resetSelection() {
        this.selectedBlocks = [];
        document.getElementById('match-col-en').style.pointerEvents = 'auto'; document.getElementById('match-col-vi').style.pointerEvents = 'auto';
    },

    handleKeydown(e) { }
};