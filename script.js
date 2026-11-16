/* =========================================================
   LARES — logika strony
   Trzy niezależne bloki: rok w stopce, kalkulator wyceny,
   formularz kontaktowy. Każdy blok jest samodzielny — możesz
   edytować jeden, nie ruszając pozostałych.
   ========================================================= */

// ---------- rok w stopce ----------
document.getElementById('rok').textContent = new Date().getFullYear();


// ---------- menu na telefonie ----------
//
// Przycisk z trzema kreskami pokazuje i chowa nawigację na wąskich
// ekranach. Menu zamyka się po wybraniu pozycji i po klawiszu Esc.
(function () {
  const naglowek = document.querySelector('.site-header');
  const przycisk = document.querySelector('.nav-toggle');
  const menu = document.getElementById('main-nav');
  if (!naglowek || !przycisk || !menu) return;

  function ustaw(otwarte) {
    naglowek.classList.toggle('nav-open', otwarte);
    przycisk.setAttribute('aria-expanded', otwarte ? 'true' : 'false');
    przycisk.setAttribute('aria-label', otwarte ? 'Zamknij menu' : 'Otwórz menu');
  }

  przycisk.addEventListener('click', function () {
    ustaw(!naglowek.classList.contains('nav-open'));
  });
  menu.addEventListener('click', function (e) {
    if (e.target.closest('a')) ustaw(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && naglowek.classList.contains('nav-open')) { ustaw(false); przycisk.focus(); }
  });
})();


// ---------- przełącznik cen brutto / netto w cenniku ----------
//
// Każda cena w cenniku ma w index.html dwie wartości:
// data-brutto i data-netto. Przełącznik tylko podmienia tekst.
// Wybór jest zapamiętywany w przeglądarce odwiedzającego.
(function () {
  const przyciski = document.querySelectorAll('.vat-btn');
  if (!przyciski.length) return;
  const ceny = document.querySelectorAll('.js-price');
  const slowa = document.querySelectorAll('.js-vat-word');
  const info = document.getElementById('vat-info');

  function ustaw(tryb) {
    ceny.forEach(function (el) { el.textContent = el.dataset[tryb]; });
    slowa.forEach(function (el) { el.textContent = tryb; });
    przyciski.forEach(function (b) {
      const aktywny = b.dataset.vat === tryb;
      b.classList.toggle('is-active', aktywny);
      b.setAttribute('aria-pressed', aktywny ? 'true' : 'false');
    });
    if (info) {
      info.textContent = tryb === 'brutto'
        ? 'Podane ceny zawierają 23% VAT.'
        : 'Podane ceny są cenami netto — należy doliczyć 23% VAT.';
    }
    try { localStorage.setItem('lares-ceny', tryb); } catch (e) { /* brak dostępu do pamięci — pomijamy */ }
  }

  przyciski.forEach(function (b) {
    b.addEventListener('click', function () { ustaw(b.dataset.vat); });
  });

  let zapisany = null;
  try { zapisany = localStorage.getItem('lares-ceny'); } catch (e) { /* jw. */ }
  if (zapisany === 'netto') ustaw('netto');
})();


// ---------- kalkulator wstępnej wyceny ----------
//
// Wszystkie ceny kalkulatora są w tym jednym bloku — zmiana stawki
// to zmiana liczby poniżej. Kwoty są netto; brutto liczone osobno.
//
// SPRZĄTANIE STAŁE (raz w tygodniu / kilka razy / codziennie)
// liczymy jak w kalkulacjach ofertowych LARES:
//   godziny w miesiącu = (metraż ÷ wydajność) × liczba wizyt,
//   ale nie mniej niż minimalny czas wizyty,
//   cena = godziny × stawka za roboczogodzinę (widełki od–do).
// Stawka obejmuje pracownika, chemię, sprzęt, koordynację i marżę.
const STAWKA_GODZINOWA = { min: 48, max: 60 };   // zł netto za roboczogodzinę

// Wydajność: ile m² sprząta jedna osoba w godzinę przy danej częstotliwości.
// Im częściej sprzątamy, tym mniej brudu i szybciej idzie praca.
const WYDAJNOSC = {
  biuro:     { tydzien: 130, kilka: 180, codziennie: 220 },
  publiczny: { tydzien: 130, kilka: 180, codziennie: 220 },
  teren:     { tydzien: 500, kilka: 600, codziennie: 700 },
};
const PREMIA_DUZA_POWIERZCHNIA = 1.2;   // od 1000 m² wydajność +20% (większa skala)
const MIN_GODZIN_NA_WIZYTE = { tydzien: 2, kilka: 1.5, codziennie: 1 };
const WIZYTY_MIESIECZNIE = { tydzien: 4.33, kilka: 13, codziennie: 21.7 };

// SPRZĄTANIE JEDNORAZOWE — według cennika na stronie (zł netto za m², progi metrażu).
// Widełki: od ceny z cennika do +30% (mocniejsze zabrudzenia, trudny dostęp).
const JEDNORAZOWO = {
  biuro:     { progi: [[100, 8], [300, 6], [1000, 5], [Infinity, 4]],        minimum: 400 },
  publiczny: { progi: [[100, 8], [300, 6], [1000, 5], [Infinity, 4]],        minimum: 400 },
  remont:    { progi: [[100, 17], [300, 14.5], [1000, 12], [Infinity, 10.5]], minimum: 900 },
  teren:     { progi: [[Infinity, 1.2]],                                     minimum: 300 },
};
const NARZUT_JEDNORAZOWO_MAX = 1.3;

