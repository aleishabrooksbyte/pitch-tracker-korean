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

const newKoreanInput = document.getElementById('new-korean');
const newEnglishInput = document.getElementById('new-english');
const addButton = document.getElementById('add-button');
const exportButton = document.getElementById('export-button');

// Pick a random phrase ensuring it doesn't repeat the exact same one consecutively
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
}

// Text-to-Speech pronunciation
listenButton.addEventListener('click', () => {
    const currentItem = vocabularyDeck[currentIndex];
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(currentItem.korean);
        utterance.lang = 'ko-KR';
        window.speechSynthesis.speak(utterance);
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
            nextButton.style.display = "inline-block";
        } else {
            feedbackEl.innerText = "Try again! 💪";
            feedbackEl.className = "incorrect";
        }
    };

    recognition.onerror = (event) => {
        feedbackEl.innerText = "Error recognizing speech. Try again.";
        feedbackEl.className = "incorrect";
    };
} else {
    recordingButton.style.display = "none";
    transcriptionResult.innerText = "Speech recognition not supported in this browser. Use Chrome or Safari.";
}

// Navigation buttons
nextButton.addEventListener('click', getRandomPhrase);
skipButton.addEventListener('click', getRandomPhrase);

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
    
    updateDeckCounter();
});

// Export custom phrases so they can be permanently baked into GitHub if desired
exportButton.addEventListener('click', () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(vocabularyDeck, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "korean_vocabulary_backup.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
});

// Initial load setup
updateDeckCounter();
getRandomPhrase();