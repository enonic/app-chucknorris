const libs = {
    mustache: require('/lib/mustache'),
    httpClient: require('/lib/http-client'),
    static: require('/lib/enonic/static')
};

const router = require('/lib/router')()

const BASE_PATH = `/${app.name}/chucknorris`;
const STATIC_BASE_PATH = `${BASE_PATH}/_static`;

exports.all = function (req) {
    return router.dispatch(req);
};

router.get(`${BASE_PATH}`, (req) => {
    const view = resolve('chucknorris.html');
    const model = createModel(req);

    function createModel(req) {
        const handlerUrl = req.path;
        const model = {
            css: `${handlerUrl}/_static/css/chucknorris.css`,
            image: `${handlerUrl}/_static/img/chucknorris.svg`,
        };

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
        body: libs.mustache.render(view, model)
    };
});

router.get(`${STATIC_BASE_PATH}/{path:.*}`, (request) => {
    return libs.static.requestHandler(
        request,
        {
            cacheControl: () => libs.static.RESPONSE_CACHE_CONTROL.SAFE,
            index: false,
            root: '/assets',
            relativePath: libs.static.mappedRelativePath(STATIC_BASE_PATH),
        }
    );
});
