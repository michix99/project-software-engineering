"""
    Main entry point for the Cloud Function.
"""
from os import getenv
import functions_framework
from firebase_admin import initialize_app
from flask import Request
from logger_utils import Logger
from auth_utils import is_authenticated
from data_handler import data_handler
from api_handler import api_handler
from version import __version__


initialize_app()
logger = Logger(component="main")


@functions_framework.http
def request_handler(request: Request) -> tuple:
    """HTTP Cloud Function.
    Args:
        request (flask.Request): The request object.
        <https://flask.palletsprojects.com/en/1.1.x/api/#incoming-request-data>
    Returns:
        The response text, or any set of values that can be turned into a
        Response object using `make_response`
        <https://flask.palletsprojects.com/en/1.1.x/api/#flask.make_response>.
    Note:
        For more information on how Flask integrates with Cloud
        Functions, see the `Writing HTTP functions` page.
        <https://cloud.google.com/functions/docs/writing/http#http_frameworks>
    """
    logger.info(f"Running with version: {__version__}")

    is_local_testing = getenv("LOCAL_TESTING", "false").lower() in ("1", "true")
    allowed_origins = (
        "*" if is_local_testing else "https://projekt-software-engineering.web.app"
    )

    if request.method == "OPTIONS":
        # Allows requests from any origin with the Content-Type
        # header and caches preflight response for an 3600s
        headers = {
            "Access-Control-Allow-Methods": "GET, PUT, POST, DELETE",
            "Access-Control-Allow-Origin": allowed_origins,
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Max-Age": "3600",
        }

        return ("", 204, headers)

    # Set CORS headers for the main request
    headers = {
        "Access-Control-Allow-Origin": allowed_origins,
        "Access-Control-Allow-Credentials": "true",
    }

    user_info, error_status, error_message = is_authenticated(request)
    if not user_info:
        return (error_message, error_status, headers)

    logger.debug(f"Request against '{request.path}'")
    path_segments = request.path.split("/")
    valid_path_segments = [
        segment for segment in path_segments if segment
    ]  # Remove empty entries

    if not valid_path_segments:
        return ("Invalid Request", 400, headers)

    match valid_path_segments[0]:
        case "data":
            return data_handler(request, valid_path_segments, headers, user_info)
        case "api":
            return api_handler(request, valid_path_segments, headers, user_info)

    return ("Invalid Request", 400, headers)
