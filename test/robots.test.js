const test = require('node:test');
const assert = require('node:assert');
const RobotsTxt = require('../public/js/robots.js');

const rules = [
    '# Example rules',
    'User-agent: *',
    'Disallow: /includes/',
    'Allow: /includes/public/',
    'Disallow: /search*&page=*',
    '',
    'User-agent: Googlebot',
    'User-agent: Bingbot',
    'Disallow: /testing_slices.html',
    'Disallow: /dupe',
    'Allow: /dupe',
].join('\n');

const robots = RobotsTxt.guard(RobotsTxt.parse(rules));

test('explains which rule matched, with its line', () => {
    assert.deepStrictEqual(robots.explain('*', '/includes/checkout.php'), {
        allowed: false,
        group: { agent: '*', line: 2 },
        rule: { rule: 'disallow', path: '/includes/', line: 3 },
    });
    assert.deepStrictEqual(robots.explain('*', '/includes/public/logo.png').rule, { rule: 'allow', path: '/includes/public/', line: 4 });
    assert.deepStrictEqual(robots.explain('*', '/search?q=shoes&page=2').rule.line, 5);
});

test('no matching rule is allowed', () => {
    const result = robots.explain('*', '/wow.php');
    assert.strictEqual(result.allowed, true);
    assert.strictEqual(result.rule, null);
});

test('names the specific agent matched in a multi-agent group', () => {
    assert.deepStrictEqual(robots.explain('Bingbot', '/').group, { agent: 'Bingbot', line: 8 });
    assert.deepStrictEqual(robots.explain('AmazonProductDiscoverybot', '/').group, { agent: '*', line: 2 });
});

test('allow wins over disallow for a repeated path, keeping its line', () => {
    assert.deepStrictEqual(robots.explain('Googlebot', '/dupe'), {
        allowed: true,
        group: { agent: 'Googlebot', line: 7 },
        rule: { rule: 'allow', path: '/dupe', line: 11 },
    });
});

test('isAllowed agrees with explain', () => {
    assert.strictEqual(robots.isAllowed('*', '/includes/x'), false);
    assert.strictEqual(robots.isAllowed('Googlebot', '/includes/x'), true);
    assert.strictEqual(robots.isAllowed('Googlebot', '/testing_slices.html'), false);
});

test('default agent group keeps real line numbers', () => {
    const content = '\nDisallow: /admin/';
    assert.strictEqual(RobotsTxt.parse(content).groups.length, 0);

    const implicit = RobotsTxt.guard(RobotsTxt.parse(content, '*'));
    assert.deepStrictEqual(implicit.explain('anybot', '/admin/x'), {
        allowed: false,
        group: { agent: '*', line: null },
        rule: { rule: 'disallow', path: '/admin/', line: 2 },
    });
});
