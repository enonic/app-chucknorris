https://market.enonic.com/vendors/enonic/chuck-norris-widget

Data retrieved from https://api.chucknorris.io/

## Fact API

The app exposes `/api/com.enonic.app.chucknorris:fact`, returning
`{fact: "..."}`. Existing descriptor permissions and connector mounts apply.
The previous `joke` endpoint is replaced by `fact`.

## MCP tool (iteration 1)

The app contributes the `fact` tool through `/mcp/chucknorris/chucknorris.yaml`
and its matching JavaScript controller. It takes no arguments and returns text
content and `structuredContent: {fact: "..."}`. Upstream failures produce an
`isError: true` result. Facts may contain adult language.

XP exposes contributed tools at `/api/system:mcp`. The public tool name is
`com.enonic.app.chucknorris__chucknorris__fact`.

With XP progress support (enonic/xp#12655), the tool reports `0/1` before
fetching the fact and `1/1` after validating the response. Failed requests return
the existing tool error with no successful-completion report. The HTTP fact
API and widget are unchanged.

Clients supplying a progress token receive the reports and final result on the
tool call's SSE response. Calls without a token keep JSON responses through
XP's no-op helper. The controller also accepts calls without the third argument
for compatibility with earlier XP builds. No artificial delays are added.

Build with Java 25:

```sh
./gradlew build
```

Run deterministic tests with Node.js 24 (no npm dependencies):

```sh
node --test src/test/js/chucknorris.test.cjs
```

Once XP dispatch is available, install the app JAR using XP's application
management UI and connect local Claude Code:

```sh
claude mcp add --transport http --scope local xp http://localhost:8080/api/system:mcp
```

In a fresh Claude session, check `/mcp` and ask: "Use the Chuck Norris tool to
get a random fact." Verify that the displayed fact matches the tool result.
Record the client version, protocol revision, tool call/result and pass/fail in
issue #68. Do not compare against a fixed fact from the live service.

Once XP lifecycle support (enonic/xp#12635) is available, stop or uninstall the
app and verify that its tool disappears and a stale invocation fails. This
requires no XP source change, rebuild or restart.
