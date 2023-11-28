const {doLogin, getStats, parseCookie, sendMail} = require("./solar.js")

export default async (req) => {
    const res = await doLogin()
        .then(res => parseCookie(res))
        .then(cookies => getStats(cookies))

    const down = res.data.data.flow.nodes.find(node => node.display === 'DISCONNECTED')
    //if (down) {
        await sendMail()
        console.log(new Date() + ": CHECK KO")
    //}
}

export const config = {
    schedule: "@hourly"
}
