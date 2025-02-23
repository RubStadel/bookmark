// "use strict";

// import filesystem access from the Tauri API
// https://v2.tauri.app/plugin/file-system/#permissions
const { resolveResource } = window.__TAURI__.path;
const { readTextFile, writeTextFile } = window.__TAURI__.fs;
const { invoke } = window.__TAURI__.core;

// Read the text file in the `$RESOURCE/resources/books.json` path
const booksJsonPath = await resolveResource('resources/books.json');
const bookList = JSON.parse(await readTextFile(booksJsonPath));

loadBookList();

let emitTimeout;
let index;
let bookFormVisible = false;

let datalists = ["Autor", "Sprache", "Genre", "Reihe", "Land"];
let parts = ["Anfang", "Mitte", "Ende"];
let months = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
let keys = { Titel: "title", Autor: "author", Sprache: "language", Ort: "location", Genre: "genre", Reihe: "series", Erscheinungsjahr: "releaseYear", Land: "country", Notizen: "notes" };

// eventListeners have to be added here instead of in the html because the function names are not available there due to module scope
document.getElementById("menu").addEventListener('touchstart', revealMenu);
document.getElementById("menu").addEventListener('touchend', clickMenuButton);
document.getElementById("menu").addEventListener('touchmove', highlightMenu);
document.getElementById("editButton").addEventListener('click', toggleEditForm);

// for testing purposes on windows only ((very limited) support for mouse input)
document.getElementById("menuButton").addEventListener('click', toggleBookForm);

function loadBookList() {
    document.getElementById("bookList").replaceChildren();

    let year = 0;
    for (let i = bookList.books.length - 1; i >= 0; i--) {
        if (bookList.books[i].beendet.split(" ")[2] != year) {
            let yearHeader = document.createElement("h1");
            yearHeader.innerText = bookList.books[i].beendet.split(" ")[2];
            document.getElementById("bookList").append(yearHeader);
            year = bookList.books[i].beendet.split(" ")[2];
        }

        let book = document.createElement("button");
        book.innerText = bookList.books[i].Titel;
        book.addEventListener("click", () => loadBookDetails(bookList.books[i].Titel));
        document.getElementById("bookList").append(book);
    }
}

async function updateJSON() {
    let booksJson = JSON.stringify(bookList);
    await writeTextFile(booksJsonPath, booksJson);
}

function sortJSON(book) {
    let newBook = book;
    let index = 0;

    for (let i = bookList.books.length - 2; i >= 0; i--) {
        if (newBook.beendet.split(" ")[2] >= bookList.books[i].beendet.split(" ")[2]) {         // selbes Jahr oder später
            if (newBook.beendet.split(" ")[2] > bookList.books[i].beendet.split(" ")[2]) {      // späteres Jahr
                index = i + 1;
                break;
            }
            if (newBook.beendet.split(" ")[1] >= bookList.books[i].beendet.split(" ")[1]) {     // selber oder späterer Monat im selben Jahr
                if (newBook.beendet.split(" ")[1] > bookList.books[i].beendet.split(" ")[1]) {  // späterer Monat im selben Jahr
                    index = i + 1;
                    break;
                }
                if (newBook.beendet.split(" ")[0] >= bookList.books[i].beendet.split(" ")[0]) { // selber oder späterer Teil im selben Monat
                    index = i + 1;
                    break;
                } else {                                                                        // früherer Teil des selben Monats
                    continue;
                }
            } else {                                                                            // früherer Monats des selben Jahres
                continue;
            }
        } else {                                                                                // früheres Jahr
            continue;
        }
    }

    bookList.books.splice(index, 0, newBook);
    updateDatalistOptions(newBook);
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
        readDatalistOptions();
        document.getElementById("title").focus();
        document.getElementById("menuButton").style.opacity = "0";
        document.getElementById("submitButton").addEventListener('click', addBook2List);
    }
}

