// Default baseline vocabulary deck
const defaultVocabulary = [
    { korean: "안녕하세요", english: "(Hello)" },
    { korean: "감사합니다", english: "(Thank you)" },
    { korean: "사랑해요", english: "(I love you)" },
    { korean: "반갑습니다", english: "(Nice to meet you)" },
    { korean: "잘 지내세요?", english: "(How have you been?)" }
];

// Load vocabulary from localStorage or initialize with defaults
let vocabularyDeck = loadVocabulary();

function loadVocabulary() {
    const saved = localStorage.getItem('korean_custom_deck');
    if (saved) {
        try {
            return JSON.parse(saved);
        } catch (e) {
            console.error("Error loading saved deck, falling back to defaults", e);
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
        counter.innerText = `Practice Deck: ${vocabularyDeck.length} phrases loaded`;
    }
}

// State variables
let currentIndex = -1;
let lastIndex = -1;

const targetWordEl = document.getElementById('target-word');
const englishMeaningEl = document.getElementById('english-meaning');
const listenButton = document.getElementById('listen-button');
const recordingButton = document.getElementById('recording-button');
const nextButton = document.getElementById('next-button');
const skipButton = document.getElementById('skip-button');
const transcriptionResult = document.getElementById('transcription-result');
const feedbackEl = document.getElementById('feedback');
const coachMessageEl = document.getElementById('coach-message');

const newKoreanInput = document.getElementById('new-korean');
const newEnglishInput = document.getElementById('new-english');
const addButton = document.getElementById('add-button');
const exportButton = document.getElementById('export-button');

const screenshotInput = document.getElementById('screenshot-input');
const ocrStatusEl = document.getElementById('ocr-status');

// Helper function to clean and fix Korean spacing/particle issues from OCR
function cleanKoreanText(text) {
    let cleaned = text
        // Remove random non-Korean/non-English OCR noise or weird floating symbols
        .replace(/[^가-힣a-zA-Z0-9\s.,?!~]/g, '')
        // Rejoin particles that got separated by spaces (e.g. "하 세 요" -> "하세요", "책 을" -> "책을")
        .replace(/\s+([요을를은는이가에도서로으로과와박밖에]+)(\s|$)/g, '$1$2')
        .replace(/\s+([요]+)/g, '$1')
        // Clean up multiple spaces
        .replace(/\s+/g, ' ')
        .trim();
        
    return cleaned;
}

// Pick a random phrase ensuring no back-to-back repeats
function getRandomPhrase() {
    if (vocabularyDeck.length === 0) return;
    
    if (vocabularyDeck.length === 1) {
        currentIndex = 0;
    } else {
        do {
            currentIndex = Math.floor(Math.random() * vocabularyDeck.length);
        } while (currentIndex === lastIndex);
    }
    lastIndex = currentIndex;
    
    const currentItem = vocabularyDeck[currentIndex];
    targetWordEl.innerText = currentItem.korean;
    englishMeaningEl.innerText = currentItem.english;
    transcriptionResult.innerText = "";
    feedbackEl.innerText = "";
    nextButton.style.display = "none";
    if (coachMessageEl) {
        coachMessageEl.innerText = "Listen to the pitch and try matching it!";
    }
}

// Text-to-Speech pronunciation (iOS volume fixed)
listenButton.addEventListener('click', () => {
    const currentItem = vocabularyDeck[currentIndex];
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(currentItem.korean);
        utterance.lang = 'ko-KR';
        utterance.volume = 1.0;
        utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);
        if (coachMessageEl) {
            coachMessageEl.innerText = "Listening closely helps your pitch!";
        }
    } else {
        alert("Text-to-speech is not supported in this browser.");
    }
});

