# Plamínkový skatepark

Trikový skatepark pro Vojtu. 3D grafika s kamerou z boku, koloběžka nebo BMX, salta, flair, vývrtky a ohnivé kruhy. Hraje se na plamínky a bez časového limitu.

## Jak hru dostat do iPhonu

1. V Safari otevřete adresu hry (GitHub Pages tohoto repozitáře).
2. Ťukněte na **Sdílet** a pak **Přidat na plochu**.
3. Hra se spouští ikonou z plochy přes celou obrazovku. Po prvním spuštění funguje i bez internetu.

## iPhone

- Laděno na iPhone 13 Pro na šířku (výřez displeje i domovská lišta mají volné místo). Funguje od iOS 15, nejlépe iOS 17 a novější.
- Na iOS 17 a novějším hraje zvuk i se zapnutým tichým režimem. Na starším iOS je potřeba přepínač ticha vypnout.
- Hlasatel mluví česky, pokud má iPhone český hlas (Nastavení → Zpřístupnění → Předčítaný obsah → Hlasy).
- Když telefon nestíhá, hra sama sníží rozlišení, aby běžela plynule.

## Ovládání

| Tlačítko | Na zemi | Ve vzduchu |
| --- | --- | --- |
| ◀ ▶ | jízda a brzda | točení salta |
| SKOK | výskok, na hraně rampy vyletí výš | vývrtka |
| TURBO / TRIK | turbo na 3 sekundy | tailwhip, barspin, superman, bez rukou |

Na počítači: šipky, mezerník = SKOK, X = TURBO/TRIK. Funguje i herní ovladač.

## Co hra umí (Fáze 1)

- Vojtův postup: panáček → kolo nebo koloběžka → hřiště → a jde se hrát.
- 4 panáčci (Vojta, Ninja Nik, Robot Bolt, Dino Rex), 8 vozidel (2 hned, další se odemykají plamínky).
- 4 hřiště:
  - **Městský skatepark:** quarter pipy, pumptrack, malý a mega skok, funbox se zábradlím, ledge.
  - **Dino džungle:** dřevěné rampy, obří hrby, spine, kmen na grind, skok tlamou T-rexe, sopka a brontosauři.
  - **FMX poušť:** hliněné vlnky, double, step-up na plošinu a velký skok z ocelové rampy.
  - **Mega rampa:** noční aréna, 26 m rozjezdová věž, obří skok a 7 m quarter pipe.
- Sponzor BoardBeat na úvodní obrazovce a na bannerech ve všech hřištích.
- Plamínky podle Vojtových pravidel (kruh 4, vývrtka 6, flair 7 a 8), kombo násobič, rekordy.
- Plamínková obrazovka na konci jízdy.
- Čtení mezi hrami: po 2 minutách jízdy přijde krátký příběh (1 až 2 odstavce) a otázka se třemi možnostmi. Správná odpověď = další 2 minuty a 20 plamínků, špatná = jiný příběh. Texty jsou pro 2. třídu ve třech úrovních, obtížnost se sama přizpůsobuje. Velké písmo, větší mezery, ťuknutím se věta podsvítí. Tlačítko DÁL se odemkne až po chvíli čtení. Hlasatel texty nečte.
- Pro rodiče (úvodní obrazovka, chráněno příkladem na násobení): zapnout nebo vypnout čtení, délka hraní 2/4/6/8 minut, dát čas hned, přehled přečtených příběhů. Texty jsou v `js/texts.js`.
- Hudba a zvuky. Český hlasatel mluví jen v menu (pokud má zařízení český hlas), při jízdě neruší.

## Pro vývojáře

Čisté HTML, CSS a JavaScript moduly bez build kroku. 3D je Three.js r160 (ve složce `vendor`), písma jsou ve složce `fonts`. Lokálně stačí:

```bash
python3 -m http.server 8000
```

Po každé změně souborů zvyšte `VERSION` v `sw.js`, aby si telefony stáhly novou verzi.
