var libs = {
    thymeleaf: require('/lib/thymeleaf'),
    httpClient: require('/lib/http-client')
};

exports.get = handleGet;

function handleGet(req) {

    var view = resolve('chucknorris.html');
    var model = createModel(req);

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
        var json = getJSON('http://api.icndb.com/jokes/random?escape=javascript');
        return json.value.joke;
    }

    function getJSON(url) {
        var response = libs.httpClient.request({
            url: url,
            method: 'GET',
            connectionTimeout: 5000,
            readTimeout: 5000,
            contentType: 'application/json'
        });

        if (response.status !== 200) {
            throw 'Could not retrieve JSON url (' + response.status + ')';
        }
        return JSON.parse(response.body);
    }

    return {
        body: libs.thymeleaf.render(view, model)
    };
}