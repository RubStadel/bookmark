"use strict";

let bookList = ["Children of Time", "Children of Ruin", "Children of Memory", "South of the Border, West of the Sun", "Norwegian Wood"];
let newYearAdded = false;
let menuIsVisible = false;

function loadBookList() {
    for (let i = 0; i < bookList.length; i++) {
        let book = document.createElement("p");
        book.innerText = bookList[i];
        document.getElementById("bookList").append(book);
    }
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

    bookList.push("test");
    let book = document.createElement("p");
    book.innerText = bookList.slice(-1);
    document.getElementById("bookList").append(book);

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