# bookmark

A minimalistic mobile app that acts as a filterable list of the books I have read.  
Intended as a convenient way to remember certain books and the memories associated with reading them.

Built in Tauri v2 (which currently does not support multipage apps and can't show local pictures) using JS as the frontend and some Rust commands in the backend for handling the local database.
A locally saved JSON file is used as the database as not to require an internet connection.  
Currently only built and tested on Android.  
Currently only built in German!

---

## Usage

The app supports:

- displaying detail information for a book including the following fields:

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
- adding new books to the list
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
- importing and exporting the JSON file (database)

![Showcase functionalities of the app](./resources/bookmark.gif)
