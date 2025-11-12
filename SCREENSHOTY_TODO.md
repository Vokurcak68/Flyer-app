# Seznam screenshotů pro uživatelskou nápovědu

## ADMINISTRÁTOR (8 screenshotů)

### 1. Formulář pro vytvoření nového uživatele
**Jak vytvořit:** Uživatelé → + Přidat uživatele
**Co zachytit:** Formulář s vyplněnými poli (jméno, příjmení, email, heslo, role, přiřazení značek)
**Název souboru:** `admin-user-form.png`

### 2. Přehled uživatelů systému
**Jak vytvořit:** Uživatelé → seznam
**Co zachytit:** Tabulka se sloupci: jméno, email, role, značky, akce (ikona tužky, ikona koše)
**Název souboru:** `admin-users-list.png`

### 3. Formulář pro přidání nové ikony
**Jak vytvořit:** Ikony → + Nová ikona
**Co zachytit:** Formulář s polem pro název, checkbox "Ikona energetické třídy", checkbox "Použít barvu značky jako pozadí", tlačítko pro nahrání souboru
**Název souboru:** `admin-icon-form.png`

### 4. Přehled ikon v systému
**Jak vytvořit:** Ikony → seznam
**Co zachytit:** Grid/seznam ikon s náhledy (šedivé pozadí!), názvy a akcemi (editace, smazání)
**Název souboru:** `admin-icons-list.png`

### 5. Formulář pro vytvoření nové značky
**Jak vytvořit:** Značky → + Nová značka
**Co zachytit:** Formulář s polem pro název, barva značky (color picker), tlačítko pro nahrání loga
**Název souboru:** `admin-brand-form.png`

### 6. Přehled značek v systému
**Jak vytvořit:** Značky → seznam
**Co zachytit:** Tabulka s logy, názvy, barvami značek a akcemi (editace, smazání)
**Název souboru:** `admin-brands-list.png`

### 7. Formulář pro přidání promo obrázku
**Jak vytvořit:** Promo obrázky → + Nový promo obrázek
**Co zachytit:** Formulář s poli: název, značka (dropdown), typ (dropdown), checkbox "Zobrazit koncovým uživatelům", checkbox "Vyplnit datum" (jen pro Patička), nahrání souboru
**Název souboru:** `admin-promo-form.png`

### 8. Přehled promo obrázků s filtrováním
**Jak vytvořit:** Promo obrázky → seznam
**Co zachytit:** Přehled promo obrázků s náhledy, filtr podle značky, informace o typu a viditelnosti
**Název souboru:** `admin-promos-list.png`

---

## DODAVATEL (22 screenshotů)

### 9. Přihlašovací obrazovka
**Jak vytvořit:** Odhlásit se a zobrazit login
**Co zachytit:** Přihlašovací obrazovka s poli pro email a heslo a tlačítkem "Přihlásit se"
**Název souboru:** `login-screen.png`

### 10. Formulář pro vytvoření nového produktu
**Jak vytvořit:** Produkty → + Nový produkt
**Co zachytit:** Formulář s vyplněnými poli: název, EAN kód, akční cena, původní cena, kategorie, značka, náhled nahraného obrázku, výběr ikon (4 sloty)
**Název souboru:** `supplier-product-form.png`

### 11. Zobrazení poznámky dodavatele v produktu
**Jak vytvořit:** Vytvořit produkt s poznámkou → ukázat v letáku
**Co zachytit:** Detail produktu v letáku s poznámkou dodavatele (tučně na oranžovém pozadí nad cenou)
**Název souboru:** `supplier-product-note.png`

### 12. Vytvoření kopie existujícího produktu
**Jak vytvořit:** Produkty → Editovat produkt → tlačítko "Vytvořit kopii"
**Co zachytit:** Formulář s předvyplněnými daty a tlačítkem "Vytvořit kopii"
**Název souboru:** `supplier-product-copy.png`

### 13. Přehled produktů s chráněnými položkami
**Jak vytvořit:** Produkty → seznam (kde některé jsou v aktivních letácích)
**Co zachytit:** Tabulka produktů - některé mají ikonu zámku (nelze editovat/mazat)
**Název souboru:** `supplier-products-list-protected.png`

