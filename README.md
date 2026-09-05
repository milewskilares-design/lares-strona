# LARES — szkielet strony

Statyczna strona (HTML + CSS + JS, bez frameworka) — celowo najprostsza
możliwa konstrukcja: żeby ją uruchomić, nie trzeba instalować Node.js,
npm ani żadnych zależności. Pełna, krok-po-kroku instrukcja (co pobrać,
jak wdrożyć, jak podłączyć domenę i Google Business Profile) jest w
osobnym przewodniku, który dostałeś razem z tym plikiem.

## Struktura

```
index.html   — treść i struktura strony (wszystkie sekcje)
style.css    — wygląd (kolory, typografia, układ)
script.js    — kalkulator wyceny, formularz kontaktowy, rok w stopce
images/      — miejsce na zdjęcia i logotypy (zobacz images/README.md)
```

## Co trzeba podmienić przed publikacją

Szukaj w `index.html` fragmentów w nawiasach kwadratowych, np.
`[TELEFON]`, `[MIASTO]`, `[EMAIL]`, `[ADRES]` — to wszystkie miejsca
wymagające Twoich danych. Jest ich kilkanaście, każde oznaczone.

W `script.js`, na samej górze, jest obiekt `STAWKI` — przykładowe ceny
za m² używane przez kalkulator wyceny. Podmień je na swoje realne stawki.

## Podgląd lokalny

Nie jest potrzebny żaden serwer — wystarczy dwukrotnie kliknąć
`index.html`, żeby otworzył się w przeglądarce. Jedyne ograniczenie:
w Visual Studio Code wygodniej jest zainstalować rozszerzenie
„Live Server” — po kliknięciu „Go Live” strona sama się odświeża przy
każdej zmianie pliku.

## Wdrożenie

Strona jest gotowa pod hosting na Vercel (bezpłatny plan wystarczy).
Pełne kroki — założenie repozytorium, import do Vercel, podłączenie
domeny larespro.pl / lares.pl, konfiguracja Google Business Profile
i lokalnego SEO — są w przewodniku.
