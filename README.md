
![RTC](./public/images/robots-txt-checker.png) Robots.txt Checker / Parser Online
================================

To run:

```bash
PORT=3000 GOOGLERECAPTCHASECRET=xxxxx npm start
```
Where 3000 is the port you want to run on
and xxxxx is your [Google re-captcha secret](https://www.google.com/recaptcha)

Or with Docker, put your settings in `.env` and use the Makefile:

```bash
cp .env.example .env   # then fill in GOOGLERECAPTCHASECRET
make up                # build and run in the background (make logs / make down)
```

`make run` runs in the foreground instead, and `make dev` runs locally without Docker.

Or visit this live @ [robots-txt-checker.wildfireinternet.co.uk](https://robots-txt-checker.wildfireinternet.co.uk/)
