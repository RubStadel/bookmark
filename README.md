# bookmark

Android app to remember which books I read when and where to refresh my memories.

Also used as a testrun for app development using Tauri (Rust) and a JS, HTML, CSS frontend.

---

## Notes

- beim Öffnen Animation wie Buch durchgeblättert wird und/oder wie Bücher in Regal sortiert werden
- dabei wird lokale "Datenbank" gelesen (json-Datei?) oder neu erstellt, wenn nicht vorhanden
- Grid aller Bücher, standardmäßig umgekehrt chronologisch sortiert, in der die Titel stehen und das Cover (in der Sichtbarkeit gedämpft) zu sehen ist
- beim Hovern wird Cover komplett sichtbar
- wenn man auf ein Buch klickt, wird das Cover sichtbar und groß. Beim Klicken auf das Cover direkt öffnet sich das Cover fullscreen, von wo man nach unten scrollen kann, um Infos zu sehen. Wird auf den Titel geklickt, kommt das Cover teilweise verdeckt und die ersten Infos sind direkt sichtbar
- Bücher sind nach Chronologie, Genre, Titel, Autor, Ort usw. sortierbar
- Genres können selbst definiert werden und werden dann in eine Liste geschrieben, damit man diese auch für andere Bücher anwenden kann
- Cover-Bilder können manuell hochgeladen werden
- können mehrere Bilder (des physischen Buches/Einbands) hinzugefügt werden?
- (alternative) minimalistische Ansicht, wo nur Titel in einer Liste angezeigt werden (?)
- jedes Buch hat folgende Felder:
  - Autor
  - Titel
  - Erscheinungsjahr
  - wo wurde es gelesen (auch gekauft/erhalten); freie Eingabe
  - wann wurde es gelesen (freie Eingabe für grobe Angaben oder genaue Daten)
  - Genre (Radio mit Möglichkeit eigene hinzuzufügen)
  - Herkunftsland des Autors (?)
  - Sprache(n), in der/denen es gelesen wurde & Originalsprache
  - Bewertung (?)
  - Zugehörigkeit (bei Reihen)
  - Notizen (freie Eingabe für z.B. besondere Stellen, Zitate, äußere Begebenheiten, die es besonders gemacht haben, etc.)

- Bücher ohne Enddatum werden als angefangen markiert (gelber Punkt oder offenes Buch-Icon daneben). Die sind oben angeheftet (?)
- Daten (für Anfang und Abschluss) werden in drei Teilen angegeben: (Anfang | Mitte | Ende | unbekannt/" "), Monat, Jahr.
- Wenn Anfang == Ende, dann nur einmal anzeigen z.B. nur gelesen in "Mitte Oktober 2024" statt gelesen "Mitte Oktober - Mitte Oktober 2024"

- Hinzugefügte Bilder werden in dedizierten Ordner kopiert. Für Bilder wird der relative Pfad in der json gespeichert. Dann werden die Bilder geladen, wenn Detaildaten eingeholt werden.
