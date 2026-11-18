const chucknorris = require('/lib/chucknorris');

exports.execute = function (name, args, context) {
    if (name !== 'fact') {
        throw new Error('Unsupported declared tool: ' + name);
    }

    if (context) {
        context.progress(0, 1, 'Fetching a Chuck Norris fact');
    }

    let fact;
    try {
        const response = chucknorris.requestFact();
        if (response.status !== 200) {
            throw new Error('Unexpected fact service response');
        }
        fact = JSON.parse(response.body).value;
        if (typeof fact !== 'string' || fact.trim().length === 0) {
            throw new Error('Invalid fact service response');
        }

    } catch (error) {
        return {
            content: [{type: 'text', text: 'Could not retrieve a Chuck Norris fact. Please try again.'}],
            isError: true
        };
    }

    if (context) {
        context.progress(1, 1, 'Chuck Norris fact ready');
    }
    return {
        content: [{type: 'text', text: fact}],
        structuredContent: {fact: fact}
    };
};
