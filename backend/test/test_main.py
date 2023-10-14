"""
    Testing the main handler for the Cloud Function.
"""
import json
import os
from unittest.mock import patch
import flask
import pytest
import main


class TestMain:  # pylint: disable=R0904
    """Contains tests for the main request handler."""

    @pytest.fixture(autouse=True)
    def fixture_init_app(self):
        """Mocks the firebase init method."""
        with patch("firebase_admin.initialize_app"):
            yield

    @pytest.fixture(autouse=True)
    def fixture_init_firestore_client(self):
        """Mocks the firstore client method."""
        with patch("firebase_admin.firestore.client"):
            yield

    def test_cors_enabled_function_auth_preflight(self, app) -> None:
        """Tests if the cors headers added correctly for a OPTION request."""
        with app.test_request_context(method="OPTIONS"):
            res = main.request_handler(flask.request)
            assert (
                res[2].get("Access-Control-Allow-Origin")
                == "https://projekt-software-engineering.web.app"
            )
            assert (
                res[2].get("Access-Control-Allow-Methods") == "GET, PUT, POST, DELETE"
            )
            assert (
                res[2].get("Access-Control-Allow-Headers")
                == "Content-Type, Authorization"
            )
            assert res[2].get("Access-Control-Max-Age") == "3600"
            assert res[2].get("Access-Control-Allow-Credentials") == "true"

    def test_cors_enabled_function_auth_preflight_local_testing(
        self, app, _environment_variables
    ) -> None:
        """Tests if the cors headers added correctly for a OPTION request (local testing)."""
        with app.test_request_context(method="OPTIONS"):
            res = main.request_handler(flask.request)
            assert res[2].get("Access-Control-Allow-Origin") == "*"
            assert (
                res[2].get("Access-Control-Allow-Methods") == "GET, PUT, POST, DELETE"
            )
            assert (
                res[2].get("Access-Control-Allow-Headers")
                == "Content-Type, Authorization"
            )
            assert res[2].get("Access-Control-Max-Age") == "3600"
            assert res[2].get("Access-Control-Allow-Credentials") == "true"

    def test_invalid_request(self, app, _environment_variables) -> None:
        """Tests that invalid request paths should be handled."""
        with app.test_request_context("/", method="GET"):
            res = main.request_handler(flask.request)
            assert res[0] == "Invalid Request"
            assert res[1] == 400
            assert res[2].get("Access-Control-Allow-Origin") == "*"
            assert res[2].get("Access-Control-Allow-Credentials") == "true"

        with app.test_request_context("/unknown-path", method="GET"):
            res = main.request_handler(flask.request)
            assert res[0] == "Invalid Request"
            assert res[1] == 400
            assert res[2].get("Access-Control-Allow-Origin") == "*"
            assert res[2].get("Access-Control-Allow-Credentials") == "true"

    def test_unauthorized_request(self, app) -> None:
        """Tests that unauthorized requests should be handled."""
        with app.test_request_context(method="GET"), patch.dict(
            os.environ, {"DISABLE_AUTH": "False"}
        ):
            res = main.request_handler(flask.request)
            assert res[0] == "No Authorization header provided!"
            assert res[1] == 401
            assert res[2].get("Access-Control-Allow-Origin") == "*"
            assert res[2].get("Access-Control-Allow-Credentials") == "true"

    def test_data_handler_request(self, app) -> None:
        """Tests a request forward to the data handler."""
        with app.test_request_context("/data/course", method="GET"), patch(
            "db_operator.DatabaseOperator.read_all"
        ) as read_mock:
            read_mock.return_value = 200, [
                {"id": "my_dummy"},
                {"id": "my_other_dummy"},
            ]
            res = main.request_handler(flask.request)
            loaded_res = json.loads(res[0])
            assert len(loaded_res) == 2
            assert res[1] == 200
            assert res[2].get("Access-Control-Allow-Origin") == "*"
            assert res[2].get("Access-Control-Allow-Credentials") == "true"

    def test_api_handler_request(self, app) -> None:
        """Tests a request forward to the api handler."""
        with app.test_request_context("/api/invalid", method="GET"):
            res = main.request_handler(flask.request)
            assert res[0] == "Invalid Request"
            assert res[1] == 400
            assert res[2].get("Access-Control-Allow-Origin") == "*"
            assert res[2].get("Access-Control-Allow-Credentials") == "true"
