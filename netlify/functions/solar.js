import emailjs from "@emailjs/nodejs";
import axios from "axios";
import {wrapper} from "axios-cookiejar-support";
import {CookieJar} from "tough-cookie";

const jar = new CookieJar();
const client = wrapper(axios.create({ jar }));

export default async function (event, context) {
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

export async function getData() {
    const res = await doLogin()
        .then(res => parseCookie(res))
        .then(cookies => getStats(cookies))

    const electricLoad = res.data.data.flow.nodes.find(node => node.name === 'neteco.pvms.KPI.kpiView.electricalLoad')
    const battery = res.data.data.flow.nodes.find(node => node.name === 'neteco.pvms.devTypeLangKey.energy_store').deviceTips
    const fv = res.data.data.flow.nodes.find(node => node.name === 'neteco.pvms.devTypeLangKey.string')

    const data = {
        "batteria_percentuale": format(battery.SOC, 0),
        "batteria_potenza": format(battery.BATTERY_POWER, 1),
        "batteria_in_scarica": battery.BATTERY_POWER.startsWith("-"),
        "carico": format(electricLoad.description.value.replace(' kW', ''), 1),
        "fv": format(fv.description.value.replace(' kW', ''), 2)
    }

    return data;
}

export async function parseCookie(res) {
    return res.headers['set-cookie']
            .map(h => h.split(";")[0])
            .join("; ")
}

export async function sendMail() {
    await emailjs.send('service_vsq3w3a', 'template_42ssg8p', {}, {publicKey: '970IaolZgQOrCiJGD', privateKey: 'qu7z0rQZUX6mAW_YvI8xl'})
}

export function doLogin() {
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

export async function getStats() {
    const cookies = 'HWWAFSESID=62c8760701f0b72d555; HWWAFSESTIME=1708460329219; locale=en-us; dp-session=x-2k5f5gbvlfthhe44vvirdjg8c7enc7dg6leqbuo9o9ulvubuny2k4b2r6l6kam877ws4lfpipf09862mhifsink76o7vc73xk4hgqls5rvqo5j9jbug5gb47qoljg92k; JSESSIONID=FF358784FBB1AB61FF77FDE77C34C686'
    const headers = {
        'Cookie': cookies,
        'Accept-Language': 'it-IT,it;q=0.9,en-US;q=0.8,en;q=0.7,ko;q=0.6,fr;q=0.5',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
    }

    const url = 'https://uni003eu5.fusionsolar.huawei.com/rest/pvms/web/station/v1/overview/energy-flow?stationDn=NE%3D138562592&_=1709487529235';
    return client.get(url, { headers })
}