// VAT: 23% dla usług w budynkach, 8% dla terenów zewnętrznych.
const VAT = { biuro: 0.23, publiczny: 0.23, remont: 0.23, teren: 0.08 };

const calcForm = document.getElementById('calc-form');
const calcResult = document.getElementById('calc-result');
const calcType = document.getElementById('calc-type');
const calcFreq = document.getElementById('calc-freq');

// Po remoncie sprzątamy tylko jednorazowo — blokujemy wybór częstotliwości.
function ustawCzestotliwosc() {
  const remont = calcType.value === 'remont';
  if (remont) calcFreq.value = 'jednorazowo';
  calcFreq.disabled = remont;
}
calcType.addEventListener('change', ustawCzestotliwosc);
ustawCzestotliwosc();

function zaokraglij(kwota) { return Math.round(kwota / 10) * 10; }
function zl(kwota) { return zaokraglij(kwota).toLocaleString('pl-PL'); }

calcForm.addEventListener('submit', function (e) {
  e.preventDefault();

  const typ = calcType.value;
  const metraz = Number(document.getElementById('calc-area').value) || 0;
  const czestotliwosc = calcFreq.value;
  let min, max, godziny = null;

  if (czestotliwosc === 'jednorazowo') {
    const c = JEDNORAZOWO[typ];
    const stawka = c.progi.find(function (p) { return metraz <= p[0]; })[1];
    min = Math.max(metraz * stawka, c.minimum);
    max = Math.max(metraz * stawka * NARZUT_JEDNORAZOWO_MAX, c.minimum * NARZUT_JEDNORAZOWO_MAX);
  } else {
    let wydajnosc = WYDAJNOSC[typ][czestotliwosc];
    if (metraz >= 1000) wydajnosc *= PREMIA_DUZA_POWIERZCHNIA;
    const naWizyte = Math.max(metraz / wydajnosc, MIN_GODZIN_NA_WIZYTE[czestotliwosc]);
    godziny = naWizyte * WIZYTY_MIESIECZNIE[czestotliwosc];
    min = godziny * STAWKA_GODZINOWA.min;
    max = godziny * STAWKA_GODZINOWA.max;
  }

  const vat = VAT[typ];
  document.getElementById('calc-min').textContent = zl(min);
  document.getElementById('calc-max').textContent = zl(max);
  document.getElementById('calc-unit').textContent =
    czestotliwosc === 'jednorazowo' ? ' netto (jednorazowo)' : ' netto / miesiąc';
  document.getElementById('calc-brutto').textContent =
    'Brutto: ' + zl(min * (1 + vat)) + ' – ' + zl(max * (1 + vat)) + ' zł (VAT ' + Math.round(vat * 100) + '%)' +
    (godziny ? ' · szacowany nakład pracy: ok. ' + Math.round(godziny) + ' roboczogodzin w miesiącu' : '');

  calcResult.hidden = false;
  calcResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});


// ---------- mapa Google po kliknięciu ----------
//
// Ramka z mapą Google ładuje się dopiero, gdy odwiedzający kliknie
// „Pokaż mapę”. Dzięki temu bez jego decyzji przeglądarka nie łączy
// się z Google i nie dostaje plików cookie Google.
(function () {
  const miejsce = document.querySelector('.map-placeholder');
  if (!miejsce) return;
  miejsce.querySelector('.map-load').addEventListener('click', function () {
    const ramka = document.createElement('iframe');
    ramka.title = 'Mapa lokalizacji LARES';
    ramka.referrerPolicy = 'no-referrer-when-downgrade';
    ramka.src = miejsce.dataset.mapSrc;
    miejsce.replaceWith(ramka);
  });
})();


// ---------- formularz kontaktowy ----------
//
// Wysyłka w tle przez Web3Forms (web3forms.com) — bez otwierania
// klienta pocztowego. Access Key jest przypisany w panelu
// Web3Forms do adresu biuro@larespro.pl (formularz "LARES —
// formularz kontaktowy"). Jeśli kiedyś trzeba go zmienić —
// nowy klucz wygenerujesz w panelu web3forms.com i podmieniasz
// tylko wartość ACCESS_KEY poniżej.

const ACCESS_KEY = 'f0bfb1e5-8ef1-4c26-9896-6884738524a7';

const contactForm = document.getElementById('contact-form');

contactForm.addEventListener('submit', async function (e) {
  e.preventDefault();

  const dane = new FormData(contactForm);
  dane.append('access_key', ACCESS_KEY);

  const przycisk = contactForm.querySelector('button[type="submit"]');
  const tekstPrzycisku = przycisk.textContent;
  przycisk.disabled = true;
  przycisk.textContent = 'Wysyłanie...';

  try {
    const odpowiedz = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      body: dane,
      headers: { Accept: 'application/json' },
    });

    if (odpowiedz.ok) {
      contactForm.innerHTML = '<p>Dziękujemy — wiadomość została wysłana, odezwiemy się wkrótce.</p>';
    } else {
      alert('Coś poszło nie tak. Spróbuj ponownie lub zadzwoń bezpośrednio.');
      przycisk.disabled = false;
      przycisk.textContent = tekstPrzycisku;
    }
  } catch (blad) {
    alert('Brak połączenia z internetem. Spróbuj ponownie lub zadzwoń bezpośrednio.');
    przycisk.disabled = false;
    przycisk.textContent = tekstPrzycisku;
  }
});
