const axios = require('axios');

const API_KEY = process.env.JSONBIN_KEY;
const BIN_ID = process.env.JSONBIN_ID
const BASE_URL = 'https://api.jsonbin.io/v3/b';

const headers = {
    'Content-Type': 'application/json',
    'X-Master-Key': API_KEY,
    'X-Bin-Private': 'true',
    'X-Bin-Meta': 'false',
};

async function readBin() {
    try {
        const response = await axios.get(`${BASE_URL}/${BIN_ID}/latest`, { headers });
        return response.data;
    } catch (error) {
        console.error('Errore nella lettura del bin:', error.response ? error.response.data : error.message);
        throw error;
    }
}

async function updateBin(data) {
    try {
        const response = await axios.put(`${BASE_URL}/${BIN_ID}`, data, { headers });
        console.log('Bin aggiornato con successo!');
        return response.data;
    } catch (error) {
        console.error('Errore nell\'aggiornamento del bin:', error.response ? error.response.data : error.message);
        throw error;
    }
}

module.exports = {
    readBin,
    updateBin
};

if (require.main === module) {
    readBin().catch(console.error);
}