function readDatalistOptions() {
    Object.keys(bookList.datalists).forEach(function (key) {
        document.getElementById(key).replaceChildren();
        for (let entry of bookList.datalists[key]) {
            let option = document.createElement("option");
            option.innerText = entry;
            document.getElementById(key).append(option);
        }
    });
}

function updateDatalistOptions(newBook) {
    let i = 0;
    Object.keys(bookList.datalists).forEach(function (key) {
        if (newBook[datalists[i]] && !bookList.datalists[key].find((entry) => entry == newBook[datalists[i]])) {
            bookList.datalists[key].push(newBook[datalists[i]]);
        }
        i++;
    });
}

function getBookFromForm() {
    return {
        Titel: document.getElementById("title").value,
        Autor: document.getElementById("author").value,
        Sprache: document.getElementById("language").value,
        Ort: document.getElementById("location").value,
        angefangen: `${parts.indexOf(document.getElementById("startPart").value)} ${months.indexOf(document.getElementById("startMonth").value) + 1} ${document.getElementById("startYear").value}`,
        beendet: `${parts.indexOf(document.getElementById("endPart").value)} ${months.indexOf(document.getElementById("endMonth").value) + 1} ${document.getElementById("endYear").value}`,
        Genre: document.getElementById("genre").value,
        Reihe: document.getElementById("series").value,
        Erscheinungsjahr: document.getElementById("releaseYear").value,
        Land: document.getElementById("country").value,
        Notizen: document.getElementById("notes").value,
        Bilder: ""                          // TODO: add support for pictures
    };
}

function addBook2List() {
    let book = getBookFromForm();

    if (!(book.Titel && book.Autor && book.Sprache && book.Ort && book.angefangen.slice(-1) != " " && book.beendet.slice(-1) != " ")) {
        return;
    }

    document.getElementById("bookForm").reset();

    let bookButton = document.createElement("button");
    bookButton.innerText = book.Titel;
    bookButton.addEventListener("click", () => loadBookDetails(book.Titel));
    document.getElementById("bookList").append(bookButton);

    sortJSON(book);

    updateJSON();
    toggleBookForm();

    loadBookList();
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
    emitTimeout = setTimeout(() => { emit_book_details(title) }, 200);              // timeout >100ms is necessary for the new WebviewWindow to be able to receive the emitted event
}

async function emit_book_details(title) {
    await invoke("emit_book_details", { title: title });
    clearTimeout(emitTimeout);
}

/// bookDetails

/**
 * Opens the bookDetails "page".
 * Sets closeBookDetails as the functionality for when the android back button is activated.
 */
function openBookDetails() {
    document.getElementById("bookDetails").style.left = "-1%";
    document.getElementById("menuButton").style.opacity = "0";
    window.androidBackCallback = closeBookDetails;
}

/**
 * Closes the bookDetails "page".
 * @returns always false so that the default android back function will be prevented
 */
function closeBookDetails() {
    document.getElementById("bookDetails").style.left = "150%";
    document.getElementById("menuButton").style.opacity = "1";
    window.androidBackCallback = () => { return true };

    return false;
}

/**
 * Opens the bookDetails "page" and loads the details of the selected book by searching the json list for the title.
 * @param {string} title - title of the selected book
 */
function loadBookDetails(title) {
    openBookDetails();
    document.getElementById("detailsList").replaceChildren();

    for (let i = 0; i < bookList.books.length; i++) {
        if (bookList.books[i].Titel != title) {
            continue
        }
        index = i;
        Object.keys(bookList.books[i]).forEach(function (key) {
            if (bookList.books[i][key]) {
                if (key == "angefangen") {
                    determineReadDates(i);
                } else if (key == "beendet") {

                } else {
                    let property = document.createElement("h2");
                    property.innerText = key;

                    let value = document.createElement("p");
                    value.innerText = bookList.books[i][key];

                    document.getElementById("detailsList").append(property);
                    document.getElementById("detailsList").append(value);
                }
            }
        });
    }
}

