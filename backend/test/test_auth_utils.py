"""
    Testing the auth utility methods.
"""
import os
from unittest import mock
import flask
from auth_utils import is_authenticated, get_user_name_by_id
from enums import Role


class MockUserReference:  # pylint: disable=R0903
    """Mock implementation of a user reference."""

    display_name: str

    def __init__(self, display_name) -> None:
        self.display_name = display_name


class TestAuthUtils:
    """Contains tests for the autentication utilites."""

    def test_disabled_authentication(self, app) -> None:
        """Tests that the authentication check gets disabled when 'DISABLE_AUTH' is set to true"""
        os.environ["DISABLE_AUTH"] = "True"
        with app.test_request_context(method="GET"):
            user_info, status_code, error_message = is_authenticated(flask.request)
            assert user_info.user_id == "dummy_user"
            assert user_info.roles == [Role.REQUESTER]
            assert status_code is None
            assert error_message is None

    def test_verification_of_token(self, app) -> None:
        """Tests that a correct token can be verified."""
        os.environ["DISABLE_AUTH"] = "False"
        dummy_token = (
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6I"
            + "kpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJlbWFpbCI6ImR1bW15QHRlc3QuZGUifQ."
            + "VmdMPX95NJy10aV8rm_ySS2d0FPXK6AFX9sfitREmFo"
        )
        with app.test_request_context(
            method="GET", environ_base={"HTTP_AUTHORIZATION": f"Bearer {dummy_token}"}
        ), mock.patch("firebase_admin.auth.verify_id_token") as verify_mock, mock.patch(
            "logger_utils.Logger.info"
        ) as logger_mock:
            mock_firebase_user = {
                "user_id": "firebase_generated_user_id",
                "email": "testuser@gmail.com",
                "admin": True,
                "editor": True,
                "requester": True,
            }
            verify_mock.return_value = mock_firebase_user
            user_info, status_code, error_message = is_authenticated(flask.request)
            assert user_info.user_id == "firebase_generated_user_id"
            assert user_info.roles == [Role.ADMIN, Role.EDITOR, Role.REQUESTER]
            assert status_code is None
            assert error_message is None
            logger_mock.assert_called_with(
                "Successfully Authenticated user with ID: firebase_generated_user_id"
            )

    def test_no_token_provided(self, app) -> None:
        """Tests that the user is not authenticated if no authentication header is provided."""
        os.environ["DISABLE_AUTH"] = "False"
        with app.test_request_context(method="GET"):
            user_info, status_code, error_message = is_authenticated(flask.request)
            assert user_info is None
            assert status_code == 401
            assert error_message == "No Authorization header provided!"

    def test_token_verification_failed(self, app) -> None:
        """Tests that the token verification failed."""
        os.environ["DISABLE_AUTH"] = "False"
        dummy_token = (
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6I"
            + "kpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJlbWFpbCI6ImR1bW15QHRlc3QuZGUifQ."
            + "VmdMPX95NJy10aV8rm_ySS2d0FPXK6AFX9sfitREmFo"
        )
        with app.test_request_context(
            method="GET", environ_base={"HTTP_AUTHORIZATION": f"Bearer {dummy_token}"}
        ), mock.patch("firebase_admin.auth.verify_id_token") as verify_mock:
            verify_mock.side_effect = ValueError("Error")
            user_info, status_code, error_message = is_authenticated(flask.request)
            assert user_info is None
            assert status_code == 403
            assert error_message == "Invalid Token: Error"

    def test_get_user_name_success(self) -> None:
        """Tests that we get the user name of a given user_id."""
        with mock.patch("firebase_admin.auth.get_user") as user_mock:
            user_mock.return_value = MockUserReference("Dummy Name")
            display_name = get_user_name_by_id("user_dummy_id")
            assert display_name == "Dummy Name"

    def test_get_user_name_fail_value_error(self) -> None:
        """Tests that we receive a value even if an error occurs."""
        with mock.patch("firebase_admin.auth.get_user") as user_mock:
            user_mock.side_effect = ValueError("Error")
            display_name = get_user_name_by_id("user_dummy_id")
            assert display_name == "Unknown"

    def test_get_user_name_empty_display_name(self) -> None:
        """Tests that we receive a value even if the display name is unset."""
        with mock.patch("firebase_admin.auth.get_user") as user_mock:
            user_mock.return_value = MockUserReference("")
            display_name = get_user_name_by_id("user_dummy_id")
            assert display_name == "Unknown"
