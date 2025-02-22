"use strict";

// import filesystem access from the Tauri API
// https://v2.tauri.app/plugin/file-system/#permissions
const { resolveResource } = window.__TAURI__.path;
const { readTextFile, writeTextFile } = window.__TAURI__.fs;
const { WebviewWindow, getCurrentWebviewWindow } = window.__TAURI__.webviewWindow;
const { invoke } = window.__TAURI__.core;
const { listen } = window.__TAURI__.event;

// Read the text file in the `$RESOURCE/resources/books.json` path
const booksJsonPath = await resolveResource('resources/books.json');
const bookList = JSON.parse(await readTextFile(booksJsonPath));

const appWebview = getCurrentWebviewWindow();
appWebview.listen("bookDetails", (event) => {
    loadBookDetails(event.payload);
    // console.log("emit 'bookDetails' received");
});

let bookFormVisible = false;
let index;

function loadBookDetails(title) {
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

let datalists = ["Autor", "Sprache", "Genre", "Reihe", "Land"];
let parts = ["Anfang", "Mitte", "Ende"];
let months = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
let keys = { Titel: "title", Autor: "author", Sprache: "language", Ort: "location", Genre: "genre", Reihe: "series", Erscheinungsjahr: "releaseYear", Land: "country", Notizen: "notes" };

function translateReadDates(date) {
    let splitDate = date.split(" ");
    let part = parts[splitDate[0]];
    let month = months[splitDate[1] - 1];
    let year = splitDate[2];

    return `${part} ${month} ${year}`;
}

function translateReadDates2Form(detail, startOrEnd) {
    let splitDate = detail.split(" ");
    document.getElementById(startOrEnd + "Part").value = parts[splitDate[0]];
    document.getElementById(startOrEnd + "Month").value = months[splitDate[1] - 1];
    document.getElementById(startOrEnd + "Year").value = splitDate[2];
}

// eventListeners have to be added here instead of in the html because the function names are not available there due to module scope
document.getElementById("editButton").addEventListener('click', toggleEditForm);
document.getElementById("submitButton").addEventListener('click', editBookDetails);

function editBookDetails() {
    let book = {
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
    }
}

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
