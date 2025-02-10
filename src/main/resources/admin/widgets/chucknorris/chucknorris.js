const libs = {
    thymeleaf: require('/lib/thymeleaf'),
    httpClient: require('/lib/http-client')
};

exports.get = handleGet;

function handleGet(req) {
    const view = resolve('chucknorris.html');
    const model = createModel(req);

    function createModel(req) {
        var model = {};

        model.errors = [];

        try {
            model.joke = getJoke();
        }
        catch(err) {
            model.errors.push(err);
        }

        model.errorExists = model.errors.length > 0;

        if (model.errorExists) {
            log.debug(model.errors);
        }

        return model;
    }

    function getJoke() {
        const json = getJSON('https://api.chucknorris.io/jokes/random');
        return json.value;
    }

    function getJSON(url) {
        const response = libs.httpClient.request({
            url: url,
            method: 'GET',
            connectionTimeout: 5000,
            readTimeout: 5000,
            contentType: 'application/json'
        });

        if (response.status !== 200) {
            throw `Could not retrieve JSON url (${response.status})`;
        }
        return JSON.parse(response.body);
    }

    return {
        body: libs.thymeleaf.render(view, model)
    };
}
