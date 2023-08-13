"""
    Testing the main handler for the Cloud Function.
"""
import os
from unittest import mock
import flask
import pytest
import main


class TestMain:  # pylint: disable=R0904
    """Contains tests for the main request handler."""

    @pytest.fixture(scope="session", name="_init_app")
    def fixture_init_app(self):
        """Mocks the firebase init."""
        with mock.patch("firebase_admin.initialize_app") as init_mock:
            return init_mock

    @pytest.fixture(scope="session", name="_init_db")
    def fixture_init_db(self):
        """Mocks the firebase init."""
        with mock.patch("firebase_admin.firestore.client") as client_mock:
            return client_mock

    def test_cors_enabled_function_auth_preflight(self, app, _init_app) -> None:
        """Tests if the cors headers added correctly for a OPTION request."""
        with app.test_request_context(method="OPTIONS"):
            res = main.request_handler(flask.request)
            assert (
                res[2].get("Access-Control-Allow-Origin")
                == "https://projekt-software-engineering.web.app"
            )
            assert res[2].get("Access-Control-Allow-Methods") == "GET"
            assert (
                res[2].get("Access-Control-Allow-Headers")
                == "Content-Type, Authorization"
            )
            assert res[2].get("Access-Control-Max-Age") == "3600"
            assert res[2].get("Access-Control-Allow-Credentials") == "true"

    def test_cors_enabled_function_auth_preflight_local_testing(
        self, app, _environment_variables, _init_app
    ) -> None:
        """Tests if the cors headers added correctly for a OPTION request (local testing)."""
        with app.test_request_context(method="OPTIONS"):
            res = main.request_handler(flask.request)
            assert res[2].get("Access-Control-Allow-Origin") == "*"
            assert res[2].get("Access-Control-Allow-Methods") == "GET"
            assert (
                res[2].get("Access-Control-Allow-Headers")
                == "Content-Type, Authorization"
            )
            assert res[2].get("Access-Control-Max-Age") == "3600"
            assert res[2].get("Access-Control-Allow-Credentials") == "true"

    def test_invalid_request(self, app, _environment_variables, _init_app) -> None:
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

    def test_unauthorized_request(self, app, _init_app) -> None:
        """Tests that unauthorized requests should be handled."""
        with app.test_request_context(method="GET"), mock.patch.dict(
            os.environ, {"DISABLE_AUTH": "False"}
        ):
            res = main.request_handler(flask.request)
            assert res[0] == "No Authorization header provided!"
            assert res[1] == 401
            assert res[2].get("Access-Control-Allow-Origin") == "*"
            assert res[2].get("Access-Control-Allow-Credentials") == "true"

    def test_get_course_successful(
        self, app, _environment_variables, _init_app, _init_db
    ) -> None:
        """Tests a successful GET request to get all course elements."""
        with app.test_request_context("/course", method="GET"), mock.patch(
            "db_operator.DatabaseOperator.read_all"
        ) as read_mock:
            read_mock.return_value = 200, [
                {"id": "dummy_id"},
                {"id": "another_dummy_id"},
            ]
            res = main.request_handler(flask.request)
            assert res[0] == '[{"id": "dummy_id"}, {"id": "another_dummy_id"}]'
            assert res[1] == 200
            assert res[2].get("Access-Control-Allow-Origin") == "*"
            assert res[2].get("Access-Control-Allow-Credentials") == "true"

    def test_get_course_failing(
        self, app, _environment_variables, _init_app, _init_db
    ) -> None:
        """Tests that a failing GET request should properly return the error."""
        with app.test_request_context("/course", method="GET"), mock.patch(
            "db_operator.DatabaseOperator.read_all"
        ) as read_mock:
            read_mock.return_value = 500, "Bad Error"
            res = main.request_handler(flask.request)
            assert res[0] == "Bad Error"
            assert res[1] == 500
            assert res[2].get("Access-Control-Allow-Origin") == "*"
            assert res[2].get("Access-Control-Allow-Credentials") == "true"

    def test_post_course_successful(
        self, app, _environment_variables, _init_app, _init_db
    ) -> None:
        """Tests a successful POST request to create a new course entry."""
        with app.test_request_context(
            "/course",
            method="POST",
            json={"course_abbreviation": "abbr", "name": "new"},
        ), mock.patch("db_operator.DatabaseOperator.create") as create_mock:
            create_mock.return_value = 201, "dummy_id"
            res = main.request_handler(flask.request)
            assert res[0] == '{"id": "dummy_id"}'
            assert res[1] == 201
            assert res[2].get("Access-Control-Allow-Origin") == "*"
            assert res[2].get("Access-Control-Allow-Credentials") == "true"

    def test_post_course_failing_conflict(
        self, app, _environment_variables, _init_app, _init_db
    ) -> None:
        """Tests that duplicated element as POST request should return a conflict."""
        with app.test_request_context(
            "/course",
            method="POST",
            json={"course_abbreviation": "abbr", "name": "new"},
        ), mock.patch("db_operator.DatabaseOperator.create") as create_mock:
            create_mock.return_value = 409, "duplicate_id"
            res = main.request_handler(flask.request)
            assert res[0] == '{"id": "duplicate_id"}'
            assert res[1] == 409
            assert res[2].get("Access-Control-Allow-Origin") == "*"
            assert res[2].get("Access-Control-Allow-Credentials") == "true"

    def test_post_course_failing_missing_fields(
        self, app, _environment_variables, _init_app, _init_db
    ) -> None:
        """Tests that a POST request with missing fields should return a bad request."""
        with app.test_request_context(
            "/course",
            method="POST",
            json={"course_abbreviation": "abbr"},
        ):
            res = main.request_handler(flask.request)
            assert (
                res[0]
                == "Not all required fields are provided! "
                + "Required fields are: course_abbreviation, name"
            )
            assert res[1] == 400
            assert res[2].get("Access-Control-Allow-Origin") == "*"
            assert res[2].get("Access-Control-Allow-Credentials") == "true"

    def test_post_course_failing(
        self, app, _environment_variables, _init_app, _init_db
    ) -> None:
        """Tests that a failing POST request should properly return the error."""
        with app.test_request_context(
            "/course",
            method="POST",
            json={"course_abbreviation": "abbr", "name": "new"},
        ), mock.patch("db_operator.DatabaseOperator.create") as create_mock:
            create_mock.return_value = 500, "Bad Error"
            res = main.request_handler(flask.request)
            assert res[0] == "Bad Error"
            assert res[1] == 500
            assert res[2].get("Access-Control-Allow-Origin") == "*"
            assert res[2].get("Access-Control-Allow-Credentials") == "true"

    def test_get_one_course_successful(
        self, app, _environment_variables, _init_app, _init_db
    ) -> None:
        """Tests a successful GET request to get a course element."""
        with app.test_request_context("/course/dummy_id", method="GET"), mock.patch(
            "db_operator.DatabaseOperator.read"
        ) as read_mock:
            read_mock.return_value = 200, {"id": "dummy_id"}
            res = main.request_handler(flask.request)
            assert res[0] == '{"id": "dummy_id"}'
            assert res[1] == 200
            assert res[2].get("Access-Control-Allow-Origin") == "*"
            assert res[2].get("Access-Control-Allow-Credentials") == "true"

    def test_get_one_course_failing(
        self, app, _environment_variables, _init_app, _init_db
    ) -> None:
        """Tests that a failing GET request for one element should properly return the error."""
        with app.test_request_context("/course/dummy_id", method="GET"), mock.patch(
            "db_operator.DatabaseOperator.read"
        ) as read_mock:
            read_mock.return_value = 500, "Bad Error"
            res = main.request_handler(flask.request)
            assert res[0] == "Bad Error"
            assert res[1] == 500
            assert res[2].get("Access-Control-Allow-Origin") == "*"
            assert res[2].get("Access-Control-Allow-Credentials") == "true"

    def test_put_course_successful(
        self, app, _environment_variables, _init_app, _init_db
    ) -> None:
        """Tests a successful PUT request to update an existing course entry."""
        with app.test_request_context(
            "/course/dummy_id",
            method="PUT",
            json={"course_abbreviation": "abbr", "name": "new"},
        ), mock.patch("db_operator.DatabaseOperator.update") as update_mock:
            update_mock.return_value = 200, "dummy_id"
            res = main.request_handler(flask.request)
            assert res[0] == '{"id": "dummy_id"}'
            assert res[1] == 200
            assert res[2].get("Access-Control-Allow-Origin") == "*"
            assert res[2].get("Access-Control-Allow-Credentials") == "true"

    def test_put_course_failing_conflict(
        self, app, _environment_variables, _init_app, _init_db
    ) -> None:
        """Tests that a duplicated element as PUT request body should return a conflict."""
        with app.test_request_context(
            "/course/dummy_id",
            method="PUT",
            json={"course_abbreviation": "abbr", "name": "new"},
        ), mock.patch("db_operator.DatabaseOperator.update") as update_mock:
            update_mock.return_value = 409, "duplicate_id"
            res = main.request_handler(flask.request)
            assert res[0] == '{"id": "duplicate_id"}'
            assert res[1] == 409
            assert res[2].get("Access-Control-Allow-Origin") == "*"
            assert res[2].get("Access-Control-Allow-Credentials") == "true"

    def test_put_course_failing_missing_fields(
        self, app, _environment_variables, _init_app, _init_db
    ) -> None:
        """Tests that a PUT request with missing fields should return a bad request."""
        with app.test_request_context(
            "/course/dummy_id",
            method="PUT",
            json={"course_abbreviation": "abbr"},
        ):
            res = main.request_handler(flask.request)
            assert (
                res[0]
                == "Not all required fields are provided! "
                + "Required fields are: course_abbreviation, name"
            )
            assert res[1] == 400
            assert res[2].get("Access-Control-Allow-Origin") == "*"
            assert res[2].get("Access-Control-Allow-Credentials") == "true"

    def test_put_course_failing(
        self, app, _environment_variables, _init_app, _init_db
    ) -> None:
        """Tests that a failing PUT request should properly return the error."""
        with app.test_request_context(
            "/course/dummy_id",
            method="PUT",
            json={"course_abbreviation": "abbr", "name": "new"},
        ), mock.patch("db_operator.DatabaseOperator.update") as update_mock:
            update_mock.return_value = 500, "Bad Error"
            res = main.request_handler(flask.request)
            assert res[0] == "Bad Error"
            assert res[1] == 500
            assert res[2].get("Access-Control-Allow-Origin") == "*"
            assert res[2].get("Access-Control-Allow-Credentials") == "true"

    def test_delete_course_successful(
        self, app, _environment_variables, _init_app, _init_db
    ) -> None:
        """Test a successful DELETE request to remove a given course entry."""
        with app.test_request_context("/course/dummy_id", method="DELETE"), mock.patch(
            "db_operator.DatabaseOperator.delete"
        ) as delete_mock:
            delete_mock.return_value = 204, None
            res = main.request_handler(flask.request)
            assert res[0] == ""
            assert res[1] == 204
            assert res[2].get("Access-Control-Allow-Origin") == "*"
            assert res[2].get("Access-Control-Allow-Credentials") == "true"

    def test_delete_course_failing(
        self, app, _environment_variables, _init_app, _init_db
    ) -> None:
        """Tests that a failing DELETE request should properly return the error."""
        with app.test_request_context("/course/dummy_id", method="DELETE"), mock.patch(
            "db_operator.DatabaseOperator.delete"
        ) as delete_mock:
            delete_mock.return_value = 500, "Bad Error"
            res = main.request_handler(flask.request)
            assert res[0] == "Bad Error"
            assert res[1] == 500
            assert res[2].get("Access-Control-Allow-Origin") == "*"
            assert res[2].get("Access-Control-Allow-Credentials") == "true"

    def test_get_body_wrong_content_type(self, app, _init_app) -> None:
        """When a bad content type was given, the parser should return nothing as body."""
        with app.test_request_context(
            method="GET", environ_base={"HTTP_CONTENT-TYPE": "wrong"}
        ):
            assert main.get_body(flask.request) is None
