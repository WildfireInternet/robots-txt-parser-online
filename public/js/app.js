
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

    // on submit
    $form.submit(function (e) {

        var results = [];

        // make sure google has loaded the re-captcha
        if ( ! window.grecaptcha) {
            console.log('google re-captcha not yet loaded');
            return ;
        }

        e.preventDefault(); // prevent default submit action

        // reset any previous errors and results
        $errors.html('');
        $errors.html('');

        // submit form data
        $.post('/', {
            rules: $rules.val(),
            urls: $urls.val(),
            ua: $ua.val(),
            'g-recaptcha-response': grecaptcha.getResponse() // get element live
        }, function (data) {

            // reset google re-captcha
            grecaptcha.reset();

            // check for error
            if (data.error) {
                $errors.html(data.error);
                return ;
            }

            // loop in results
            $.each(data.results, function (url, isAllowed) {
                var state = isAllowed ? 'allowed' : 'disallowed';
                results.push(template.replace(/\{state\}/g, state).replace(/\{url\}/g, url));
            });

            // show results
            $results.html(results.join(''));

        });
    });
});
