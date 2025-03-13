"use strict";

// import filesystem access from the Tauri API
// https://v2.tauri.app/plugin/file-system/#permissions
const { resolveResource } = window.__TAURI__.path;
const { readTextFile, writeTextFile } = window.__TAURI__.fs;

// read the text file in the `$RESOURCE/resources/books.json` path and write the contents into the json list.
const booksJsonPath = await resolveResource('resources/books.json');
const bookList = JSON.parse(await readTextFile(booksJsonPath));

/// global variable definitions

let index;
let bookFormVisible = false;
let bookDetailsVisible = false;
let lastScrollTop = 0;
let sorted = [];
// let sorted = [
//     {
//         "2025": [
//             "test1",
//             "test2"
//         ]
//     },
//     {
//         "2024": [
//             "test3"
//         ]
//     }
// ];

let datalists = ["Autor", "Sprache", "Genre", "Reihe", "Land"];
let bottomElements = ["genre", "series", "releaseYear", "country", "notes"];
let parts = ["Anfang", "Mitte", "Ende"];
let months = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
let keys = { Titel: "title", Autor: "author", Sprache: "language", Ort: "location", Genre: "genre", Reihe: "series", Erscheinungsjahr: "releaseYear", Land: "country", Notizen: "notes" };
let alphabet = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "ä", "ö", "ü"];

sortChronologically();

/// event listeners

// eventListeners have to be added here instead of in the html because the function names are not available there due to module scope
document.getElementById("menu").addEventListener('touchstart', revealMenu);
document.getElementById("menu").addEventListener('touchend', clickMenuButton);
document.getElementById("menu").addEventListener('touchmove', highlightMenu);
document.getElementById("editButton").addEventListener('click', toggleEditForm);
document.getElementById("bookList").addEventListener('scroll', checkSearchBar);
document.getElementById("search").addEventListener("blur", hideSearchBar);
document.getElementById("sortBack").addEventListener("click", hideSortPopup)

// move the book form up when focuseing the lower elements so that the keyboard does not block them
for (let i = 0; i < bottomElements.length; i++) {
    document.getElementById(bottomElements[i]).addEventListener('focus', () => { scrollForm(10 * (i + 1)) });
    document.getElementById(bottomElements[i]).addEventListener('blur', resetFormHeight);
}

// for testing on windows only ((very limited) support for mouse input)
document.getElementById("menuButton").addEventListener('click', toggleBookForm);

/// function definitions

/**
 * Loads the books from the json list into the book list.
 * 
 * Adds h1 headers for each year that a book has been read in.
 * Each book is represented as a button in the list. When clicking on this button, the detail page is opened.
 */
function loadBookList() {
    document.getElementById("bookList").replaceChildren();

    for (let headerObject of sorted) {
        Object.keys(headerObject).forEach(function (header) {
            let headerElement = document.createElement("h1");
            headerElement.innerText = header;
            document.getElementById("bookList").append(headerElement);

            for (let entry of headerObject[header]) {
                let book = document.createElement("button");
                book.innerText = entry;
                book.addEventListener("click", () => loadBookDetails(entry));
                document.getElementById("bookList").append(book);
            }
        });
    }
}

/**
 * Updates the json file by overwriting it with the contents of the json list.
 */
async function updateJSON() {
    let booksJson = JSON.stringify(bookList);
    await writeTextFile(booksJsonPath, booksJson);
}

/**
 * Sorts the json file chronological order by comparing their read dates.
 * 
 * Does not write to the json file directly. updateJSON() has to be called afterwards!
 * @param {object} book - object containing the books details
 */
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

/**
 * Toggles the book form for adding details of a new book.
 * 
 * Loads the datalist options from the json file for the datalist tags.
 * Puts focus on the top-most input element (title).
 */
function toggleBookForm() {
    let formDiv = document.getElementById("bookFormDiv");
    if (bookFormVisible) {
        formDiv.style.top = "-250%";
        bookFormVisible = false;
        document.getElementById("menuButton").style.opacity = "1";
    } else {
        formDiv.style.top = "0%";
        bookFormVisible = true;
        readDatalistOptions();
        document.getElementById("title").focus();
        document.getElementById("menuButton").style.opacity = "0";
        document.getElementById("submitButton").addEventListener('click', addBook2List);
        window.androidBackCallback = closeForm;
    }
}

/**
 * Adds the options for the datalist tags in the book form by reading them from the json file.
 */
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

