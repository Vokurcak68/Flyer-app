# 💾 Databázová Konfigurace - Flyer Management App

## 📊 Aktuální Stav

### ✅ V Produkci Běží: **localStorage (Browser Storage)**

Aplikace momentálně **NEBĚŽÍ** na klasické databázi, ale používá **localStorage** jako mock databázi.

---

## 🔍 Co je localStorage?

**localStorage** je vestavěné úložiště v prohlížeči, které umožňuje ukládat data přímo v prohlížeči uživatele.

### Charakteristiky:
- 💾 **Kapacita:** ~5-10 MB dat
- 🔒 **Bezpečnost:** Data pouze v tomto prohlížeči
- ⚡ **Rychlost:** Velmi rychlé (lokální)
- 🌐 **Sdílení:** Data NEJSOU sdílená mezi uživateli
- 💪 **Persistence:** Data zůstávají i po zavření prohlížeče

### Kde jsou data uložena?
```
V prohlížeči na vašem počítači:
- Chrome: DevTools → Application → Local Storage
- Firefox: DevTools → Storage → Local Storage
- Edge: DevTools → Application → Local Storage
```

---

## 📁 Struktura Mock Databáze

### Databázové "Tabulky" (localStorage keys):

```javascript
const DB = {
  users: 'flyer_users',           // Uživatelé (4 demo účty)
  products: 'flyer_products',     // Produkty dodavatelů
  flyers: 'flyer_flyers',         // Letáky dodavatelů
  approvals: 'flyer_approvals',   // Schvalovací požadavky
  userFlyers: 'flyer_user_flyers' // Letáky koncových uživatelů
};
```

### Inicializační Data:

#### 1. **Uživatelé** (flyer_users)
```json
[
  {
    "id": "1",
    "email": "dodavatel@acme.cz",
    "password": "admin",
    "role": "supplier",
    "name": "Jan Novák",
    "brands": ["Samsung", "LG"]
  },
  {
    "id": "2",
    "email": "schvalovatel1@company.cz",
    "password": "admin",
    "role": "approver",
    "name": "Eva Svobodová"
  },
  {
    "id": "3",
    "email": "schvalovatel2@company.cz",
    "password": "admin",
    "role": "approver",
    "name": "Petr Dvořák"
  },
  {
    "id": "4",
    "email": "uzivatel@email.cz",
    "password": "admin",
    "role": "end_user",
    "name": "Marie Nováková"
  }
]
```

#### 2. **Produkty** (flyer_products)
```json
// Prázdné pole při startu - dodavatel si je vytvoří
[]
```

Struktura produktu:
```typescript
{
  id: string,
  supplierId: string,
  name: string,
  ean: string,
  brand: string,
  description: string,
  price: number,
  originalPrice?: number,
  image: string,
  icons: string[]
}
```

#### 3. **Letáky** (flyer_flyers)
```json
// Prázdné pole při startu
[]
```

Struktura letáku:
```typescript
{
  id: string,
  supplierId: string,
  name: string,
  validFrom: string,
  validTo: string,
  status: 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'active',
  pages: [{
    id: number,
    products: Array<Product | null> // 8 slotů
  }],
  createdAt: string
}
```

---

## ⚙️ Funkce pro Práci s Daty

### Čtení dat:
```typescript
const getFromDB = (key: string): any =>
  JSON.parse(localStorage.getItem(key) || '[]');

// Použití:
const users = getFromDB(DB.users);
const products = getFromDB(DB.products);
```

### Zápis dat:
```typescript
const saveToDB = (key: string, data: any): void =>
  localStorage.setItem(key, JSON.stringify(data));

// Použití:
saveToDB(DB.products, updatedProducts);
```

### Inicializace:
```typescript
const initDB = () => {
  if (!localStorage.getItem(DB.users)) {
    // Vytvoří demo uživatele
  }
  // ... inicializace dalších tabulek
};
```

---

## ⚠️ Omezení localStorage

### Nevýhody:
1. ❌ **Nesdílené:** Každý uživatel má vlastní data
2. ❌ **Kapacita:** Limit ~5-10 MB
3. ❌ **Bezpečnost:** Data lze vidět v DevTools
4. ❌ **Validace:** Žádná databázová validace
5. ❌ **Backup:** Nelze zálohovat centrálně
6. ❌ **Multi-device:** Data nejsou synchronizovaná

### Kdy to FUNGUJE:
- ✅ Demo aplikace
- ✅ Prototypy
- ✅ Lokální development
- ✅ Single-user aplikace
- ✅ Offline-first aplikace

### Kdy to NEFUNGUJE:
- ❌ Multi-user systém
- ❌ Produkční aplikace
- ❌ Sdílení dat mezi uživateli
- ❌ Reporting a analytics
- ❌ Data větší než 5 MB

---

## 🚀 Migrace na Skutečnou Databázi

### Doporučená Architektura pro Produkci:

```
┌─────────────────┐
│  React Frontend │  ← Vaše současná aplikace
└────────┬────────┘
         │ HTTP/REST API
         ▼
┌─────────────────┐
│  Backend API    │  ← NestJS/Node.js (POTŘEBA VYTVOŘIT)
│  (NestJS)       │
└────────┬────────┘
         │ SQL
         ▼
┌─────────────────┐
│  PostgreSQL DB  │  ← Skutečná databáze
└─────────────────┘
```

### 1️⃣ PostgreSQL Schema (Připraveno v návrhu)

