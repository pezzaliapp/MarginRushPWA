# Margin Rush — v4.9 Pro

**Margin Rush** è una Progressive Web App (PWA) che simula la competizione in un mercato globale.  
L’obiettivo è ottimizzare prezzo, qualità, brand e servizio per massimizzare l’utile netto e battere i concorrenti.

## ✨ Funzionalità principali
- **Simulazione di mercato** con domanda variabile e tre competitor:
  - *Comp A* — Price-war (guerra di prezzi)
  - *Comp B* — Premium (alto valore percepito)
  - *Comp C* — Bandit AI (algoritmo adattivo ε-greedy)
- **Leve decisionali**:
  - Prezzo di vendita (lordo o netto con IVA)
  - Investimenti in **Qualità**, **Brand**, **Servizio**
  - Capienza ordini/giorno
- **Costi variabili**:
  - Prezzo d’acquisto
  - Overhead per unità
  - Costo Qualità (dipende dal livello Q)
  - Costo Garanzia (in/out garanzia, goodwill)
  - Commissioni/fee del canale di vendita
- **Costi fissi**:
  - Personale, affitto, SaaS, altro
  - Costi specifici per canale di vendita (vedi sotto)
- **Canali di vendita**:
  - **On-line** (fee piattaforma, pagamenti, logistica, SaaS, gestione store)
  - **Venditore P.IVA** (compenso fisso, auto, carburante, provvigioni, telepass, altre spese)
  - **Dipendente** (RAL, auto aziendale, trasferte, telepass, provvigioni opzionali)
- **Indicatori finanziari**:
  - Margine di contribuzione /u e totale
  - Break-even (unità e ricavi)
  - Indice di copertura (% del prezzo che resta per i fissi)
  - Margine di sicurezza (% distanza dalle vendite a BE)
- **Grafici**:
  - BE Chart: ricavi vs costi totali
  - MC Chart: ricavi vs costi variabili, area verde = margine di contribuzione
- **Clienti spostati**: variazione quota rispetto al giorno precedente, con breakdown (Prezzo, Q, B, S)
- **Advisor**: suggerimento automatico del prezzo più profittevole dato il mercato
- **Log mosse competitor**: visibile giorno per giorno
- **PWA ready**: installabile e funzionante offline

## 🚀 Installazione & utilizzo
1. Clona o scarica la repository.
2. Apri `index.html` in un browser moderno (Chrome, Edge, Safari).
3. Puoi installare la PWA su desktop o mobile (`Aggiungi a schermata Home`).
4. Imposta parametri di costo, IVA, garanzia e canale → simula fino a 10 giorni.
5. Usa i grafici per valutare **redditività** e strategie di prezzo.

## 📊 Perché usare il Margine di Contribuzione
Il MC è l’indicatore corretto per valutare la redditività di un prodotto.  
Permette di capire se un prodotto **copre i costi fissi** e genera utile senza dover allocare in modo arbitrario altri costi.

\[
MC = Prezzo\ Netto - Costi\ Variabili\ Diretti
\]

- **MC > 0** → ogni pezzo contribuisce a coprire i costi fissi.  
- **MC < 0** → più vendi, più perdi.  
- **Break-even**: punto in cui \( MC \times Q = Fissi \).

## 📱 Compatibilità
- Mobile (iPhone/Android) e Desktop (Windows, macOS, Linux)
- Responsive: controlli leggibili su schermi piccoli e grandi

## 👤 Autore
**Alessandro Pezzali**  
www.alessandropezzali.it · [pezzaliAPP.com](https://www.pezzaliapp.com)

## 📄 Licenza
Rilasciato sotto **MIT License** (2025).