// Speech Recognition setup
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SpeechRecognition) {
    const recognition = new SpeechRecognition();
    recognition.lang = 'ko-KR';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recordingButton.addEventListener('click', () => {
        feedbackEl.innerText = "Listening...";
        feedbackEl.style.color = "#007aff";
        transcriptionResult.innerText = "";
        if (coachMessageEl) {
            coachMessageEl.innerText = "I'm listening to your pitch! Speak clearly.";
        }
        try {
            recognition.start();
        } catch (e) {
            console.error(e);
        }
    });

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript.trim();
        transcriptionResult.innerText = `You said: ${transcript}`;
        
        const targetText = vocabularyDeck[currentIndex].korean.replace(/[.,?!]/g, "").trim();
        const cleanedTranscript = transcript.replace(/[.,?!]/g, "").trim();

        if (cleanedTranscript === targetText) {
            feedbackEl.innerText = "Correct! 🎉";
            feedbackEl.className = "correct";
            nextButton.style.display = "block";
            if (coachMessageEl) {
                coachMessageEl.innerText = "Wonderful job! Perfect pitch! 🌟";
            }
        } else {
            feedbackEl.innerText = "Try again! 💪";
            feedbackEl.className = "incorrect";
            if (coachMessageEl) {
                coachMessageEl.innerText = "So close! Check your pitch and try again.";
            }
        }
    };

    recognition.onerror = (event) => {
        feedbackEl.innerText = "Error recognizing speech. Try again.";
        feedbackEl.className = "incorrect";
        if (coachMessageEl) {
            coachMessageEl.innerText = "Oops, didn't catch that. Tap record again!";
        }
    };
} else {
    recordingButton.style.display = "none";
    transcriptionResult.innerText = "Speech recognition not supported in this browser. Use Safari or Chrome.";
}

// Navigation buttons
nextButton.addEventListener('click', getRandomPhrase);
skipButton.addEventListener('click', () => {
    if (coachMessageEl) {
        coachMessageEl.innerText = "No worries, let's try a new one!";
    }
    getRandomPhrase();
});

// Add custom phrase handler
addButton.addEventListener('click', () => {
    const kText = newKoreanInput.value.trim();
    const eText = newEnglishInput.value.trim();

    if (!kText) {
        alert("Please enter a Korean phrase.");
        return;
    }

    vocabularyDeck.push({
        korean: cleanKoreanText(kText),
        english: eText ? `(${eText})` : "(Custom phrase)"
    });

    saveVocabulary();

    newKoreanInput.value = "";
    newEnglishInput.value = "";
    feedbackEl.innerText = "Phrase added permanently! ✨";
    feedbackEl.style.color = "#5856d6";
    if (coachMessageEl) {
        coachMessageEl.innerText = "Added to your deck! Let's practice it!";
    }
});

// Screenshot OCR Handling (Batch Extraction with Korean Particle Cleanup)
if (screenshotInput) {
    screenshotInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;

        ocrStatusEl.innerText = "Scanning full screenshot... 🔍";
        ocrStatusEl.style.color = "#007aff";
        if (coachMessageEl) {
            coachMessageEl.innerText = "Scanning and fixing Korean grammar spacing...";
        }

        Tesseract.recognize(
            file,
            'kor+eng',
            { 
                logger: m => {
                    if (m.status === 'recognizing text') {
                        ocrStatusEl.innerText = `Reading & cleaning: ${Math.round(m.progress * 100)}%`;
                    }
                }
            }
        ).then(({ data: { text } }) => {
            ocrStatusEl.innerText = "";
            parseAndBatchAddText(text);
            screenshotInput.value = "";
        }).catch(err => {
            console.error(err);
            ocrStatusEl.innerText = "Could not read image. Try a clearer shot.";
            ocrStatusEl.style.color = "#ff3b30";
            if (coachMessageEl) {
                coachMessageEl.innerText = "Hmm, couldn't read that image clearly.";
            }
        });
    });
}

function parseAndBatchAddText(rawText) {
    const rawLines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    
    let addedCount = 0;
    let currentKorean = "";

    for (let i = 0; i < rawLines.length; i++) {
        let line = rawLines[i];

        if (/[가-힣]/.test(line)) {
            line = cleanKoreanText(line);

            if (currentKorean) {
                vocabularyDeck.push({
                    korean: currentKorean,
                    english: "(Custom phrase)"
                });
                addedCount++;
            }
            currentKorean = line;
        } else if (currentKorean && line.length > 1) {
            vocabularyDeck.push({