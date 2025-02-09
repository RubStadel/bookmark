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
                    let property = document.createElement("h2");
                    property.innerText = "gelesen";
                    let value = document.createElement("p");
                    if (bookList.books[i]["angefangen"] == bookList.books[i]["beendet"]) {
                        value.innerText = bookList.books[i]["angefangen"];
                    } else {
                        value.innerText = `${bookList.books[i]["angefangen"]} - ${bookList.books[i]["beendet"]}`;
                    }
                    document.getElementById("detailsList").append(property);
                    document.getElementById("detailsList").append(value);
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
