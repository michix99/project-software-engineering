"""
    Basic fixture setups for the different test classes.
"""
import os
import pytest
import flask


@pytest.fixture(scope="session", name="_environment_variables")
def fixture_environment_variables_local():
    """Creates the necessary environment variables."""
    os.environ["DISABLE_AUTH"] = "True"
    os.environ["LOCAL_TESTING"] = "True"


@pytest.fixture(scope="module", name="app")
def fixture_app():
    """Create a fake "app" for generating test request contexts."""
    return flask.Flask(__name__)
