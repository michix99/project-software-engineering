"""
    Testing the api handler for the Cloud Function.
"""
from unittest import mock
from unittest.mock import patch
import flask
import pytest
from firebase_admin import exceptions
from backend.test.mocks import MockUserReference
import api_handler
from enums import Role
from auth_utils import UserInfo


class MockExportedUserReference:  # pylint: disable=R0903
    """Mock implementation of a exported user record."""

    class MockUserInfo:
        """Mock implementation of a user info."""

        uid: str = "uid"
        email: str = "email"
        display_name: str = "display name"
        disabled: bool = False
        custom_claims: dict

    users = [MockUserInfo()]

    def __init__(self, custom_claims: dict) -> None:
        self.users[0].custom_claims = custom_claims


class TestApiHandler:  # pylint: disable=R0904
    """Contains tests for the api request handler."""

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
        with app.test_request_context("/api/unknown-path", method="GET"):
            res = api_handler.api_handler(
                flask.request,
                ["api", "unknown-path"],
                {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Credentials": "true",
                },
                UserInfo("567", [Role.ADMIN]),
            )
            assert res[0] == "Invalid Request"
            assert res[1] == 400
            assert res[2].get("Access-Control-Allow-Origin") == "*"
            assert res[2].get("Access-Control-Allow-Credentials") == "true"

    def test_set_role_successful(self, app, role="requester") -> None:
        """Tests a successful request to set a user role to requester."""
        with app.test_request_context(
            "/api/setRole",
            method="PUT",
            json={"target_user_id": "dummy-id", "role": role},
        ), mock.patch("firebase_admin.auth.set_custom_user_claims"):
            res = api_handler.api_handler(
                flask.request,
                ["api", "setRole"],
                {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Credentials": "true",
                },
                UserInfo("123", [Role.ADMIN]),
            )
            assert res[0] == '{"id": "dummy-id"}'
            assert res[1] == 200
            assert res[2].get("Access-Control-Allow-Origin") == "*"
            assert res[2].get("Access-Control-Allow-Credentials") == "true"
            assert res[2].get("Access-Control-Allow-Methods") == "PUT"

    def test_set_role_successful_editor(self, app) -> None:
        """Tests a successful request to set a user role to editor."""
        self.test_set_role_successful(app, "editor")

    def test_set_role_successful_admin(self, app) -> None:
        """Tests a successful request to set a user role to admin."""
        self.test_set_role_successful(app, "admin")

    def test_set_role_failing_missing_permission(self, app) -> None:
        """
        Tests a failing request to set a user role.
        User has not the permission to change a role.
        """
        with app.test_request_context(
            "/api/setRole",
            method="PUT",
            json={
                "target_user_id": "another-dummy-id",
                "role": "requester",
            },
        ):
            res = api_handler.api_handler(
                flask.request,
                ["api", "setRole"],
                {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Credentials": "true",
                },
                UserInfo("123", [Role.EDITOR]),
            )
            assert res[0] == "User does not have required rights to perform request!"
            assert res[1] == 403
            assert res[2].get("Access-Control-Allow-Origin") == "*"
            assert res[2].get("Access-Control-Allow-Credentials") == "true"

    def test_set_role_failing_incomplete_body(self, app) -> None:
        """
        Tests a failing request to set a user role.
        Body is missing required fields.
        """
        with app.test_request_context(
            "/api/setRole",
            method="PUT",
            json={
                "role": "requester",
            },
        ):
            res = api_handler.api_handler(
                flask.request,
                ["api", "setRole"],
                {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Credentials": "true",
                },
                UserInfo("987", [Role.ADMIN]),
            )
            assert (
                res[0]
                == "Not all required fields are provided! Required fields are: "
                + "target_user_id, role"
            )
            assert res[1] == 400
            assert res[2].get("Access-Control-Allow-Methods") == "PUT"
            assert res[2].get("Access-Control-Allow-Origin") == "*"
            assert res[2].get("Access-Control-Allow-Credentials") == "true"

    def test_set_role_failing_with_value_error(self, app) -> None:
        """
        Tests a failing request to set a user role.
        Raising value error while setting.
        """
        with app.test_request_context(
            "/api/setRole",
            method="PUT",
            json={
                "target_user_id": "dummy-id",
                "role": "requester",
            },
        ), mock.patch("firebase_admin.auth.set_custom_user_claims") as set_claims_mock:
            set_claims_mock.side_effect = ValueError("Error")
            res = api_handler.api_handler(
                flask.request,
                ["api", "setRole"],
                {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Credentials": "true",
                },
                UserInfo("123", [Role.ADMIN]),
            )
            assert res[0] == "User ID or custom claim invalid!"
            assert res[1] == 400
            assert res[2].get("Access-Control-Allow-Origin") == "*"
            assert res[2].get("Access-Control-Allow-Methods") == "PUT"
            assert res[2].get("Access-Control-Allow-Credentials") == "true"

    def test_set_role_failing_with_firebase_error(self, app) -> None:
        """
        Tests a failing request to set a user role.
        Raising firebase error while setting.
        """
        with app.test_request_context(
            "/api/setRole",
            method="PUT",
            json={
                "target_user_id": "dummy-id",
                "role": "requester",
            },
        ), mock.patch("firebase_admin.auth.set_custom_user_claims") as set_claims_mock:
            set_claims_mock.side_effect = exceptions.FirebaseError(
                "Error Code", "Error Message"
            )
            res = api_handler.api_handler(
                flask.request,
                ["api", "setRole"],
                {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Credentials": "true",
                },
                UserInfo("123", [Role.ADMIN]),
            )
            assert res[0] == "Error Code"
            assert res[1] == 500
            assert res[2].get("Access-Control-Allow-Origin") == "*"
            assert res[2].get("Access-Control-Allow-Credentials") == "true"
            assert res[2].get("Access-Control-Allow-Methods") == "PUT"

    def test_update_user_successful(self, app) -> None:
        """Tests a successful request to update a user."""
        with app.test_request_context(
            "/api/updateUser",
            method="PUT",
            json={
                "target_user_id": "dummy-id",
                "display_name": "Dummy Name",
                "email": "dummy@test.de",
            },
        ), mock.patch("firebase_admin.auth.update_user"):
            res = api_handler.api_handler(
                flask.request,
                ["api", "updateUser"],
                {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Credentials": "true",
                },
                UserInfo("456", [Role.ADMIN]),
            )
            assert res[0] == '{"id": "dummy-id"}'
            assert res[1] == 200
            assert res[2].get("Access-Control-Allow-Origin") == "*"
            assert res[2].get("Access-Control-Allow-Methods") == "PUT"
            assert res[2].get("Access-Control-Allow-Credentials") == "true"

    def test_update_user_failing_incomplete_body(self, app) -> None:
        """
        Tests a failing request to update a user.
        Body is missing required fields.
        """
        with app.test_request_context(
            "/api/updateUser",
            method="PUT",
            json={
                "target_user_id": "dummy-id",
            },
        ):
            res = api_handler.api_handler(
                flask.request,
                ["api", "updateUser"],
                {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Credentials": "true",
                },
                UserInfo("789", [Role.ADMIN]),
            )
            assert (
                res[0]
                == "Not all required fields are provided! Required fields are: "
                + "target_user_id, display_name, email"
            )
            assert res[1] == 400
            assert res[2].get("Access-Control-Allow-Methods") == "PUT"
            assert res[2].get("Access-Control-Allow-Origin") == "*"
            assert res[2].get("Access-Control-Allow-Credentials") == "true"

    def test_update_user_failing_with_value_error(self, app) -> None:
        """
        Tests a failing request to update a user.
        Raising value error while setting.
        """
        with app.test_request_context(
            "/api/updateUser",
            method="PUT",
            json={
                "target_user_id": "dummy-id",
                "display_name": "Dummy Name",
                "email": "dummy@test.de",
            },
        ), mock.patch("firebase_admin.auth.update_user") as update_mock:
            update_mock.side_effect = ValueError("Error")
            res = api_handler.api_handler(
                flask.request,
                ["api", "updateUser"],
                {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Credentials": "true",
                },
                UserInfo("123", [Role.ADMIN]),
            )
            assert res[0] == "User ID invalid!"
            assert res[1] == 400
            assert res[2].get("Access-Control-Allow-Methods") == "PUT"
            assert res[2].get("Access-Control-Allow-Origin") == "*"
            assert res[2].get("Access-Control-Allow-Credentials") == "true"

    def test_update_user_failing_with_firebase_error(self, app) -> None:
        """
        Tests a failing request to update a user.
        Raising firebase error while setting.
        """
        with app.test_request_context(
            "/api/updateUser",
            method="PUT",
            json={
                "target_user_id": "dummy-id",
                "display_name": "Dummy Name",
                "email": "dummy@test.de",
            },
        ), mock.patch("firebase_admin.auth.update_user") as update_mock:
            update_mock.side_effect = exceptions.FirebaseError(
                "Error Code", "Error Message"
            )
            res = api_handler.api_handler(
                flask.request,
                ["api", "updateUser"],
                {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Credentials": "true",
                },
                UserInfo("432", [Role.ADMIN]),
            )
            assert res[0] == "Error Code"
            assert res[1] == 500
            assert res[2].get("Access-Control-Allow-Origin") == "*"
            assert res[2].get("Access-Control-Allow-Credentials") == "true"
            assert res[2].get("Access-Control-Allow-Methods") == "PUT"

    def test_update_user_failing_missing_permissions(self, app) -> None:
        """
        Tests a failing request to update a user.
        User is no admin or does not try to modify his own user name.
        """
        with app.test_request_context(
            "/api/updateUser",
            method="PUT",
            json={
                "target_user_id": "dummy-id",
                "display_name": "name",
                "email": "dummy@test.de",
            },
        ):
            res = api_handler.api_handler(
                flask.request,
                ["api", "updateUser"],
                {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Credentials": "true",
                },
                UserInfo("789", [Role.REQUESTER]),
            )
            assert res[0] == "User does not have required rights to perform request!"
            assert res[1] == 403
            assert res[2].get("Access-Control-Allow-Origin") == "*"
            assert res[2].get("Access-Control-Allow-Credentials") == "true"
            assert res[2].get("Access-Control-Allow-Methods") == "PUT"

    def test_get_users_success(self, app) -> None:
        """Tests a successful request to get all users."""
        with app.test_request_context(
            "/api/user",
            method="GET",
        ), mock.patch("firebase_admin.auth.list_users") as exported_users:
            exported_users.return_value = MockExportedUserReference({"admin": True})
            res = api_handler.api_handler(
                flask.request,
                ["api", "user"],
                {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Credentials": "true",
                },
                UserInfo("789", [Role.ADMIN]),
            )
            assert res[0] == [
                {
                    "id": "uid",
                    "email": "email",
                    "display_name": "display name",
                    "disabled": False,
                    "admin": True,
                    "editor": False,
                    "requester": False,
                }
            ]
            assert res[1] == 200
            assert res[2].get("Access-Control-Allow-Origin") == "*"
            assert res[2].get("Access-Control-Allow-Credentials") == "true"
            assert res[2].get("Access-Control-Allow-Methods") == "GET"

    def test_get_users_failing_with_value_error(self, app) -> None:
        """
        Tests a failing request to get all users.
        Raising value error while loading.
        """
        with app.test_request_context(
            "/api/user",
            method="GET",
        ), mock.patch("firebase_admin.auth.list_users") as exported_users:
            exported_users.side_effect = ValueError("Error")
            res = api_handler.api_handler(
                flask.request,
                ["api", "user"],
                {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Credentials": "true",
                },
                UserInfo("123", [Role.ADMIN]),
            )
            assert res[0] == "Parameter max_results or page_token are invalid!"
            assert res[1] == 400
            assert res[2].get("Access-Control-Allow-Origin") == "*"
            assert res[2].get("Access-Control-Allow-Methods") == "GET"
            assert res[2].get("Access-Control-Allow-Credentials") == "true"

    def test_get_users_failing_with_firebase_error(self, app) -> None:
        """
        Tests a failing request to get all users.
        Raising firebase error while loading.
        """
        with app.test_request_context(
            "/api/user",
            method="GET",
        ), mock.patch("firebase_admin.auth.list_users") as exported_users:
            exported_users.side_effect = exceptions.FirebaseError(
                "Error Code", "Error Message"
            )
            res = api_handler.api_handler(
                flask.request,
                ["api", "user"],
                {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Credentials": "true",
                },
                UserInfo("432", [Role.ADMIN]),
            )
            assert res[0] == "Error Code"
            assert res[1] == 500
            assert res[2].get("Access-Control-Allow-Origin") == "*"
            assert res[2].get("Access-Control-Allow-Methods") == "GET"
            assert res[2].get("Access-Control-Allow-Credentials") == "true"

    def test_get_users_failing_missing_permissions(self, app) -> None:
        """
        Tests a failing request to get all users.
        User is no admin.
        """
        with app.test_request_context(
            "/api/user",
            method="GET",
        ):
            res = api_handler.api_handler(
                flask.request,
                ["api", "user"],
                {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Credentials": "true",
                },
                UserInfo("789", [Role.REQUESTER]),
            )
            assert res[0] == "User does not have required rights to perform request!"
            assert res[1] == 403
            assert res[2].get("Access-Control-Allow-Origin") == "*"
            assert res[2].get("Access-Control-Allow-Credentials") == "true"
            assert res[2].get("Access-Control-Allow-Methods") == "GET"

    def test_get_user_success_as_admin(self, app) -> None:
        """Tests a successful request to get one user as admin."""
        with app.test_request_context(
            "/api/user/uid",
            method="GET",
        ), mock.patch("firebase_admin.auth.get_user") as user_mock:
            user_mock.return_value = MockUserReference("Dummy Name")
            res = api_handler.api_handler(
                flask.request,
                ["api", "user", "uid"],
                {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Credentials": "true",
                },
                UserInfo("789", [Role.ADMIN]),
            )
            assert res[0] == {
                "id": "uid",
                "email": "email",
                "display_name": "Dummy Name",
                "disabled": False,
                "admin": True,
                "editor": False,
                "requester": False,
            }

            assert res[1] == 200
            assert res[2].get("Access-Control-Allow-Origin") == "*"
            assert res[2].get("Access-Control-Allow-Credentials") == "true"
            assert res[2].get("Access-Control-Allow-Methods") == "GET"

    def test_get_user_fail_as_requester(self, app) -> None:
        """Tests a failing request to get a user as requester."""
        with app.test_request_context(
            "/api/user/uid",
            method="GET",
        ), mock.patch("firebase_admin.auth.get_user") as user_mock:
            user_mock.return_value = MockUserReference("Dummy Name")
            res = api_handler.api_handler(
                flask.request,
                ["api", "user", "uid"],
                {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Credentials": "true",
                },
                UserInfo("789", [Role.REQUESTER]),
            )
            assert res[0] == "User does not have required rights to perform request!"
            assert res[1] == 403
            assert res[2].get("Access-Control-Allow-Origin") == "*"
            assert res[2].get("Access-Control-Allow-Credentials") == "true"
            assert res[2].get("Access-Control-Allow-Methods") == "GET"
