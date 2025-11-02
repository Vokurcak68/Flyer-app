# Testovací scénáře - Správa letáků

## Obsah
1. [Přihlášení a autentizace](#1-přihlášení-a-autentizace)
2. [Administrátor - Správa uživatelů](#2-administrátor---správa-uživatelů)
3. [Administrátor - Správa značek](#3-administrátor---správa-značek)
4. [Administrátor - Správa ikon](#4-administrátor---správa-ikon)
5. [Administrátor - Správa promo obrázků](#5-administrátor---správa-promo-obrázků)
6. [Dodavatel - Správa produktů](#6-dodavatel---správa-produktů)
7. [Dodavatel - Správa promo obrázků](#7-dodavatel---správa-promo-obrázků)
8. [Dodavatel - Tvorba a správa letáků](#8-dodavatel---tvorba-a-správa-letáků)
9. [Předschvalovatel - Schvalování letáků](#9-předschvalovatel---schvalování-letáků)
10. [Schvalovatel - Finální schvalování](#10-schvalovatel---finální-schvalování)
11. [Koncový uživatel - Moje letáky](#11-koncový-uživatel---moje-letáky)
12. [Všichni uživatelé - Aktivní letáky](#12-všichni-uživatelé---aktivní-letáky)

---

## 1. Přihlášení a autentizace

### TC-AUTH-001: Přihlášení administrátora
**Předpoklady:** Existuje uživatel s rolí admin
**Kroky:**
1. Otevřít aplikaci na `/login`
2. Zadat email administrátora
3. Zadat heslo
4. Kliknout na "Přihlásit se"

**Očekávaný výsledek:**
- Uživatel je přesměrován na `/dashboard`
- V hlavičce je zobrazeno jméno uživatele a role "Administrátor"
- Menu obsahuje: Přehled, Uživatelé, Ikony, Značky, Promo obrázky

### TC-AUTH-002: Přihlášení dodavatele
**Předpoklady:** Existuje uživatel s rolí supplier
**Kroky:**
1. Otevřít aplikaci na `/login`
2. Zadat email dodavatele
3. Zadat heslo
4. Kliknout na "Přihlásit se"

**Očekávaný výsledek:**
- Uživatel je přesměrován na `/dashboard`
- V hlavičce je zobrazeno jméno uživatele a role "Dodavatel"
- Menu obsahuje: Přehled, Produkty, Promo obrázky, Letáky

### TC-AUTH-003: Přihlášení předschvalovatele
**Předpoklady:** Existuje uživatel s rolí pre_approver
**Kroky:**
1. Otevřít aplikaci na `/login`
2. Zadat email předschvalovatele
3. Zadat heslo
4. Kliknout na "Přihlásit se"

**Očekávaný výsledek:**
- Uživatel je přesměrován na `/dashboard`
- V hlavičce je zobrazeno jméno uživatele a role "Předschvalovatel"
- Menu obsahuje: Přehled, Předschvalování, Aktivní letáky

### TC-AUTH-004: Přihlášení schvalovatele
**Předpoklady:** Existuje uživatel s rolí approver
**Kroky:**
1. Otevřít aplikaci na `/login`
2. Zadat email schvalovatele
3. Zadat heslo
4. Kliknout na "Přihlásit se"

**Očekávaný výsledek:**
- Uživatel je přesměrován na `/dashboard`
- V hlavičce je zobrazeno jméno uživatele a role "Schvalovatel"
- Menu obsahuje: Přehled, Schvalování, Aktivní letáky

### TC-AUTH-005: Přihlášení koncového uživatele
**Předpoklady:** Existuje uživatel s rolí end_user
**Kroky:**
1. Otevřít aplikaci na `/login`
2. Zadat email koncového uživatele
3. Zadat heslo
4. Kliknout na "Přihlásit se"

**Očekávaný výsledek:**
- Uživatel je přesměrován na `/dashboard`
- V hlavičce je zobrazeno jméno uživatele a role "Koncový uživatel"
- Menu obsahuje: Přehled, Aktivní letáky, Moje letáky

### TC-AUTH-006: Neplatné přihlašovací údaje
**Kroky:**
1. Otevřít aplikaci na `/login`
2. Zadat neplatný email nebo heslo
3. Kliknout na "Přihlásit se"

**Očekávaný výsledek:**
- Zobrazí se chybová hláška
- Uživatel zůstane na přihlašovací stránce

### TC-AUTH-007: Odhlášení
**Předpoklady:** Uživatel je přihlášen
**Kroky:**
1. Kliknout na ikonu odhlášení v hlavičce

**Očekávaný výsledek:**
- Uživatel je odhlášen
- Uživatel je přesměrován na `/login`

---

## 2. Administrátor - Správa uživatelů

### TC-ADMIN-USER-001: Zobrazení seznamu uživatelů
**Předpoklady:** Přihlášen jako admin
**Kroky:**
1. Kliknout na "Uživatelé" v menu

**Očekávaný výsledek:**
- Zobrazí se seznam všech uživatelů
- Pro každého uživatele je vidět: jméno, email, role, přiřazené značky
- Je k dispozici tlačítko "Přidat uživatele"

### TC-ADMIN-USER-002: Vytvoření nového uživatele - Dodavatel
**Předpoklady:** Přihlášen jako admin, na stránce `/admin/users`
**Kroky:**
1. Kliknout na "Přidat uživatele"
2. Vyplnit formulář:
   - Email: `novydodavatel@test.cz`
   - Heslo: `Test123!`
   - Jméno: `Jan`
   - Příjmení: `Nový`
   - Role: `Dodavatel`
3. Vybrat alespoň jednu značku
4. Kliknout na "Vytvořit uživatele"

**Očekávaný výsledek:**
- Zobrazí se zpráva o úspěšném vytvoření
- Nový uživatel se objeví v seznamu
- Lze se přihlásit s novými údaji

### TC-ADMIN-USER-003: Vytvoření uživatele s duplicitním emailem
**Předpoklady:** Přihlášen jako admin, existuje uživatel s emailem `test@test.cz`
**Kroky:**
1. Kliknout na "Přidat uživatele"
2. Vyplnit email: `test@test.cz`
3. Vyplnit ostatní povinná pole
4. Kliknout na "Vytvořit uživatele"

**Očekávaný výsledek:**
- Zobrazí se chybová hláška o duplicitním emailu
- Uživatel není vytvořen

### TC-ADMIN-USER-004: Úprava uživatele
**Předpoklady:** Přihlášen jako admin, existuje uživatel
**Kroky:**
1. Kliknout na "Upravit" u vybraného uživatele
2. Změnit jméno a přiřazené značky
3. Kliknout na "Uložit změny"

**Očekávaný výsledek:**
- Zobrazí se zpráva o úspěšné aktualizaci
- Změny se projeví v seznamu uživatelů

### TC-ADMIN-USER-005: Smazání uživatele
**Předpoklady:** Přihlášen jako admin, existuje uživatel, který nemá vytvořené žádné produkty ani letáky
**Kroky:**
1. Kliknout na "Smazat" u vybraného uživatele
2. Potvrdit smazání v dialogu

**Očekávaný výsledek:**
- Uživatel je smazán
- Již se nezobrazuje v seznamu

### TC-ADMIN-USER-006: Přiřazení značek dodavateli
**Předpoklady:** Přihlášen jako admin, existuje dodavatel bez značek
**Kroky:**
1. Upravit dodavatele
2. Vybrat několik značek
3. Uložit změny

**Očekávaný výsledek:**
- Dodavatel má přiřazené vybrané značky
- Dodavatel vidí pouze produkty z těchto značek

---

## 3. Administrátor - Správa značek

### TC-ADMIN-BRAND-001: Zobrazení seznamu značek
**Předpoklady:** Přihlášen jako admin
**Kroky:**
1. Kliknout na "Značky" v menu

**Očekávaný výsledek:**
- Zobrazí se seznam všech značek
- Pro každou značku je vidět: název, logo
- Je k dispozici tlačítko "Přidat značku"

### TC-ADMIN-BRAND-002: Vytvoření nové značky
**Předpoklady:** Přihlášen jako admin
**Kroky:**
1. Kliknout na "Přidat značku"
2. Vyplnit název: `Testovací značka`
3. Nahrát logo (PNG/JPG)
4. Kliknout na "Vytvořit značku"

**Očekávaný výsledek:**
- Značka je vytvořena
- Zobrazí se v seznamu s logem

### TC-ADMIN-BRAND-003: Úprava značky
**Předpoklady:** Přihlášen jako admin, existuje značka
**Kroky:**
1. Kliknout na "Upravit" u vybrané značky
2. Změnit název
3. Nahrát nové logo
4. Kliknout na "Uložit změny"

**Očekávaný výsledek:**
- Změny jsou uloženy
- Nové logo se zobrazuje

### TC-ADMIN-BRAND-004: Smazání značky bez produktů
**Předpoklady:** Přihlášen jako admin, existuje značka bez produktů
**Kroky:**
1. Kliknout na "Smazat" u vybrané značky
2. Potvrdit smazání

**Očekávaný výsledek:**
- Značka je smazána

### TC-ADMIN-BRAND-005: Pokus o smazání značky s produkty
**Předpoklady:** Přihlášen jako admin, existuje značka s produkty
**Kroky:**
1. Kliknout na "Smazat" u vybrané značky
2. Potvrdit smazání

**Očekávaný výsledek:**
- Zobrazí se chybová hláška, že značka má produkty
- Značka není smazána

---

## 4. Administrátor - Správa ikon

### TC-ADMIN-ICON-001: Zobrazení seznamu ikon
**Předpoklady:** Přihlášen jako admin
**Kroky:**
1. Kliknout na "Ikony" v menu

**Očekávaný výsledek:**
- Zobrazí se seznam všech ikon
- Pro každou ikonu je vidět: název, obrázek, typ (normální/energetická třída)

### TC-ADMIN-ICON-002: Přidání běžné ikony
**Předpoklady:** Přihlášen jako admin
**Kroky:**
1. Kliknout na "Přidat ikonu"
2. Vyplnit název: `Sleva`
3. Vybrat typ: `Běžná ikona`
4. Nahrát obrázek
5. Kliknout na "Vytvořit ikonu"

**Očekávaný výsledek:**
- Ikona je vytvořena
- Zobrazí se v seznamu

### TC-ADMIN-ICON-003: Přidání ikony energetické třídy
**Předpoklady:** Přihlášen jako admin
**Kroky:**
1. Kliknout na "Přidat ikonu"
2. Vyplnit název: `A+++`
3. Vybrat typ: `Energetická třída`
4. Nahrát obrázek
5. Kliknout na "Vytvořit ikonu"

**Očekávaný výsledek:**
- Ikona je vytvořena
- Je označena jako energetická třída

### TC-ADMIN-ICON-004: Úprava ikony
**Předpoklady:** Přihlášen jako admin, existuje ikona
**Kroky:**
1. Kliknout na "Upravit" u vybrané ikony
2. Změnit název a nahrát nový obrázek
3. Kliknout na "Uložit změny"

**Očekávaný výsledek:**
- Změny jsou uloženy

### TC-ADMIN-ICON-005: Smazání ikony
**Předpoklady:** Přihlášen jako admin, existuje ikona nepoužitá v produktech
**Kroky:**
1. Kliknout na "Smazat" u vybrané ikony
2. Potvrdit smazání

**Očekávaný výsledek:**
- Ikona je smazána

---

## 5. Administrátor - Správa promo obrázků

### TC-ADMIN-PROMO-001: Zobrazení promo obrázků
**Předpoklady:** Přihlášen jako admin
**Kroky:**
1. Kliknout na "Promo obrázky" v menu

**Očekávaný výsledek:**
- Zobrazí se všechny promo obrázky ze všech značek
- Je možné filtrovat podle velikosti (single/double/quadruple)

### TC-ADMIN-PROMO-002: Přidání promo obrázku
**Předpoklady:** Přihlášen jako admin
**Kroky:**
1. Kliknout na "Přidat promo obrázek"
2. Vyplnit název
3. Vybrat značku
4. Vybrat velikost (např. single)
5. Nahrát obrázek
6. Kliknout na "Vytvořit"

**Očekávaný výsledek:**
- Promo obrázek je vytvořen
- Zobrazí se v seznamu

### TC-ADMIN-PROMO-003: Smazání promo obrázku
**Předpoklady:** Přihlášen jako admin
**Kroky:**
1. Kliknout na "Smazat" u vybraného promo obrázku
2. Potvrdit smazání

**Očekávaný výsledek:**
- Promo obrázek je smazán

---

## 6. Dodavatel - Správa produktů

### TC-SUPP-PROD-001: Zobrazení seznamu produktů
**Předpoklady:** Přihlášen jako dodavatel
**Kroky:**
1. Kliknout na "Produkty" v menu

**Očekávaný výsledek:**
- Zobrazí se pouze produkty patřící k přiřazeným značkám dodavatele
- Je k dispozici filtrování podle značky a kategorie
- Je možné vyhledávat podle názvu

### TC-SUPP-PROD-002: Vytvoření nového produktu
**Předpoklady:** Přihlášen jako dodavatel, má přiřazené značky
**Kroky:**
1. Kliknout na "Přidat produkt"
2. Vyplnit formulář:
   - Název: `Testovací produkt`
   - EAN kód: `1234567890123`
   - Značka: vybrat z přiřazených
   - Kategorie: vybrat kategorii
   - Popis: vyplnit popis (max 16 řádků)
   - Cena: `999`
   - Původní cena: `1299` (volitelné)
3. Nahrát obrázek produktu
4. Přidat ikony (volitelné)
5. Kliknout na "Vytvořit produkt"

**Očekávaný výsledek:**
- Produkt je vytvořen
- Zobrazí se v seznamu produktů
- Má správnou značku a kategorii

### TC-SUPP-PROD-003: Validace EAN kódu
**Předpoklady:** Přihlášen jako dodavatel
**Kroky:**
1. Kliknout na "Přidat produkt"
2. Vyplnit EAN kód: `123` (neplatný)
3. Vyplnit ostatní pole
4. Kliknout na "Vytvořit produkt"

**Očekávaný výsledek:**
- Zobrazí se chyba validace EAN kódu
- Produkt není vytvořen

### TC-SUPP-PROD-004: Kontrola délky popisu
**Předpoklady:** Přihlášen jako dodavatel
**Kroky:**
1. Vytvořit nebo upravit produkt
2. Zadat popis delší než 16 řádků

**Očekávaný výsledek:**
- Zobrazí se upozornění na překročení limitu
- Popis je zkrácen nebo nelze uložit

### TC-SUPP-PROD-005: Úprava produktu
**Předpoklady:** Přihlášen jako dodavatel, existuje produkt
**Kroky:**
1. Kliknout na "Upravit" u vybraného produktu
2. Změnit název, cenu a obrázek
3. Přidat novou ikonu
4. Kliknout na "Uložit změny"

**Očekávaný výsledek:**
- Změny jsou uloženy
- Nová ikona se zobrazuje v pořadí

### TC-SUPP-PROD-006: Přeuspořádání ikon produktu
**Předpoklady:** Přihlášen jako dodavatel, produkt má více ikon
**Kroky:**
1. Upravit produkt s více ikonami
2. Přetáhnout ikony do jiného pořadí pomocí drag & drop
3. Uložit změny

**Očekávaný výsledek:**
- Pořadí ikon je změněno
- Změna se projeví i v náhledu letáku

### TC-SUPP-PROD-007: Smazání produktu nepoužitého v letácích
**Předpoklady:** Přihlášen jako dodavatel, existuje produkt nepoužitý v letácích
**Kroky:**
1. Kliknout na "Smazat" u vybraného produktu
2. Potvrdit smazání

**Očekávaný výsledek:**
- Produkt je smazán

### TC-SUPP-PROD-008: Pokus o smazání produktu použitého v letáku
**Předpoklady:** Přihlášen jako dodavatel, existuje produkt použitý v letáku
**Kroky:**
1. Kliknout na "Smazat" u vybraného produktu
2. Potvrdit smazání

**Očekávaný výsledek:**
- Zobrazí se chybová hláška
- Produkt není smazán

### TC-SUPP-PROD-009: Filtrování produktů podle značky
**Předpoklady:** Přihlášen jako dodavatel, má přiřazeno více značek
**Kroky:**
1. Na stránce produktů vybrat filtr značky
2. Vybrat konkrétní značku

**Očekávaný výsledek:**
- Zobrazí se pouze produkty vybrané značky

### TC-SUPP-PROD-010: Vyhledávání produktů
**Předpoklady:** Přihlášen jako dodavatel
**Kroky:**
1. Do vyhledávacího pole zadat část názvu produktu
2. Stisknout Enter nebo kliknout na vyhledávání

**Očekávaný výsledek:**
- Zobrazí se pouze produkty odpovídající hledanému výrazu

### TC-SUPP-PROD-011: Import produktů z CSV
**Předpoklady:** Přihlášen jako dodavatel, připraven CSV soubor
**Kroky:**
1. Kliknout na "Importovat z CSV"
2. Vybrat CSV soubor s produkty
3. Kliknout na "Import"

**Očekávaný výsledek:**
- Produkty jsou naimportovány
- Zobrazí se statistika importu

### TC-SUPP-PROD-012: Export produktů do CSV
**Předpoklady:** Přihlášen jako dodavatel
**Kroky:**
1. Kliknout na "Exportovat do CSV"

**Očekávaný výsledek:**
- Stáhne se CSV soubor se všemi produkty dodavatele

---

## 7. Dodavatel - Správa promo obrázků

### TC-SUPP-PROMO-001: Zobrazení promo obrázků dodavatele
**Předpoklady:** Přihlášen jako dodavatel
**Kroky:**
1. Kliknout na "Promo obrázky" v menu

**Očekávaný výsledek:**
- Zobrazí se pouze promo obrázky značek přiřazených dodavateli
- Je možné filtrovat podle velikosti

### TC-SUPP-PROMO-002: Přidání promo obrázku dodavatelem
**Předpoklady:** Přihlášen jako dodavatel
**Kroky:**
1. Kliknout na "Přidat promo obrázek"
2. Vyplnit název
3. Vybrat značku (z přiřazených)
4. Vybrat velikost
5. Nahrát obrázek
6. Kliknout na "Vytvořit"

**Očekávaný výsledek:**
- Promo obrázek je vytvořen
- Patří k vybrané značce

### TC-SUPP-PROMO-003: Smazání vlastního promo obrázku
**Předpoklady:** Přihlášen jako dodavatel, má vytvořený promo obrázek
**Kroky:**
1. Kliknout na "Smazat" u svého promo obrázku
2. Potvrdit smazání

**Očekávaný výsledek:**
- Promo obrázek je smazán

---

## 8. Dodavatel - Tvorba a správa letáků

### TC-SUPP-FLYER-001: Zobrazení seznamu letáků
**Předpoklady:** Přihlášen jako dodavatel
**Kroky:**
1. Kliknout na "Letáky" v menu

**Očekávaný výsledek:**
- Zobrazí se seznam letáků dodavatele
- Pro každý leták je vidět: název, platnost, stav, počet stránek

### TC-SUPP-FLYER-002: Vytvoření nového letáku
**Předpoklady:** Přihlášen jako dodavatel
**Kroky:**
1. Kliknout na "Vytvořit nový leták"
2. Vyplnit formulář:
   - Název: `Vánoční leták 2025`
   - Platnost od: `01.12.2025`
   - Platnost do: `31.12.2025`
3. Kliknout na "Vytvořit"

**Očekávaný výsledek:**
- Leták je vytvořen ve stavu "Koncept"
- Otevře se editor letáku
- Leták má výchozí 1 stránku

### TC-SUPP-FLYER-003: Přidání stránky do letáku
**Předpoklady:** Přihlášen jako dodavatel, otevřen editor letáku
**Kroky:**
1. Kliknout na "Přidat stránku"
2. Zadat číslo stránky

**Očekávaný výsledek:**
- Nová stránka je přidána
- Má 8 prázdných slotů

### TC-SUPP-FLYER-004: Přidání produktu do slotu pomocí drag & drop
**Předpoklady:** Otevřen editor letáku, zobrazeny produkty
**Kroky:**
1. Vybrat produkt ze seznamu
2. Přetáhnout ho myší na prázdný slot
3. Pustit myš

**Očekávaný výsledek:**
- Produkt se zobrazí ve slotu
- Jsou vidět: obrázek, název, značka, cena, ikony
- Leták je automaticky uložen

### TC-SUPP-FLYER-005: Přidání produktu kliknutím
**Předpoklady:** Otevřen editor letáku
**Kroky:**
1. Kliknout na prázdný slot
2. V dialogu vybrat produkt
3. Potvrdit výběr

**Očekávaný výsledek:**
- Produkt je přidán do slotu

### TC-SUPP-FLYER-006: Přidání promo obrázku do slotu
**Předpoklady:** Otevřen editor letáku, přepnuto na tab "Promo"
**Kroky:**
1. Přetáhnout promo obrázek velikosti "single" na prázdný slot

**Očekávaný výsledek:**
- Promo obrázek se zobrazí v 1 slotu

### TC-SUPP-FLYER-007: Přidání dvojitého promo obrázku
**Předpoklady:** Otevřen editor letáku, jsou volné 2 sloty vedle sebe
**Kroky:**
1. Přetáhnout promo obrázek velikosti "double" na první ze dvou slotů

**Očekávaný výsledek:**
- Promo obrázek zabere 2 sloty vedle sebe

### TC-SUPP-FLYER-008: Přidání čtverného promo obrázku
**Předpoklady:** Otevřen editor letáku, jsou volné 4 sloty (2x2)
**Kroky:**
1. Přetáhnout promo obrázek velikosti "quadruple" na levý horní slot z bloku 2x2

**Očekávaný výsledek:**
- Promo obrázek zabere 4 sloty (2x2)

### TC-SUPP-FLYER-009: Odebrání produktu ze slotu
**Předpoklady:** Ve slotu je produkt
**Kroky:**
1. Kliknout na křížek u produktu ve slotu

**Očekávaný výsledek:**
- Produkt je odstraněn
- Slot je prázdný

### TC-SUPP-FLYER-010: Přidání footer promo obrázku
**Předpoklady:** Otevřen editor letáku
**Kroky:**
1. V sekci footer kliknout na "Vybrat obrázek"
2. Vybrat promo obrázek

**Očekávaný výsledek:**
- Promo obrázek se zobrazí v patičce stránky

### TC-SUPP-FLYER-011: Vyhledávání produktů v editoru
**Předpoklady:** Otevřen editor letáku
**Kroky:**
1. Do vyhledávacího pole zadat část názvu produktu
2. Počkat na výsledky

**Očekávaný výsledek:**
- Zobrazí se pouze produkty odpovídající hledání

### TC-SUPP-FLYER-012: Navigace mezi stránkami letáku
**Předpoklady:** Leták má více stránek
**Kroky:**
1. Kliknout na tlačítko stránky (např. "2")

**Očekávaný výsledek:**
- Zobrazí se vybraná stránka
- Tlačítko aktivní stránky je zvýrazněno

### TC-SUPP-FLYER-013: Uložení rozpracovaného letáku
**Předpoklady:** V letáku jsou změny
**Kroky:**
1. Kliknout na "Uložit koncept"

**Očekávaný výsledek:**
- Zobrazí se zpráva o úspěšném uložení
- Změny jsou zachovány

### TC-SUPP-FLYER-014: Automatické ukládání
**Předpoklady:** Otevřen editor letáku
**Kroky:**
1. Přidat produkt do slotu
2. Počkat 2 sekundy

**Očekávaný výsledek:**
- Leták je automaticky uložen
- Zobrazí se krátká zpráva o autosave

### TC-SUPP-FLYER-015: Generování PDF náhledu
**Předpoklady:** Leták má alespoň 1 stránku s produkty
**Kroky:**
1. Kliknout na "Vygenerovat PDF"
2. Počkat na vygenerování

**Očekávaný výsledek:**
- PDF je vygenerováno
- Otevře se v novém okně/tabu
- Obsahuje všechny stránky letáku
- Produkty mají správné rozložení a formátování

### TC-SUPP-FLYER-016: Odeslání letáku ke schválení
**Předpoklady:** Leták je kompletní (má stránky s produkty)
**Kroky:**
1. Kliknout na "Odeslat ke schválení"
2. Potvrdit odeslání

**Očekávaný výsledek:**
- Leták změní stav na "Čeká na předschválení"
- PDF je automaticky vygenerováno
- Leták se již nedá upravovat
- Předschvalovatel dostane leták k předschválení

### TC-SUPP-FLYER-017: Úprava konceptu letáku
**Předpoklady:** Existuje leták ve stavu "Koncept"
**Kroky:**
1. V seznamu letáků kliknout na "Upravit"
2. Změnit název, platnost nebo obsah
3. Uložit

**Očekávaný výsledek:**
- Změny jsou uloženy

### TC-SUPP-FLYER-018: Smazání konceptu letáku
**Předpoklady:** Existuje leták ve stavu "Koncept"
**Kroky:**
1. Kliknout na "Smazat"
2. Potvrdit smazání

**Očekávaný výsledek:**
- Leták je smazán

### TC-SUPP-FLYER-019: Pokus o úpravu odeslaného letáku
**Předpoklady:** Leták je v procesu schvalování
**Kroky:**
1. Pokusit se otevřít leták v editoru

**Očekávaný výsledek:**
- Leták je otevřen pouze pro čtení
- Nelze přidávat/odebírat produkty

### TC-SUPP-FLYER-020: Úprava zamítnutého letáku
**Předpoklady:** Leták byl zamítnut
**Kroky:**
1. Otevřít zamítnutý leták
2. Přečíst důvod zamítnutí
3. Provést úpravy
4. Odeslat znovu ke schválení

**Očekávaný výsledek:**
- Leták lze upravovat
- Je vidět historie zamítnutí s důvodem
- Po úpravách lze odeslat znovu

### TC-SUPP-FLYER-021: Filtrování letáků podle stavu
**Předpoklady:** Existují letáky v různých stavech
**Kroky:**
1. Vybrat filtr stavu (např. "Koncept")

**Očekávaný výsledek:**
- Zobrazí se pouze letáky ve vybraném stavu

---

## 9. Předschvalovatel - Schvalování letáků

### TC-PREAPP-001: Zobrazení letáků k předschválení
**Předpoklady:** Přihlášen jako předschvalovatel
**Kroky:**
1. Kliknout na "Předschvalování" v menu

**Očekávaný výsledek:**
- Zobrazí se seznam letáků čekajících na předschválení
- Pro každý leták: název, dodavatel, platnost, datum odeslání

### TC-PREAPP-002: Zobrazení detailu letáku
**Předpoklady:** Existuje leták k předschválení
**Kroky:**
1. Kliknout na "Kontrolovat" u vybraného letáku

**Očekávaný výsledek:**
- Zobrazí se detail letáku
- Je vidět náhled všech stránek
- Lze listovat mezi stránkami
- Produkty jsou zobrazeny správně

### TC-PREAPP-003: Zobrazení PDF letáku
**Předpoklady:** V detailu letáku
**Kroky:**
1. Kliknout na "Zobrazit PDF"

**Očekávaný výsledek:**
- Otevře se PDF v novém okně
- PDF odpovídá náhledu v aplikaci

### TC-PREAPP-004: Předschválení letáku
**Předpoklady:** V detailu letáku k předschválení
**Kroky:**
1. Zadat komentář (volitelný): `V pořádku, doporučuji ke schválení`
2. Kliknout na "Předschválit"

**Očekávaný výsledek:**
- Leták změní stav na "Předschváleno"
- Leták se přesune do fronty schvalovatele
- Komentář je uložen
- Schvalovatel vidí komentář předschvalovatele

### TC-PREAPP-005: Zamítnutí letáku předschvalovatelem
**Předpoklady:** V detailu letáku k předschválení
**Kroky:**
1. Zadat důvod zamítnutí: `Chybí ceny u některých produktů`
2. Kliknout na "Zamítnout"
3. Potvrdit zamítnutí

**Očekávaný výsledek:**
- Leták změní stav na "Zamítnuto"
- Dodavatel vidí důvod zamítnutí
- Dodavatel může leták upravit a odeslat znovu

### TC-PREAPP-006: Předschválení bez komentáře
**Předpoklady:** V detailu letáku
**Kroky:**
1. Kliknout na "Předschválit" bez zadání komentáře

**Očekávaný výsledek:**
- Zobrazí se upozornění, že komentář je volitelný
- Leták lze předschválit i bez komentáře

### TC-PREAPP-007: Zamítnutí bez důvodu
**Předpoklady:** V detailu letáku
**Kroky:**
1. Kliknout na "Zamítnout" bez zadání důvodu

**Očekávaný výsledek:**
- Zobrazí se chyba, že důvod je povinný
- Leták není zamítnut

---

## 10. Schvalovatel - Finální schvalování

### TC-APP-001: Zobrazení letáků ke schválení
**Předpoklady:** Přihlášen jako schvalovatel
**Kroky:**
1. Kliknout na "Schvalování" v menu

**Očekávaný výsledek:**
- Zobrazí se pouze letáky, které prošly předschválením
- Pro každý leták je vidět informace o předschválení

### TC-APP-002: Zobrazení detailu s komentářem předschvalovatele
**Předpoklady:** Leták byl předschválen s komentářem
**Kroky:**
1. Kliknout na "Kontrolovat"

**Očekávaný výsledek:**
- Zobrazí se detail letáku
- Je vidět komentář předschvalovatele
- Datum a čas předschválení

### TC-APP-003: Schválení letáku
**Předpoklady:** V detailu předschváleného letáku
**Kroky:**
1. Zadat povinný komentář: `Schváleno k publikaci`
2. Kliknout na "Schválit"

**Očekávaný výsledek:**
- Leták změní stav na "Schváleno"
- Pokud je v rozmezí platnosti, stane se aktivním
- Zobrazí se v "Aktivních letácích"

### TC-APP-004: Zamítnutí letáku schvalovatelem
**Předpoklady:** V detailu předschváleného letáku
**Kroky:**
1. Zadat důvod: `Nevhodné obrázky produktů`
2. Kliknout na "Zamítnout"
3. Potvrdit

**Očekávaný výsledek:**
- Leták změní stav na "Zamítnuto"
- Dodavatel vidí důvod zamítnutí
- Lze upravit a odeslat znovu

### TC-APP-005: Schválení bez komentáře
**Předpoklady:** V detailu letáku
**Kroky:**
1. Kliknout na "Schválit" bez komentáře

**Očekávaný výsledek:**
- Zobrazí se chyba, že komentář je povinný
- Leták není schválen

---

## 11. Koncový uživatel - Moje letáky

### TC-ENDUSER-001: Zobrazení aktivních letáků pro inspiraci
**Předpoklady:** Přihlášen jako koncový uživatel, existují aktivní schválené letáky
**Kroky:**
1. Kliknout na "Aktivní letáky" v menu

**Očekávaný výsledek:**
- Zobrazí se seznam aktivních schválených letáků
- Lze je prohlížet
- Lze zobrazit PDF

### TC-ENDUSER-002: Zobrazení seznamu "Moje letáky"
**Předpoklady:** Přihlášen jako koncový uživatel
**Kroky:**
1. Kliknout na "Moje letáky" v menu

**Očekávaný výsledek:**
- Zobrazí se seznam vlastních letáků koncového uživatele
- Jsou vidět pouze vlastní letáky

### TC-ENDUSER-003: Vytvoření nového letáku koncovým uživatelem
**Předpoklady:** Přihlášen jako koncový uživatel
**Kroky:**
1. Kliknout na "Vytvořit nový leták"
2. Vyplnit název a platnost
3. Kliknout na "Vytvořit"

**Očekávaný výsledek:**
- Leták je vytvořen
- Otevře se editor letáku
- V seznamu produktů jsou POUZE produkty z aktivních schválených letáků

### TC-ENDUSER-004: Zobrazení pouze produktů z aktivních letáků
**Předpoklady:** Koncový uživatel v editoru letáku
**Kroky:**
1. Prohlédnout seznam dostupných produktů

**Očekávaný výsledek:**
- Zobrazí se pouze produkty, které jsou v aktivních schválených letácích
- Nelze přidat produkty, které nejsou schválené

### TC-ENDUSER-005: Přidání produktu z aktivního letáku
**Předpoklady:** Koncový uživatel v editoru
**Kroky:**
1. Vybrat produkt z aktivního letáku
2. Přetáhnout ho do slotu

**Očekávaný výsledek:**
- Produkt je přidán do slotu
- Leták je automaticky uložen

### TC-ENDUSER-006: Přidání promo obrázku z aktivních letáků
**Předpoklady:** Koncový uživatel v editoru, přepnuto na tab "Promo"
**Kroky:**
1. Vybrat promo obrázek z aktivního letáku
2. Přetáhnout ho do slotu

**Očekávaný výsledek:**
- Promo obrázek je přidán
- Je to obrázek z aktivního letáku

### TC-ENDUSER-007: Generování PDF vlastního letáku
**Předpoklady:** Koncový uživatel má vytvořený leták s produkty
**Kroky:**
1. Otevřít vlastní leták
2. Kliknout na "Vygenerovat PDF"

**Očekávaný výsledek:**
- PDF je vygenerováno
- Obsahuje produkty a promo obrázky
- Formátování odpovídá náhledu

### TC-ENDUSER-008: Úprava vlastního letáku
**Předpoklady:** Koncový uživatel má vytvořený leták
**Kroky:**
1. Otevřít leták k úpravě
2. Změnit produkty nebo název
3. Uložit

**Očekávaný výsledek:**
- Změny jsou uloženy
- Leták zůstává ve vlastnictví koncového uživatele

### TC-ENDUSER-009: Smazání vlastního letáku
**Předpoklady:** Koncový uživatel má vytvořený leták
**Kroky:**
1. Kliknout na "Smazat"
2. Potvrdit smazání

**Očekávaný výsledek:**
- Leták je smazán

### TC-ENDUSER-010: Vyhledávání produktů v editoru
**Předpoklady:** Koncový uživatel v editoru
**Kroky:**
1. Zadat název produktu do vyhledávání

**Očekávaný výsledek:**
- Zobrazí se pouze produkty z aktivních letáků odpovídající hledání

---

## 12. Všichni uživatelé - Aktivní letáky

### TC-ACTIVE-001: Zobrazení aktivních letáků (předschvalovatel)
**Předpoklady:** Přihlášen jako předschvalovatel, existují aktivní letáky
**Kroky:**
1. Kliknout na "Aktivní letáky"

**Očekávaný výsledek:**
- Zobrazí se všechny schválené aktivní letáky
- Lze je prohlížet a stáhnout PDF

### TC-ACTIVE-002: Zobrazení aktivních letáků (schvalovatel)
**Předpoklady:** Přihlášen jako schvalovatel
**Kroky:**
1. Kliknout na "Aktivní letáky"

**Očekávaný výsledek:**
- Zobrazí se všechny schválené aktivní letáky

### TC-ACTIVE-003: Zobrazení aktivních letáků (koncový uživatel)
**Předpoklady:** Přihlášen jako koncový uživatel
**Kroky:**
1. Kliknout na "Aktivní letáky"

**Očekávaný výsledek:**
- Zobrazí se všechny schválené aktivní letáky
- Slouží jako zdroj produktů pro vlastní letáky

### TC-ACTIVE-004: Stažení PDF aktivního letáku
**Předpoklady:** V seznamu aktivních letáků
**Kroky:**
1. Kliknout na "Stáhnout PDF" u vybraného letáku

**Očekávaný výsledek:**
- PDF se stáhne
- Lze ho otevřít a vytisknout

### TC-ACTIVE-005: Filtrování aktivních letáků podle platnosti
**Předpoklady:** Existují letáky s různou platností
**Kroky:**
1. Použít filtr platnosti

**Očekávaný výsledek:**
- Zobrazí se pouze letáky platné v daném období

---

## Regresní testy

### TC-REGR-001: Celý workflow dodavatel → schválení → aktivní
**Kroky:**
1. Přihlásit jako dodavatel
2. Vytvořit produkt
3. Vytvořit leták
4. Přidat produkty
5. Odeslat ke schválení
6. Odhlásit se
7. Přihlásit jako předschvalovatel
8. Předschválit leták
9. Odhlásit se
10. Přihlásit jako schvalovatel
11. Schválit leták
12. Ověřit, že leták je aktivní

**Očekávaný výsledek:**
- Celý proces proběhne bez chyb
- Leták je viditelný jako aktivní

### TC-REGR-002: Workflow zamítnutí → úprava → nové schválení
**Kroky:**
1. Leták je zamítnut předschvalovatelem
2. Dodavatel upraví leták
3. Dodavatel odešle znovu
4. Předschvalovatel předschválí
5. Schvalovatel schválí

**Očekávaný výsledek:**
- Upravený leták projde schválením
- Historie zamítnutí je zachována

### TC-REGR-003: Koncový uživatel - tvorba letáku z aktivních produktů
**Kroky:**
1. Dodavatel vytvoří a schválí leták s produkty
2. Koncový uživatel vytvoří vlastní leták
3. Přidá produkty z aktivního letáku
4. Vygeneruje PDF

**Očekávaný výsledek:**
- Koncový uživatel vidí pouze schválené produkty
- PDF je správně vygenerováno

---

## Performance testy

### TC-PERF-001: Načtení seznamu produktů (1000+ položek)
**Předpoklady:** V databázi je 1000+ produktů
**Kroky:**
1. Otevřít seznam produktů
2. Změřit čas načtení

**Očekávaný výsledek:**
- Seznam se načte do 2 sekund
- Funguje paginace

### TC-PERF-002: Generování PDF složitého letáku
**Předpoklady:** Leták s 10 stránkami, plně obsazenými produkty
**Kroky:**
1. Vygenerovat PDF

**Očekávaný výsledek:**
- PDF se vygeneruje do 10 sekund
- Kvalita je dobrá

### TC-PERF-003: Autosave při rychlých změnách
**Předpoklady:** Editor letáku
**Kroky:**
1. Rychle přidávat/odebírat produkty

**Očekávaný výsledek:**
- Autosave neblokuje UI
- Změny jsou uloženy

---

## Bezpečnostní testy

### TC-SEC-001: Přístup k cizímu letáku (dodavatel)
**Předpoklady:** Dodavatel A, existuje leták dodavatele B
**Kroky:**
1. Zkusit otevřít URL letáku dodavatele B

**Očekávaný výsledek:**
- Zobrazí se chyba 403 Forbidden

### TC-SEC-002: Pokus o schválení bez oprávnění
**Předpoklady:** Přihlášen jako dodavatel
**Kroky:**
1. Zkusit zavolat API pro schválení letáku přímo

**Očekávaný výsledek:**
- API vrátí chybu 403

### TC-SEC-003: SQL Injection v vyhledávání
**Kroky:**
1. Do vyhledávacího pole zadat: `'; DROP TABLE products; --`

**Očekávaný výsledek:**
- SQL injection nefunguje
- Aplikace zůstává funkční

### TC-SEC-004: XSS útok v názvu produktu
**Kroky:**
1. Vytvořit produkt s názvem: `<script>alert('XSS')</script>`

**Očekávaný výsledek:**
- Script se nezpracuje
- Text je escapován

---

## Testy kompatibility

### TC-COMP-001: Různé prohlížeče
**Kroky:**
1. Otevřít aplikaci v Chrome, Firefox, Edge, Safari

**Očekávaný výsledek:**
- Aplikace funguje ve všech prohlížečích
- Drag & drop funguje

### TC-COMP-002: Mobilní zařízení
**Kroky:**
1. Otevřít aplikaci na tabletu/mobilu

**Očekávaný výsledek:**
- UI je responzivní
- Základní funkce fungují

### TC-COMP-003: Různé velikosti obrázků
**Kroky:**
1. Nahrát velmi velký obrázek (10MB+)
2. Nahrát velmi malý obrázek (1KB)

**Očekávaný výsledek:**
- Aplikace ošetří velikosti
- Zobrazí upozornění pokud je obrázek příliš velký

---

## Chybové stavy

### TC-ERROR-001: Ztráta spojení s backendem
**Kroky:**
1. Odpojit backend
2. Zkusit uložit leták

**Očekávaný výsledek:**
- Zobrazí se chybová hláška
- Data nejsou ztracena (pokud možno)

### TC-ERROR-002: Timeout při generování PDF
**Kroky:**
1. Vytvořit velmi složitý leták
2. Vygenerovat PDF

**Očekávaný výsledek:**
- Zobrazí se progress nebo timeout message
- Uživatel ví, co se děje

### TC-ERROR-003: Duplicitní EAN kód
**Kroky:**
1. Vytvořit produkt s EAN: `1234567890123`
2. Zkusit vytvořit další produkt se stejným EAN

**Očekávaný výsledek:**
- Zobrazí se chyba o duplicitním EAN
- Produkt není vytvořen

---

## Doporučený postup testování

1. **Fáze 1 - Základní funkčnost:**
   - Spustit všechny TC-AUTH testy
   - Spustit základní CRUD operace pro každou roli

2. **Fáze 2 - Workflow testy:**
   - Otestovat celý approval workflow (TC-REGR-001, 002)
   - Otestovat workflow koncového uživatele (TC-REGR-003)

3. **Fáze 3 - Edge cases:**
   - Bezpečnostní testy
   - Chybové stavy
   - Validace vstupů

4. **Fáze 4 - Performance a kompatibilita:**
   - Performance testy s reálným množstvím dat
   - Testy v různých prohlížečích

5. **Fáze 5 - UAT (User Acceptance Testing):**
   - Reální uživatelé testují své use cases
   - Zpětná vazba a úpravy

## Testovací data

Pro efektivní testování připravit:
- **Uživatele:** minimálně 1 z každé role
- **Značky:** alespoň 3-5 různých značek
- **Produkty:** alespoň 50 produktů různých značek
- **Ikony:** sada běžných ikon a energetických tříd
- **Promo obrázky:** několik v každé velikosti (single, double, quadruple)
- **Letáky:** různé stavy (koncept, pending, approved, rejected)