### 14. Náhled importovaných produktů z CSV
**Jak vytvořit:** Produkty → Import CSV → vyber CSV soubor
**Co zachytit:** Dialog s náhledem dat před importem v tabulce
**Název souboru:** `supplier-csv-import-preview.png`

### 15. Formulář pro vytvoření značky dodavatelem
**Jak vytvořit:** Značky → + Nová značka (jako supplier)
**Co zachytit:** Formulář s polem pro název, výběr barvy a nahráním loga (PNG s průhledným pozadím)
**Název souboru:** `supplier-brand-form.png`

### 16. Formulář pro vytvoření promo obrázku s výběrem typu
**Jak vytvořit:** Promo obrázky → + Nový promo obrázek
**Co zachytit:** Formulář s dropdown pro typ (Single, Horizontal, Square, Full Page, Footer) a checkbox "Vyplnit datum platnosti"
**Název souboru:** `supplier-promo-form.png`

### 17. Ukázka patičky s automaticky vyplněným datem
**Jak vytvořit:** Vytvořit footer promo s "Vyplnit datum" → ukázat v letáku
**Co zachytit:** Patička letáku s automaticky vygenerovaným datem (bílé tučné písmo vpravo)
**Název souboru:** `supplier-footer-auto-date.png`

### 18. Formulář pro vytvoření nového letáku
**Jak vytvořit:** Letáky → + Nový leták
**Co zachytit:** Formulář s poli: název akce, platnost od (date picker), platnost do (date picker)
**Název souboru:** `supplier-flyer-form.png`

### 19. Editor letáku - hlavní pracovní plocha
**Jak vytvořit:** Otevřít editor letáku
**Co zachytit:** Celá obrazovka s levým panelem (náhled stránky grid 2x4), pravým panelem (záložky Produkty/Promos, vyhledávání, seznam produktů), horní lišta (název letáku, datum od/do, tlačítka Uložit/Odeslat)
**Název souboru:** `supplier-flyer-editor.png`

### 20. Kopírování existujícího letáku
**Jak vytvořit:** Detail letáku → tlačítko "Vytvořit kopii"
**Co zachytit:** Horní panel s tlačítkem "Vytvořit kopii" a progress indikátor během kopírování
**Název souboru:** `supplier-flyer-copy.png`

### 21. Přidání nové stránky do letáku
**Jak vytvořit:** Editor → kliknout "+ Přidat stránku"
**Co zachytit:** Editor s více stránkami, tlačítko "+ Přidat stránku" a nově přidaná prázdná stránka s 8 prázdnými sloty
**Název souboru:** `supplier-flyer-add-page.png`

### 22. Přidání produktu na stránku pomocí drag & drop
**Jak vytvořit:** Editor → drag produkt z pravého panelu na slot
**Co zachytit:** Produkt během přetahování s vizuálním indikátorem cílového slotu
**Název souboru:** `supplier-flyer-drag-drop.png`

### 23. Stránka s patičkou a automatickým datem
**Jak vytvořit:** Editor → přidat footer promo s datem
**Co zachytit:** Stránka letáku s 8 produkty nahoře a patičkou dole s automatickým datem
**Název souboru:** `supplier-flyer-page-with-footer.png`

### 24. Uložení letáku jako koncept
**Jak vytvořit:** Editor → kliknout "💾 Uložit"
**Co zachytit:** Editor s tlačítkem "💾 Uložit" a stavem letáku "Koncept" (šedý badge)
**Název souboru:** `supplier-flyer-save-draft.png`

### 25. Odeslání letáku k autorizaci s validací
**Jak vytvořit:** Editor → kliknout "📤 Odeslat k autorizaci"
**Co zachytit:** Tlačítko "📤 Odeslat k autorizaci" a loading spinner během validace
**Název souboru:** `supplier-flyer-submit.png`

