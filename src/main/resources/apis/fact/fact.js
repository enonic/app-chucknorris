const chucknorris = require('/lib/chucknorris');

exports.get = function () {
    return {
        contentType: 'application/json',
        body: {
            fact: getFact()
        }
    };
};

function getFact() {
    const response = chucknorris.requestFact();
    return response.status === 200 ? JSON.parse(response.body).value : 'Chuck Norris does not need the internet.';
}
