"""
    Testing the data handler for the Cloud Function.
"""
from unittest.mock import patch
import flask
import pytest
import data_handler
from enums import Role
from auth_utils import UserInfo
from data_model import Course


class TestDataHandler:  # pylint: disable=R0904
    """Contains tests for the data request handler."""

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

    def test_invalid_request(self, app) -> None:
        """Tests that invalid request paths should be handled."""
        with app.test_request_context("/data/course/id/unknown-path", method="GET"):
            res = data_handler.data_handler(
                flask.request,
                ["data", "course", "id", "unknown-path"],
                {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Credentials": "true",
                },
                UserInfo("123", [Role.ADMIN]),
            )
            assert res[0] == "Invalid Request"
            assert res[1] == 400
            assert res[2].get("Access-Control-Allow-Origin") == "*"
            assert res[2].get("Access-Control-Allow-Credentials") == "true"

    def test_invalid_entity_type(self, app) -> None:
        """Tests that invalid entity type should be handled."""
        with app.test_request_context("/data/unknown-path", method="GET"):
            res = data_handler.data_handler(
                flask.request,
                ["data", "unknown-path"],
                {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Credentials": "true",
                },
                UserInfo("123", [Role.ADMIN]),
            )
            assert res[0] == "Invalid Entity Type"
            assert res[1] == 400
            assert res[2].get("Access-Control-Allow-Origin") == "*"
            assert res[2].get("Access-Control-Allow-Credentials") == "true"

    def test_missing_permissions_for_course(self, app) -> None:
        """Tests that a user not having admin rights cannot modify a course."""
        with app.test_request_context("/data/course", method="POST"):
            res = data_handler.data_handler(
                flask.request,
                [
                    "data",
                    "course",
                ],
                {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Credentials": "true",
                },
                UserInfo("123", [Role.EDITOR]),
            )
            assert res[0] == "User does not have required rights to perform action!"
            assert res[1] == 403
            assert res[2].get("Access-Control-Allow-Credentials") == "true"
            assert res[2].get("Access-Control-Allow-Origin") == "*"

    def test_get_course_successful(self, app) -> None:
        """Tests a successful GET request to get all course elements."""
        with app.test_request_context("/data/course", method="GET"), patch(
            "db_operator.DatabaseOperator.read_all",
            return_value=(
                200,
                [
                    {"id": "dummy_id"},
                    {"id": "another_dummy_id"},
                ],
            ),
        ):
            res = data_handler.data_handler(
                flask.request,
                ["data", "course"],
                {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Credentials": "true",
                },
                UserInfo("123", [Role.ADMIN]),
            )
            assert res[0] == '[{"id": "dummy_id"}, {"id": "another_dummy_id"}]'
            assert res[1] == 200
            assert res[2].get("Access-Control-Allow-Origin") == "*"
            assert res[2].get("Access-Control-Allow-Credentials") == "true"
            assert res[2].get("Access-Control-Allow-Methods") == "GET"

    def test_get_ticket_requester(self, app) -> None:
        """Tests a successful GET request to get all ticket elements created by the requester."""
        with app.test_request_context("/data/ticket", method="GET"), patch(
            "db_operator.DatabaseOperator.find_all",
            return_value=(
                200,
                [
                    {"id": "dummy_id"},
                    {"id": "another_dummy_id"},
                ],
            ),
        ):
            res = data_handler.data_handler(
                flask.request,
                ["data", "ticket"],
                {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Credentials": "true",
                },
                UserInfo("123", [Role.REQUESTER]),
            )
            assert res[0] == '[{"id": "dummy_id"}, {"id": "another_dummy_id"}]'
            assert res[1] == 200
            assert res[2].get("Access-Control-Allow-Origin") == "*"
            assert res[2].get("Access-Control-Allow-Credentials") == "true"
            assert res[2].get("Access-Control-Allow-Methods") == "GET"

    def test_get_course_failing(self, app) -> None:
        """Tests that a failing GET request should properly return the error."""
        with app.test_request_context("/data/course", method="GET"), patch(
            "db_operator.DatabaseOperator.read_all"
        ) as read_mock:
            read_mock.return_value = 500, "Bad Error"
            res = data_handler.data_handler(
                flask.request,
                ["data", "course"],
                {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Credentials": "true",
                },
                UserInfo("123", [Role.ADMIN]),
            )
            assert res[0] == "Bad Error"
            assert res[1] == 500
            assert res[2].get("Access-Control-Allow-Origin") == "*"
            assert res[2].get("Access-Control-Allow-Credentials") == "true"
            assert res[2].get("Access-Control-Allow-Methods") == "GET"

    def test_post_course_successful(self, app) -> None:
        """Tests a successful POST request to create a new course entry."""
        with app.test_request_context(
            "/data/course",
            method="POST",
            json={"course_abbreviation": "abbr", "name": "new"},
        ), patch("db_operator.DatabaseOperator.create") as create_mock:
            create_mock.return_value = 201, "dummy_id"
            res = data_handler.data_handler(
                flask.request,
                ["data", "course"],
                {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Credentials": "true",
                },
                UserInfo("123", [Role.ADMIN]),
            )
            assert res[0] == '{"id": "dummy_id"}'
            assert res[1] == 201
            assert res[2].get("Access-Control-Allow-Origin") == "*"
            assert res[2].get("Access-Control-Allow-Credentials") == "true"
            assert res[2].get("Access-Control-Allow-Methods") == "POST"

    def test_post_course_failing_conflict(self, app) -> None:
        """Tests that duplicated element as POST request should return a conflict."""
        with app.test_request_context(
            "/data/course",
            method="POST",
            json={"course_abbreviation": "abbr", "name": "new"},
        ), patch("db_operator.DatabaseOperator.create") as create_mock:
            create_mock.return_value = 409, "duplicate_id"
            res = data_handler.data_handler(
                flask.request,
                ["data", "course"],
                {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Credentials": "true",
                },
                UserInfo("123", [Role.ADMIN]),
            )
            assert res[0] == '{"id": "duplicate_id"}'
            assert res[1] == 409
            assert res[2].get("Access-Control-Allow-Origin") == "*"
            assert res[2].get("Access-Control-Allow-Credentials") == "true"
            assert res[2].get("Access-Control-Allow-Methods") == "POST"

    def test_post_course_failing_missing_fields(
        self,
        app,
    ) -> None:
        """Tests that a POST request with missing fields should return a bad request."""
        with app.test_request_context(
            "/data/course",
            method="POST",
            json={"course_abbreviation": "abbr"},
        ):
            res = data_handler.data_handler(
                flask.request,
                ["data", "course"],
                {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Credentials": "true",
                },
                UserInfo("123", [Role.ADMIN]),
            )
            assert (
                res[0]
                == "Not all required fields are provided! "
                + "Required fields are: course_abbreviation, name"
            )
            assert res[1] == 400
            assert res[2].get("Access-Control-Allow-Origin") == "*"
            assert res[2].get("Access-Control-Allow-Credentials") == "true"
            assert res[2].get("Access-Control-Allow-Methods") == "POST"

    def test_post_course_failing(self, app) -> None:
        """Tests that a failing POST request should properly return the error."""
        with app.test_request_context(
            "/data/course",
            method="POST",
            json={"course_abbreviation": "abbr", "name": "new"},
        ), patch("db_operator.DatabaseOperator.create") as create_mock:
            create_mock.return_value = 500, "Bad Error"
            res = data_handler.data_handler(
                flask.request,
                ["data", "course"],
                {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Credentials": "true",
                },
                UserInfo("123", [Role.ADMIN]),
            )
            assert res[0] == "Bad Error"
            assert res[1] == 500
            assert res[2].get("Access-Control-Allow-Origin") == "*"
            assert res[2].get("Access-Control-Allow-Credentials") == "true"
            assert res[2].get("Access-Control-Allow-Methods") == "POST"

    def test_get_one_course_successful(self, app) -> None:
        """Tests a successful GET request to get a course element."""
        with app.test_request_context("/data/course/dummy_id", method="GET"), patch(
            "db_operator.DatabaseOperator.read"
        ) as read_mock:
            read_mock.return_value = 200, {"id": "dummy_id"}
            res = data_handler.data_handler(
                flask.request,
                ["data", "course", "dummy_id"],
                {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Credentials": "true",
                },
                UserInfo("123", [Role.ADMIN]),
            )
            assert res[0] == '{"id": "dummy_id"}'
            assert res[1] == 200
            assert res[2].get("Access-Control-Allow-Origin") == "*"
            assert res[2].get("Access-Control-Allow-Credentials") == "true"
            assert res[2].get("Access-Control-Allow-Methods") == "GET"

    def test_get_one_ticket_failing_not_creator(self, app) -> None:
        """
        Tests a failing GET request to get a ticket element.
        User is not creator or has needed permissions.
        """
        with app.test_request_context("/data/ticket/dummy_id", method="GET"), patch(
            "db_operator.DatabaseOperator.read"
        ) as read_mock:
            read_mock.return_value = 200, {
                "id": "dummy_id",
                "created_by": "different_user",
            }
            res = data_handler.data_handler(
                flask.request,
                ["data", "ticket", "dummy_id"],
                {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Credentials": "true",
                },
                UserInfo("123", [Role.REQUESTER]),
            )
            assert res[0] == "User does not have required rights to load ticket!"
            assert res[1] == 403
            assert res[2].get("Access-Control-Allow-Origin") == "*"
            assert res[2].get("Access-Control-Allow-Credentials") == "true"
            assert res[2].get("Access-Control-Allow-Methods") == "GET"

    def test_get_one_course_failing(self, app) -> None:
        """Tests that a failing GET request for one element should properly return the error."""
        with app.test_request_context("/data/course/dummy_id", method="GET"), patch(
            "db_operator.DatabaseOperator.read"
        ) as read_mock:
            read_mock.return_value = 500, "Bad Error"
            res = data_handler.data_handler(
                flask.request,
                ["data", "course", "dummy_id"],
                {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Credentials": "true",
                },
                UserInfo("123", [Role.ADMIN]),
            )
            assert res[0] == "Bad Error"
            assert res[1] == 500
            assert res[2].get("Access-Control-Allow-Origin") == "*"
            assert res[2].get("Access-Control-Allow-Credentials") == "true"
            assert res[2].get("Access-Control-Allow-Methods") == "GET"

    def test_put_course_successful(self, app) -> None:
        """Tests a successful PUT request to update an existing course entry."""
        with app.test_request_context(
            "/data/course/dummy_id",
            method="PUT",
            json={"course_abbreviation": "abbr", "name": "new"},
        ), patch("db_operator.DatabaseOperator.update") as update_mock:
            update_mock.return_value = 200, "dummy_id"
            res = data_handler.data_handler(
                flask.request,
                ["data", "course", "dummy_id"],
                {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Credentials": "true",
                },
                UserInfo("123", [Role.ADMIN]),
            )
            assert res[0] == '{"id": "dummy_id"}'
            assert res[1] == 200
            assert res[2].get("Access-Control-Allow-Origin") == "*"
            assert res[2].get("Access-Control-Allow-Credentials") == "true"
            assert res[2].get("Access-Control-Allow-Methods") == "PUT"

    def test_put_course_failing_conflict(self, app) -> None:
        """Tests that a duplicated element as PUT request body should return a conflict."""
        with app.test_request_context(
            "/data/course/dummy_id",
            method="PUT",
            json={"course_abbreviation": "abbr", "name": "new"},
        ), patch("db_operator.DatabaseOperator.update") as update_mock:
            update_mock.return_value = 409, "duplicate_id"
            res = data_handler.data_handler(
                flask.request,
                ["data", "course", "dummy_id"],
                {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Credentials": "true",
                },
                UserInfo("123", [Role.ADMIN]),
            )
            assert res[0] == '{"id": "duplicate_id"}'
            assert res[1] == 409
            assert res[2].get("Access-Control-Allow-Origin") == "*"
            assert res[2].get("Access-Control-Allow-Credentials") == "true"
            assert res[2].get("Access-Control-Allow-Methods") == "PUT"

    def test_put_course_failing_missing_fields(self, app) -> None:
        """Tests that a PUT request with missing fields should return a bad request."""
        with app.test_request_context(
            "/data/course/dummy_id",
            method="PUT",
            json={"course_abbreviation": "abbr"},
        ):
            res = data_handler.data_handler(
                flask.request,
                ["data", "course", "dummy_id"],
                {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Credentials": "true",
                },
                UserInfo("123", [Role.ADMIN]),
            )
            assert (
                res[0]
                == "Not all required fields are provided! "
                + "Required fields are: course_abbreviation, name"
            )
            assert res[1] == 400
            assert res[2].get("Access-Control-Allow-Origin") == "*"
            assert res[2].get("Access-Control-Allow-Credentials") == "true"
            assert res[2].get("Access-Control-Allow-Methods") == "PUT"

    def test_put_course_failing(self, app) -> None:
        """Tests that a failing PUT request should properly return the error."""
        with app.test_request_context(
            "/data/course/dummy_id",
            method="PUT",
            json={"course_abbreviation": "abbr", "name": "new"},
        ), patch("db_operator.DatabaseOperator.update") as update_mock:
            update_mock.return_value = 500, "Bad Error"
            res = data_handler.data_handler(
                flask.request,
                ["data", "course", "dummy_id"],
                {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Credentials": "true",
                },
                UserInfo("123", [Role.ADMIN]),
            )
            assert res[0] == "Bad Error"
            assert res[1] == 500
            assert res[2].get("Access-Control-Allow-Origin") == "*"
            assert res[2].get("Access-Control-Allow-Credentials") == "true"
            assert res[2].get("Access-Control-Allow-Methods") == "PUT"

    def test_delete_course_successful(self, app) -> None:
        """Test a successful DELETE request to remove a given course entry."""
        with app.test_request_context("/data/course/dummy_id", method="DELETE"), patch(
            "db_operator.DatabaseOperator.delete"
        ) as delete_mock:
            delete_mock.return_value = 204, None
            res = data_handler.data_handler(
                flask.request,
                ["data", "course", "dummy_id"],
                {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Credentials": "true",
                },
                UserInfo("123", [Role.ADMIN]),
            )
            assert res[0] == ""
            assert res[1] == 204
            assert res[2].get("Access-Control-Allow-Origin") == "*"
            assert res[2].get("Access-Control-Allow-Credentials") == "true"
            assert res[2].get("Access-Control-Allow-Methods") == "DELETE"

    def test_delete_ticket_not_allowed(self, app) -> None:
        """
        Test a failing DELETE request to remove a given ticket entry.
        This is not allowed
        """
        with app.test_request_context("/data/ticket/dummy_id", method="DELETE"):
            res = data_handler.data_handler(
                flask.request,
                ["data", "ticket", "dummy_id"],
                {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Credentials": "true",
                },
                UserInfo("123", [Role.ADMIN]),
            )
            assert res[0] == "Tickets cannot be deleted!"
            assert res[1] == 405
            assert res[2].get("Access-Control-Allow-Origin") == "*"
            assert res[2].get("Access-Control-Allow-Credentials") == "true"

    def test_delete_course_failing(self, app) -> None:
        """Tests that a failing DELETE request should properly return the error."""
        with app.test_request_context("/data/course/dummy_id", method="DELETE"), patch(
            "db_operator.DatabaseOperator.delete"
        ) as delete_mock:
            delete_mock.return_value = 500, "Bad Error"
            res = data_handler.data_handler(
                flask.request,
                ["data", "course", "dummy_id"],
                {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Credentials": "true",
                },
                UserInfo("123", [Role.ADMIN]),
            )

            assert res[0] == "Bad Error"
            assert res[1] == 500
            assert res[2].get("Access-Control-Allow-Origin") == "*"
            assert res[2].get("Access-Control-Allow-Credentials") == "true"
            assert res[2].get("Access-Control-Allow-Methods") == "DELETE"

    def test_get_body_wrong_content_type(self, app) -> None:
        """When a bad content type was given, the parser should return nothing as body."""
        with app.test_request_context(
            method="GET", environ_base={"HTTP_CONTENT-TYPE": "wrong"}
        ):
            assert data_handler.get_body(flask.request) is None

    def test_has_required_role(self) -> None:
        """Should return if the user has the required role."""
        assert (
            data_handler.has_required_role(
                "course", Course, Role.REQUESTER, [Role.REQUESTER]
            )
            is True
        )
        assert (
            data_handler.has_required_role(
                "course", Course, Role.REQUESTER, [Role.EDITOR]
            )
            is True
        )
        assert (
            data_handler.has_required_role(
                "course", Course, Role.REQUESTER, [Role.ADMIN]
            )
            is True
        )
        assert (
            data_handler.has_required_role(
                "course", Course, Role.EDITOR, [Role.REQUESTER]
            )
            is False
        )
        assert (
            data_handler.has_required_role("course", Course, Role.EDITOR, [Role.EDITOR])
            is True
        )
        assert (
            data_handler.has_required_role("course", Course, Role.EDITOR, [Role.ADMIN])
            is True
        )
        assert (
            data_handler.has_required_role(
                "course", Course, Role.ADMIN, [Role.REQUESTER]
            )
            is False
        )
        assert (
            data_handler.has_required_role("course", Course, Role.ADMIN, [Role.EDITOR])
            is False
        )
        assert (
            data_handler.has_required_role("course", Course, Role.ADMIN, [Role.ADMIN])
            is True
        )
        # rule does not apply for given entity
        assert (
            data_handler.has_required_role("ticket", Course, Role.ADMIN, [Role.ADMIN])
            is True
        )
        # invalid required role
        assert (
            data_handler.has_required_role("course", Course, "invalid", [Role.ADMIN])
            is False
        )
