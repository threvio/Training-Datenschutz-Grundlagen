// progress.js — verfolgt den Fortschritt durch die Lektionen

// Liste aller Lektionen und speicher für erledigte
const allLessons = ["lektion1", "lektion2", "lektion3", "lektion4"];
let completedLessons = [];

// 1. Für jeden "Als erledigt"-Button einen Klick-Handler setzen
window.addEventListener("load", function () {
    document.querySelectorAll(".btn-next").forEach(function (button) {
        button.onclick = function () {
            const lesson = button.dataset.lesson;
            markLessonComplete(lesson);
        };
    });
});

// 2. Eine Lektion als erledigt markieren
function markLessonComplete(lesson) {
    // Nur hinzufügen, wenn noch nicht erledigt
    if (!completedLessons.includes(lesson)) {
        completedLessons.push(lesson);
    }

    // Häkchen im navigationspunkt anzeigen
    const navItem = document.querySelector('.nav-item[data-view="' + lesson + '"]');
    if (navItem) {
        navItem.classList.add("done");
    }

    updateCourseProgress();
    unlockQuizIfReady();

    // In das LMS speichern
    saveCourseProgress();
}

// 3. Hauptfortschrittsbalken aktualisieren
function updateCourseProgress() {
    const percent = (completedLessons.length / allLessons.length) * 100;
    document.getElementById("progressFill").style.width = percent + "%";
}

// 4. Quiz freischalten, wenn alle Lektionen erledigt sind
function unlockQuizIfReady() {
    const quizNav = document.querySelector('.nav-item[data-view="quiz"]');
    if (completedLessons.length === allLessons.length) {
        quizNav.classList.remove("locked");
    }
}