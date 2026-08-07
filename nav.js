// nav.js — seitliche Navigation: wechselt zwischen den Ansichten

const navItems = document.querySelectorAll(".nav-item");
const views = document.querySelectorAll(".view");

navItems.forEach(function (item) {
    item.onclick = function () {

        // Gesperrten Quiz nicht öffnen
        if (item.classList.contains("locked")) {
            return;
        }

        const target = item.dataset.view;

        // Alle Views ausblenden, dann die gewählte einblenden
        views.forEach( function (view) {
            view.classList.remove("active");
        });
        document.getElementById(target).classList.add("active");

        // Aktiven Navigationspunkt markieren
        navItems.forEach(function (nav) {
            nav.classList.remove("active");
        });
        item.classList.add("active");

        // PDF-Lektionen automatisch als erledigt markieren, sobald geöffnet
        const pdfLektionen = ["lektion2", "lektion4"];
        if (pdfLektionen.includes(target)) {
            markLessonComplete(target);
        }
    };
});
