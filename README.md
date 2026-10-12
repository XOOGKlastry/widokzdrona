# Widok z drona

Edytor wybranych kadrów z filmu i prosta galeria zdjęć z mapą Esri World Imagery. Bez instalacji i bez wysyłania filmu na serwer.

## Uruchomienie na Windows

1. Pobierz `index.html` i otwórz w Edge lub Chrome z dostępem do internetu.
2. Kliknij **Otwórz film** i wybierz lokalny MP4.
3. Opcjonalnie dodaj pasujący SRT tego samego filmu. Obsługiwane są pola `latitude` i `longitude`. Nieznany format nie tworzy fikcyjnej lokalizacji.
4. Przewijaj film suwakiem, wpisz sekundę lub użyj przycisków ±0,1 s. Kliknij **Dodaj ten kadr**.
5. Nadaj opis. Jeżeli brak GPS, wybierz **Wskaż pozycję na mapie** i kliknij pozycję drona.
6. Kliknij **Pobierz galerię dla znajomych**. Plik `galeria.html` zawiera zdjęcia i otwiera się od razu jako galeria, bez panelu edycji. Zapisz go przed zamknięciem edytora: sesja edycji nie jest automatycznie zachowywana.

## Widok dla znajomych

Eksportowana galeria pokazuje zdjęcie u góry i mapę pod nim w jednym ekranie. Bez nagłówka i panelu autora. Po aktualizacji trzeba ponownie wyeksportować `galeria.html`: wcześniej pobrane pliki nie aktualizują się automatycznie.

## Mapa

- Aktywny punkt: 36 px, zielony, z numerem.
- Pozostałe: szare punkty 11 px; obszar kliknięcia 44 px.
- **Pokaż szare** ukrywa pozostałe punkty.
- **Pokaż znaczniki** ukrywa wszystkie punkty, zostawia podkład.
- Kliknięcie punktu wybiera zdjęcie i przewija do galerii. Dla nakładających się punktów pojawia się lista kadrów w tym miejscu.
- Punkty oznaczają pozycję drona, nie środek fotografowanej sceny. Kierunek kamery jest odczytywany z jawnych pól `gimbal_yaw` / `camera_yaw` oraz `gimbal_pitch` / `camera_pitch` w SRT. Sam GPS ani yaw kadłuba nie są używane do zgadywania kierunku. W edytorze można podać azymut ręcznie (0° północ, 90° wschód) lub zaznaczyć widok pionowo w dół. Strzałka i wachlarz są schematem kierunku, nie obliczonym zasięgiem zdjęcia na gruncie.

## GitHub Pages

W repozytorium przejdź do **Settings → Pages → Deploy from a branch → main → / (root) → Save**. Po zakończeniu wdrożenia użyj adresu pokazanego przez GitHub. Dodaj wyeksportowany `galeria.html` do głównego katalogu repozytorium, by udostępniać znajomym ten plik pod adresem strony zakończonym `/galeria.html`. `index.html` pozostaje edytorem. Sam zapis repozytorium nie włącza GitHub Pages.

Repozytorium jest publiczne: zdjęcia i współrzędne umieszczone w galerii w repozytorium też będą publiczne. Samo otwarcie lokalnego filmu w edytorze go nie publikuje.

## Duże filmy i kodeki

Przeglądarka czyta lokalny film przez URL obiektowy; nie zapisuj wielogigabajtowych MP4 w repozytorium. JPEG ograniczany do 1920 px, jakość 0,85. Wybór czasu nie gwarantuje jednej konkretnej klatki. Obsługa H.265 zależy od systemu. Gdy obraz się nie otwiera, przygotuj kopię w PowerShell (FFmpeg):

```powershell
ffmpeg -i "film.MP4" -vf "scale=1920:-2" -c:v libx264 -crf 21 -preset fast -an -movflags +faststart "film-podglad.mp4"
```

Nie przycinaj czasu filmu, jeśli używasz SRT oryginału. Dopasowanie GPS następuje tylko w przedziale konkretnego wpisu SRT. Wybranie nowego filmu czyści przypisany SRT; poprzednie kadry zostają.

## Zależności i ograniczenia

Leaflet 1.9.4 z unpkg; podkład Esri World Imagery z services.arcgisonline.com. Internet jest potrzebny dla biblioteki i mapy. Mapa wysyła do dostawcy zapytania o kafle oglądanego obszaru. Atrybucja dostawców jest widoczna na mapie. Współrzędne WGS84, wizualizacja Web Mercator; zakres szerokości ograniczony do ±85,05112878°.

Nie dołączono zdjęć z wcześniejszego ZIP — oryginał nie był dostępny w środowisku tej wersji. Można stworzyć galerię z lokalnego filmu.

## Weryfikacja

Sprawdzono składnię JavaScript oraz parser SRT (poprawny wpis, nieprawidłowa szerokość i pusty wynik). Nie wykonano testu w przeglądarce: środowisko wykonawcze było niedostępne. Przed udostępnieniem sprawdź: dodanie dwóch kadrów, pozycje ręczne/SRT, kliknięcia mapy, oba przełączniki, nakładające się punkty oraz ponowne otwarcie wyeksportowanej galerii. Cofnięcie zmian: przywróć poprzedni commit GitHub.