```sql
-- Uživatelé
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100),
  role VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Značky
CREATE TABLE brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL
);

-- Produkty
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID REFERENCES users(id),
  brand_id UUID REFERENCES brands(id),
  ean VARCHAR(13) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2),
  image_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Letáky
CREATE TABLE flyers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  valid_from DATE NOT NULL,
  valid_to DATE NOT NULL,
  status VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ... další tabulky
```

### 2️⃣ Backend API Setup (Připraveno k vytvoření)

Vytvořit backend v NestJS:

```bash
# 1. Vytvořit backend projekt
npx @nestjs/cli new flyer-backend

# 2. Instalace závislostí
cd flyer-backend
npm install @nestjs/typeorm typeorm pg
npm install @nestjs/jwt passport passport-jwt
npm install bcrypt class-validator

# 3. Konfigurace PostgreSQL v .env
DATABASE_URL=postgresql://user:password@localhost:5432/flyer_db

# 4. Spuštění
npm run start:dev
```

### 3️⃣ Docker Setup s PostgreSQL

Již připravený `docker-compose.yml` s PostgreSQL:

```yaml
# Rozšířená verze pro backend + databázi
version: '3.8'

services:
  # PostgreSQL Databáze
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: flyer_db
      POSTGRES_USER: flyer_user
      POSTGRES_PASSWORD: flyer_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  # Backend API
  backend:
    build: ./backend
    ports:
      - "4000:4000"
    environment:
      DATABASE_URL: postgresql://flyer_user:flyer_password@postgres:5432/flyer_db
    depends_on:
      - postgres

  # Frontend
  frontend:
    build: .
    ports:
      - "8080:80"
    depends_on:
      - backend

volumes:
  postgres_data:
```

---

## 📋 Kroky k Migraci

### Fáze 1: Příprava (HOTOVO ✅)
- [x] Frontend aplikace
- [x] localStorage mock
- [x] Docker konfigurace
- [x] Dokumentace

### Fáze 2: Backend API (TODO 🔨)
- [ ] Vytvořit NestJS backend
- [ ] Implementovat REST API endpoints
- [ ] JWT autentizace
- [ ] Validace dat
- [ ] Error handling

### Fáze 3: Databáze (TODO 🔨)
- [ ] Nastavit PostgreSQL
- [ ] Vytvořit schema
- [ ] Migrace skripty
- [ ] Seed data
- [ ] Indexy a optimalizace

### Fáze 4: Integrace (TODO 🔨)
- [ ] Nahradit localStorage API calls
- [ ] Testing
- [ ] Deployment
- [ ] Monitoring

---

## 🛠️ Rychlý Start s PostgreSQL

### Option 1: Docker (Nejrychlejší)

```bash
# Spustit PostgreSQL v Dockeru
docker run --name flyer-postgres \
  -e POSTGRES_DB=flyer_db \
  -e POSTGRES_USER=flyer_user \
  -e POSTGRES_PASSWORD=flyer_password \
  -p 5432:5432 \
  -d postgres:16-alpine

# Připojit se
docker exec -it flyer-postgres psql -U flyer_user -d flyer_db
```

### Option 2: Lokální Instalace

Windows:
```powershell
# Stáhnout z https://www.postgresql.org/download/windows/
# Instalovat PostgreSQL
# Vytvořit databázi
createdb -U postgres flyer_db
```

Linux:
```bash
sudo apt install postgresql
sudo -u postgres createdb flyer_db
```

---

## 📊 Srovnání Řešení

| Feature | localStorage | PostgreSQL | MongoDB |
|---------|-------------|------------|---------|
| Multi-user | ❌ | ✅ | ✅ |
| Kapacita | 5-10 MB | Neomezená | Neomezená |
| Rychlost | ⚡⚡⚡ | ⚡⚡ | ⚡⚡ |
| ACID | ❌ | ✅ | Částečně |
| Relace | ❌ | ✅ | ❌ |
| Dotazy | ❌ | SQL | MongoDB query |
| Backup | ❌ | ✅ | ✅ |
| Cena | Free | Free/Paid | Free/Paid |

---

## 💡 Doporučení

### Pro Demo/Prototyp:
✅ **localStorage** - Aktuální řešení je ideální!

### Pro Produkci:
✅ **PostgreSQL** + NestJS backend
- Plná podpora relací
- ACID transakce
- Schváleno pro enterprise
- Skvělý ekosystém

---

## 🔐 Jak Zobrazit Data v Prohlížeči

### Chrome/Edge DevTools:
1. Stiskněte **F12**
2. Záložka **Application**
3. Sekce **Storage** → **Local Storage**
4. Klikněte na `http://localhost:8080`
5. Uvidíte všechny klíče (flyer_users, flyer_products...)

### Firefox DevTools:
1. Stiskněte **F12**
2. Záložka **Storage**
3. **Local Storage** → `http://localhost:8080`

### Vymazat Data:
```javascript
// V konzoli prohlížeče (F12 → Console)
localStorage.clear();
// Poté reload stránky (F5)
```

---

## 📞 Potřebujete Pomoc s Migrací?

Pro vytvoření produkčního backendu s PostgreSQL:

1. 📧 Kontaktujte vývojový tým
2. 📚 Viz [návrh v dokumentu](Návrh\ Moderní\ SaaS\ Platformy\ pro\ Sp.txt)
3. 🐳 Použijte připravené Docker konfigurace
4. 🔧 Backend API kód je připraven k implementaci

---

**Shrnutí:**
✅ Aplikace běží na **localStorage** (browser storage)
🎯 Pro demo a prototyp je to **perfektní řešení**
🚀 Pro produkci doporučujeme migraci na **PostgreSQL + Backend API**

*Poslední aktualizace: 20. října 2025*
