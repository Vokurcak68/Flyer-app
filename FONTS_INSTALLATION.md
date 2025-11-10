# Instalace Vodafone Fontů pro Produkci

## DŮLEŽITÉ
Pro správné generování PDF letáků je nutné nainstalovat Vodafone fonty na produkční Windows Server.

## Požadované Fonty

Aplikace vyžaduje následující fonty v `C:\Windows\Fonts\`:

1. **VodafoneRg.ttf** - Vodafone Regular
   - Používá se pro běžný text v produktech (názvy produktů, popisy)

2. **VodafoneRgBd.ttf** - Vodafone Regular Bold
   - Používá se pro brand názvy a ceny

3. **VodafoneLt.ttf** - Vodafone Light (volitelný)
   - Používá se pro doplňkový text

## Instalace Fontů na Produkčním Serveru

### Krok 1: Získání fontů
1. Na vývojovém počítači zkopírujte fonty z `C:\Windows\Fonts\`:
   - VodafoneRg.ttf
   - VodafoneRgBd.ttf
   - VodafoneLt.ttf
2. Zkopírujte je na USB nebo přeneste jiným způsobem na produkční server

### Krok 2: Instalace fontů
Na produkčním Windows Serveru:

**Metoda A - Automatická instalace (doporučeno):**
1. Klikněte pravým tlačítkem na každý `.ttf` soubor
2. Vyberte "Install" nebo "Nainstalovat pro všechny uživatele"
3. Fonty se automaticky zkopírují do `C:\Windows\Fonts\`

**Metoda B - Ruční kopírování:**
1. Otevřete `C:\Windows\Fonts\` v Průzkumníku
2. Přetáhněte nebo zkopírujte `.ttf` soubory do této složky
3. Windows je automaticky nainstaluje

### Krok 3: Restart Backend
Po instalaci fontů restartujte backend aplikaci:
```bash
pm2 restart flyer-api
```
nebo
```bash
# Pokud používáte Windows Service
net stop "Flyer Management API"
net start "Flyer Management API"
```

## Ověření Instalace

### 1. Kontrola přítomnosti fontů
Zkontrolujte, že fonty existují:
```powershell
Get-ChildItem C:\Windows\Fonts | Where-Object { $_.Name -like '*Vodafone*' }
```

### 2. Kontrola backend logů
Backend při startu loguje, pokud fonty nejsou nalezeny:
```bash
pm2 logs flyer-api
```
Hledejte varování typu: "Could not register fonts"

### 3. Test PDF generování
1. Přihlaste se do aplikace
2. Otevřete existující leták
3. Vygenerujte PDF (tlačítko "📄 Zobrazit PDF")
4. Zkontrolujte, že produkty mají správný Vodafone font (ne Arial fallback)

## Fallback Chování

Pokud Vodafone fonty nejsou nalezeny, aplikace použije fallback fonty:
- **Vodafone-Rg** → Arial
- **Vodafone-Rg-Bold** → Arial Bold
- **Vodafone-Lt** → Arial

⚠️ **Poznámka:** Fallback fonty fungují, ale PDF nebude mít správný brand vzhled.

## Řešení Problémů

### Problém: Fonty nejsou viditelné po instalaci
**Řešení:**
1. Zkontrolujte, že jste použili "Install for all users"
2. Restartujte backend service
3. V krajním případě restartujte celý server

### Problém: PDF stále používá Arial místo Vodafone
**Řešení:**
1. Zkontrolujte, že názvy fontů jsou přesně:
   - `VodafoneRg.ttf` (case-sensitive)
   - `VodafoneRgBd.ttf`
   - `VodafoneLt.ttf`
2. Zkontrolujte backend logy pro font warnings
3. Ověřte, že backend má přístup k `C:\Windows\Fonts\`

### Problém: Backend nemá přístup k fontům
**Řešení:**
1. Zkontrolujte oprávnění na `C:\Windows\Fonts\`
2. Ujistěte se, že backend běží pod účtem s přístupem k system fontům
3. Pokud běží pod service účtem, možná bude potřeba přidat explicitní oprávnění

## Soubory v Kódu

Registrace fontů probíhá v:
- **Backend:** `backend/src/flyers/pdf.service.ts` (řádky 82-103)
- **Frontend:** Fonty se používají v CSS pro zobrazení produktů

## Kontakt
Při problémech s instalací fontů kontaktujte vývojový tým.

---

**Verze dokumentu:** 1.0
**Datum:** 7. listopadu 2025
**Aplikace:** Flyer Management System v3.1.2
