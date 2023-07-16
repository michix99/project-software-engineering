# ProjektSoftwareEngineering

Uses python 3.11

## Create virtuell environment

Run `python -m venv .env`.

## Activate virtuell environment

Depending on our host system, you need to run the activate script in your virtuell environment folder. Sample for running in windows powershell: `[...]\.env\Scripts\Activate.ps1`. You can deactivate the virtuell environment by running `deactivate`.

## Install dependencies

Run `pip install -r requirements.txt` in the backend folder _after_ activating your virteull environment.

## Development server

Run `functions-framework --target <function name (ex: hello_get)> --debug` for a dev server. Run requests against `http://localhost:8080/`.

## Install dependencies for lint and testing

Run `pip install -r ./test/requirements.txt` in the backend folder.

## Running lint

Run `pylint backend` to execute the linter via pylint.

## Running unit tests

Run `pytest --cov=backend` to execute the unit tests via pytest.
