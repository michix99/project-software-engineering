"""
    Testing the main handler for the Cloud Function.
"""
import flask
import pytest
import main


@pytest.fixture(scope="module", name="app")
def fixture_app():
    """Create a fake "app" for generating test request contexts."""
    return flask.Flask(__name__)


def test_cors_enabled_function_auth_preflight(app):
    """
    Tests if the cors headers added correctly for a OPTION request.
    """
    with app.test_request_context(method="OPTIONS"):
        res = main.request_handler(flask.request)
        assert (
            res[2].get("Access-Control-Allow-Origin")
            == "https://projekt-software-engineering.web.app"
        )
        assert res[2].get("Access-Control-Allow-Methods") == "GET"
        assert (
            res[2].get("Access-Control-Allow-Headers") == "Content-Type, Authorization"
        )
        assert res[2].get("Access-Control-Max-Age") == "3600"
        assert res[2].get("Access-Control-Allow-Credentials") == "true"


# def test_cors_enabled_function_auth_main(app):
#     """
#     Tests if the cors headers added correctly for a GET request.
#     """
#     with app.test_request_context(method="GET"):
#         res = main.cors_enabled_function_auth(flask.request)
#         assert res[2].get("Access-Control-Allow-Origin") == "https://mydomain.com"
#         assert res[2].get("Access-Control-Allow-Credentials") == "true"
