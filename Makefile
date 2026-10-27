PORT ?= 3000

.PHONY: serve test

# serve the static site locally, e.g. `make serve PORT=8080`
serve:
	python3 -m http.server -d public $(PORT)

# run the parser tests (Node 18+, no dependencies)
test:
	node --test
