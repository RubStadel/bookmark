# bookmark

A minimalistic mobile app that acts as a filterable list of the books you have read.  
Intended as a convenient way to remember certain books and the memories associated with reading them.

Built in Tauri v2 (which currently does not support multipage apps and can't show local pictures) using JS as the frontend and some Rust commands in the backend for handling the local database.
A locally saved JSON file is used as the database as not to require an internet connection.  
Currently only built and tested on Android.  
Currently only built in German!

---

## Usage

The app supports:

- adding books to the list
- displaying detailed information for a book including the following fields:

  - title
  - author
  - language
  - location
  - starting date
  - ending date
  - genre
  - series
  - release year
  - country (of origin of author)
- editing the given information for a book
- searching the list (all fields of a book entry)
- sorting the list (also reversable):

  - chronologically
  - alphabetically
  - by author
  - by language
  - by location
  - by genre
  - by series
  - by release year
  - by country
- switching between light and dark mode
- importing and exporting the JSON file (useful when switching phones)

### Showcase

![Showcase functionalities of the app](./resources/bookmark.gif)

## Example JSON file (database)

````json
{
  "books": [
    {
      "Titel": "Buch 1",
      "Autor": "Max Mustermann",
      "Sprache": "Deutsch",
      "Ort": "Musterstadt",
      "angefangen": "2 6 2025",
      "beendet": "2 6 2025",
      "Genre": "Sachbuch",
      "Reihe": "Beispiele, 1",
      "Erscheinungsjahr": "2025",
      "Land": "Deutschland",
      "Notizen": ""
    },
    {...}
  ],
  "datalists": {
    "authors": [
      "Max Mustermann",
      ...
    ],
    "languages": [
      "Deutsch"
    ],
    "genres": [
      "Sachbuch"
    ],
    "seriesDatalist": [
      "Beispiele"
    ],
    "countries": [
      "Deutschland"
    ]
  },
  "darkTheme": true
}
````
