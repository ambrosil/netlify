const axios = require('axios');
const pdf = require("pdf-parse");
const TelegramBot = require("node-telegram-bot-api");
const {readBin, updateBin} = require("./jsonbin-api.cjs");
const cloudinary = require('cloudinary').v2;

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN
const CHAT_ID = process.env.TELEGRAM_CHATID

cloudinary.config({
	cloud_name: process.env.CLOUDINARY_NAME,
	api_key: process.env.CLOUDINARY_KEY,
	api_secret: process.env.CLOUDINARY_SECRET
});

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: false });

exports.handler = async function(event, context) {
	try {
		const data = JSON.parse(event.body);
		if (!data.emailBody) {
			return {
				statusCode: 400,
				body: JSON.stringify({ error: "Campo emailBody mancante nella richiesta" })
			};
		}

		const body = await callFirstLink(data.emailBody);
		const pdfUrl = extractPdfLink(body);
		const pdfBuffer = await downloadPdfAsBuffer(pdfUrl);
		const info = await extractPdfInfo(pdfBuffer);
		const spese = calcolaRipartizioneSpese(info)
		const nuoviSaldi = await calcolaNuoviSaldi(spese)
		const imageUrl = await generaReportPNG(nuoviSaldi)

		await Promise.all([
			sendPDF(pdfUrl),
			sendImage(imageUrl),
			aggiornaSaldi(nuoviSaldi)
		]);

		return { statusCode: 200, body: JSON.stringify(spese) };
	} catch (error) {
		console.error('Errore:', error);
		return {
			statusCode: 500,
			body: JSON.stringify({
				error: "Errore nell'elaborazione dei dati",
				details: error.message
			})
		};
	}
};

async function aggiornaSaldi(nuoviSaldi) {
	nuoviSaldi['DeLuca'] = 0
	nuoviSaldi['Donatone'] = 0
	await updateBin(nuoviSaldi)
}

async function calcolaNuoviSaldi(spese) {
	const saldi = await readBin();
	Object.keys(spese).forEach(nome => {
		saldi[nome] = arrotondaPerEccesso(saldi[nome] - spese[nome]);
	})

	return saldi
}

async function downloadPdfAsBuffer(pdfUrl) {
	try {
		const response = await axios.get(pdfUrl, {
			headers: {
				'Accept': 'application/pdf'
			},
			responseType: 'arraybuffer'
		});

		// Verifica che il content-type sia effettivamente PDF
		const contentType = response.headers['content-type'];
		if (contentType && !contentType.includes('application/pdf')) {
			console.error(`Attenzione: il content-type non è PDF ma ${contentType}`);
		}

		return Buffer.from(response.data);
	} catch (error) {
		console.error('Errore durante il download del PDF:', error);
		throw error;
	}
}

Array.prototype.extract = function(pos) {
	if (pos < 0 || pos >= this.length) {
		return null;
	}

	const line = this[pos];
	// Cerca numeri con virgola o punto decimale nel formato italiano
	const matches = line.match(/(\d+[,.]\d+)/g);
	if (matches && matches.length > 0) {
		// Prendi il primo numero trovato e convertilo in float
		return parseFloat(matches[0].replace(',', '.'));
	}
	return null;
};

async function extractPdfInfo(dataBuffer) {
	try {
		const data = await pdf(dataBuffer);
		const lines = data.text.split('\n');

		// Cerca il pivot in modo più robusto
		const pivot = getPivot(lines);

		if (pivot === -1) {
			return {
				error: "Impossibile trovare il punto di riferimento nel PDF",
				text: data.text.substring(0, 1000) // Primi 1000 caratteri per debug
			};
		}

		const info = {
			kwTotali: lines.extract(pivot - 1) || 0,
			kwCondivisi: 17, // Fisso, potrebbe essere parametrizzato
			spesaMateria: lines.extract(pivot) || 0,
			trasporto: lines.extract(pivot + 1) || 0,
			oneri: lines.extract(pivot + 2) || 0,
			iva: lines.extract(pivot + 4) || 0,
			totale: lines.extract(pivot + 6) || 0,
		};

		info.kwCondominio = info.kwTotali - info.kwCondivisi;
		return info;
	} catch (error) {
		console.error("Errore nell'analisi del PDF:", error);
		throw error;
	}
}

