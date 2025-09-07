# Margin Rush — v2.4 (PWA)

**Novità principali**
- **Mobile first**: su schermi piccoli la tabella diventa una **lista di card** con slider, domanda (barra) e utile per prodotto. Su desktop resta la tabella completa.
- **Legenda integrata** con simboli (ε, D₀, p₀, p*) e spiegazione Practice/Season.
- **Barre di domanda** visive per capire subito “quale vende di più”.

**Obiettivo del gioco**
In **60 secondi** regola i **prezzi** di 5 prodotti per massimizzare l’**utile netto**.

**Modello**
- Domanda: `D(p) = D₀ · e^{−ε (p − p₀)/p₀}`
- Utile per prodotto: `(p_netto − costo) × D(p)` (se spunti “Prezzi IVA inclusa?” il `p_netto` è al netto IVA)
- Utile netto finale: `(Σ utili − costi fissi) × (1 − tax%)`

**Modalità**
- **Season** (seed settimanale `YYYY-Www`): confronta i punteggi sulla stessa istanza e salva **Top‑5 locale**.
- **Practice**: allenamento con seed casuale `PRAC-*` (fuori classifica).

**Condivisione**
Pulsante **Condividi** → copia un testo con l’URL `?seed=...` per sfidare altri con la **stessa partita**.

**PWA**
- Offline‑first con service worker, installabile su iOS/Android/Desktop.
- Salvataggi in `localStorage` (`mr.best.<seed>`, `mr.leader.<seed>`).
