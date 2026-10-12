# Automatyczny odczyt każdego filmu

1. Pobierz repozytorium przez Code → Download ZIP i rozpakuj.
2. Otwórz PowerShell w rozpakowanym katalogu.
3. Uruchom `powershell -NoProfile -STA -File .\Start-Widok.ps1`.
4. W otwartej stronie kliknij „Otwórz DJI — automatyczna telemetria”. Wybierz oryginalny MP4. Każdy kolejny film odczytuje się tak samo, bez SRT i bez eksportowania JSON.
5. Wybierz moment, dodaj kadr i wyeksportuj galerię.

Wymaga ExifTool w PATH (już zainstalowany u autora). Pomocnik działa tylko na localhost:8765. Nie wysyła filmów do GitHub. GitHub Pages pozostaje przeglądarką/edytorem ręcznym, bo nie może uruchamiać lokalnego ExifToola. Gotowy plik galeria.html nie wymaga pomocnika.

Parser korzysta z `-ee -n -j -G3` i wiąże SampleTime, GPSLatitude/GPSLongitude, GimbalYaw/GimbalPitch w obrębie tego samego dokumentu osadzonego. Nie używa kierunku kadłuba ani arbitralnego timestampu jako czasu filmu. Brakujące pola pozostają nieznane. Niektóre warianty telemetrii mogą wymagać dalszego dopasowania parsera. Format protobuf potrafi pomijać zera; ta wersja konserwatywnie nie uzupełnia braków zerami bez potwierdzenia struktury próbki.

Odczyt następuje przed odtwarzaniem i może potrwać. Dane są w pamięci tylko dla bieżącego filmu. Obsługa odtwarzania H.265 zależy od przeglądarki i kodeków Windows. Pomocnik nie transkoduje filmu.

Weryfikacja: sprawdzono składnię JavaScript. Skrypt PowerShell i odczyt prawdziwego DJI nie zostały uruchomione w środowisku wykonawczym; ta integracja wymaga testu na Windows. Jeśli PowerShell blokuje skrypt, nie wyłączaj globalnej polityki: stosuj zasady swojego komputera/organizacji. Zamknięcie okna PowerShell wyłącza usługę.

Dokumentacja: https://exiftool.org/exiftool_pod.html oraz https://exiftool.org/TagNames/DJI.html
