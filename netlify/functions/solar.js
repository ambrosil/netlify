const axios = require('axios');
const { wrapper } = require('axios-cookiejar-support');
const { CookieJar } = require('tough-cookie');

const jar = new CookieJar();
const client = wrapper(axios.create({ jar }));

exports.handler = async function (event, context) {
    return {
        statusCode: 200,
        body: JSON.stringify(await getData())
    };
}

function format(s, fractionDigits) {
    const n = parseFloat(s)
    const value = Math.abs(n).toLocaleString(
        undefined,
        { maximumFractionDigits: fractionDigits }
    );

    return value
}

async function getData() {
    const res = await doLogin()
        .then(res => parseCookie(res))
        .then(cookies => getStats2(cookies))

    const inverter = res.data.data.flow.nodes.find(node => node.name === 'neteco.pvms.devTypeLangKey.inverter').deviceTips
    const battery = res.data.data.flow.nodes.find(node => node.name === 'neteco.pvms.devTypeLangKey.energy_store').deviceTips
    const fv = res.data.data.flow.nodes.find(node => node.name === 'neteco.pvms.devTypeLangKey.string')

    const data = {
        "batteria_percentuale": format(battery.SOC, 0),
        "batteria_potenza": format(battery.BATTERY_POWER, 1),
        "batteria_in_scarica": battery.BATTERY_POWER.startsWith("-"),
        "carico": format(inverter.ACTIVE_POWER, 1),
        "fv": format(fv.description.value.replace(' kW', ''), 2)
    }

    return data;
}

async function parseCookie(res) {
    return res.headers['set-cookie']
            .map(h => h.split(";")[0])
            .join("; ")
}

function doLogin() {
    const data = {
        "organizationName": "",
        "username": process.env.SOLAR_USER,
        "password": process.env.SOLAR_PASS
    };

    const headers = {
        'Content-Length': JSON.stringify(data).length,
        'Content-Type': 'application/json',
        'Host': 'eu5.fusionsolar.huawei.com'
    }

    const url = 'https://eu5.fusionsolar.huawei.com/unisso/v2/validateUser.action?service=https%3A%2F%2Fregion03eu5.fusionsolar.huawei.com%2Funisess%2Fv1%2Fauth%3Fservice%3D%252Fpvmswebsite%252Fassets%252Fbuild%252Findex.html&decision=1';
    return client.post(url, data, { headers })
}

async function getStats(cookies) {
    const headers = {
        'Cookie': cookies
    }

    const url = 'https://region03eu5.fusionsolar.huawei.com/rest/pvms/web/station/v1/overview/station-detail?stationDn=NE%3D35274115&_=1663714022296';
    return client.get(url, { headers })
}

async function getStats2(cookies) {
    const headers = {
        'Cookie': cookies
    }

    const url = 'https://region03eu5.fusionsolar.huawei.com/rest/pvms/web/station/v1/overview/energy-flow?stationDn=NE%3D35274115&_=1664032391631';
    return client.get(url, { headers })
}