/**
 * Adds the read dates to the bookDetails page.
 * Conditionally formats the read dates if there is some overlap between start and end.
 * @param {number} i - index of the selected book (for lookup of the read dates from json list)
 */
function determineReadDates(i) {
    let property = document.createElement("h2");
    property.innerText = "gelesen";
    let value = document.createElement("p");

    let start = bookList.books[i]["angefangen"];
    let end = bookList.books[i]["beendet"];
    let startDate = translateReadDates(start);
    let endDate = translateReadDates(end);

    if (start == end) {
        value.innerText = startDate;
    } else if (start.split(" ")[1] == end.split(" ")[1] && start.split(" ")[2] == end.split(" ")[2]) {                      // same month and year
        value.innerText = `${startDate.split(" ")[0]} - ${endDate}`;
    } else if (start.split(" ")[2] == end.split(" ")[2]) {                                                                  // same year
        value.innerText = `${startDate.split(" ")[0]} ${startDate.split(" ")[1]} - ${endDate}`;
    } else {
        value.innerText = `${startDate} - ${endDate}`;
    }
    document.getElementById("detailsList").append(property);
    document.getElementById("detailsList").append(value);
}

/**
 * Translates the read dates from integers (datalist option indices) to strings (part and month).
 * @param {string} date - date as read from the json list (e.g. "0 1 2023")
 * @returns {string} date as string (e.g. "Anfang Januar 2023")
 */
function translateReadDates(date) {
    let splitDate = date.split(" ");
    let part = parts[splitDate[0]];
    let month = months[splitDate[1] - 1];
    let year = splitDate[2];

    return `${part} ${month} ${year}`;
}

/**
 * Toggles the form for editing book details.
 */
function toggleEditForm() {
    let formDiv = document.getElementById("bookFormDiv");
    if (bookFormVisible) {
        formDiv.style.top = "-150%";
        bookFormVisible = false;
        document.getElementById("editButton").style.opacity = "1";
    } else {
        formDiv.style.top = "0%";
        bookFormVisible = true;
        readDatalistOptions();
        fillInEditForm();
        document.getElementById("title").focus();
        document.getElementById("editButton").style.opacity = "0";
        document.getElementById("submitButton").addEventListener('click', editBookDetails);
    }
}

/**
 * Fills the form for editing book details with the information that is currently saved in the json.
 */
function fillInEditForm() {
    const book = bookList.books[index];
    Object.keys(book).forEach(function (key) {
        if (book[key]) {
            if (key == "angefangen") {
                translateReadDates2Form(book[key], "start");
            } else if (key == "beendet") {
                translateReadDates2Form(book[key], "end");
            } else {
                document.getElementById(keys[key]).value = book[key];
            }
        }
    });
}

/**
 * Fills the read dates into the select tags of the form for editing book details.
 * @param {string} date - date as read from the json list (e.g. "0 1 2023")
 * @param {string} startOrEnd - indicator if detail is start or end date, also used to select id of select element to fill
 */
function translateReadDates2Form(date, startOrEnd) {
    let splitDate = date.split(" ");
    document.getElementById(startOrEnd + "Part").value = parts[splitDate[0]];
    document.getElementById(startOrEnd + "Month").value = months[splitDate[1] - 1];
    document.getElementById(startOrEnd + "Year").value = splitDate[2];
}

function editBookDetails() {
    let book = getBookFromForm();

    if (!(book.Titel && book.Autor && book.Sprache && book.Ort && book.angefangen.slice(-1) != " " && book.beendet.slice(-1) != " ")) {
        return;
    }

    document.getElementById("bookForm").reset();

    bookList.books.splice(index, 1);

    sortJSON(book);
    updateJSON();

    loadBookDetails(book.Titel);
    toggleEditForm();
}
