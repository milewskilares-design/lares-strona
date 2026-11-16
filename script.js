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
// TODO: to są PRZYKŁADOWE stawki — podmień na własne, zanim
// opublikujesz stronę. To jedyne miejsce, w którym trzeba
// zmienić ceny.
//
// STAWKA = zł za m² za jedno sprzątanie (widełki min–max).
const STAWKI = {
  biuro:      { min: 2.5, max: 3.5 },   // biura i obiekty komercyjne
  publiczny:  { min: 2.2, max: 3.0 },   // szkoły, urzędy, placówki publiczne
  remont:     { min: 6.0, max: 9.0 },   // sprzątanie po remoncie/budowie
  teren:      { min: 1.5, max: 2.5 },   // tereny zewnętrzne
};

// Ile sprzątań w miesiącu odpowiada danej częstotliwości.
const WIZYTY_MIESIECZNIE = {
  jednorazowo: 1,
  tydzien: 4,
  kilka: 12,
  codziennie: 22,
};

const calcForm = document.getElementById('calc-form');
const calcResult = document.getElementById('calc-result');

calcForm.addEventListener('submit', function (e) {
  e.preventDefault();

  const typ = document.getElementById('calc-type').value;
  const metraz = Number(document.getElementById('calc-area').value) || 0;
  const czestotliwosc = document.getElementById('calc-freq').value;

  const stawka = STAWKI[typ];
  const wizyty = WIZYTY_MIESIECZNIE[czestotliwosc];

  const kosztJednegoSprzataniaMin = metraz * stawka.min;
  const kosztJednegoSprzataniaMax = metraz * stawka.max;

  const razem_min = Math.round(kosztJednegoSprzataniaMin * wizyty);
  const razem_max = Math.round(kosztJednegoSprzataniaMax * wizyty);

  document.getElementById('calc-min').textContent = razem_min.toLocaleString('pl-PL');
  document.getElementById('calc-max').textContent = razem_max.toLocaleString('pl-PL');
  document.getElementById('calc-unit').textContent =
    czestotliwosc === 'jednorazowo' ? ' (jednorazowo)' : ' / miesiąc';

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
