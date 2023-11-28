const emailjs = require("@emailjs/nodejs")

exports.handler = async function (event, context) {
    const response = await emailjs.send('service_vsq3w3a', 'template_42ssg8p', {}, {
        publicKey: '970IaolZgQOrCiJGD', privateKey: 'qu7z0rQZUX6mAW_YvI8xl'
    })

    return {
        statusCode: response.status,
        body: response.text
    };
}