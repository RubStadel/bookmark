"use strict";

// import filesystem access from the Tauri API
// https://v2.tauri.app/plugin/file-system/#permissions
const { resolveResource } = window.__TAURI__.path;
const { readTextFile, writeTextFile } = window.__TAURI__.fs;

// Read the text file in the `$RESOURCE/resources/books.json` path
const booksJsonPath = await resolveResource('resources/books.json');
const bookList = JSON.parse(await readTextFile(booksJsonPath));

loadBookList();

let newYearAdded = false;
let menuIsVisible = false;

// eventListeners have to be added here instead of in the html because the function names are not available there due to module scope
document.getElementById("menuButton").addEventListener('click', revealMenu);
document.getElementsByClassName("menuButtons").item(1).addEventListener('click', addBook2List);

function loadBookList() {
    for (let i = 0; i < bookList.books.length; i++) {
        let book = document.createElement("button");
        book.innerText = bookList.books[i].title;
        book.addEventListener("click", revealMenu); // TODO: replace revealMenu() with opening of book-specific detail page
        document.getElementById("bookList").append(book);
    }
}

async function updateJSON() {
    let booksJson = JSON.stringify(bookList);
    await writeTextFile(booksJsonPath, booksJson);
}

function addYear2List() {
    if (newYearAdded) {
        return;
    }

    let year = document.createElement("h1");
    year.innerText = "2025";
    document.getElementById("bookList").append(year);

    newYearAdded = true;
}

function addBook2List() {
    addYear2List();

    bookList.books.push({ title: "Children of Memory", author: "Adrian Tchaikovsky" }); // TODO: replace with option to insert detail information about the new book
    let book = document.createElement("button");
    book.innerText = bookList.books.slice(-1)[0].title;
    document.getElementById("bookList").append(book);

    updateJSON();

    revealMenu();
}

function revealMenu() {
    let buttons = document.getElementsByClassName("menuButtons");
    if (menuIsVisible) {
        buttons[0].style.transform = "rotate(45deg)";
        for (let i = 1; i < buttons.length; i++) {
            buttons[i].style.opacity = "0";
            buttons[i].style.transform = "none";
        }
        menuIsVisible = false;
    } else {
        let k = 7.5;
        buttons[0].style.transform = "rotate(0deg)";
        for (let i = 1; i < buttons.length; i++) {
            buttons[i].style.opacity = "1";
            k += 5;
            buttons[i].style.transform = "translateY(-" + k + "vh)";
        }
        menuIsVisible = true;
    }
}