const {doLogin, getStats, parseCookie, sendMail} = require("./solar.js")

export default async (req) => {
    const res = await doLogin()
        .then(res => parseCookie(res))
        .then(cookies => getStats(cookies))

    console.log(new Date() + ": CHECKING....")
    const down = res.data.data.flow.nodes.find(node => node.display === 'DISCONNECTED')
    if (down) {
        console.log(new Date() + ": SOLAR KO")
        await sendMail()
    } else {
        console.log(new Date() + ": SOLAR OK")
    }
}

export const config = {
    schedule: "0 * * * *"
}
