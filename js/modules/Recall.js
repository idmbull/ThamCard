import { shuffle } from '../utils.js';

export default {
    data: [], currentItem: null, isChecked: false,

    init(data) {
        this.data = shuffle(data);
        this.loadQuestion();
    },

    loadQuestion() {
        this.isChecked = false;
        this.currentItem = shuffle(this.data)[0];

        document.getElementById('rc-meaning').textContent = this.currentItem.meaning;
        const elPos = document.getElementById('rc-pos');
        if (this.currentItem.pos) {
            elPos.textContent = this.currentItem.pos;
            elPos.classList.remove('hidden');
        } else {
            elPos.classList.add('hidden');
        }
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
        nextBtn.onclick = () => this.loadQuestion();
    },

    handleKeydown(e) {
        if (e.key === 'Enter' && this.isChecked) {
            e.preventDefault(); document.getElementById('rc-next-btn').click();
        }
    }
};