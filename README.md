# myApp
Progettazione e sviluppo di un semplice web service che legge un elenco di post in formato json da un feed, li restituisce e li persiste su DB. Deploy come FaaS su AWS Lambda. Progetto sviluppato in NodeJS+ExpressJS.

Le funzionalità esposte sono: <br>
•	Restituzione dell’elenco di post con eventuali opzioni di filtraggio per titolo e/o numero massimo di elementi da restituire
•	Interazione con DB mySQL nel quale salvare i contenuti del feed a richiesta e possibilità di restituire i contenuti del DB quando richiesto

## DESCRIZIONE

L'applicazione espone 4 endpoint invocabili tramite chiamate GET:
  /posts                    restituisce tutti i post presenti nel feed
  /posts-filtered           restituisce solo i post che fanno match con i parametri "title" e "items"
  /sync-db                  persiste i dati del feed nel DB
  /posts-db                 restituisce i dati contenuti nel DB.
  
