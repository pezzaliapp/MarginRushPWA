# Margin Rush — micro-tycoon da 60 secondi (PWA)

**Obiettivo:** massimizzare l’**utile netto** regolando i prezzi di 5 prodotti in **60s**.

- Ogni prodotto ha **costo**, **domanda di riferimento** \(D₀\), **prezzo di riferimento** \(p₀\) ed **elasticità** \(ε\).
- La domanda stimata decresce esponenzialmente all’aumentare del prezzo:  
  \[ D(p) = D_0 \cdot e^{-\varepsilon \cdot \frac{(p - p_0)}{p_0}} \]
- L’utile per prodotto è \((p - \text{costo}) \times D(p)\).

## Modalità
- **Season**: parametri settimanali deterministici tramite seed `YYYY-Www`. Confronta il tuo **best** locale.
- **Practice**: seed casuale (`PRAC-*`), per allenarti senza intaccare la Season.

## Condivisione
Il pulsante **Condividi** copia un testo con il seed corrente (es. `?seed=2025-W36`) per sfidare amici/colleghi sulla **stessa partita**.

## PWA
- Offline-first con **service worker**
- **start_url** locale per GitHub Pages
- Salvataggio best in `localStorage` come `mr.best.<seed>`

## Deploy rapido
1. Copia l’intera cartella in una repo GitHub (es. `MarginRushPWA/`).
2. Abilita GitHub Pages (branch `main`, root).
3. Apri l’URL: la PWA è installabile da mobile/desktop.
