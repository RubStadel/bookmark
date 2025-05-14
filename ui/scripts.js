"use strict";

const { invoke } = window.__TAURI__.core;
const { openUrl } = window.__TAURI__.opener;

// read the PrivateDir::Data/resources/books.json file and write the contents into the json list.
let bookList = "";
await invoke('read_file').then((fileContent) => bookList = JSON.parse(fileContent));

/// global variable definitions

let index;
let bookFormVisible = false;
let bookDetailsVisible = false;
let lastScrollTop = 0;
let lastY = 0;
let sorted = new Map();

const datalists = ["Autor", "Sprache", "Genre", "Reihe", "Land"];
const bottomElements = ["genre", "series", "releaseYear", "country", "notes"];
const parts = ["Anfang", "Mitte", "Ende"];
const months = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
const keys = { Titel: "title", Autor: "author", Sprache: "language", Ort: "location", Genre: "genre", Reihe: "series", Erscheinungsjahr: "releaseYear", Land: "country", Notizen: "notes" };
const alphabet = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", "ä", "ö", "ü"];
let sortingStates = new Map();
sortingStates.set(0, false)
    .set(1, false)
    .set(2, false)
    .set(3, false)
    .set(4, false)
    .set(5, false)
    .set(6, false)
    .set(7, false)
    .set(8, false);

sortByDate();

bookList.darkTheme = !bookList.darkTheme;
toggleColorScheme();

/// event listeners

// eventListeners have to be added here instead of in the html because the function names are not available there due to module scope
document.getElementById("menu").addEventListener('touchstart', revealMenu);
document.getElementById("menu").addEventListener('touchend', clickMenuButton);
document.getElementById("menu").addEventListener('touchmove', highlightMenu);
document.getElementById("editButton").addEventListener('click', toggleEditForm);
document.getElementById("bookList").addEventListener('touchmove', checkSearchBar);
document.getElementById("bookList").addEventListener('touchend', () => { lastScrollTop = document.getElementById("bookList").scrollTop; lastY = 0; });
document.getElementById("search").addEventListener('blur', hideSearchBar);
document.getElementById("sortBack").addEventListener('click', hideSortPopup);
document.getElementById("search").addEventListener('input', search);

// onclick functions of the sorting buttons
document.getElementById("chronologisch").addEventListener('click', () => { sortByDate("read", sortingStates.get(0)); sortingStates.set(0, !sortingStates.get(0)) });
document.getElementById("alphabetisch").addEventListener('click', () => { sortByLetter("Titel", sortingStates.get(1)); sortingStates.set(1, !sortingStates.get(1)) });
document.getElementById("Autor").addEventListener('click', () => { sortByLetter("Autor", sortingStates.get(2)); sortingStates.set(2, !sortingStates.get(2)) });
document.getElementById("Sprache").addEventListener('click', () => { sortByLetter("Sprache", sortingStates.get(3)); sortingStates.set(3, !sortingStates.get(3)) });
document.getElementById("Ort").addEventListener('click', () => { sortByLetter("Ort", sortingStates.get(4)); sortingStates.set(4, !sortingStates.get(4)) });
document.getElementById("Genre").addEventListener('click', () => { sortByLetter("Genre", sortingStates.get(5)); sortingStates.set(5, !sortingStates.get(5)) });
document.getElementById("Reihe").addEventListener('click', () => { sortByLetter("Reihe", sortingStates.get(6)); sortingStates.set(6, !sortingStates.get(6)) });
document.getElementById("Erscheinungsjahr").addEventListener('click', () => { sortByDate("release", sortingStates.get(7)); sortingStates.set(7, !sortingStates.get(7)) });
document.getElementById("Land").addEventListener('click', () => { sortByLetter("Land", sortingStates.get(8)); sortingStates.set(8, !sortingStates.get(8)) });

