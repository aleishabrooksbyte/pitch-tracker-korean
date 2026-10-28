// Default baseline vocabulary deck
const defaultVocabulary = [
    { korean: "안녕하세요", english: "(Hello)" },
    { korean: "감사합니다", english: "(Thank you)" },
    { korean: "사랑해요", english: "(I love you)" },
    { korean: "반갑습니다", english: "(Nice to meet you)" },
    { korean: "잘 지내세요?", english: "(How have you been?)" }
];

let vocabularyDeck = loadVocabulary();
let lastAddedBatchCount = 0; // Tracks last batch size for Undo

function loadVocabulary() {
    const saved = localStorage.getItem('korean_custom_deck');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed;
            }
        } catch (e) {
            console.error("Error loading saved deck", e);
        }
    }
    return [...defaultVocabulary];
}

function saveVocabulary() {
    localStorage.setItem('korean_custom_deck', JSON.stringify(vocabularyDeck));
    updateDeckCounter();
}

function updateDeckCounter() {
    const counter = document.getElementById('deck-counter');
    if (counter) {
        counter.innerText = `Practice Deck: ${vocabularyDeck.length} phrases (Tap to manage)`; } }  // State variables let currentIndex = -1; let lastIndex = -1;  const targetWordEl = document.getElementById('target-word'); const englishMeaningEl = document.getElementById('english-meaning'); const listenButton = document.getElementById('listen-button'); const recordingButton = document.getElementById('recording-button'); const nextButton = document.getElementById('next-button'); const skipButton = document.getElementById('skip-button'); const transcriptionResult = document.getElementById('transcription-result'); const feedbackEl = document.getElementById('feedback'); const coachMessageEl = document.getElementById('coach-message');  const newKoreanInput = document.getElementById('new-korean'); const newEnglishInput = document.getElementById('new-english'); const addButton = document.getElementById('add-button'); const batchInput = document.getElementById('batch-input'); const batchAddButton = document.getElementById('batch-add-button'); const undoButton = document.getElementById('undo-button'); const exportButton = document.getElementById('export-button');  const deckCounterEl = document.getElementById('deck-counter'); const deckModal = document.getElementById('deck-modal'); const closeModal = document.getElementById('close-modal'); const deckListEl = document.getElementById('deck-list');  // Intelligent cleaner: Removes leading numbers and extracts English function parseAndCleanLine(line) { // 1. Remove leading numbers (e.g., "161 목" -> "목") let cleaned = line.replace(/^\d+\s*/, '').trim();  // 2. Separate English words if present on the same line (e.g., "목 neck throat") const englishMatch = cleaned.match(/[a-zA-Z\s,()]+$/); let englishPart = "";  if (englishMatch && englishMatch[0].trim().length > 1) { englishPart = englishMatch[0].trim(); cleaned = cleaned.replace(englishMatch[0], '').trim(); }  // 3. Clean Korean spacing & particles cleaned = cleaned .replace(/[^가-힣a-zA-Z0-9\s.,?!~]/g, '') .replace(/\s+([요을를은는이가에도서로으로과와박밖에]+)(\s\vert{}$)/g, '$1$2') .replace(/\s+([요]+)/g, '$1') .replace(/\s+/g, ' ') .trim();  return { korean: cleaned, english: englishPart ? `(${englishPart})` : ""
    };
}

// Pick a random phrase
function getRandomPhrase() {
    if (!vocabularyDeck || vocabularyDeck.length === 0) return;
    
    if (vocabularyDeck.length === 1) {
        currentIndex = 0;
    } else {
        do {
            currentIndex = Math.floor(Math.random() * vocabularyDeck.length);
        } while (currentIndex === lastIndex);
    }
    lastIndex = currentIndex;
    
    const currentItem = vocabularyDeck[currentIndex];
    if (targetWordEl) targetWordEl.innerText = currentItem.korean;
    if (englishMeaningEl) englishMeaningEl.innerText = currentItem.english;
    if (transcriptionResult) transcriptionResult.innerText = "";
    if (feedbackEl) feedbackEl.innerText = "";
    if (nextButton) nextButton.style.display = "none";
    if (coachMessageEl) coachMessageEl.innerText = "Listen to the pitch and try matching it!";
}

// DIRECT AUDIO STREAM TTS (Bypasses iOS Speech Engine Restrictions)
let activeAudio = null;

if (listenButton) {
    listenButton.addEventListener('click', () => {
        if (currentIndex < 0 || !vocabularyDeck[currentIndex]) return;
        const currentItem = vocabularyDeck[currentIndex];
        
        // Stop any currently playing audio
        if (activeAudio) {
            activeAudio.pause();
            activeAudio = null;
        }

        const encodedText = encodeURIComponent(currentItem.korean);
        const audioUrl = `