"""
    Testing the auth utility methods.
"""
import os
from unittest import mock
import flask
from auth_utils import is_authenticated


class TestAuthUtils:
    """Contains tests for the autentication utilites."""

    def test_disabled_authentication(self, app) -> None:
        """Tests that the authentication check gets disabled when 'DISABLE_AUTH' is set to true"""
        os.environ["DISABLE_AUTH"] = "True"
        with app.test_request_context(method="GET"):
            auth_successful, status_code, error_message = is_authenticated(
                flask.request
            )
            assert auth_successful is True
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
                "user_id": "firebasegenerateduserid",
                "email": "testuser@gmail.com",
            }
            verify_mock.return_value = mock_firebase_user
            auth_successful, status_code, error_message = is_authenticated(
                flask.request
            )
            assert auth_successful is True
            assert status_code is None
            assert error_message is None
            logger_mock.assert_called_with(
                "Successfully Authenticated user with email: testuser@gmail.com"
            )

    def test_no_token_provided(self, app) -> None:
        """Tests that the user is not authenticated if no authentication header is provided."""
        os.environ["DISABLE_AUTH"] = "False"
        with app.test_request_context(method="GET"):
            auth_successful, status_code, error_message = is_authenticated(
                flask.request
            )
            assert auth_successful is False
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
            auth_successful, status_code, error_message = is_authenticated(
                flask.request
            )
            assert auth_successful is False
            assert status_code == 403
            assert error_message == "Invalid Token: Error"
