"""Utilities related to authentication and authorization."""
from firebase_admin import auth
from os import getenv
from logger_utils import Logger

logger = Logger(component="auth_utils")


def is_authenticated(request) -> tuple[bool, int, str]:
    """
    Validates the provided token and returns if the requester is authenticated.

    request - The http request object.

    returns:
    A tuple indicating if the user is authenticated (1),
    the error status code (2) and message (3) if not.
    """
    if getenv("DISABLE_AUTH", "false").lower() in ("1", "true"):
        return True, None, None

    bearer = request.headers.get("Authorization")
    if not bearer:
        error_message = "No Authorization header provided!"
        logger.error(f"Not able to authenticate user: {error_message}")
        return False, 401, error_message
    id_token = bearer.split()[1]

    email = ""
    try:
        decoded_token = auth.verify_id_token(id_token)
        email = decoded_token["email"]
        logger.debug(f"Decoded JWT Token: {decoded_token}")
    except Exception as error:  # pylint: disable=W0718
        logger.error(f"Not able to authenticate user: {str(error)}")
        return False, 403, f"Invalid Token: {str(error)}"

    logger.info(f"Successfully Authenticated user with email: %s", email)
    return True, None, None
