const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const resources = path.resolve(__dirname, '../../main/resources');

function load(relativePath, request) {
    const exports = {};
    vm.runInNewContext(fs.readFileSync(path.join(resources, relativePath), 'utf8'), {
        exports,
        require(name) {
            if (name === '/lib/http-client') {
                return {request};
            }
            if (name === '/lib/chucknorris') {
                return load('lib/chucknorris.js', request);
            }
            throw new Error('Unexpected module: ' + name);
        }
    });
    return exports;
}

function execute(request, context) {
    return JSON.parse(JSON.stringify(load('mcp/chucknorris/chucknorris.js', request).execute('fact', {}, context)));
}

test('returns text and structured fact with bounded upstream request', () => {
    const result = execute(options => {
        assert.equal(options.url, 'https://api.chucknorris.io/jokes/random');
        assert.equal(options.method, 'GET');
        assert.equal(options.connectionTimeout, 5000);
        assert.equal(options.readTimeout, 5000);
        return {status: 200, body: JSON.stringify({value: 'Chuck Norris can unit test randomness.'})};
    });
    assert.deepEqual(result, {
        content: [{type: 'text', text: 'Chuck Norris can unit test randomness.'}],
        structuredContent: {fact: 'Chuck Norris can unit test randomness.'}
    });
});

for (const [name, request] of [
    ['HTTP failure', () => ({status: 503, body: 'Unavailable'})],
    ['invalid JSON', () => ({status: 200, body: 'invalid'})],
    ['missing fact', () => ({status: 200, body: '{}'})],
    ['empty fact', () => ({status: 200, body: '{"value":" "}'})],
    ['network failure', () => {throw new Error('Internal connection details');}]
]) {
    test(name + ' returns an actionable tool error', () => {
        const progress = [];
        const context = {progress: (...args) => progress.push(args)};
        assert.deepEqual(execute(request, context), {
            content: [{type: 'text', text: 'Could not retrieve a Chuck Norris fact. Please try again.'}],
            isError: true
        });
        assert.deepEqual(progress, [[0, 1, 'Fetching a Chuck Norris fact']]);
    });
}

test('reports progress around the upstream request and preserves the result', () => {
    const events = [];
    const context = {progress: (...args) => events.push(args)};
    const result = execute(() => {
        events.push(['request']);
        return {status: 200, body: '{"value":"A fact"}'};
    }, context);
    assert.deepEqual(events, [
        [0, 1, 'Fetching a Chuck Norris fact'],
        ['request'],
        [1, 1, 'Chuck Norris fact ready']
    ]);
    assert.deepEqual(result, {
        content: [{type: 'text', text: 'A fact'}],
        structuredContent: {fact: 'A fact'}
    });
});

test('works with an inactive no-op progress helper', () => {
    const result = execute(() => ({status: 200, body: '{"value":"A fact"}'}), {progress() {}});
    assert.equal(result.structuredContent.fact, 'A fact');
});

test('progress failures propagate without being reported as upstream failures', () => {
    for (const failureAt of [0, 1]) {
        const context = {
            progress(value) {
                if (value === failureAt) {
                    throw new Error('Progress stream closed');
                }
            }
        };
        assert.throws(() => execute(() => ({status: 200, body: '{"value":"A fact"}'}), context), /Progress stream closed/);
    }
});

test('unknown tool fails before contacting the fact service', () => {
    const controller = load('mcp/chucknorris/chucknorris.js', () => assert.fail('Unexpected network request'));
    assert.throws(() => controller.execute('unknown', {}, {
        progress: () => assert.fail('Unexpected progress report')
    }), /Unsupported declared tool: unknown/);
});

test('fact API returns fact and preserves fallback responses', () => {
    for (const [response, expected] of [
        [{status: 200, body: '{"value":"A fact"}'}, 'A fact'],
        [{status: 503}, 'Chuck Norris does not need the internet.']
    ]) {
        const result = load('apis/fact/fact.js', () => response).get();
        assert.equal(result.contentType, 'application/json');
        assert.deepEqual(JSON.parse(JSON.stringify(result.body)), {fact: expected});
    }
});