// move the book form up when focusing the lower elements so that the keyboard does not block them
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

    if (!sorted.size) {
        let text = document.createElement("h3");
        text.innerHTML = "klicken, um ein Buch <br>hinzuzufügen <br><br>oder <br><br>halten, um das ganze <br>Menü anzuzeigen";
        let arrow = document.createElement("span");
        arrow.innerHTML = "&#x219C;";
        document.getElementById("bookList").append(text, arrow);
        return;
    }

    for (let header of sorted.keys()) {
        let headerElement = document.createElement("h1");
        let count = document.createElement("small");
        headerElement.innerText = header;
        count.innerText = `( ${sorted.get(header).length} )`;
        headerElement.append(count);
        document.getElementById("bookList").append(headerElement);
        for (let entry of sorted.get(header)) {
            let book = document.createElement("button");
            book.innerText = entry[0];
            book.addEventListener("click", () => loadBookDetails(`${entry[0]}_${entry[1]}_${entry[2]}`));
            document.getElementById("bookList").append(book);
        }
    }
}

/**
 * Updates the json file by overwriting it with the contents of the json list.
 */
async function updateJSON() {
    let booksJson = JSON.stringify(bookList);
    invoke('edit_file', { contents: booksJson });
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

    for (let i = bookList.books.length - 1; i >= 0; i--) {
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
        let newEntry = newBook[datalists[i]];
        if (datalists[i] == "Reihe") {
            newEntry = newBook[datalists[i]].split(", ")[0];
        }
        if (newEntry && !bookList.datalists[key].find((entry) => entry == newEntry)) {
            bookList.datalists[key].push(newEntry);
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
        Titel: document.getElementById("title").value.trim(),
        Autor: document.getElementById("author").value.trim(),
        Sprache: document.getElementById("language").value.trim(),
        Ort: document.getElementById("location").value.trim(),
        angefangen: `${parts.indexOf(document.getElementById("startPart").value)} ${months.indexOf(document.getElementById("startMonth").value) + 1} ${document.getElementById("startYear").value}`,
        beendet: `${parts.indexOf(document.getElementById("endPart").value)} ${months.indexOf(document.getElementById("endMonth").value) + 1} ${document.getElementById("endYear").value}`,
        Genre: document.getElementById("genre").value.trim(),
        Reihe: document.getElementById("series").value.trim(),
        Erscheinungsjahr: document.getElementById("releaseYear").value,
        Land: document.getElementById("country").value.trim(),
        Notizen: document.getElementById("notes").value.trim()
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
async function addBook2List() {
    let book = getBookFromForm();

    if (!(book.Titel && book.Autor && book.Sprache && book.Ort && book.angefangen.slice(-1) != " " && book.beendet.slice(-1) != " ")) {
        return;
    }

    document.getElementById("bookForm").reset();

    let bookButton = document.createElement("button");
    bookButton.innerText = book.Titel;
    bookButton.addEventListener("click", () => loadBookDetails(`${book.Titel}_${book.Sprache}_${book.beendet.split(" ")[2]}`));
    document.getElementById("bookList").append(bookButton);

    sortJSON(book);

    await updateJSON();
    toggleBookForm();

    sortByDate();
}

/**
 * Toggles the color theme of the app between light and dark mode.
 * Looks up the set preference from the json file and toggles that value as well.
 */
function toggleColorScheme() {
    let root = document.querySelector(':root');
    let button = document.getElementById("colorSchemeButton");
    if (bookList.darkTheme) {
        root.style.setProperty('--black', 'white');
        root.style.setProperty('--white', 'black');
        root.style.setProperty('--gold', 'gold');
        root.style.setProperty('--transparent-black', 'rgba(255, 255, 255, 0.8)');
        root.style.setProperty('--grey', 'darkgrey');
        button.innerText = "Nachtmodus";
        let icon = document.createElement("ion-icon");
        icon.name = "moon-outline";
        button.append(icon);
    } else {
        root.style.setProperty('--black', 'black');
        root.style.setProperty('--white', 'white');
        root.style.setProperty('--gold', 'darkgoldenrod');
        root.style.setProperty('--transparent-black', 'rgba(0, 0, 0, 0.8)');
        root.style.setProperty('--grey', 'grey');
        button.innerText = "Tagmodus";
        let icon = document.createElement("ion-icon");
        icon.name = "sunny-outline";
        button.append(icon);
    }
    bookList.darkTheme = !bookList.darkTheme;
    updateJSON();
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
    if (y < 16.5) {
        button = 0;
    } else if (y < 43.5) {
        button = Math.floor((y - 16.5) / 4.5) + 1;
    } else {
        button = 7;
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
            element.style.color = "var(--white)";
            element.style.translate = "0vw 0";
        }
    );
}

/**
 * Activates the button the touch was released over.
 * @param {Event} e - touch event
 */
async function clickMenuButton(e) {
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
        case 4:
            toggleColorScheme();
            break;
        case 5:
            await importJSON();
            break;
        case 6:
            await invoke('copy_to_public_dir');
            alert("Die JSON wurde unter ~Documents/bookmark_exported.json gespeichert.")
            break;
        case 7:
            await openUrl("https://github.com/RubStadel/bookmark");
            break;
        default:
            break;
    }
    hideMenu();
}

/**
 * Checks if the user scrolled from the very top.
 * If so, the search bar is revealed.
 */
function checkSearchBar(e) {
    const { touches, changedTouches } = e.originalEvent ?? e;
    const touch = touches[0] ?? changedTouches[0];
    let y = touch.clientY;
    let scrollTop = document.getElementById("bookList").scrollTop;
    if (scrollTop == 0 && y > lastY && lastY != 0 && lastScrollTop == 0) {
        revealSearchBar();
    }
    lastY = y <= 0 ? 0 : y;
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
    document.getElementById("search").value = "";
}

/**
 * Performs a search through all entry fields of all books in the book list.
 * Clears the shown list of books and only re-adds those that match the search term somewhere in their entry.
 * 
 * Is called on every change of the users input in the search field.
 */
function search() {
    document.getElementById("bookList").replaceChildren();
    sorted = new Map();

    let searchText = document.getElementById("search").value.toLowerCase();
    for (let i = 0; i < bookList.books.length; i++) {
        Object.keys(bookList.books[i]).forEach(function (key) {
            if (!sorted.has(bookList.books[i].Titel)) {
                if (bookList.books[i][key].toLowerCase().includes(searchText)) {
                    let book = document.createElement("button");
                    book.innerText = bookList.books[i].Titel;
                    book.addEventListener("click", () => loadBookDetails(`${bookList.books[i].Titel}_${bookList.books[i].Sprache}_${bookList.books[i].beendet.split(" ")[2]}`));
                    document.getElementById("bookList").append(book);
                    sorted.set(bookList.books[i].Titel);
                }
            }
        });
    }

    window.androidBackCallback = sortByDate;
}

/**
 * Imports an existing JSON file by promting the user to select a file (via Rust Command).
 * The content of this file is checked for duplicates with the local JSON.
 * Any books or datalist options that do not already exist are added to the local JSON.
 * 
 * Shows an alert to the user to inform them how many books were imported.
 * Sorts and updates the local JSON and redraws the shown bookList via sortByDate().
 */
async function importJSON() {
    let imported = "";
    await invoke('import_json').then((fileContent) => { imported = JSON.parse(fileContent) });
    let count = 0;

    if (imported.books) {
        // books:
        let infoArray = [];
        for (let i = 0; i < bookList.books.length; i++) {
            infoArray.push(`${bookList.books[i].Titel}_${bookList.books[i].Sprache}_${bookList.books[i].beendet.split(" ")[2]}`);
        }
        for (let i = 0; i < imported.books.length; i++) {
            if (!infoArray.includes(`${imported.books[i].Titel}_${imported.books[i].Sprache}_${imported.books[i].beendet.split(" ")[2]}`)) {
                let bookButton = document.createElement("button");
                bookButton.innerText = imported.books[i].Titel;
                bookButton.addEventListener("click", () => loadBookDetails(`${imported.books[i].Titel}_${imported.books[i].Sprache}_${imported.books[i].beendet.split(" ")[2]}`));
                document.getElementById("bookList").append(bookButton);

                sortJSON(imported.books[i]);
                count++;
            }
        }
        // datalists:
        for (let i = 0; i < imported.datalists.length; i++) {
            for (let l = 0; l < bookList.datalists.length; l++) {
                for (let k = 0; k < imported.datalists[i].length; k++) {
                    if (!bookList.datalists[l].includes(imported.datalists[i][k])) {
                        bookList.datalists[l].push(imported.datalists[i][k]);
                    }
                }
            };
        };
        bookList.darkTheme = imported.darkTheme;

        await updateJSON();
        sortByDate();
    }
    alert(`Es wurden ${count} Bücher eingelesen.`);
}

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

// TODO: add possibility to have headers for individual months as well as years (only for "read") (?)

/**
 * Sorts the book list chronologically by writing title, language and endYear into the "sorted" map in order.
 * Then calls loadBookList() to add respective HTML elements for headers (years) and titles.
 * 
 * The loop for determining if the order is reversed is implemented branchlessly.
 * @param {string} date - which date to use; either "read" or "release"; defaults to "read"
 * @param {boolean} isReversed - whether to reverse the chronological order or not; defaults to false
 */
function sortByDate(date = "read", isReversed = false) {
    sorted = new Map();
    let yearList = [];
    for (let i = ((bookList.books.length) * !isReversed); i != (bookList.books.length * isReversed); i -= (1 - (2 * isReversed))) {
        let year = bookList.books[i - !isReversed].beendet.split(" ")[2];
        if (date == "release") {
            year = bookList.books[i - !isReversed].Erscheinungsjahr;
        }
        if (!sorted.has(year)) {
            sorted.set(year, "");
            yearList = [];
        } else {
            yearList = sorted.get(year);
        }
        yearList.push([bookList.books[i - !isReversed].Titel, bookList.books[i - !isReversed].Sprache, bookList.books[i - !isReversed].beendet.split(" ")[2]]);
        sorted.set(year, yearList);
    }
    if (date == "release") {
        sorted = sortChronologically(isReversed);
    }

    window.androidBackCallback = () => { return true };
    loadBookList();
}

/**
 * Sorts the entries in the "sorted" map in chronological order and returns the new map.
 * 
 * If the release year is not given, the book is added to the category "Unbekannt".
 * @param {boolean} isReversed - whether to reverse the chronological order or not; defaults to false
 * @returns chronologically sorted map
 */
function sortChronologically(isReversed = false) {
    let sortedChrono = new Map();
    let years = [];
    for (let year of sorted.keys()) {
        years.push(year);
    }
    years.sort();
    for (let i = ((years.length - 1) * !isReversed); i != (years.length * isReversed) - !isReversed; i -= (1 - (2 * isReversed))) {
        if (years[i]) {
            sortedChrono.set(years[i], sorted.get(years[i]));
        } else {
            sortedChrono.set("Unbekannt", sortAlphabeticallyArray(sorted.get(years[i])));
        }
    }
    return sortedChrono;
}

/**
 * Sorts the book list alphabetically by parameter (e.g. "Titel" or "Autor").
 * This is done by writing titles into the "sorted" map in arrays for each starting letter.
 * sortAlphabetically() is called to sort these arrays in alphabtical order.
 * Then calls loadBookList() to add respective HTML elements for headers (years) and titles.
 * @param {string} parameter - parameter of book detail to sort by (e.g. "Titel")
 * @param {boolean} isReversed - whether to reverse the alphabetical order or not; defaults to false
 */
function sortByLetter(parameter, isReversed = false) {
    sorted = new Map();
    let letterList = [];
    for (let i = 0; i <= (bookList.books.length - 1); i++) {
        let letter = bookList.books[i][parameter];
        if (parameter == "Titel") {
            letter = bookList.books[i][parameter][0].toUpperCase();
        } else if (parameter == "Reihe") {
            letter = bookList.books[i][parameter].split(", ")[0];
        }
        if (parameter == "Ort") {
            letter = bookList.books[i][parameter].split(", ");
            for (let tmp of letter) {
                if (!sorted.has(tmp)) {
                    sorted.set(tmp, "");
                    letterList = [];
                } else {
                    letterList = sorted.get(tmp);
                }
                letterList.push([bookList.books[i].Titel, bookList.books[i].Sprache, bookList.books[i].beendet.split(" ")[2]]);
                sorted.set(tmp, letterList);
            }
        } else {
            if (!sorted.has(letter)) {
                sorted.set(letter, "");
                letterList = [];
            } else {
                letterList = sorted.get(letter);
            }
            letterList.push([bookList.books[i].Titel, bookList.books[i].Sprache, bookList.books[i].beendet.split(" ")[2]]);
            sorted.set(letter, letterList);
        }
    }
    if (parameter == "Titel") {
        sorted = sortAlphabeticallyTitle(isReversed);
    } else {
        sorted = sortAlphabetically(parameter, isReversed);
    }

    loadBookList();
}

/**
 * Sorts the entries in the "sorted" map in alphabetical order and returns the new map.
 * This function is made specifically for sorting titles. For the other categories use sortAlphabetically().
 * 
 * All books whose title starts with a letter not defined in the alphabet (variable) is sorted into the category "Sonstige".
 * @param {boolean} isReversed - whether to reverse the alphabetical order or not; defaults to false
 * @returns alphabetically sorted map
 */
function sortAlphabeticallyTitle(isReversed = false) {
    let sortedAlpha = new Map();
    let others = [];
    for (let i = ((alphabet.length - 1) * isReversed); i != (alphabet.length * !isReversed) - isReversed; i -= (1 - (2 * !isReversed))) {
        if (isReversed && i == alphabet.length - 1) {
            for (let letter of sorted.keys()) {
                if (!alphabet.includes(letter.toLowerCase())) {
                    for (let entry of sorted.get(letter)) {
                        others.push(entry);
                    }
                    sortedAlpha.set("Sonstige", sortAlphabeticallyArray(others, index = 1));
                    sorted.delete(letter);
                }
            }
        }
        let letter = alphabet[i].toUpperCase();
        if (sorted.has(letter)) {
            sortedAlpha.set(letter, sortAlphabeticallyArray(sorted.get(letter), index = 1));
            sorted.delete(letter);
        }
    }
    for (let letter of sorted.keys()) {
        for (let entry of sorted.get(letter)) {
            others.push(entry);
        }
        sortedAlpha.set("Sonstige", sortAlphabeticallyArray(others, index = 1));
    }
    return sortedAlpha;
}

/**
 * Sorts the entries in the "sorted" map in alphabetical order and returns the new map.
 * 
 * All books where the category starts with a letter not defined in the alphabet (variable) is sorted into the category "Sonstige".
 * @param {string} parameter - parameter of book detail to sort by (e.g. "Titel"); defaults to ""
 * @param {boolean} isReversed - whether to reverse the alphabetical order or not; defaults to false
 * @returns alphabetically sorted map
 */
function sortAlphabetically(parameter = "", isReversed = false) {
    let sortedAlpha = new Map();
    let others = [];
    for (let i = ((alphabet.length - 1) * isReversed); i != (alphabet.length * !isReversed) - isReversed; i -= (1 - (2 * !isReversed))) {
        if (isReversed && i == alphabet.length - 1) {
            for (let letter of sorted.keys()) {
                if (!alphabet.includes(letter[0].toLowerCase())) {
                    for (let entry of sorted.get(letter)) {
                        others.push(entry);
                    }
                    sortedAlpha.set("Sonstige", sortAlphabeticallyArray(others));
                    sorted.delete(letter);
                }
            }
        }
        let letter = alphabet[i].toUpperCase();
        let letters = [];
        let match;
        for (let entry of sorted.keys()) {
            letters.push(entry);
        }
        if (parameter == "Autor" || parameter == "Sprache" || parameter == "Ort" || parameter == "Genre" || parameter == "Land" || parameter == "Reihe") {
            if (parameter == "Autor") {
                match = letters.filter((element) => element.split(" ")[element.split(" ").length - 1][0] == letter);
            } else {
                match = letters.filter((element) => element[0] == letter);
            }
            if (match) {
                for (let matched of match) {
                    if (parameter == "Reihe") {
                        sortedAlpha.set(matched, sortAscendingArray(sorted.get(matched)));
                    } else {
                        sortedAlpha.set(matched, sortAlphabeticallyArray(sorted.get(matched)));
                    }
                    sorted.delete(matched);
                }
            }
        } else {
            match = letters.find((element) => element[0] == letter);
            if (match) {
                sortedAlpha.set(match, sortAlphabeticallyArray(sorted.get(match)));
                sorted.delete(match);
            }
        }
    }
    for (let letter of sorted.keys()) {
        for (let entry of sorted.get(letter)) {
            others.push(entry);
        }
        sortedAlpha.set("Sonstige", sortAlphabeticallyArray(others));
    }
    return sortedAlpha;
}

/**
 * Sorts the given array according to the number in the series (ascending order) and returns the sorted array.
 * 
 * Used in sorting for the internal sorting of the book in a given header.
 * Entries that do not start with a letter defined in the alphabet (variable) are added to the end.
 * @param {string[]} array - array to be sorted
 * @returns sorted array
 */
function sortAscendingArray(array) {
    let titles = [];
    array.forEach((element) => titles.push(element[0]));

    let sortedArray = [];
    let sortedMap = new Map();
    let numbers = [];
    for (let i = 0; i < bookList.books.length; i++) {
        if (!titles.includes(bookList.books[i].Titel)) {
            continue
        }
        numbers.push(bookList.books[i].Reihe.split(", ")[1]);
        sortedMap.set(bookList.books[i].Reihe.split(", ")[1], [bookList.books[i].Titel, bookList.books[i].Sprache, bookList.books[i].beendet.split(" ")[2]]);
    }
    numbers.sort();
    for (let entry of numbers) {
        sortedArray.push(sortedMap.get(entry));
    }

    return sortedArray;
}

/**
 * Sorts the given array alphabetically (for either the first or the second letter in the title) and returns the sorted array.
 * 
 * Used in sorting for the internal sorting of the book in a given header.
 * Entries whose second letter is not a letter defined in the alphabet (variable) are added to the end.
 * @param {string[]} array - array to be sorted
 * @param {number} [index=0] - index of the letter to sort for; defaults to 0 (first letter)
 * @returns sorted array
 */
function sortAlphabeticallyArray(array, index = 0) {
    let sortedArray = [];
    for (let i = 0; i < alphabet.length; i++) {
        let match = array.filter((element) => element[0][index].toLowerCase() == alphabet[i]);
        if (match.length) {
            for (let entry of match) {
                sortedArray.push(entry);
                array.splice(array.indexOf(entry), 1);
            }
        }
    }
    for (let entry of array) {
        sortedArray.push(entry);
    }
    return sortedArray;
}

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
function loadBookDetails(info) {
    openBookDetails();
    document.getElementById("detailsList").replaceChildren();

    for (let i = 0; i < bookList.books.length; i++) {
        if (`${bookList.books[i].Titel}_${bookList.books[i].Sprache}_${bookList.books[i].beendet.split(" ")[2]}` != info) {
            continue
        }
        index = i;
        Object.keys(bookList.books[i]).forEach(async function (key) {
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
        formDiv.style.top = "-250%";
        bookFormVisible = false;
        document.getElementById("editButton").style.opacity = "1";
        document.getElementById("bookDetails").style.top = "0%";
    } else {
        setTimeout(() => { document.getElementById("bookDetails").style.top = "-75%"; }, 500);
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
    document.getElementById("bookFormDiv").style.top = "-250%";
    document.getElementById("bookForm").reset();
    bookFormVisible = false;

    window.androidBackCallback = () => { return true };
    if (bookDetailsVisible) {
        window.androidBackCallback = closeBookDetails;
        document.getElementById("bookDetails").style.top = "0%";
        document.getElementById("editButton").style.opacity = "1";
    } else {
        document.getElementById("menuButton").style.opacity = "1";
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

/**
 * Updates the detail information on the book that has been edited (if all required fields still contain values).
 * Updates the json file and closes the edit form.
 */
function editBookDetails() {
    let book = getBookFromForm();

    if (!(book.Titel && book.Autor && book.Sprache && book.Ort && book.angefangen.slice(-1) != " " && book.beendet.slice(-1) != " ")) {
        return;
    }

    document.getElementById("bookForm").reset();

    bookList.books = bookList.books.filter(bookElement => bookList.books.indexOf(bookElement) != index);

    sortJSON(book);
    updateJSON();

    loadBookDetails(`${book.Titel}_${book.Sprache}_${book.beendet.split(" ")[2]}`);
    toggleEditForm();
    sortByDate();
    window.androidBackCallback = closeBookDetails;
}
