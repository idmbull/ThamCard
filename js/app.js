import { parseCSV } from './utils.js';
import ModeFlashcard from './modules/Flashcard.js';
import ModeListening from './modules/Listening.js';
import ModeDictation from './modules/Dictation.js';
import ModeRecall from './modules/Recall.js';
import ModeMatch from './modules/Match.js';
import ModeRecallTyping from './modules/RecallTyping.js';

const App = {
    flashcards: [],
    activeModule: null,

    init() {
        this.bindEvents();
    },

    bindEvents() {
        // Handle CSV Upload
        const fileInput = document.getElementById('csv-input');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (event) => {
                    this.flashcards = parseCSV(event.target.result);
                    if (this.flashcards.length >= 5) {
                        document.getElementById('view-empty').classList.add('hidden');
                        document.getElementById('mode-tabs').classList.remove('hidden');
                        this.switchMode('flashcard');
                    } else {
                        alert("Cần ít nhất 5 từ vựng để tạo các bài luyện tập trắc nghiệm!");
                    }
                };
                reader.readAsText(file);
            });
        }

        // Handle Tab Switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const mode = e.target.getAttribute('data-mode');
                this.switchMode(mode);

                document.querySelectorAll('.tab-btn').forEach(b => {
                    b.className = "tab-btn px-3 py-1.5 rounded-md font-label-md text-on-surface-variant hover:text-on-surface transition-all whitespace-nowrap";
                });
                e.target.className = "tab-btn active px-3 py-1.5 rounded-md font-label-md text-primary bg-surface-container-lowest shadow-sm transition-all whitespace-nowrap";
            });
        });

        // Delegate Global Keyboard events to the Active Module
        window.addEventListener('keydown', (e) => {
            if (this.activeModule && typeof this.activeModule.handleKeydown === 'function') {
                // Ignore keydown if user is typing in a generic input (except Dictation handles its own)
                if (['input', 'textarea'].includes(document.activeElement.tagName.toLowerCase()) && this.activeModule !== ModeDictation) {
                    return;
                }
                this.activeModule.handleKeydown(e);
            }
        });
    },

    switchMode(modeId) {
        window.speechSynthesis.cancel();

        document.querySelectorAll('.view-section').forEach(el => el.classList.add('hidden'));
        document.getElementById(`view-${modeId}`).classList.remove('hidden');

        // Initialize corresponding module
        switch (modeId) {
            case 'flashcard': this.activeModule = ModeFlashcard; break;
            case 'listening': this.activeModule = ModeListening; break;
            case 'dictation': this.activeModule = ModeDictation; break;
            case 'recall': this.activeModule = ModeRecall; break;
            case 'match': this.activeModule = ModeMatch; break;
            case 'recall-typing': this.activeModule = ModeRecallTyping; break;
            default: this.activeModule = null;
        }

        if (this.activeModule) {
            this.activeModule.init(this.flashcards);
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});