jQuery(function ($) {

    // gather inputs for use later
    var $form = $('#robots-parser-form'),
        $rules = $('#rules'),
        $urls = $('#urls'),
        $ua = $('#ua'),
        // rules editor parts
        $gutter = $('#rules-gutter'),
        $highlight = $('#rules-highlight'),
        $lineCount = $('#line-count'),
        // get template for results
        template = $('#result-url').html(),
        // results and summaries
        $results = $('#results'),
        $blocked = $('#blocked-count'),
        $allowed = $('#allowed-count'),
        $matchedGroup = $('#matched-group');

    // escape user input before inserting it as html
    function escapeHtml(str) {
        return $('<div>').text(str).html().replace(/"/g, '&quot;');
    }

    function capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    // check each url against the rules, returns a list of { url, allowed, group, rule }
    function check(rules, urls, ua) {
        var results = [],
            robots;

        // fallback if no useragent given, rules without a group are treated as `User-agent: *`
        robots = RobotsTxt.guard(RobotsTxt.parse(rules, RobotsTxt.parse(rules).groups.length ? null : '*'));

        // loop urls, checking if allowed
        urls.split(/\r?\n/).forEach(function (url) {
            url = url.trim();
            if (url) {
                var path = url;
                // make sure path is correct, rules only match against the path (and query) of full urls
                if (url.startsWith('http')) {
                    try {
                        var parsed = new URL(url);
                        path = parsed.pathname + parsed.search;
                    } catch (err) {}
                } else if ( ! url.startsWith('/')) {
                    url = path = '/' + url;
                }
                results.push($.extend({ url: url }, robots.explain(ua, path)));
            }
        });

        return results;
    }

    // syntax highlight one line of robots.txt
    function highlightLine(line) {
        var hash = line.indexOf('#'),
            code = hash === -1 ? line : line.slice(0, hash),
            comment = hash === -1 ? '' : line.slice(hash),
            colon = code.indexOf(':'),
            html = escapeHtml(code);

        if (colon !== -1) {
            var field = code.slice(0, colon),
                type = { 'user-agent': 'agent', 'disallow': 'disallow', 'allow': 'allow' }[field.trim().toLowerCase()];
            html = (type ? '<span class="tok-' + type + '">' + escapeHtml(field) + '</span>' : escapeHtml(field))
                + '<span class="tok-colon">:</span>'
                + escapeHtml(code.slice(colon + 1));
        }

        if (comment) {
            html += '<span class="tok-comment">' + escapeHtml(comment) + '</span>';
        }

        return html;
    }

    // redraw the rules editor's line numbers and highlighting, marking lines that matched a url
    function renderEditor(hitLines) {
        var lines = $rules.val().split(/\r?\n/),
            gutter = [],
            code = [];

        lines.forEach(function (line, i) {
            var cls = hitLines[i + 1] ? ' class="is-hit"' : '';
            gutter.push('<div' + cls + '>' + (i + 1) + '</div>');
            code.push('<div' + cls + '>' + highlightLine(line) + '</div>');
        });

        $gutter.html(gutter.join(''));
        $highlight.html(code.join(''));
        $lineCount.text($rules.val() ? lines.length + (lines.length === 1 ? ' line' : ' lines') : '');

        // grow to fit the rules so only the page scrolls vertically
        var rules = $rules[0];
        rules.style.height = 'auto';
        rules.style.height = (rules.scrollHeight + rules.offsetHeight - rules.clientHeight) + 'px';
        syncScroll();
    }

    function syncScroll() {
        $highlight.css('transform', 'translateX(' + (-$rules[0].scrollLeft) + 'px)');
    }

    function describeRule(rule) {
        return rule ? 'L' + rule.line + ' ' + capitalize(rule.rule) + ': ' + rule.path : 'no matching rule';
    }

    function describeGroup(group) {
        if ( ! group) {
            return 'No matching group, so everything is allowed';
        }
        return 'Matched group: <code>User-agent: ' + escapeHtml(group.agent) + '</code>'
            + (group.line ? '' : ' (assumed)');
    }

    function showEmpty(message) {
        $results.html('<li class="results-empty">' + message + '</li>');
        $blocked.text('');
        $allowed.text('');
    }

    // check everything and redraw, runs on every change
    function update() {
        var rules = $rules.val(),
            urls = $urls.val(),
            ua = $ua.val().trim() || '*',
            hitLines = {},
            blocked = 0,
            html = [];

        if ( ! rules.trim()) {
            $matchedGroup.html('');
            showEmpty('Add some robots.txt rules to see results.');
            renderEditor(hitLines);
            return;
        }

        // matched group only depends on the user-agent, so check it with any path
        $matchedGroup.html(describeGroup(check(rules, '/', ua)[0].group));

        var results = check(rules, urls, ua);

        results.forEach(function (result) {
            var state = result.allowed ? 'allowed' : 'disallowed';
            if (result.rule) {
                hitLines[result.rule.line] = true;
            }
            if ( ! result.allowed) {
                blocked++;
            }
            html.push(template
                .replace(/\{state\}/g, state)
                .replace(/\{label\}/g, capitalize(state))
                .replace(/\{url\}/g, function () { return escapeHtml(result.url); })
                .replace(/\{rule\}/g, function () { return escapeHtml(describeRule(result.rule)); }));
        });

        renderEditor(hitLines);

        if ( ! results.length) {
            showEmpty('Add some URLs to test.');
            return;
        }

        $results.html(html.join(''));
        $blocked.text(blocked + ' blocked');
        $allowed.text((results.length - blocked) + ' allowed');
    }

    $form.on('input', update);
    $rules.on('scroll', syncScroll);

    // results update live, so there's nothing to submit (e.g. on enter in the user-agent field)
    $form.on('submit', function (e) {
        e.preventDefault();
    });

    // browsers may restore previous values on back/refresh
    update();
});
