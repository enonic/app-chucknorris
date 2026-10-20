const httpClient = require('/lib/http-client');

exports.get = function () {
    return {
        contentType: 'application/json',
        body: {
            joke: getJoke()
        }
    };
};

function getJoke() {
    const response = httpClient.request({
        url: 'https://api.chucknorris.io/jokes/random',
        method: 'GET',
        connectionTimeout: 5000,
        readTimeout: 5000
    });
    return response.status === 200 ? JSON.parse(response.body).value : 'Chuck Norris does not need the internet.';
}