/**
 * Updates the datalist options in the json file.
 * 
 * If a new entry has been made in a datalist element, that string is added to the datalists list in the json file.
 * @param {object} newBook - object containing the details of the newly added book
 */
function updateDatalistOptions(newBook) {
    let i = 0;
    Object.keys(bookList.datalists).forEach(function (key) {
        if (newBook[datalists[i]] && !bookList.datalists[key].find((entry) => entry == newBook[datalists[i]])) {
            bookList.datalists[key].push(newBook[datalists[i]]);
        }
        i++;
    });
}

/**
 * Gathers the details put into the book form and returns them in the form of an object.
 * @returns object containing the details of the new book
 */
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

/**
 * Adds the new book to the book list.
 * 
 * Checks if all required fields have been provided and if so, resets the form.
 * Adds a new button to the book list that opens the detail page for that book when clicked on.
 * Determines the position of the new book in the book list and inserts it so that the list is chronologically sorted.
 * Writes the sorted book list into the json file.
 * Reloads the json list and re-builds the book list, now including the newly added book.
 */
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

    sortChronologically();
    // loadBookList();  // TODO: test functionality and remove if possible
}

/**
 * Reveals the menu buttons in an animation and rotates the icon on the menu button.
 */
function revealMenu() {
    resetButtonHighlight();
    let buttons = document.getElementsByClassName("menuButtons");
    let k = 5;
    buttons[0].style.transform = "rotate(0deg)";
    for (let i = 1; i < buttons.length; i++) {
        buttons[i].style.opacity = "1";
        k += 5;
        buttons[i].style.transform = "translateY(-" + k + "vh)";
    }
    document.getElementById("bookList").style.opacity = "0.2";
}

/**
 * Hides the menu buttons and rotates the icon on the menu button.
 */
function hideMenu() {
    let buttons = document.getElementsByClassName("menuButtons");
    buttons[0].style.transform = "rotate(45deg)";
    for (let i = 1; i < buttons.length; i++) {
        buttons[i].style.opacity = "0";
        buttons[i].style.transform = "none";
    }
    document.getElementById("bookList").style.opacity = "1";
}

/**
 * Identifies and highlights the menu button that the user is hovering over.
 * If the user is hovering over the menu button, nothing is highlighted.
 * Used as the touchmove eventListener of the menu.
 * @param {Event} e - touch event
 */
function highlightMenu(e) {
    let button = identifyMenuButton(e);

    if (button) {
        highlightButton(button);
    } else {
        resetButtonHighlight();
    }
}

/**
 * Identifies the menu button the user is hovering over by evaluating the position of the current touch event.
 * Values are hardcoded based on empirical findings on my personal phone (there is a weird offset at the bottom).
 * @param {Event} e - touch event
 * @returns {number} button - index of the hovered over button in the menu
 */
