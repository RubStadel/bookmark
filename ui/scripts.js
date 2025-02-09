"use strict";

// import filesystem access from the Tauri API
// https://v2.tauri.app/plugin/file-system/#permissions
const { resolveResource } = window.__TAURI__.path;
const { readTextFile, writeTextFile } = window.__TAURI__.fs;
const { Window } = window.__TAURI__.window;
const { Webview } = window.__TAURI__.webview;
const { WebviewWindow } = window.__TAURI__.webviewWindow;
const { invoke } = window.__TAURI__.core;

// Read the text file in the `$RESOURCE/resources/books.json` path
const booksJsonPath = await resolveResource('resources/books.json');
const bookList = JSON.parse(await readTextFile(booksJsonPath));

loadBookList();

let newYearAdded = false;

// eventListeners have to be added here instead of in the html because the function names are not available there due to module scope
document.getElementById("menu").addEventListener('touchstart', revealMenu);
document.getElementById("menu").addEventListener('touchend', clickMenuButton);
document.getElementById("menu").addEventListener('touchmove', highlightMenu);

// for testing purposes on windows only ((very limited) support for mouse input)
document.getElementById("menuButton").addEventListener('click', newWindowCommand);

function loadBookList() {
    for (let i = 0; i < bookList.books.length; i++) {
        let book = document.createElement("button");
        book.innerText = bookList.books[i].title;
        // book.addEventListener("click", revealMenu); // TODO: replace revealMenu() with opening of book-specific detail page
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
    book.addEventListener("click", revealMenu);
    document.getElementById("bookList").append(book);

    updateJSON();
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
            addBook2List();
            break;

        default:
            break;
    }
    hideMenu();
}

/// Create new WebviewWindow on mobile
async function newWindowCommand() {
    await invoke("create_window", { config: 1 });
    /// alternatively:
    // window.location.href = "index2.html";
}