function extractPdfLink(htmlBody) {
	try {
		// Cerca il tag script con id="doc-data"
		const docDataRegex = /<script\s+type="text\/plain"\s+id="doc-data">([\s\S]*?)<\/script>/;
		const docDataMatch = htmlBody.match(docDataRegex);

		if (!docDataMatch || !docDataMatch[1]) {
			return null;
		}

		// Estrai e analizza il JSON dai dati
		const jsonData = JSON.parse(docDataMatch[1].trim());

		// Naviga attraverso la struttura JSON per trovare il LINK_PDF
		if (jsonData &&
			jsonData.FILE &&
			jsonData.FILE.DOCUMENT &&
			jsonData.FILE.DOCUMENT[0] &&
			jsonData.FILE.DOCUMENT[0].TEMPLATE &&
			jsonData.FILE.DOCUMENT[0].TEMPLATE[0] &&
			jsonData.FILE.DOCUMENT[0].TEMPLATE[0].DATA &&
			jsonData.FILE.DOCUMENT[0].TEMPLATE[0].DATA[0] &&
			jsonData.FILE.DOCUMENT[0].TEMPLATE[0].DATA[0].ELE &&
			jsonData.FILE.DOCUMENT[0].TEMPLATE[0].DATA[0].ELE[0] &&
			jsonData.FILE.DOCUMENT[0].TEMPLATE[0].DATA[0].ELE[0].RIEPILOGO &&
			jsonData.FILE.DOCUMENT[0].TEMPLATE[0].DATA[0].ELE[0].RIEPILOGO[0] &&
			jsonData.FILE.DOCUMENT[0].TEMPLATE[0].DATA[0].ELE[0].RIEPILOGO[0].LINK_PDF) {

			return jsonData.FILE.DOCUMENT[0].TEMPLATE[0].DATA[0].ELE[0].RIEPILOGO[0].LINK_PDF;
		}

		// Se non troviamo il link tramite la struttura JSON, proviamo con regex
		const pdfLinkRegex = /https:\/\/media-platform\.doxee\.com\/da-purl\/document\/[a-f0-9]+/;
		const pdfLinkMatch = htmlBody.match(pdfLinkRegex);

		if (pdfLinkMatch) {
			return pdfLinkMatch[0];
		}

		throw new Error("Link PDF non trovato")
	} catch (error) {
		console.error("Errore nell'estrazione del link PDF:", error);

		// Fallback con regex se c'è un errore nel parsing JSON
		const pdfLinkRegex = /https:\/\/media-platform\.doxee\.com\/da-purl\/document\/[a-f0-9]+/;
		const pdfLinkMatch = htmlBody.match(pdfLinkRegex);

		if (pdfLinkMatch) {
			return pdfLinkMatch[0];
		}

		throw new Error("Link PDF non trovato")
	}
}

async function callFirstLink(text) {
	// Regex per trovare URL con https:// o http://
	const urlRegex = /https?:\/\/[^\s<>]+/;
	const match = text.match(urlRegex);

	if (!match) {
		throw Error("Nessun link trovato nel corpo dell'email");
	}

	const link = match[0];

	const response = await axios.get(link, {
		headers: {
			'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
		},
		maxRedirects: 5  // Gestisce automaticamente i redirect
	});

	return response.data;
}

function getPivot(lines) {
	// Cerco diversi possibili pattern del titolo della sezione
	const patterns = [
		'€SPESA PER LA MATERIA ENERGIA',
		'SPESA PER LA MATERIA ENERGIA',
		'SPESA PER LA TUA ENERGIA ELETTRICA',
		'SPESA MATERIA ENERGIA'
	];

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i].trim();

		for (const pattern of patterns) {
			if (line.includes(pattern)) {
				// console.log(`Trovato pivot alla riga ${i}: "${line}"`);
				return i;
			}
		}
	}

	// console.warn("Pivot non trovato, cercando un'altra strategia...");

	// Strategia alternativa: cerca pattern correlati a importi
	for (let i = 0; i < lines.length; i++) {
		if (lines[i].match(/spesa|energia|materia/i) && lines[i].match(/\d+[,.]\d+/)) {
			// console.log(`Trovato possibile pivot alternativo alla riga ${i}: "${lines[i]}"`);
			return i;
		}
	}

	return -1; // Non trovato
}

// Funzione per arrotondare per eccesso a 2 decimali
const arrotondaPerEccesso = (numero) => {
	return Math.ceil(numero * 100) / 100;
};

