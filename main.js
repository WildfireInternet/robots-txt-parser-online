"use strict";

const express = require('express'),
    bodyParser = require('body-parser'),
    robotsParser = require('robots-txt-parse'),
    robotsGuard = require('robots-txt-guard'),
    ReadableString = require('readable-string'),
    request = require('request'),
    port = process.env.PORT || 3000,
    googleRecaptchaSecret = process.env.GOOGLERECAPTCHASECRET;

if ( ! googleRecaptchaSecret) {
    console.log('Please specify google re-captcha secret, https://www.google.com/recaptcha')
    return ;
}

let app = express();

app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({ extended: false }));

app.post('/', (req, res) => {

    // make sure all rquired data is entered
    if ( ! req.body.rules) {
        return res.json({
            error: "Please supply robots.txt rules"
        });
    }

    if ( ! req.body.urls) {
        return res.json({
            error: "Please supply example urls"
        });
    }

    console.log(req.body);

    // verify google recaptcha
    request.post('https://www.google.com/recaptcha/api/siteverify', {
        form: {
            secret: googleRecaptchaSecret,
            response: req.body['g-recaptcha-response'],
            remoteip: req.ip
        }
    }, function (err, httpResponse, body) {

        // check for http errors
        if (err) {
            console.log('google recaptcha HTTP error:', err);
            return res.json({
                error: "Unkown HTTP error"
            });
        }

        // parse response from google
        body = JSON.parse(body);

        if ( ! body.success) {
            console.log('google recaptcha result error:', body);
            return res.json({
                error: "Please tick to prove you are not a robot"
            });
        }

        // gather data
        let results = {},
            urls = req.body.urls.split(/\r?\n/),
            rules = req.body.rules,
            ua = req.body.ua || '*',
            r;

        // fallback if no useragent given
        if ( ! rules.match(/user-?agent:/i)) {
            rules = "User-agent: *\r\n" + rules;
        }

        // create a readable stream froma  string
        r = new ReadableString(rules, {
            encoding: 'utf8'
        });

        // parse with the robots parser
        robotsParser(r).then(function (robots) {
            let parsedRobotsRules = robotsGuard(robots);

            // loop urls, checking if allowed
            urls.forEach(function (url) {
                if (url) {
                    // make sure path is correct
                    if ( ! url.startsWith('/') && ! url.startsWith('http')) {
                        url = '/' + url;
                    }
                    results[url] = parsedRobotsRules.isAllowed(ua, url)
                }
            });

            // return results to the user
            return res.json({
                "results": results
            });

        });

    });

});

app.listen(port, () => {
    console.log('Listening on http://localhost:' + port);
});
