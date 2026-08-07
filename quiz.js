// quiz.js — Logik des Quiz (Antworten, Punktzahl, Fortschritt)

// Speichert die aktuell gewählte Antwort pro Frage.
let score = 0;

// 1. Für jede Frage: Klick auf eine Option merken und optisch markieren.
const questions = document.querySelectorAll(".question");

questions.forEach(function (question) {
    const options = question.querySelectorAll(".option");

    options.forEach(function (option) {
        option.onclick = function () {
            // Vorherige Auswahl in dieser Frage zurücksetzen
            options.forEach(function (o) {
                o.classList.remove("selected");
            });
            // Angeklickte Option markieren
            option.classList.add("selected");
            // Gewählten Wert an der Frage speichern
            question.dataset.selected = option.dataset.value;

            updateProgress();
            saveCourseProgress(); // Quiz-Antwort mitspeichern
        };
    });
});

// 2. Fortschrittsbalken aktualisieren (wie viele Fragen beantwortet sind)
function updateProgress() {
    const answered = document.querySelectorAll(".question[data-selected]").length;
    const percent = (answered / questions.length) * 100;
    document.getElementById("progressFill").style.width = percent + "%";
}

// 3. Quiz auswerten: richtige Antworten zählen und Punktzahl berechnen
function evaluateQuiz() {
    let correct = 0;

    questions.forEach(function (question) {
        if (question.dataset.selected === question.dataset.answer) {
            correct++;
        }
    });

    // Punktzahl in Prozent (z.B. 2 von 2 = 100)
    score = Math.round((correct / questions.length) * 100);
    return score;
}