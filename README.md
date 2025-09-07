# Margin Rush — v4.9 Pro
**Simulatore interattivo di pricing e redditività**  
Autore: Alessandro Pezzali · Licenza: MIT (2025)

---

## 📖 Introduzione
Molte decisioni di marketing e vendita si riducono a una domanda semplice ma cruciale:  
**“A questo prezzo, il mio prodotto conviene davvero?”**

**Margin Rush** è una Progressive Web App (PWA) che permette di esplorare questa domanda in modo interattivo.  
È al tempo stesso un *business game* e un *laboratorio di analisi economica*: giocando impari a leggere i numeri chiave che determinano la sopravvivenza di un prodotto sul mercato.

---

## 🎯 Perché è utile
- **Per venditori e manager** → allena a capire come i costi e i margini reagiscono alle scelte di prezzo.  
- **Per studenti di economia e marketing** → trasforma formule astratte (margine, break-even, sicurezza) in scenari concreti.  
- **Per imprenditori e startupper** → simula in pochi minuti quello che nella realtà richiederebbe mesi di vendite.  

Margin Rush non è un calcolatore sterile: è un ambiente competitivo.  
Ti mette di fronte a **3 concorrenti virtuali** che cambiano strategia di giorno in giorno, proprio come avviene in un mercato reale.

---

## ⚙️ Come funziona la simulazione
- Il **mercato** è composto da un numero variabile di clienti al giorno (M).  
- Ogni offerta (tu + 3 competitor) ha un’**utilità percepita** determinata da:
  - **Prezzo** (più basso → più appetibile, ma riduce margini),
  - **Qualità (Q)**,
  - **Brand (B)**,
  - **Servizio (S)**,
  - **Stagionalità** (fluttuazioni della domanda).
- La quota di mercato viene calcolata con un modello **logit**, tipico dell’analisi di marketing.  

### I tre concorrenti
- **Comp A (Price-war)** → abbassa i prezzi per guadagnare quota.  
- **Comp B (Premium)** → investe in qualità e brand, mantenendo prezzi alti.  
- **Comp C (Bandit AI)** → usa un algoritmo adattivo (*ε-greedy*) che prova diverse strategie e adotta quelle più efficaci.

---

## 📘 Manuale d’uso passo–passo
1. **Avvia l’app** (aprendo `index.html` in un browser moderno o installando la PWA).  
2. **Imposta le leve principali**:
   - Prezzo (con IVA inclusa o esclusa),
   - Investimenti in Qualità (Q), Brand (B), Servizio (S),
   - Capienza ordini massima al giorno.  
3. **Definisci i costi**:
   - Variabili (acquisto, overhead, garanzia, commissioni di canale),
   - Fissi (personale, affitto, SaaS, altre spese).  
4. **Scegli il canale di vendita**:
   - Online,
   - Venditore a Partita IVA,
   - Dipendente aziendale.  
5. **Avanza di un giorno**: i concorrenti reagiscono, i clienti si ridistribuiscono.  
6. **Analizza il report**: unità vendute, quota di mercato, utile netto, margini, indicatori, grafici.  
7. Dopo 10 giorni → valuta il tuo utile cumulato e confrontalo con i competitor.

---

## 🧩 Legenda simboli e sigle
- **Q (Qualità)** → investimenti sul prodotto, riducono reclami ma aumentano costi.  
- **B (Brand)** → forza del marchio, riduce sensibilità al prezzo.  
- **S (Servizio)** → assistenza e customer care, incrementa fiducia.  
- **MC/u** → Margine di Contribuzione per unità.  
- **MC tot** → Margine di Contribuzione totale (giorno).  
- **BE (Break-even)** → unità minime da vendere per non perdere.  
- **MoS (Margine di Sicurezza)** → quanto sei sopra il BE.  
- **Copertura** → % del prezzo che resta disponibile per coprire i costi fissi.  
- **Advisor** → prezzo suggerito dal sistema come più conveniente.  
- **Clienti spostati (Δ)** → clienti guadagnati o persi rispetto a ieri, divisi per causa (Prezzo, Q, B, S).

---

## 📊 Indicatori di redditività

### 1. Margine di Contribuzione (MC)
- **Divulgativo**: indica quanto ogni pezzo venduto contribuisce a coprire i costi fissi.  
- **Formula**:  
  \[
  MC/u = Prezzo\ Netto - Costi\ Variabili
  \]  
  \[
  MC_{tot} = MC/u \times Quantità
  \]  
- **Esempio**: Prezzo netto 50€, costi variabili 30€ → MC/u = 20€.  
  Se vendi 100 pezzi, MC totale = 2.000€.

---

### 2. Break-even (BE)
- **Divulgativo**: è il punto in cui le vendite coprono esattamente i costi fissi.  
- **Formula**:  
  \[
  BE = \frac{Costi\ Fissi}{MC/u \cdot (1 - Tax\%)}
  \]  
- **Esempio**: Costi fissi giornalieri 1.000€, MC/u 20€, tax 24% →  
  BE ≈ 66 unità.  
  Vendendo almeno 66 unità, non perdi.

---

### 3. Margine di Sicurezza (MoS)
- **Divulgativo**: misura quanto sei sopra il pareggio; più è alto, più sei resiliente.  
- **Formula**:  
  \[
  MoS = \frac{Vendite\ Effettive - Vendite\ a\ BE}{Vendite\ Effettive}
  \]  
- **Esempio**: vendi 100 unità, BE = 66 → MoS = 34%.

---

### 4. Indice di Copertura
- **Divulgativo**: mostra la quota di prezzo che rimane per coprire i fissi.  
- **Formula**:  
  \[
  Copertura = \frac{MC/u}{Prezzo\ Netto}
  \]  
- **Esempio**: Prezzo netto 50€, MC/u 20€ → Copertura = 40%.  

---

## 🛠️ Aspetti tecnici
- **Motore di mercato**: modello logit per la distribuzione della domanda.  
- **Strategie competitor**: price-war, premium, bandit AI.  
- **Persistenza**: parametri salvati in `localStorage`.  
- **Grafici**: break-even (ricavi vs costi totali), margine di contribuzione (ricavi vs costi variabili).  
- **PWA**: installabile e funzionante offline, con service worker e manifest.

---

## 🚀 Installazione
1. Scarica i file e apri `index.html`.  
2. Su smartphone → “Aggiungi a schermata Home” per installare come app.  
3. L’app funziona offline; i tuoi dati restano salvati sul dispositivo.

---

## 👤 Autore
**Alessandro Pezzali**  
[https://github.com/pezzaliapp](https://github.com/pezzaliapp) · [pezzaliAPP.com](https://www.pezzaliapp.com)

---

## 📄 Licenza
Rilasciato sotto **MIT License** (2025).
