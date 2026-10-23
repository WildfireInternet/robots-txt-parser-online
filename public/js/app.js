jQuery(function ($) {

    // gather inputs for use later
    var $form = $('#robots-parser-form'),
        $rules = $('#rules'),
        $urls = $('#urls'),
        $ua = $('#ua'),
        // get template for results
        template = $('#result-url').html(),
        // container for any errors
        $errors = $('#error-msg'),
        // container for results
        $results = $('#results');

    // escape user input before inserting it as html
    function escapeHtml(str) {
        return $('<div>').text(str).html().replace(/"/g, '&quot;');
    }

    // check each url against the rules, returns an object of url => isAllowed
    function check(rules, urls, ua) {
        var results = {},
            robots;

        // fallback if no useragent given
        if ( ! RobotsTxt.parse(rules).groups.length) {
            rules = "User-agent: *\r\n" + rules;
        }

        robots = RobotsTxt.guard(RobotsTxt.parse(rules));

        // loop urls, checking if allowed
        urls.split(/\r?\n/).forEach(function (url) {
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
                results[url] = robots.isAllowed(ua, path);
            }
        });

        return results;
    }

    // on submit
    $form.submit(function (e) {

        var results = [];

        e.preventDefault(); // prevent default submit action

        // reset any previous errors and results
        $errors.html('');
        $results.html('');

        // make sure all required data is entered
        if ( ! $rules.val()) {
            $errors.html("Please supply robots.txt rules");
            return ;
        }

        if ( ! $urls.val()) {
            $errors.html("Please supply example urls");
            return ;
        }

        // loop in results
        $.each(check($rules.val(), $urls.val(), $ua.val() || '*'), function (url, isAllowed) {
            var state = isAllowed ? 'allowed' : 'disallowed';
            results.push(template.replace(/\{state\}/g, state).replace(/\{url\}/g, function () { return escapeHtml(url); }));
        });

        // show results
        $results.html(results.join(''));
    });
});
