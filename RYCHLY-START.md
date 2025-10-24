# 🚀 RYCHLÝ START - Flyer Management App

## ✅ Co se právě děje

**Backend se instaluje...** (běží na pozadí)

Po dokončení instalace spustíme:
1. ✅ SQLite databázi (soubor, bez instalace!)
2. ✅ Backend API (NestJS na portu 4000)
3. ✅ Frontend už běží (port 8080)

---

## 📋 Kroky k Spuštění

### 1️⃣ Backend (Po dokončení instalace)

```bash
cd c:\Projekty\flyer-app\backend

# Generovat Prisma Client
npx prisma generate

# Vytvořit databázi a tabulky
npx prisma migrate dev --name init

# Naplnit daty
npm run seed

# Spustit backend
npm run start:dev
```

### 2️⃣ Frontend (už běží!)
```
http://localhost:8080
```

---

## 🎯 Co Používáme

### Databáze: **SQLite** (místo PostgreSQL)
- ✅ Žádná instalace potřeba
- ✅ Soubor: `backend/dev.db`
- ✅ Perfektní pro vývoj
- ✅ Lze upgrade na PostgreSQL později

### Backend: **NestJS + Prisma**
- Port: 4000
- API: http://localhost:4000/api

### Frontend: **React**
- Port: 8080
- URL: http://localhost:8080

---

## 📧 Demo Účty

```
📦 Dodavatel:    dodavatel@acme.cz / admin
✅ Schvalovatel: schvalovatel1@company.cz / admin
✅ Schvalovatel: schvalovatel2@company.cz / admin
👤 Uživatel:     uzivatel@email.cz / admin
```

---

## 🔧 Užitečné Příkazy

### Backend
```bash
npm run start:dev     # Spustit s watch mode
npm run start         # Spustit produkční
npm run build         # Build
npx prisma studio     # Otevřít DB viewer v prohlížeči
```

### Databáze
```bash
npx prisma migrate dev      # Nová migrace
npx prisma migrate reset    # Reset DB
npm run seed                # Naplnit daty
npx prisma studio          # GUI pro databázi
```

---

## 📁 Struktura Projektu

```
flyer-app/
├── backend/                 ← NOVÝ Backend!
│   ├── src/
│   │   ├── main.ts         ← Entry point
│   │   ├── app.module.ts   ← Root module
│   │   ├── prisma/         ← Database service
│   │   └── seed.ts         ← Data seeding
│   ├── prisma/
│   │   └── schema.prisma   ← Database schema
│   ├── dev.db              ← SQLite database (vytvoří se)
│   └── package.json
├── src/
│   └── App.tsx             ← Frontend React app
└── build/                  ← Frontend build (běží)
```

---

## ⏱️ Časová Osa

1. ✅ **HOTOVO:** Frontend build
2. ✅ **HOTOVO:** Frontend server (port 8080)
3. 🔄 **PROBÍHÁ:** Backend instalace závislostí
4. ⏳ **ČEKÁ:** Prisma generate
5. ⏳ **ČEKÁ:** Database migrace
6. ⏳ **ČEKÁ:** Data seed
7. ⏳ **ČEKÁ:** Backend start

---

## 🎉 Po Spuštění

### Otevřete prohlížeč:

**Frontend:** http://localhost:8080
- Přihlaste se demo účtem
- Funguje s localStorage (zatím)

**Backend API:** http://localhost:4000/api
- REST API endpointy
- Připraveno k propojení

**Prisma Studio:** http://localhost:5555
```bash
npx prisma studio
```
- GUI pro databázi
- Procházení dat

---

## 🔄 Propojení Frontend ↔ Backend

Po spuštění backendu aktualizujeme frontend aby používal API místo localStorage.

V `src/App.tsx` změníme:
```typescript
// BEFORE (localStorage)
const getFromDB = (key: string) => JSON.parse(localStorage.getItem(key) || '[]');

// AFTER (API)
const getFromDB = async (key: string) => {
  const response = await fetch(`http://localhost:4000/api/${key}`);
  return response.json();
};
```

---

## 🐛 Troubleshooting

### Backend instalace trvá dlouho
```bash
# Zkontrolovat progress
cd c:\Projekty\flyer-app\backend
npm install --verbose
```

### Port 4000 je obsazený
```bash
# Najít proces
netstat -ano | findstr :4000

# Ukončit
taskkill /PID <PID> /F
```

### Prisma chyby
```bash
# Smazat node_modules a reinstall
cd backend
rm -rf node_modules
npm install
npx prisma generate
```

---

## 📚 Další Kroky

1. ✅ Spustit backend
2. 🔧 Propojit frontend s backendem
3. 🧪 Otestovat workflow
4. 🚀 Přidat API endpointy
5. 📊 Upgrade na PostgreSQL (volitelné)

---

**Status:** 🔄 Instalace běží...

*Aktualizováno: 20. října 2025*
