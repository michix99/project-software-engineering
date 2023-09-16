"""Utilities related to authentication and authorization."""
from dataclasses import dataclass
from os import getenv
from enums import Role
from firebase_admin import auth
from flask import Request
from logger_utils import Logger
from google.cloud import exceptions
from firebase_admin import exceptions

logger = Logger(component="auth_utils")


@dataclass
class UserInfo:
    """Class to describe a course of the IU."""

    user_id: str
    roles: list[Role]


def is_authenticated(request: Request) -> tuple[UserInfo | None, int, str]:
    """Validates the provided token and returns if the requester is authenticated.
    Args:
        request - The http request object.
    Returns:
        A tuple indicating if the user is authenticated (1),
        the error status code (2) and message (3) if not.
    """
    # if getenv("DISABLE_AUTH", "false").lower() in ("1", "true"):
    #     return UserInfo("dummy_user", [Role.REQUESTER]), None, None

    bearer = request.headers.get("Authorization")
    if not bearer:
        error_message = "No Authorization header provided!"
        logger.error(f"Not able to authenticate user: {error_message}")
        return None, 401, error_message
    id_token = bearer.split()[1]

    user_id = ""
    try:
        decoded_token = auth.verify_id_token(id_token)
        logger.debug(f"Decoded JWT Token: {decoded_token}")
        user_id = decoded_token["user_id"]
        roles = []
        if decoded_token.get("admin", False) is True:
            roles.append(Role.ADMIN)
        if decoded_token.get("editor", False) is True:
            roles.append(Role.EDITOR)
        if decoded_token.get("requester", False) is True:
            roles.append(Role.REQUESTER)
    except (ValueError, exceptions.FirebaseError) as error:
        logger.error(f"Not able to authenticate user: {str(error)}")
        return None, 403, f"Invalid Token: {str(error)}"

    logger.info(f"Successfully Authenticated user with ID: {user_id}")
    return UserInfo(user_id, roles), None, None


def get_user_name_by_id(user_id: str) -> str:
    try:
        user = auth.get_user(user_id)
    except (ValueError, exceptions.FirebaseError, auth.UserNotFoundError) as error:
        logger.error(f"Not able to get user name: {str(error)}")
        return "Unknown"

    return user.display_name or "Unknown"
