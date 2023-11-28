import {doLogin, getStats, parseCookie} from "./solar.js";
import emailjs from "@emailjs/nodejs";

export default async (req) => {
    const res = await doLogin()
        .then(res => parseCookie(res))
        .then(cookies => getStats(cookies))

    const down = res.data.data.flow.nodes.find(node => node.display === 'DISCONNECTED')
    if (down) {
        await emailjs.send('service_vsq3w3a', 'template_42ssg8p', {}, {publicKey: '970IaolZgQOrCiJGD', privateKey: 'qu7z0rQZUX6mAW_YvI8xl'})
    }
}

export const config = {
    schedule: "@hourly"
}