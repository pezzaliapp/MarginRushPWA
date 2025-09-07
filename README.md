
# Margin Rush — v4 *Market Duel*

**Obiettivo:** battere 3 competitor su **10 giorni** massimizzando **utile cumulato** e quotazione. Turni **manuali**: pianifica, **Avanza giorno**, osserva le mosse rivali e adatta la strategia.

## Modello di mercato
- Clienti/giorno: `M` (con stagionalità).
- Scelta cliente con **logit**: \(U = α - β·p + w_Q·Q + w_S·S + w_B·B + ξ_t\).
- Quota \(s_i = e^{U_i}/\sum e^{U_j}\); **Unità** \(q_i = M·s_i\).
- Costi: `c(Q) = 8 + 2·Q`, fissi `500/g`.
- IVA: se attiva, il margine usa il **prezzo netto** `p/(1+IVA%)`.

## Leve del giocatore
- **Prezzo** (slider).
- **Qualità (Q)**: +0.5 buff per step, **dura 3 giorni**, costo `€300/step`.
- **Brand (B)**: +0.5 buff per step, **dura 3 giorni**, costo `€250/step`.
- **Servizio (S)**: +1 per step, **permanente**, costo `€200/step`.
- **Capienza**: ordini/giorno (una tantum) costo `€0.2 per punto`.

## Competitor (AI)
- **Comp A — Price-war**: segue il tuo prezzo cercando di stare ~5% sotto (rispettando un minimo).
- **Comp B — Premium**: mantiene prezzi alti e investe regolarmente in Brand/Qualità.
- **Comp C — Follower**: fa smoothing sul tuo prezzo e investe saltuariamente in Brand.

## Flusso del turno
1. Imposta prezzo e **investimenti** (costano subito).
2. Clicca **Avanza giorno**.
3. I competitor effettuano le proprie mosse.
4. Il mercato si alloca → vedi **Unità, Quota, Utile**.
5. **Report del giorno** mostra i **clienti spostati (Δ vs comp)** e un **breakdown** approssimato per **Prezzo, Q, B, S**.

## Condizioni di fine
- 10 giorni. Mostriamo **utile cumulato** e la **quota** dell’ultimo giorno. (Target tipico: quota > 30%, cassa positiva).

## PWA
- Offline-first con Service Worker (`mr-v4-duel`).
- Installabile su iOS/Android/Desktop.

---

### Note “game design”
- Il breakdown Δ è **additivo e approssimato** (varia un fattore per volta); in futuro si può usare una **decomposizione di Shapley** per precisione.
- Le strategie AI sono **leggere** per restare fluide su mobile: possiamo passare a un **bandit** per il competitor adattivo.
