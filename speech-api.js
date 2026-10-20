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
    coachMessageEl.innerText = "Listen to the pitch and try matching it!";
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
        coachMessageEl.innerText = "Listening closely helps your pitch!";
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
        coachMessageEl.innerText = "I'm listening to your pitch! Speak clearly.";
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
            coachMessageEl.innerText = "Wonderful job! Perfect pitch! 🌟";
        } else {
            feedbackEl.innerText = "Try again! 💪";
            feedbackEl.className = "incorrect";
            coachMessageEl.innerText = "So close! Check your pitch and try again.";
        }
    };

    recognition.onerror = (event) => {
        feedbackEl.innerText = "Error recognizing speech. Try again.";
        feedbackEl.className = "incorrect";
        coachMessageEl.innerText = "Oops, didn't catch that. Tap record again!";
    };
} else {
    recordingButton.style.display = "none";
    transcriptionResult.innerText = "Speech recognition not supported in this browser. Use Safari or Chrome.";
}

// Navigation buttons
nextButton.addEventListener('click', getRandomPhrase);
skipButton.addEventListener('click', () => {
    coachMessageEl.innerText = "No worries, let's try a new one!";
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
        korean: kText,
        english: eText ? `(${eText})` : "(Custom phrase)"
    });

    saveVocabulary();

    newKoreanInput.value = "";
    newEnglishInput.value = "";
    feedbackEl.innerText = "Phrase added permanently! ✨";
    feedbackEl.style.color = "#5856d6";
    coachMessageEl.innerText = "Added to your deck! Let's practice it!";
});

// Direct Screenshot OCR Handling (Fixed for mobile file tapping)
screenshotInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;

    ocrStatusEl.innerText = "Scanning screenshot... 🔍";
    ocrStatusEl.style.color = "#007aff";
    coachMessageEl.innerText = "Reading your screenshot for vocabulary...";

    Tesseract.recognize(
        file,
        'kor+eng',
        { 
            logger: m => {
                if (m.status === 'recognizing text') {
                    ocrStatusEl.innerText = `Reading: ${Math.round(m.progress * 100)}%`;
                }
            }
        }
    ).then(({ data: { text } }) => {
        ocrStatusEl.innerText = "";
        parseExtractedText(text);
        screenshotInput.value = "";
    }).catch(err => {
        console.error(err);
        ocrStatusEl.innerText = "Could not read image. Try a clearer shot.";
        ocrStatusEl.style.color = "#ff3b30";
        coachMessageEl.innerText = "Hmm, couldn't read that image clearly.";
    });
});

function parseExtractedText(rawText) {
    const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    let koreanFound = "";
    let englishFound = "";

    for (let line of lines) {
        if (/[가-힣]/.test(line)) {
            if (!koreanFound) koreanFound = line;
        } else {
            if (!englishFound && line.length > 2) englishFound = line;
        }
    }

    if (koreanFound) {
        newKoreanInput.value = koreanFound;
        if (englishFound) newEnglishInput.value = englishFound;
        feedbackEl.innerText = "Text extracted! Review and tap Add.";
        feedbackEl.style.color = "#34c759";
        coachMessageEl.innerText = "Found it! Check the box and add it.";
    } else {
        newKoreanInput.value = rawText.trim();
        feedbackEl.innerText = "Extracted text loaded into box.";
        feedbackEl.style.color = "#ff9500";
        coachMessageEl.innerText = "Check the text box and tap Add!";
    }
}

// Export JSON backup
exportButton.addEventListener('click', () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(vocabularyDeck, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "korean_vocabulary_backup.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    coachMessageEl.innerText = "Deck backed up successfully!";
});

// Initial load setup
updateDeckCounter();
getRandomPhrase();