### 26. Modální okno s validačními chybami letáku
**Jak vytvořit:** Odeslat leták s chybami v ERP
**Co zachytit:** Modální okno s nadpisem "⚠️ Validační chyby letáku", seznam produktů s chybami (EAN, název, popis chyby), tlačítka "Editovat produkt", "Export do TXT", "Export do PDF/HTML"
**Název souboru:** `supplier-validation-errors-modal.png`

### 27. Export validačních chyb do PDF
**Jak vytvořit:** Modální okno s chybami → Export do PDF
**Co zachytit:** Vygenerovaný PDF dokument s validačními chybami v přehledném formátu
**Název souboru:** `supplier-validation-errors-export.png`

### 28. Leták odeslaný k předschválení - zamčený stav
**Jak vytvořit:** Po úspěšném odeslání letáku
**Co zachytit:** Detail letáku se stavem "Čeká na předschválení" (oranžový badge) a zamčeným editorem (produkty nelze přesouvat)
**Název souboru:** `supplier-flyer-pending-preapproval.png`

### 29. Ukázka vygenerovaného PDF letáku
**Jak vytvořit:** Detail letáku → "📄 Generovat PDF"
**Co zachytit:** Otevřené PDF v prohlížeči - stránka A4 s produkty, cenami, promo obrázky v profesionálním layoutu
**Název souboru:** `supplier-flyer-pdf.png`

### 30. Detail odmítnutého letáku s důvodem zamítnutí
**Jak vytvořit:** Po zamítnutí letáku předschvalovatelem/schvalovatelem
**Co zachytit:** Detail letáku se stavem "Zamítnuto" (červený badge), text s důvodem zamítnutí a tlačítko "✏️ Upravit"
**Název souboru:** `supplier-flyer-rejected.png`

---

## PŘEDSCHVALOVATEL (6 screenshotů)

### 31. Seznam letáků čekajících na předschválení
**Jak vytvořit:** Přihlásit jako pre-approver → Schvalování
**Co zachytit:** Tabulka s letáky čekajícími na předschválení: název, dodavatel, platnost od-do, stav, tlačítko "Zobrazit detail"
**Název souboru:** `preapprover-pending-list.png`

### 32. Detail letáku v režimu předschválení
**Jak vytvořit:** Předschvalovatel → kliknout na detail letáku
**Co zachytit:** Detail s náhledem všech stránek, tlačítko "📄 Náhled PDF", kontrolní seznam (EAN kódy, ceny, obrázky), tlačítka "✅ Předschválit" a "❌ Zamítnout"
**Název souboru:** `preapprover-flyer-detail.png`

### 33. Předschválení letáku - potvrzovací dialog
**Jak vytvořit:** Detail → kliknout "✅ Předschválit"
**Co zachytit:** Potvrzovací dialog s textem "Opravdu chcete předschválit tento leták?" a tlačítky "Ano, předschválit" / "Zrušit"
**Název souboru:** `preapprover-approve-dialog.png`

### 34. Leták po předschválení čekající na finální schválení
**Jak vytvořit:** Po předschválení letáku
**Co zachytit:** Detail letáku se stavem "Čeká na schválení" (žlutý badge) a informací o předschvalovateli
**Název souboru:** `preapprover-flyer-approved.png`

### 35. Dialog pro zamítnutí letáku s uvedením důvodu
**Jak vytvořit:** Detail → kliknout "❌ Zamítnout"
**Co zachytit:** Modální dialog s textarea pro důvod zamítnutí a tlačítky "Zamítnout leták" (červené) / "Zrušit"
**Název souboru:** `preapprover-reject-dialog.png`

### 36. Historie schvalování letáku
**Jak vytvořit:** Detail letáku → scroll dolů k sekci "Historie"
**Co zachytit:** Sekce "Historie schvalování" s časovou osou akcí: kdo, kdy, jakou akci provedl, případné poznámky/důvody
**Název souboru:** `preapprover-flyer-history.png`

---

## SCHVALOVATEL (5 screenshotů)

### 37. Seznam letáků čekajících na finální schválení
**Jak vytvořit:** Přihlásit jako approver → Schvalování
**Co zachytit:** Tabulka s letáky čekajícími na finální schválení: název, dodavatel, předschvalovatel, platnost, stav, tlačítko "Zobrazit detail"
**Název souboru:** `approver-pending-list.png`

