IMAGE ?= robots-txt-checker
NAME ?= robots-txt-checker

-include .env
PORT ?= 3000

.PHONY: build run up down logs dev check-env

build:
	docker build -t $(IMAGE) .

# run in the foreground, removed on exit
run: check-env build
	docker run --rm -it --env-file .env -p $(PORT):$(PORT) $(IMAGE)

# run in the background, restarting on crash/reboot
up: check-env build
	-docker rm -f $(NAME) 2>/dev/null
	docker run -d --name $(NAME) --restart unless-stopped --env-file .env -p $(PORT):$(PORT) $(IMAGE)

down:
	docker rm -f $(NAME)

logs:
	docker logs -f $(NAME)

# run locally without docker
dev: check-env node_modules
	node --env-file=.env main.js

node_modules: package-lock.json
	npm ci
	touch node_modules

check-env:
	@test -f .env || { echo "Missing .env - run: cp .env.example .env"; exit 1; }
