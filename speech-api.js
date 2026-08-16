// speech-api.js
const recordingButton = document.getElementById("recording-button");
const transcriptionResult = document.getElementById("transcription-result");
let isRecording = false;

// Initialize Web Speech API
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

if (typeof SpeechRecognition !== "undefined") {
    const recognition = new SpeechRecognition();
    recognition.lang = 'ko-KR'; 
    recognition.continuous = true; 
    recognition.interimResults = true; 

    recognition.addEventListener("result", (event) => {
        transcriptionResult.textContent = "";
        for (const result of event.results) {
            const text = document.createTextNode(result[0].transcript);
            const p = document.createElement("p");
            p.appendChild(text);
            
            if (result.isFinal) {
                p.classList.add("final");
            }
            transcriptionResult.appendChild(p);
        }
    });

    const onClick = (event) => {
        if (isRecording) {
            recognition.stop();
            recordingButton.textContent = "Start recording";
        } else {
            recognition.start();
            recordingButton.textContent = "Stop recording";
        }
        isRecording = !isRecording;
    };

    recordingButton.addEventListener("click", onClick);
} else {
    recordingButton.remove();
    transcriptionResult.textContent = "Your browser does not support Speech Recognition.";
}