function identifyMenuButton(e) {
    const { touches, changedTouches } = e.originalEvent ?? e;
    const touch = touches[0] ?? changedTouches[0];
    let y = touch.clientY;

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

/**
 * Highlights the button the user is hovering over by translating it horizontally and changing the color to gold.
 * @param {number} button - index of the hovered over button in the menu
 */
function highlightButton(button) {
    resetButtonHighlight();
    let b = document.getElementsByClassName("menuButtons").item(button);
    b.style.color = "gold";
    b.style.translate = "-10vw 0";
}

/**
 * Resets the button color and horizontal translation for all menu buttons.
 */
function resetButtonHighlight() {
    Array.from(document.getElementsByClassName("menuButtons")).forEach(
        function (element) {
            element.style.color = "white";
            element.style.translate = "0vw 0";
        }
    );
}

/**
 * Activates the button the touch was released over.
 * @param {Event} e - touch event
 */
function clickMenuButton(e) {
    let button = identifyMenuButton(e);

    switch (button) {
        case 1:
            toggleBookForm();
            break;
        case 2:
            revealSearchBar();
            break;
        case 3:
            openSortPopup();
            break;
        // case 4:      // FIXME: change to open settings page when ready
        //     sortByLetter("Titel", true);    // (useful for testing purposes !)
        //     break;
        default:
            break;
    }
    hideMenu();
}

/**
 * Checks if the user scrolled from the very top.
 * If so, the search bar is revealed.
 */
function checkSearchBar() {
    let scrollTop = document.getElementById("bookList").scrollTop;
    if (scrollTop < lastScrollTop && scrollTop == 0) {
        revealSearchBar();
    }
    lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
}

/**
 * Reveals the search bar by moving it down into the visible area.
 * The book list has to be moved down as well to avoid oclusion by overlap.
 * Also hides the menu button by turning its opacity to zero.
 */
function revealSearchBar() {
    document.getElementById("search").innerText = "";
    document.getElementById("search").style.top = "2vh";
    document.getElementById("bookList").style.paddingTop = "6vh";
    document.getElementById("menuButton").style.opacity = "0";
    document.getElementById("search").focus();
}

/**
 * Hides the search bar by moving it up off screen.
 */
function hideSearchBar() {
    document.getElementById("search").style.top = "-5vh";
    document.getElementById("bookList").style.paddingTop = "0vh";
    document.getElementById("menuButton").style.opacity = "1";
}

// TODO: add search functionaltiy

/**
 * Scrolls the book form up forcibly by moving some of it out of screen.
 * @param {number} top - percentage that the form is moved up by
 */
function scrollForm(top) {
    document.getElementById("bookFormDiv").style.height = "150%";
    document.getElementById("bookFormDiv").style.top = `-${top}%`;
}

/**
 * Resets the book form to its original height and scroll position after being forced up to prevent the keyboard from covering form elements.
 * Called when form elements are not focused anymore (blurred).
 */
function resetFormHeight() {
    document.getElementById("bookFormDiv").style.height = "100%";
    document.getElementById("bookFormDiv").style.top = "0%";
}

/**
 * Opens the pop-up in which the sorting category is selected.
 * Sets the android back button function to close the pop-up.
 */
function openSortPopup() {
    document.getElementById("sortBack").style.top = "0vh";
    document.getElementById("sortPopup").style.border = "2px solid gray";
    document.getElementById("sortPopup").style.top = "20vh";
    for (let button of document.getElementsByClassName("sortButtons")) {
        button.style.opacity = "1";
    }
    window.androidBackCallback = hideSortPopup;
}

/**
 * Closes the pop-up in which the sorting category is selected.
 * Resets the android back button function to closing the app.
 */
function hideSortPopup() {
    document.getElementById("sortBack").style.top = "-150vh";
    document.getElementById("sortPopup").style.border = "none";
    document.getElementById("sortPopup").style.top = "-150vh";
    for (let button of document.getElementsByClassName("sortButtons")) {
        button.style.opacity = "0";
    }
    window.androidBackCallback = () => { return true };
}

/// sorting functions

/**
 * Sorts the book list chronologically by writing titles into the "sorted" array in order.
 * Then calls loadBookList() to add respective HTML elements for headers (years) and titles.
 * 
 * The loop for determining if the order is reversed is implemented branchlessly.
 * @param {boolean} isReversed - whether to reverse the chronological order or not; defaults to false
 */
function sortChronologically(isReversed = false) {
    sorted = [];
    let headerIndex = -1;
    let headerKey = "";
    let year = 0;
    for (let i = ((bookList.books.length) * !isReversed); i != (bookList.books.length * isReversed); i -= (1 - (2 * isReversed))) {
        let endYear = bookList.books[i - !isReversed].beendet.split(" ")[2];
        if (endYear != year) {
            let headerObject = {};
            headerObject[endYear] = [];
            sorted.push(headerObject);
            year = endYear;
            headerIndex++;
            headerKey = endYear;
        }

        let tmp = sorted[headerIndex];
        tmp[headerKey].push(bookList.books[i - !isReversed].Titel);
        sorted[headerIndex] = tmp;
    }
    loadBookList();
}

/**
 * Sorts the book list alphabetically by parameter (e.g. "Titel" or "Autor").
 * This is done by writing titles into the "sorted" array in lists for each starting letter.
 * sortAlphabetically() is called to sort these lists in alphabtical order.
 * Then calls loadBookList() to add respective HTML elements for headers (years) and titles.
 * @param {string} parameter - parameter of book detail to sort by (e.g. "Titel")
 * @param {boolean} isReversed - whether to reverse the alphabetical order or not; defaults to false
 */
function sortByLetter(parameter, isReversed = false) {
    sorted = [];
    let letters = [];
    let headerIndex = -1;

    let currentLetter = "";
    for (let i = 0; i <= (bookList.books.length - 1); i++) {
        let letter = bookList.books[i][parameter][0].toLowerCase();
        if (letter != currentLetter) {
            if (letters.includes(letter)) {
                headerIndex = letters.indexOf(letter);
            } else {
                let headerObject = {};
                headerObject[letter] = [];
                sorted.push(headerObject);
                headerIndex = sorted.length - 1;
            }
            currentLetter = letter;
            letters.push(letter);
        }
        let tmp = sorted[headerIndex];
        tmp[letter].push(bookList.books[i].Titel);
        sorted[headerIndex] = tmp;
    }
    sorted = sortAlphabetically(letters, isReversed);

    loadBookList();
}

/**
 * Sorts the objects in the "sorted" array in alphabetical order and returns the new array.
 * 
 * All books whose title starts with a letter not defined in the alphabet (variable) is sorted into the category "Sonstige".
 * @param {string[]} letters - list of letters for which titles exist in the book list
 * @param {boolean} isReversed - whether to reverse the alphabetical order or not; defaults to false
 * @returns alphabetically sorted array
 */
function sortAlphabetically(letters, isReversed = false) {
    let sortedAlpha = [];
    let headerIndex = -1;
    let headerObject = {};

    for (let i = ((alphabet.length) * isReversed); i != (alphabet.length * !isReversed); i -= (1 - (2 * !isReversed))) {
        let letter = alphabet[i];
        if (letters.includes(letter)) {
            headerObject = {};
            headerObject[letter.toUpperCase()] = [];
            sortedAlpha.push(headerObject);
            headerIndex = sortedAlpha.length - 1;

            let tmp = sortedAlpha[headerIndex];
            let sortedObject = sorted.find((element) => element[letter] != undefined);
            Object.keys(sortedObject).forEach(function (header) {
                for (let entry of sortedObject[header]) {
                    tmp[letter.toUpperCase()].push(entry);
                    sortedAlpha[headerIndex] = tmp;
                }
            });
            letters = letters.filter((lettersLetter) => lettersLetter != letter);
        }
    }

    if (letters != "") {
        headerObject = {};
        headerObject["Sonstige"] = [];
        sortedAlpha.push(headerObject);
        headerIndex = sortedAlpha.length - 1;

        let tmp = sortedAlpha[headerIndex];
        for (let letter of letters) {
            let sortedObject = sorted.find((element) => element[letter] != undefined);
            Object.keys(sortedObject).forEach(function (header) {
                for (let entry of sortedObject[header]) {
                    tmp["Sonstige"].push(entry);
                    sortedAlpha[headerIndex] = tmp;
                }
            });
        }
        if (isReversed) {
            sortedAlpha.splice(0, 0, {});
            sortedAlpha[0] = sortedAlpha.pop();
        }
    }

    return sortedAlpha;
}

// TODO: implement other sorting methods
// TODO: assign sorting functions to buttons in sortPopup

// let sorted = [
//     {
//         "2025": [
//             "test1",
//             "test2"
//         ]
//     },
//     {
//         "2024": [
//             "test3"
//         ]
//     },
//     {
//         "c": [
//             "Children of Time",
//             "Children of Ruin"
//             "Children of Memory"
//         ]
//     }
// ];

/// bookDetails "page"

/**
 * Opens the bookDetails "page".
 * Sets closeBookDetails as the functionality for when the android back button is activated.
 */
function openBookDetails() {
    document.getElementById("bookDetails").style.right = "0%";
    document.getElementById("menuButton").style.opacity = "0";
    bookDetailsVisible = true;
    window.androidBackCallback = closeBookDetails;
}

/**
 * Closes the bookDetails "page".
 * @returns always false so that the default android back function will be prevented
 */
function closeBookDetails() {
    document.getElementById("bookDetails").style.right = "150%";
    document.getElementById("menuButton").style.opacity = "1";
    bookDetailsVisible = false;
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
                    if (key == "Notizen") {
                        value.style.width = "85%";
                        value.style.textAlign = "justify";
                    }
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
        window.androidBackCallback = closeForm;
    }
}

/**
 * Closes the book form no matter which function it took (new book vs. edit).
 * Resets the android back button callback to the correct functionality based on whether or not the bookDetails "page" is visible.
 */
function closeForm() {
    document.getElementById("bookFormDiv").style.top = "-150%";
    bookFormVisible = false;
    document.getElementById("editButton").style.opacity = "1";
    document.getElementById("menuButton").style.opacity = "1";

    window.androidBackCallback = () => { return true };
    if (bookDetailsVisible) {
        window.androidBackCallback = closeBookDetails;
    }

    return false;
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