function calcolaRipartizioneSpese(info) {
	const {
		spesaMateria,
		trasporto,
		oneri,
		iva,
		kwTotali,
		kwCondivisi,
		kwCondominio
	} = info;

	// Calcola il totale della bolletta
	const totaleBolletta = spesaMateria + trasporto + oneri + iva;

	// Calcola le percentuali
	const percentualeCondivisi = kwCondivisi * 100 / kwTotali / 100;
	const kwRimanenti = kwTotali - kwCondivisi;
	const percentualeCondominio = kwRimanenti * 100 / kwTotali / 100;

	// Calcola le quote per tipo di spesa
	const quotaCondominio = {
		spesaMateria: spesaMateria * percentualeCondominio,
		iva: iva * percentualeCondominio
	};

	const quotaCondivisa = {
		spesaMateria: spesaMateria * percentualeCondivisi,
		trasporto,
		oneri,
		iva: iva * percentualeCondivisi
	};

	// Calcola le spese da dividere
	const spesaDaDividereIn4 = quotaCondominio.spesaMateria + quotaCondominio.iva;
	const spesaDaDividereIn6 = quotaCondivisa.spesaMateria + quotaCondivisa.iva + trasporto + oneri;

	// Calcola le quote unitarie
	const quotaUnitaria4 = spesaDaDividereIn4 / 4;
	const quotaUnitaria6 = spesaDaDividereIn6 / 6;

	// Calcola le quote per ciascun condomino
	const quote = {
		Albrigo: quotaUnitaria4 + quotaUnitaria6,
		Donatone: quotaUnitaria4 + quotaUnitaria6,
		DeLuca: quotaUnitaria4 + quotaUnitaria6,
		SininiClaudio: quotaUnitaria6,
		SininiElia: quotaUnitaria6
	};

	return Object.fromEntries(
		Object.entries(quote).map(([nome, importo]) => [
			nome,
			arrotondaPerEccesso(importo)
		])
	);
}

async function generaReportPNG(saldi) {
	// Dimensioni e configurazione
	const larghezzaCella = 120;
	const altezzaCella = 40;
	const larghezzaTotale = larghezzaCella * Object.keys(saldi).length;
	const altezzaTotale = altezzaCella * 2;

	// Inizio SVG
	let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${larghezzaTotale}" height="${altezzaTotale}" viewBox="0 0 ${larghezzaTotale} ${altezzaTotale}">`;

	// Aggiungi stile
	svg += `
          <style>
            .header { fill: #f0f0f0; }
            .positive { fill: #90ee90; }
            .negative { fill: #ffb6c1; }
            .cell { stroke: #000; stroke-width: 1; }
            .text { font-family: Arial; font-size: 14px; text-anchor: middle; }
            .amount { font-family: Arial; font-size: 16px; font-weight: bold; text-anchor: middle; }
          </style>`;

	// Disegna le celle intestazione
	let x = 0;
	Object.keys(saldi).forEach((nome, index) => {
		svg += `<rect class="header cell" x="${x}" y="0" width="${larghezzaCella}" height="${altezzaCella}" />`;
		svg += `<text class="text" x="${x + larghezzaCella/2}" y="${altezzaCella/2 + 5}">${nome}</text>`;
		x += larghezzaCella;
	});

	// Disegna le celle con i valori
	x = 0;
	Object.entries(saldi).forEach(([nome, dati]) => {
		const credito = typeof dati === 'number' ? dati : dati.credito || 0;
		const cellClass = credito >= 0 ? "positive" : "negative";
		const textColor = credito >= 0 ? "#000000" : "#000000";

		svg += `<rect class="${cellClass} cell" x="${x}" y="${altezzaCella}" width="${larghezzaCella}" height="${altezzaCella}" />`;
		svg += `<text class="amount" x="${x + larghezzaCella/2}" y="${altezzaCella + altezzaCella/2 + 5}" fill="${textColor}">${credito.toFixed(2)}</text>`;
		x += larghezzaCella;
	});

	// Chiudi SVG
	svg += '</svg>';

	return await convertSvgBufferToPngBuffer(Buffer.from(svg));
}

async function sendPDF(pdfUrl) {
	const data = new Date().toLocaleDateString();
	const caption = `*BOLLETTA - ${data}*`;

	await bot.sendDocument(CHAT_ID, pdfUrl, {
		caption: caption,
		filename: 'bolletta.pdf',
		parse_mode: 'Markdown'
	});
}

async function convertSvgBufferToPngBuffer(svgBuffer) {
	try {
		const base64Svg = `data:image/svg+xml;base64,${svgBuffer.toString('base64')}`;
		const uploadResult = await cloudinary.uploader.upload(base64Svg, { format: 'png' });
		return uploadResult.secure_url;
	} catch (error) {
		console.error('Errore durante la conversione:', error.message);
		throw error;
	}
}

async function sendImage(imageUrl){
	const data = new Date().toLocaleDateString();
	const caption = `*REPORT SALDI CONDOMINIO - ${data}*`;

	await bot.sendPhoto(CHAT_ID, imageUrl, {
		caption: caption,
		parse_mode: 'Markdown'
	});
}
