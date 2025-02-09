# bookmark

Android app to remember which books I read when and where to refresh my memories.

Also used as a testrun for app development using Tauri (Rust) and a JS, HTML, CSS frontend.

---

## Notizen

- **Erst Funktionalität erstellen, dann Aussehen/Design/Frontend optimieren!**

- am Anfang ganze Datenbank (aus json) einlesen (statt on-demand das zu holen, was gerade benötigt wird)

- Datenbank wird aus "resources/books.json" gelesen und in "target/debug/resources/books.json" kopiert

- beim Öffnen Animation wie Buch durchgeblättert wird und/oder wie Bücher in Regal sortiert werden
- dabei wird lokale "Datenbank" gelesen (json-Datei?) oder neu erstellt, wenn nicht vorhanden
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
- [ ] Möglichkeit Bücher in der Datenbank zu sortieren (in JS oder Rust?) (<https://stackoverflow.com/a/1069840>)
- [ ] Sortierkategorien (z.B. Jahre) als Zwischenüberschriften in der Liste anzeigen
- [ ] Suche von Schlagworten (mit RegEx?; mit JS oder Rust?)
- [ ] Möglichkeit neue Kategorien (Suche, Sortierung, Genre, etc.) zu Auswahlliste hinzuzufügen
- [ ] Einfügen von Bildern für Bücher (inkl. Kopieren in Unterordner)
- [ ] Entfernen von Bildern aus dem Unterordner (und json)
- [ ] Anzeige von Bildern auf der Detailseite von Büchern
- [ ] Testinstallation, um herauszufinden, wo Daten in Android gespeichert werden (so, dass man darauf zugreifen kann)

### UI (Seiten)

- [x] Liste der Bücher in der Datenbank
- [ ] Eingabefenster für neue Bücher, die der Datenbank hinzugefügt werden
- [x] neue Seite für jedes Buch öffnen (Detailanzeige)
- [ ] Seite für Einstellungen
- [ ] Auswahl-Popup (o.ä.) für die Sortierweise

### Nichtfunktionalitätsrelevante Features (Verschönerungen)

- [x] Auswahlleiste auf der Hauptseite (Listenansicht) beim Halten des Knopfes sichtbar machen
- [ ] Auswahlleiste auf der Hauptseite (Listenansicht) mit Icons versehen
- [ ] Suchleiste beim Herunterziehen von ganz oben anzeigen
- [ ] hellen/dunklen Modus einbauen (inkl. Möglichkeit des Wechselns zwischen den beiden)
- [ ] Animationen beim Öffnen der App (siehe Notizen)
- [ ] Animationen bei Seitenwechsel
- [ ] Animationen bei Anwenden einer neuen Sortierweise
- [ ] Animationen beim Anzeigen der Suchleiste
- [ ] komplexerer Modus, wo auch Cover/Bilder in der Liste (Grid) angezeigt werden
