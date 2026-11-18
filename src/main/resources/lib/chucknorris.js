const httpClient = require('/lib/http-client');

exports.requestFact = function () {
    return httpClient.request({
        url: 'https://api.chucknorris.io/jokes/random',
        method: 'GET',
        connectionTimeout: 5000,
        readTimeout: 5000
    });
};
