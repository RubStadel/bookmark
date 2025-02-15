"use strict";

// import filesystem access from the Tauri API
// https://v2.tauri.app/plugin/file-system/#permissions
const { resolveResource } = window.__TAURI__.path;
const { readTextFile, writeTextFile } = window.__TAURI__.fs;
const { invoke } = window.__TAURI__.core;

// Read the text file in the `$RESOURCE/resources/books.json` path
const booksJsonPath = await resolveResource('resources/books.json');
const bookList = JSON.parse(await readTextFile(booksJsonPath));

loadBookList();

let newYearAdded = false;
let emitTimeout;
let bookFormVisible = false;

// eventListeners have to be added here instead of in the html because the function names are not available there due to module scope
document.getElementById("menu").addEventListener('touchstart', revealMenu);
document.getElementById("menu").addEventListener('touchend', clickMenuButton);
document.getElementById("menu").addEventListener('touchmove', highlightMenu);
document.getElementById("submitButton").addEventListener('click', addBook2List);

// for testing purposes on windows only ((very limited) support for mouse input)
document.getElementById("menuButton").addEventListener('click', toggleBookForm);

function loadBookList() {
    for (let i = 0; i < bookList.books.length; i++) {
        let book = document.createElement("button");
        book.innerText = bookList.books[i].Titel;
        book.addEventListener("click", () => { newWindow(1, bookList.books[i].Titel) });
        document.getElementById("bookList").append(book);
    }
}

async function updateJSON() {
    let booksJson = JSON.stringify(bookList);
    await writeTextFile(booksJsonPath, booksJson);
}

// FIXME: replace with real chronological sorting including h1 headers for new years/months
function addYear2List() {
    if (newYearAdded) {
        return;
    }

    let year = document.createElement("h1");
    year.innerText = "2025";
    document.getElementById("bookList").append(year);

    newYearAdded = true;
}

function toggleBookForm() {
    let formDiv = document.getElementById("bookFormDiv");
    if (bookFormVisible) {
        formDiv.style.top = "-150%";
        bookFormVisible = false;
        document.getElementById("menuButton").style.opacity = "1";
    } else {
        formDiv.style.top = "0%";
        bookFormVisible = true;
        document.getElementById("menuButton").style.opacity = "0";
    }
}

function addBook2List() {
    // TODO: check for required content input

    addYear2List();

    let book = {
        Titel: document.getElementById("title").value,
        Autor: document.getElementById("author").value,
        Sprache: document.getElementById("language").value,
        Ort: document.getElementById("location").value,
        angefangen: `${document.getElementById("startPart").value} ${document.getElementById("startMonth").value} ${document.getElementById("startYear").value}`,
        beendet: `${document.getElementById("endPart").value} ${document.getElementById("endMonth").value} ${document.getElementById("endYear").value}`,
        Genre: document.getElementById("genre").value,
        Erscheinungsjahr: document.getElementById("releaseYear").value,
        Land: document.getElementById("country").value,
        Notizen: document.getElementById("notes").value,
        Bilder: ""                          // TODO: add support for pictures
    };
    console.log(book);
    bookList.books.push(book);

    let bookButton = document.createElement("button");
    bookButton.innerText = bookList.books.slice(-1)[0].Titel;
    bookButton.addEventListener("click", () => { newWindow(1, bookList.books.slice(-1)[0].Titel) });
    document.getElementById("bookList").append(bookButton);                               // TODO: (re-)sort bookList chronologically

    updateJSON();
    toggleBookForm();
}

function revealMenu() {
    resetButtonHighlight();
    let buttons = document.getElementsByClassName("menuButtons");
    let k = 7.5;
    buttons[0].style.transform = "rotate(0deg)";
    for (let i = 1; i < buttons.length; i++) {
        buttons[i].style.opacity = "1";
        k += 5;
        buttons[i].style.transform = "translateY(-" + k + "vh)";
    }
}

function hideMenu() {
    let buttons = document.getElementsByClassName("menuButtons");
    buttons[0].style.transform = "rotate(45deg)";
    for (let i = 1; i < buttons.length; i++) {
        buttons[i].style.opacity = "0";
        buttons[i].style.transform = "none";
    }
}

function identifyMenuButton(e) {
    const { touches, changedTouches } = e.originalEvent ?? e;
    const touch = touches[0] ?? changedTouches[0];
    let x = touch.pageX;
    let y = touch.clientY;

    let X = screen.width;
    let Y = screen.height;

    y = Y - y;
    y = (y / Y) * 100;

    let button = 0;
    if (y < 19.5) {
        button = 0;
    } else if (y < 23) {
        button = 1;
    } else if (y < 28) {
        button = 2;
    } else if (y < 33) {
        button = 3;
    } else {
        button = 4;
    }

    return button;
}

function highlightMenu(e) {
    let button = identifyMenuButton(e);

    if (button) {
        highlightButton(button);
    } else {
        resetButtonHighlight();
    }
}

function highlightButton(button) {
    resetButtonHighlight();
    let b = document.getElementsByClassName("menuButtons").item(button);
    b.style.color = "gold";
    b.style.paddingRight = "10vw";
}

function resetButtonHighlight() {
    Array.from(document.getElementsByClassName("menuButtons")).forEach(
        function (element) {
            element.style.color = "white";
            element.style.paddingRight = "0vw";
        }
    );
}

function clickMenuButton(e) {
    let button = identifyMenuButton(e);

    switch (button) {
        case 1:
            toggleBookForm();
            break;

        default:
            break;
    }
    hideMenu();
}

/// Create new WebviewWindow on mobile
/// config: 1 for bookDetails, 2 for settings (not implemented yet)
async function newWindow(config, title) {
    await invoke("create_window", { config: config });
    emitTimeout = setTimeout(() => { emit_book_details(title) }, 150);              // timeout >100ms is necessary for the new WebviewWindow to be able to receive the emitted event
}

async function emit_book_details(title) {
    await invoke("emit_book_details", { title: title });
    clearTimeout(emitTimeout);
}
