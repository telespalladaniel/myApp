//Progetto 22HBG - Daniel Rajer
//web service che legge elenco di post in formato JSON da un feed


//PACCHETTI NODEJS
const express = require('express'); //pacchetto express js
const app = express(); //creazione app express js
//const port = 3000; //porta alla quale interrogare l'app, la porta non serve nel caso in cui si fa il deploy come FaaS in AWS Lambda
var bodyParser = require('body-parser'); //json parser
const serverless = require('serverless-http'); //pacchetto per il deploy come FaaS
const https = require('https'); //pacchetto https per leggere dal feed
var mysql = require('mysql'); //pacchetto per interagire con db

//URL FEED POST
let url = "https://22hbg.com/wp-json/wp/v2/posts/"; //feed





app.get('/', (req, res) => { //test
	res.send('Hello World');
	//la pagina di home restituisce un semplice Hello World di test

});

function filter(itemsFilter, titleFilter, json) { //funzione filtro
	//la funzione filter riceve l'array json contenente i post e li filtra per titolo e per numero max di elementi da restituire
	// json -> array di posts
	// titleFilter -> filtro Titolo
	// itemsFilter -> num max elementi da restituire
	let posts = ""; //accumulatore posts
	if (itemsFilter == null) //caso in cui non si voglia filtrare per numero
		itemsFilter = json.length; //tutti i numeri vengono fatti passare
	if (titleFilter == null) //caso in cui non si voglia filtrare per titolo
		titleFilter = ""; //tutti i titoli vengono fatti passare

	let i = 0; //iteratore ciclo
	let founded = 0; //conta quanti post sono stati trovati
	while (i < json.length && founded < itemsFilter) {
		if (json[i].title.rendered.toUpperCase().includes(titleFilter.toUpperCase())) { //filtraggio titolo
			//aggiungo post trovato all'accumulatore
			posts = posts + '<br>' + 'Post Numero ' + i + '<br>' + 'Titolo: ' + json[i].title.rendered + '<br>' + json[i].content.rendered + '<br>';
			founded++; //incremento numero post trovati
		}
		i++;
	}
	return posts; //restituisco post trovati

}


function getPromise() { //Javascript Promise per invocazione sincrona della lettura dal feed


	return new Promise((resolve, reject) => { //creazione promise
		https.get(url, (res) => { //funzione get di https per lettura dal feed
			let body = ""; //accumulatore

			res.on("data", (chunk) => {
				body += chunk; //lettura in chuncks
			});

			res.on("end", () => { //alla fine della lettura


				try {
					let json = JSON.parse(body); //conversione body json



					resolve(json); //il promise ritorna il json



				} catch (error) {
					console.error(error.message);
				};
			});

		}).on("error", (err) => {
			console.log(err);

		});
	});

}





async function leggiFeed() { //funzione che legge dal feed e ritorna i post filtrati tramite i parametri specificati
	let result = "";
	try {
		let http_promise = getPromise(); //promise che incapsula la logica di lettura dal feed
		result = await http_promise; //per l'invocazione sincrona

	} catch (e) {
		console.log(e);

	}
	return result;

}



app.use(bodyParser.json());

app.get('/posts', (req, answ) => { //elencare tutti i post del feed
	//nessun filtraggio
	titleFilter = null;
	itemsFilter = null;
	let result = leggiFeed();
	result.then((response) => { //invocazione sincrona
		answ.send(filter(itemsFilter, titleFilter, response)); //restituzione risultato
	}).catch((error) => {
		console.log(error);
	});


});



app.get('/posts-filtered', (req, answ) => { //elencare tutti i post del feed con filtri

	//recupero parametri
	let titleFilter = req.query.title;
	let itemsFilter = req.query.items;

	let result = leggiFeed();
	result.then((response) => { //invocazione sincrona
		answ.send(filter(itemsFilter, titleFilter, response)); //restituzione risultato
	}).catch((error) => {
		console.log(error);
	});


});


app.get('/sync-db', (req, answ) => { //legge feed e scrive nel db

	//CONNESSIONE AL DB
	var connection = mysql.createConnection({
		host: "****",
		user: "nomeUtente",
		password: "****", //così facendo sarebbe necessario scrivere la password in chiaro, è possibile prevedere una estensione in cui le credenziali vengono passate come parametro criptato dall'utente
		port: 3306,
		database: 'nome'
	});

	connection.connect(function(err) {
		if (err) {
			console.log(err);
			answ.send("errore connesione db");
		}
	});




	let result = leggiFeed(); //recupero dati json dal feed
	result.then((response) => { //invocazione sincrona
		var jsondata = response; //array dei posts json
		var values = []; //map

		//inserisco nella mappa i valori da persistere nel db
		//in questo esempio persistiamo solo ID, DATA, TITOLO, CONTENUTO, LINK
		for (var i = 0; i < jsondata.length; i++)
			values.push([jsondata[i].id, jsondata[i].date, jsondata[i].title.rendered, jsondata[i].content.rendered, jsondata[i].link]);


		//QUERY
		connection.query('INSERT INTO posts (id, date, title, content, link) VALUES ?', [values], function(err, result) {
			if (err) {
				answ.send('Error');
			}
			else {
				answ.send('Success');
			}
		});



		connection.end(); //chiusura connessione
	}).catch((error) => {
		console.log(error);
		answ.send(error);
	});




});


app.get('/posts-db', (req, answ) => { //legge dal db
	var sqlQuery = "SELECT * FROM posts"; //query

	//CREAZIONE CONNESSIONE AL DB
	var connection = mysql.createConnection({
		host: "***",
		user: "numeUtente",
		password: "****",
		port: 3306,
		database: 'nome'
	});


	connection.connect(function(err) {
		if (err) {
			console.log(err);
			answ.send("errore connesione db");
		}
	});

	//INVOCAZIONE QUERY
	connection.query(sqlQuery, function(err, result, fields) {


		if (err) answ.send('errore');
		else {
			let posts = '';
			let i = 0;


			while (i < result.length) {
				posts = posts + '<br>' + 'Post Numero ' + i + '<br>' + 'Titolo: ' + result[i].title + '<br>' + result[i].content + '<br>';
				i++;
			}
			answ.send(posts); //restituzione risultato

		}

	});



	connection.end(); //chiusura connessione





});


exports.handler = serverless(app); //per esportare l'app come FaaS
//app.listen(port, () => console.log(`Hello world app listeningg on port ${port}!`)) //solo nel caso in cui l'app sia stand-alone e non FaaS
