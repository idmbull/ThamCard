export const parseCSV = (strData) => {
    const arrData = [];
    const objPattern = new RegExp(("(\\,|\\r?\\n|\\r|^)(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|([^\"\\,\\r\\n]*))"), "gi");
    let arrMatches = null; let currentRow = [];

    while (arrMatches = objPattern.exec(strData)) {
        if (arrMatches[1].length && arrMatches[1] !== ",") {
            if (currentRow.length > 0) arrData.push(currentRow);
            currentRow = [];
        }
        currentRow.push(arrMatches[2] ? arrMatches[2].replace(/""/g, "\"") : arrMatches[3]);
    }
    if (currentRow.length > 0) arrData.push(currentRow);

    const flashcards = [];
    for (let i = 1; i < arrData.length; i++) { // Bỏ qua dòng Header (dòng 0)
        const r = arrData[i];

        // Cấu trúc mới: 0:word, 1:phonetic, 2:pos, 3:meaning_vi, 4:level, 5:ex_en, 6:ex_vi, 7:collocations
        // Kiểm tra xem dòng có cột word không thì mới xử lý
        if (r.length >= 7 && r[0] && r[0].trim() !== "") {
            flashcards.push({
                id: i,
                word: r[0].trim(),
                phonetic: r[1] ? r[1].trim() : '',
                pos: r[2] ? r[2].trim() : '',

                // --- ĐÃ ĐỔI VỊ TRÍ 2 CỘT NÀY CHO NHAU ---
                meaning: r[3] ? r[3].trim() : '',
                level: r[4] ? r[4].trim() : '',
                // ----------------------------------------

                ex_en: r[5] ? r[5].trim() : '',
                ex_vi: r[6] ? r[6].trim() : '',
                collocations: r[7] ? r[7].trim() : ''
            });
        }
    }
    return flashcards;
};

export const speak = (word, rate = 1.0) => {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(word);
        utter.lang = 'en-US';
        utter.rate = rate;
        window.speechSynthesis.speak(utter);
    }
};

export const shuffle = (array) => {
    return array.slice().sort(() => Math.random() - 0.5);
};