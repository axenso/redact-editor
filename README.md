# Interactive Chat

Percorso: `~/Documents/cursor/interactive-chat`

Editor di testo ricco con toolbar di formattazione, salvataggio locale e modifica AI sulla selezione (OpenAI).

## Funzionalità

- Paragrafi e titoli (H1, H2, H3)
- Toolbar: grassetto, corsivo, sottolineato, colori, allineamento, elenchi
- Menu contestuale sulla selezione → **Modifica con AI**
- Salvataggio automatico in `localStorage`
- Tema chiaro

## Setup

```bash
npm install
cp .env.local.example .env.local
# Modifica .env.local e aggiungi la tua VITE_OPENAI_API_KEY
npm run dev
```

Apri [http://localhost:5173](http://localhost:5173).

## Uso

1. Scrivi e formatta il testo con la barra degli strumenti.
2. Seleziona una porzione di testo.
3. Clicca **Modifica con AI** nel menu che appare.
4. Descrivi la modifica desiderata e clicca **Applica**.

## Nota sulla sicurezza

La chiave API è usata dal browser (variabile `VITE_*`). Va bene per sviluppo locale. Per produzione, usa un proxy backend per non esporre la chiave.
