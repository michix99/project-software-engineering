# ProjektSoftwareEngineering

Uses python 3.11

## Create virtuell environment

Run `python -m venv .env`.

## Activate virtuell environment

Depending on our host system, you need to run the activate script in your virtuell environment folder. Sample for running in windows powershell: `[...]\.env\Scripts\Activate.ps1`. Sample for running in linux shell: `source [...]/.env/bin/activate` You can deactivate the virtuell environment by running `deactivate`.

## Install dependencies

Run `pip install -r requirements.txt` in the backend folder _after_ activating your virteull environment.

## Development server

Run `functions-framework --target <function name (ex: request_handler)> --debug` for a dev server. Run requests against `http://localhost:8080/`.
For local testing you can disable the authentication by setting the environment variable `DISABLE_AUTH` to true. You should also set the environment variable `LOCAL_TESTING` to true while testing locally.

### To start the local server on Windows use
`$env:LOCAL_TESTING="True"; $env:DISABLE_AUTH="True"; functions-framework --target request_handler --debug`

### To start the local server on Linux/MacOS use
`export LOCAL_TESTING=True; export DISABLE_AUTH=True; functions-framework --target request_handler --debug`

## Install dependencies for lint and testing

Run `pip install -r ./test/requirements.txt` in the backend folder.

## Running lint

Run `pylint backend` to execute the linter via pylint.

## Running unit tests

Run `pytest --cov-report html --cov-report term  --cov=.` to execute the unit tests via pytest.

