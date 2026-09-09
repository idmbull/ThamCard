import { parseCSV } from './utils.js';
import ModeFlashcard from './modules/Flashcard.js';
import ModeListening from './modules/Listening.js';
import ModeDictation from './modules/Dictation.js';
import ModeRecall from './modules/Recall.js';
import ModeMatch from './modules/Match.js';
import ModeRecallTyping from './modules/RecallTyping.js';

const App = {
    flashcards: [],
    allDataBySheet: {}, // Lưu trữ kho dữ liệu đã phân tách theo từng Sheet
    activeModule: null,

    init() {
        this.bindEvents();
    },

    bindEvents() {
        const fileInput = document.getElementById('csv-input');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (!file) return;

                const extension = file.name.split('.').pop().toLowerCase();

                if (extension === 'csv') {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        const parsedData = parseCSV(event.target.result);
                        // Với CSV, chỉ có 1 sheet mặc định
                        this.allDataBySheet = { 'Dữ liệu CSV': parsedData };
                        this.updateSheetSelector();
                    };
                    reader.readAsText(file);
                }
                else if (['xlsx', 'xls'].includes(extension)) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        const data = new Uint8Array(event.target.result);
                        const workbook = window.XLSX.read(data, { type: 'array' });

                        this.allDataBySheet = {}; // Reset kho lưu trữ

                        // Lặp qua từng Sheet và lưu vào allDataBySheet
                        workbook.SheetNames.forEach(sheetName => {
                            const worksheet = workbook.Sheets[sheetName];
                            const jsonData = window.XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                            const sheetCards = [];
                            for (let i = 1; i < jsonData.length; i++) {
                                const r = jsonData[i];
                                if (r && r.length > 0 && r[0] && r[0].toString().trim() !== "") {
                                    sheetCards.push({
                                        word: r[0] ? r[0].toString().trim() : '',
                                        phonetic: r[1] ? r[1].toString().trim() : '',
                                        pos: r[2] ? r[2].toString().trim() : '',
                                        meaning: r[3] ? r[3].toString().trim() : '',
                                        level: r[4] ? r[4].toString().trim() : '',
                                        ex_en: r[5] ? r[5].toString().trim() : '',
                                        ex_vi: r[6] ? r[6].toString().trim() : '',
                                        collocations: r[7] ? r[7].toString().trim() : ''
                                    });
                                }
                            }

                            // Chỉ thêm các Sheet có chứa dữ liệu hợp lệ
                            if (sheetCards.length > 0) {
                                this.allDataBySheet[sheetName] = sheetCards;
                            }
                        });

                        this.updateSheetSelector();
                    };
                    reader.readAsArrayBuffer(file);
                }
                else {
                    alert("Định dạng file không hỗ trợ! Vui lòng chọn .csv hoặc .xlsx");
                }
            });
        }

        // Đổi tab
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

        // Bàn phím
        window.addEventListener('keydown', (e) => {
            if (this.activeModule && typeof this.activeModule.handleKeydown === 'function') {
                if (['input', 'textarea'].includes(document.activeElement.tagName.toLowerCase()) && this.activeModule !== ModeDictation && this.activeModule !== ModeRecallTyping) {
                    return;
                }
                this.activeModule.handleKeydown(e);
            }
        });
    },

    // ----------------------------------------------------
    // LOGIC CẬP NHẬT SELECTOR VÀ BỐC DỮ LIỆU
    // ----------------------------------------------------
    updateSheetSelector() {
        const selector = document.getElementById('sheet-select');
        selector.innerHTML = ''; // Xóa sạch option cũ

        const sheetNames = Object.keys(this.allDataBySheet);

        if (sheetNames.length === 0) {
            alert("File Excel của bạn không có dữ liệu từ vựng hợp lệ!");
            return;
        }

        // Nếu file có nhiều hơn 1 sheet, ta thêm tùy chọn "Gộp tất cả"
        if (sheetNames.length > 1) {
            const optAll = document.createElement('option');
            optAll.value = 'ALL';
            optAll.textContent = '📚 Học Tất cả các Sheet';
            selector.appendChild(optAll);
        }

        // Đổ tên các Sheet vào Dropdown
        sheetNames.forEach(name => {
            const opt = document.createElement('option');
            opt.value = name;
            opt.textContent = `📄 ${name} (${this.allDataBySheet[name].length} từ)`;
            selector.appendChild(opt);
        });

        selector.classList.remove('hidden'); // Hiển thị Menu

        // Gắn sự kiện khi người dùng chọn Sheet khác
        selector.onchange = (e) => {
            this.loadDataFromSelection(e.target.value);
        };

        // Lần đầu tải file -> Tự động nạp lựa chọn đầu tiên (Mặc định là học tất cả)
        this.loadDataFromSelection(selector.value);
    },

    loadDataFromSelection(selectedValue) {
        this.flashcards = []; // Làm rỗng mảng hiện tại

        if (selectedValue === 'ALL') {
            // Nối tất cả các sheet lại với nhau
            Object.values(this.allDataBySheet).forEach(sheetData => {
                this.flashcards = this.flashcards.concat(sheetData);
            });
        } else {
            // Chỉ lấy dữ liệu của sheet được chọn
            this.flashcards = this.allDataBySheet[selectedValue] || [];
        }

        // Đánh lại ID cho mảng mới (Các module game rất cần ID để chấm điểm)
        this.flashcards.forEach((card, idx) => card.id = idx + 1);

        this.checkAndStart();
    },

    checkAndStart() {
        if (this.flashcards.length >= 5) {
            document.getElementById('view-empty').classList.add('hidden');
            document.getElementById('mode-tabs').classList.remove('hidden');

            // Nếu người dùng mới load file lần đầu -> Bật chế độ Flashcard
            if (!this.activeModule) {
                this.switchMode('flashcard');
            }
            // Nếu người dùng đang học dở mà đổi sheet -> Reset lại chế độ đang học
            else {
                this.activeModule.init(this.flashcards);
            }
        } else {
            alert(`Sheet này chỉ có ${this.flashcards.length} từ. Ứng dụng cần ít nhất 5 từ vựng để tạo câu hỏi trắc nghiệm!`);
        }
    },

    // ----------------------------------------------------
    // ĐIỀU HƯỚNG MODULE
    // ----------------------------------------------------
    switchMode(modeId) {
        window.speechSynthesis.cancel();

        document.querySelectorAll('.view-section').forEach(el => el.classList.add('hidden'));
        document.getElementById(`view-${modeId}`).classList.remove('hidden');

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