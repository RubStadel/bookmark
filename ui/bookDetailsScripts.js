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

});

function loadBookDetails(title) {
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
    } else if (start.split(" ").slice(1, 3) == end.split(" ").slice(1, 3)) {        // same month and year
        value.innerText = `${startDate.split(" ")[0]} - ${endDate}`;
    } else if (start.split(" ")[2] == end.split(" ")[2]) {                          // same year
        value.innerText = `${startDate.split(" ").slice(0, 2)} - ${endDate}`;
    } else {
        value.innerText = `${startDate} - ${endDate}`;
    }
    document.getElementById("detailsList").append(property);
    document.getElementById("detailsList").append(value);
}

let parts = ["Anfang", "Mitte", "Ende"];
let months = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];

function translateReadDates(date) {
    let splitDate = date.split(" ");
    let part = parts[splitDate[0]];
    let month = months[splitDate[1] - 1];
    let year = splitDate[2];

    return `${part} ${month} ${year}`;
}

// eventListeners have to be added here instead of in the html because the function names are not available there due to module scope
document.getElementById("editButton").addEventListener('click', editBookDetails);

let index;

function editBookDetails() {
    /// TODO: open edit form
    /// replace old details: splice(start, deleteCount, item1):
    // bookList.books.splice(index, 1, newDetails);
    /// update json:
    // updateJSON();
}

async function updateJSON() {
    let booksJson = JSON.stringify(bookList);
    await writeTextFile(booksJsonPath, booksJson);
}