### 38. Detail letáku v režimu finálního schválení
**Jak vytvořit:** Schvalovatel → kliknout na detail letáku
**Co zachytit:** Detail s náhledem stránek, informace o předschválení (kdo předschválil, kdy), tlačítko "📄 Náhled PDF", tlačítka "✅ Schválit" a "❌ Zamítnout"
**Název souboru:** `approver-flyer-detail.png`

### 39. Schválení letáku - potvrzení a výsledný stav
**Jak vytvořit:** Detail → kliknout "✅ Schválit" → potvrdit
**Co zachytit:** Potvrzovací dialog a následně detail se stavem "Schváleno" (zelený badge)
**Název souboru:** `approver-flyer-approved.png`

### 40. Aktivní leták po schválení
**Jak vytvořit:** Po schválení letáku (pokud je v období platnosti)
**Co zachytit:** Detail aktivního letáku se stavem "Aktivní" (zelený badge) a informacemi o schválení
**Název souboru:** `approver-flyer-active.png`

### 41. Přehled všech aktivních letáků
**Jak vytvořit:** Schvalovatel → Aktivní letáky
**Co zachytit:** Stránka s přehledem všech aktivních letáků: karty s náhledem, název, platnost, tlačítka "📄 PDF", "🛑 Ukončit předčasně", "👁️ Detail"
**Název souboru:** `approver-active-flyers.png`

---

## KONCOVÝ UŽIVATEL (5 screenshotů)

### 42. Dashboard koncového uživatele s aktivními letáky
**Jak vytvořit:** Přihlásit jako end user → úvodní stránka
**Co zachytit:** Dashboard s kartami aktivních letáků, vyhledávací pole, filtr podle značek, tlačítka "📄 Zobrazit PDF" / "👁️ Detail"
**Název souboru:** `enduser-dashboard.png`

### 43. Zobrazení PDF letáku v prohlížeči
**Jak vytvořit:** End user → kliknout "📄 Zobrazit PDF"
**Co zachytit:** PDF otevřené v novém okně prohlížeče s možnostmi stažení, tisku, sdílení (toolbar prohlížeče)
**Název souboru:** `enduser-pdf-view.png`

### 44. Detail letáku pro koncového uživatele
**Jak vytvořit:** End user → kliknout "👁️ Detail"
**Co zachytit:** Detailní zobrazení s náhledem všech stránek, seznam produktů s cenami, promo obrázky, informace o platnosti
**Název souboru:** `enduser-flyer-detail.png`

### 45. Filtrace a řazení aktivních letáků
**Jak vytvořit:** End user → použít filtry a řazení
**Co zachytit:** Rozhraní s aktivními filtry: vyhledávací pole (vyplněné), filtr podle značek (vybrané značky), dropdown pro řazení (např. "Od nejnovějšího")
**Název souboru:** `enduser-filters.png`

### 46. Stránka 'Moje letáky' pro koncového uživatele
**Jak vytvořit:** End user → Moje letáky
**Co zachytit:** Přehled vlastních konceptů end usera, tlačítko "+ Nový leták", seznam konceptů s možností editace
**Název souboru:** `enduser-my-flyers.png`

---

## Instrukce pro vytváření screenshotů:

1. **Rozlišení:** Používej celou obrazovku v rozumném rozlišení (min. 1920x1080)
2. **Formát:** Ukládej jako PNG pro nejlepší kvalitu
3. **Obsah:** Používej realistická testovací data (ne "test", "test123" apod.)
4. **Osobní údaje:** NEPOUŽÍVEJ skutečné osobní údaje, emaily, telefony
5. **Konzistence:** Snaž se použít stejné testovací produkty/letáky napříč screenshoty kde to dává smysl
6. **Zvýraznění:** Pokud je potřeba ukázat konkrétní tlačítko/akci, můžeš přidat červený rámeček/šipku v editoru
7. **Umístění:** Všechny screenshoty ulož do složky `public/guide-screenshots/`

Po vytvoření screenshotů budu moct aktualizovat HTML nápovědu a vložit je na správná místa.
