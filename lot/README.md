# Przegląd lotu — osobne narzędzie

Otwórz https://xoogklastry.github.io/widokzdrona/lot/ . Ta aplikacja jest niezależna od galerii; jej pliki i dotychczasowy pomocnik nie zostały zmienione.

## Użycie

- **SRT / CSV / JSON**: wczytaj jeden lot. Suwak, przyciski ±1 s, odtwarzanie i kliknięcia wykresu zmieniają czas.
- **Film**: otwórz lokalne MP4 i pasującą telemetrię. Czas lotu = czas filmu + przesunięcie w sekundach. Dla SRT tego samego nieprzyciętego filmu pozostaw 0. Dla nagrania zaczynającego się w 45. sekundzie logu ustaw 45.
- **Zdjęcie**: oryginalny JPEG DJI jest odczytywany przez EXIF/XMP, niezależnie od osi czasu. Wróć do lotu przyciskiem. Zrzuty ekranu/klatki wyeksportowane bez metadanych nie dostarczą GPS ani kierunku.
- **Zobacz przykład**: demonstracja z wyraźnie oznaczonymi, symulowanymi danymi.
- Pliki nie są wysyłane na serwer. Dostawcy map dostają zapytania o oglądane kafle. Nie publikujemy Twojej trasy w repozytorium.

## Automatyczny odczyt MP4 na Windows

Pobierz ZIP repozytorium, rozpakuj i otwórz PowerShell w podfolderze `lot`:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -STA -File .\Start-Lot.ps1 -Port 8766
```

Pozostaw okno otwarte. Przycisk **MP4 + telemetria automatycznie** otwiera wybór filmu i uruchamia zainstalowany ExifTool. Oddzielny port 8766 pozwala działać obok pomocnika galerii. Wersja GitHub Pages nie może uruchamiać lokalnego ExifToola: korzystaj z SRT/JSON lub tego pomocnika. Pomocnik wymaga `exiftool` w PATH. Nie wymaga przesyłania plików ani konwersji w chmurze. H.265 może wymagać kodeka Windows lub kopii H.264 bez zmiany osi czasu.

## Dane i zakres obsługi

SRT: pola `latitude`, `longitude`, `rel_alt`, `abs_alt`, `gimbal_yaw`, `gimbal_pitch`, `drone_yaw` (i opisane poniżej warianty). Nie wszystkie DJI SRT zawierają orientację.

CSV (UTF-8, separator przecinek albo średnik):

```csv
t,latitude,longitude,relativeAltitude,absoluteAltitude,GimbalYaw,GimbalPitch,DroneYaw
0,49.1,20.1,40,240,350,-30,90
1,49.1001,20.1001,42,242,352,-30,90
```

JSON: tablica obiektów o tych samych polach, `{ "samples": [...] }`, lub ExifTool `-ee -n -j -G3` (SampleTime i pola w tym samym DocN). Czas: sekundy od początku źródła, nie timestamp UNIX. Współrzędne: WGS84 dziesiętne. Wysokości: metry. Kierunki: stopnie od północy zgodnie z ruchem wskazówek zegara. Są także aliasy `SampleTime`, `GPSLatitude`, `GPSLongitude`, `GimbalYawDegree`, `GimbalPitchDegree`, `FlightYawDegree`.

Surowe binarne logi **DJI FlightRecord TXT/DAT nie są dekodowane**. Eksporty AirData/DJI Fly o innych nazwach kolumn należy dopasować do powyższego CSV. Nie rozpoznajemy arbitralnie jednostek ani czasu. Limit importu logu: 100 MB.

## Znaczenie mapy

- Niebieska strzałka: orientacja kadłuba z metadanych.
- Zielona strzałka: azymut kamery z metadanych. Zielony pierścień przy pochyleniu ≤ −89° oznacza widok prawie pionowy w dół.
- To schemat kierunku, nie obliczony obszar widoczny na gruncie. Kierunek ruchu nie zastępuje kierunku kamery.
- Wysokość względna: względem startu, jeśli tak definiuje ją plik; nie wysokość nad terenem. Absolutna: wartość źródłowa, bez harmonizacji układu wysokości.
- Mapa Web Mercator; GPS ograniczony do szerokości ±85,05112878°. Dane bez GPS mogą nadal pokazywać wysokość i czas.
- Brak interpolacji i wygładzania: pokazujemy ostatnią próbkę tylko w jej przedziale ważności. Dla CSV/JSON bez końca próbki używamy następnej próbki, maksymalnie 2 s (ostatnia: 1 s). Luki ukrywają bieżący znacznik, a trasa jest dzielona. Nie wyliczamy odległości ani prędkości ze śladu.

## Weryfikacja i zależności

Leaflet 1.9.4, exifr 7.1.3 (EXIF/XMP). Mapa i biblioteki CDN wymagają internetu. Testy parsera: SRT, CSV, JSON, zerowe współrzędne, brak kierunku, rozdzielenie kamery/kadłuba, luki. Test CI sprawdza także składnię HTML/JS oraz nowego PowerShella. Brak testu z rzeczywistym filmem i przeglądarką w bieżącym środowisku — potrzebna weryfikacja na danych użytkownika.

Źródła: https://leafletjs.com/reference.html ; https://github.com/MikeKovarik/exifr ; https://exiftool.org/TagNames/DJI.html
