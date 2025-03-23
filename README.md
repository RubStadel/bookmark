# bookmark

Android app to remember which books I read when and where to refresh my memories.

Also used as a testrun for app development using Tauri (Rust) and a JS, HTML, CSS frontend.

---

## Notizen

- **Erst Funktionalität erstellen, dann Aussehen/Design/Frontend optimieren!**

- am Anfang ganze Datenbank (aus json) einlesen (statt on-demand das zu holen, was gerade benötigt wird)

- Datenbank wird aus "resources/books.json" gelesen und in "target/debug/resources/books.json" kopiert

- beim Öffnen Animation wie Buch durchgeblättert wird und/oder wie Bücher in Regal sortiert werden (?)
- dabei wird lokale "Datenbank" gelesen (json-Datei) oder neu erstellt, wenn nicht vorhanden
- Grid aller Bücher, standardmäßig umgekehrt chronologisch sortiert, in der die Titel stehen und das Cover (in der Sichtbarkeit gedämpft) zu sehen ist
- beim Hovern wird Cover komplett sichtbar
- wenn man auf ein Buch klickt, wird das Cover sichtbar und groß. Beim Klicken auf das Cover direkt öffnet sich das Cover fullscreen, von wo man nach unten scrollen kann, um Infos zu sehen. Wird auf den Titel geklickt, kommt das Cover teilweise verdeckt und die ersten Infos sind direkt sichtbar
- Bücher sind nach Chronologie, Genre, Titel, Autor, Ort usw. sortierbar
- Genres können selbst definiert werden und werden dann in eine Liste geschrieben, damit man diese auch für andere Bücher anwenden kann
- Cover-Bilder können manuell hochgeladen werden
- können mehrere Bilder (des physischen Buches/Einbands) hinzugefügt werden?
- (alternative) minimalistische Ansicht, wo nur Titel in einer Liste angezeigt werden
- jedes Buch hat folgende Felder:
  - Autor
  - Titel
  - Erscheinungsjahr
  - wo wurde es gelesen (auch gekauft/erhalten); freie Eingabe
  - wann wurde es gelesen (freie Eingabe für grobe Angaben oder genaue Daten)
  - Genre (Radio mit Möglichkeit eigene hinzuzufügen)
  - Herkunftsland des Autors
  - Sprache in der es gelesen wurde
  - Bewertung (?)
  - Zugehörigkeit (bei Reihen)
  - Notizen (freie Eingabe für z.B. besondere Stellen, Zitate, äußere Begebenheiten, die es besonders gemacht haben, etc.)

- Bücher ohne Enddatum werden als angefangen markiert (gelber Punkt oder offenes Buch-Icon daneben). Die sind oben angeheftet (?)
- Daten (für Anfang und Abschluss) werden in drei Teilen angegeben: (Anfang | Mitte | Ende | unbekannt/" "), Monat, Jahr.
- Wenn Anfang == Ende, dann nur einmal anzeigen z.B. nur gelesen in "Mitte Oktober 2024" statt gelesen "Mitte Oktober - Mitte Oktober 2024"

- Hinzugefügte Bilder werden in dedizierten Ordner kopiert. Für Bilder wird der relative Pfad in der json gespeichert. Dann werden die Bilder geladen, wenn Detaildaten eingeholt werden.

## ToDo

### Grundlegende Features

