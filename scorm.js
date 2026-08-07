// scorm.js — Kommunikation mit dem LMS (SCORM 1.2)

// Hier speichern wir das API-Objekt, das vom LMS bereitgestellt wird.
let api = null;

// 1. Sucht das API-Object, indem es sich durch die Fenster (parent) hocharbeitet.
function findAPI(win) {
    let attempt = 0;
    while (win.API == null && win.parent != null && win.parent != win && attempt <10 ) {
        attempt++;
        win = win.parent;
    }
    return win.API;
}

// Holt das API aus dem aktuellen Fenster oder dem opener-Fenster.
function getAPI() {
    let foundApi = findAPI(window);
    if (foundApi == null && window.opener != null) {
        foundApi = findAPI(window.opener);
    }
    return foundApi;
}

// 2. Beim Laden der Seite: API suchen und die Sitzung öffnen.
window.onload = function () {
    api = getAPI();
    if (api == null) {
        alert("SCORM API nicht gefunden (normal, wenn lokal ohne LMS geöffnet).");
        return;
    }
    api.LMSInitialize("");
    restoreCourseProgress();

    // Solange nicht abgeschlossen: Status auf "incomplete"
    const currentStatus = api.LMSGetValue("cmi.core.lesson_status");
    if (currentStatus === "not attempted" || currentStatus === "") {
        api.LMSSetValue("cmi.core.lesson_status", "incomplete");
        api.LMSCommit("");

    }

    // 3. Beim Klick auf den Button: Quiz auswerten und Ergebnis an das LMS senden.
    document.getElementById("finishBtn").onclick = function () {
        // Punktzahl aus quiz.js holen
        const score = evaluateQuiz();

        // Bestehensgrenze: 50%
        const passed = score >= 75;
        const status = passed ? "passed" : "failed";

        // Ergebnis an das LMS übermitteln
        api.LMSSetValue("cmi.core.score.raw", score.toString());
        api.LMSSetValue("cmi.core.score.min", "0");
        api.LMSSetValue("cmi.core.score.max", "100");
        api.LMSSetValue("cmi.core.lesson_status", status);
        api.LMSCommit("");

        saveInteractions();   // jede Frage einzeln ans LMS melden
        
        // Ergebnis auf der Seite anzeigen.
        showResult(score, passed);
    };
};

// Zeigt das Ergebnis unter dem Button an.
    function showResult(score, passed) {
    const result = document.getElementById("result");
    result.textContent = passed
        ? "Bestanden! Ergebnis: " + score + "%"
        : "Nicht bestanden. Ergebnis: " + score + "%";
    result.className = "result " + (passed ? "passed" : "failed");
    }

// 4. Beim Schließen der Seite: die Sitzung ordentlich beenden.
window.onunload = function () {
    if (api != null) {
        api.LMSFinish("");
    }
};

// 5. Speichert die aktuellen Antworten im LMS (suspend_data)
function saveProgress() {
    if (api == null) {
        return;
    }

    // Alle gewählten Antworten in ein Objekt sammeln
    const answers = {};
    document.querySelectorAll(".question").forEach(function (question, index) {
        if (question.dataset.selected) {
            answers["q" + index] = question.dataset.selected;
        }
    });

    // Objekt in einem String umwandeln und im LMS speichern
    api.LMSSetValue("cmi.suspend_data", JSON.stringify(answers));
    api.LMSCommit("");
}

// 6. Lädt gespeicherte Antworten aus dem LMS und stellt sie wieder her.
function restoreProgress() {
    if (api == null) {
        return;
    }

    const saved = api.LMSGetValue("cmi.suspend_data");

    // Nicht gespeichert? Dann nichts wiederherstellen
    if (!saved || saved === "") {
        return;
    }

    // String zurück in ein Objekt umwandeln
    const answers = JSON.parse(saved);

    // Für jede Frage die gespeicherte Antwort wieder markieren
    document.querySelectorAll(".question").forEach(function (question, index) {
        const savedValue = answers["q" + index];
        if (!savedValue) {
            return;
        }

        question.dataset.selected = savedValue;
        const option = question.querySelector('.option[data-value="' + savedValue + '"]');
        if (option) {
            option.classList.add("selected");
        }
    });

    // Fortschrittsbalken aktualisieren.
        updateProgress();
}

// Speichert jede einzelne Antwort als Interaction im LMS (cmi.interactions)
function saveInteractions() {
    if (api == null) {
        return;
    }

    document.querySelectorAll(".question").forEach(function (question, index) {
        const studentAnswer = question.dataset.selected || "";
        const correctAnswer = question.dataset.answer;
        const results = (studentAnswer === correctAnswer) ? "correct" : "wrong";

        // Eindeutige ID der Interaktion (z.B. "frage_1")
        api.LMSSetValue("cmi.interactions." + index + ".id", "frage_" + (index + 1));
        // Art der Frage: Multiple Choice
        api.LMSSetValue("cmi.interactions." + index + ".type", "choice");
        // Antwort des Lernenden
        api.LMSSetValue("cmi.interactions" + index + ".student_response", studentAnswer);
        // Richtige Antwort
        api.LMSSetValue("cmi.interactions" + index + ".correct_responses.0.pattern", correctAnswer);
        // Ergebnis: correct oder wrong
        api.LMSSetValue("cmi.interactions." + index + ".result", result);
    });

    api.LMSCommit("");
}

// Speichert Lektionen-Fortschritt UND Quiz-Antworten zusammen (suspend_data)
function saveCourseProgress() {
    if (api == null) {
        return;
    }

    // Quiz-Antworten einsammeln
    const answers = {};
    document.querySelectorAll(".question").forEach(function (question, index) {
        if (question.dataset.selected) {
            answers["q" + index] = question.dataset.selected;
        }
    });

    const data = { 
        lessons: completedLessons,
        answers: answers
    };

    api.LMSSetValue("cmi.suspend_data", JSON.stringify(data));
    api.LMSCommit("");
}

// Lädt Lektionen UND Quiz-Antworten beim Start wieder
function restoreCourseProgress() {
    if (api == null) {
        return;
    }
    const saved = api.LMSGetValue("cmi.suspend_data");
    if (!saved || saved === "") {
        return;
    }
    const data = JSON.parse(saved);

    // Erledigte Lektionen wiederherstellen
    if (data.lessons) {
        data.lessons.forEach(function (lesson) {
            markLessonComplete(lesson);
        });
    }

    // Quiz-Antworten wiederherstellen
    if (data.answers) {
        document.querySelectorAll(".question").forEach(function (question, index) {
            const savedValue = data.answers["q" + index];
            if (savedValue) {
                question.dataset.selected = savedValue;
                const option = question.querySelector('.option[data-value="' + savedValue + '"]');
                if (option) {
                    option.classList.add(selected);
                }
            }
        });
    }
}