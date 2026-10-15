const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const source = ts.transpileModule(fs.readFileSync('services/googleClickNavigation.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const context = { exports: {}, URL };
vm.runInNewContext(source, context);
const route = context.exports.publicRouteWithGoogleClick;
const origin = 'https://instaplaque.co.uk';
const landing = origin + '/memorial-plaques?gclid=TEST123&_gl=1*test*_up*MQ..&utm_source=google&email=private#private';
const carried = new URL(route('/design', landing), origin);
assert.equal(carried.searchParams.get('gclid'), 'TEST123');
assert.equal(carried.searchParams.get('_gl'), '1*test*_up*MQ..');
assert.deepEqual([...carried.searchParams.keys()], ['gclid', '_gl']);
assert.equal(carried.hash, '');
assert.equal(route('/design?gclid=existing', landing), '/design?gclid=existing&_gl=1*test*_up*MQ..');
for (const privateRoute of ['/proof', '/proof/x', '/order', '/order-confirmed', '/checkout', '/admin', '/?order=private', '/?proof=private', '/?session_id=private', '/?view=admin']) {
  assert.equal(route(privateRoute, landing), privateRoute, 'No click IDs forwarded into private URLs');
  const separator = privateRoute.includes('?') ? '&' : '?';
  assert.equal(route('/design', origin + privateRoute + separator + 'gclid=TEST123'), '/design', 'No parameters forwarded from private URLs');
}
assert.equal(route('https://example.org/design', landing), 'https://example.org/design');
assert.equal(route('/design', 'http://instaplaque.co.uk/?gclid=TEST123'), '/design');
assert.equal(route('/design', 'https://preview.example/?gclid=TEST123'), '/design');
assert.equal(route('/design', origin + '/?gclid=' + 'x'.repeat(4097)), '/design');
assert.equal(route('/design', origin + '/?gclid=private%40example.invalid'), '/design');
assert.equal(route('/design', origin + '/?gclid=TEST123&session_id=private'), '/design');
assert.equal(route('/design#guide', 'https://www.instaplaque.co.uk/?gbraid=test123'), '/design?gbraid=test123#guide');
console.log('PASS Google click navigation: public React routes preserve only click/linker IDs; private/external routes, arbitrary parameters and malformed values excluded; no storage');