- [x] am Anfang ganze Datenbank aus json einlesen
- [x] Testen auf Android Studio (virtuelles Android-Gerät) ermöglichen
- [x] Testen auf Android-Gerät ermöglichen (in Android Developer Einstellungen USB-Debugging erlauben, dann `cargo tauri android dev`)
- [x] Seitenmanagement (WebviewWindow) in Tauri anschauen/ausprobieren (via Rust Command: [Rust Documentation for WebviewWindowBuilder](https://docs.rs/tauri/2.2.5/tauri/webview/struct.WebviewWindowBuilder.html "current (v2), also works for Android"))
- [x] Sicherstellen, dass man beim Drücken des Android-Back-Buttons zur vorherigen Seite zurückkehrt (via Kotlin-Plugin: [Doku](https://v2.tauri.app/develop/plugins/develop-mobile/), [GitHub-Issue](https://github.com/tauri-apps/tauri/issues/8142))
- [x] Möglichkeit Bücher in der Datenbank zu sortieren (in JS oder Rust?) (<https://stackoverflow.com/a/1069840>)
- [x] Sortierkategorien (z.B. Jahre) als Zwischenüberschriften in der Liste anzeigen
- [x] Suche von Schlagworten (mit RegEx?; mit JS oder Rust?)
- [x] Möglichkeit neue Kategorien (Suche, Sortierung, Genre, etc.) zu Auswahlliste hinzuzufügen
- [ ] Einfügen von Bildern für Bücher (inkl. Kopieren in Unterordner)
- [ ] Entfernen von Bildern aus dem Unterordner (und json)
- [ ] Anzeige von Bildern auf der Detailseite von Büchern
- [ ] Testinstallation, um herauszufinden, wo Daten in Android gespeichert werden (so, dass man darauf zugreifen kann)

### Bugfixes

- [x] Sicherstellen, dass man Eingabebereiche sehen kann (nicht von der Android-Tastatur verdeckt)
- [x] Sicherstellen, dass das Halten des Menüknopfes nicht die Bücherliste scrollt (overflow: scroll)
- [x] Sicherstellen, dass die Outfit-Schriftart für die Bücherliste verwendet wird (CSS-Selektor * für alle Texte)
- [x] Sicherstellen, dass der Editierknopf nicht mit den Notizen kollidiert (Knopf verkleinern und weiter an die Seite schieben)
- [x] Sicherstellen, dass die Suchleiste nur angezeigt wird, wenn nach unten gescrollt wird
- [x] Sortierfunktionen umschreiben, sodass sorted eine Map ist, damit der Code wenigstens einigermaßen lesbar ist
- [x] Sicherstellen, dass die Suchleiste nur angezeigt wird, wenn man ganz oben anfängt (nicht auch beim langen Scrollen nach oben, wenn man schon losgelassen hat)
- [ ] Testen der Edit-Form: Sicherstellen,
  - dass bisherige Inhalte richtig übernommen werden
  - dass beim Schließen der richtige Knopf eingeblendet wird
  - dass Notizen nicht unten überstehen (south of the Border, West of the Sun)

### UI (Seiten, etc.)

- [x] Liste der Bücher in der Datenbank
- [x] Eingabefenster für neue Bücher, die der Datenbank hinzugefügt werden
- [x] Eingabefenster für das Anpassen eines Buches (von bookDetails kommend)
- [x] neue Seite für jedes Buch öffnen (Detailanzeige)
- [x] Auswahl-Popup (o.ä.) für die Sortierweise
- [ ] Seite für Einstellungen

### Nichtfunktionalitätsrelevante Features (Verschönerungen)

- [x] Auswahlleiste auf der Hauptseite (Listenansicht) beim Halten des Knopfes sichtbar machen
- [x] Auswahlleiste auf der Hauptseite (Listenansicht) mit Icons versehen
- [x] Animationen für die Auswahlleiste auf der Hauptseite (Listenansicht)
- [x] Schriftart ändern (ähnlich zu Ratio-Schriftart: [Outline (wird verwendet)](https://fonts.google.com/specimen/Outfit "Outline"), [Lexend](https://fonts.google.com/specimen/Lexend "Lexend"))
- [x] Suchleiste beim Herunterziehen von ganz oben anzeigen
- [ ] hellen/dunklen Modus einbauen (inkl. Möglichkeit des Wechselns zwischen den beiden) [Plugin-Doku](https://github.com/wyhaya/tauri-plugin-theme "GitHub")
- [ ] Animationen beim Öffnen der App (siehe Notizen; Splashscreen?)
- [x] Animationen bei Seitenwechsel (?)
- [ ] Animationen bei Anwenden einer neuen Sortierweise
- [x] Animationen beim Anzeigen der Suchleiste
- [ ] komplexerer Modus, wo auch Cover/Bilder in der Liste (Grid) angezeigt werden
