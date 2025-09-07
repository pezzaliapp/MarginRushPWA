# Margin Rush — v2.5 (PWA)

**Perché questa versione**
Su iPhone alcuni non riuscivano a trovare i controlli di **IVA / costi fissi / imposte** in verticale. Ora c’è un **pulsante “⚙️ Parametri”** che apre un **pannello a comparsa (bottom sheet)** con tutti i campi — sempre accessibile su schermi piccoli. Su desktop i parametri restano anche nel footer della tabella.

## Come si gioca
- Hai **60s** per regolare i **prezzi** di 5 prodotti e massimizzare l’**UTILE NETTO**.
- La **domanda** si aggiorna live: la **barra verde** indica quante unità vendi (relativa al massimo attuale).
- Il bordo **oro** appare quando sei vicino al prezzo **ottimo stimato** `p* = costo + p₀/ε`.
- **Practice** = allenamento (fuori classifica). **Season** = seed settimanale condivisibile, con **Top-5 locale**.

## Finanza (pannello ⚙️)
- **Prezzi IVA inclusa?** (se attivo, il margine usa il **prezzo netto**, cioè al netto IVA)
- **IVA %**, **Costi fissi (€)**, **Aliquota imposta utile (%)**
- L’utile netto mostrato nel pannello è lo stesso del riepilogo (sincronizzati).

## Modello di domanda
`D(p) = D₀ · e^{−ε (p − p₀) / p₀}`  
Utile prodotto = `(p_netto − costo) × D(p)`  
Utile netto finale = `(Σ utili − costi fissi) × (1 − tax%)`

## PWA
- Offline-first, installabile su iOS/Android/Desktop.
- Salvataggi: `mr.best.<seed>`, `mr.leader.<seed>` in `localStorage`.
