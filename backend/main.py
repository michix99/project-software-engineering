"""
    Main entry point for the Cloud Function.
"""
import logging
from os import getenv
import functions_framework
from firebase_admin import auth, initialize_app
from version import __version__

logger = logging.getLogger()
logger.setLevel(logging.INFO)
logger.info("Running with version: %s", __version__)
initialize_app()


@functions_framework.http
def hello_get(request):
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

    allowed_origins = "https://projekt-software-engineering.web.app"
    if getenv("LOCAL_TESTING", "false").lower() in ("1", "true"):
        allowed_origins = "*"

    if request.method == "OPTIONS":
        # Allows GET requests from any origin with the Content-Type
        # header and caches preflight response for an 3600s
        headers = {
            "Access-Control-Allow-Origin": allowed_origins,
            "Access-Control-Allow-Methods": "GET",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
        }

        return ("", 204, headers)

    # Set CORS headers for the main request
    headers = {"Access-Control-Allow-Origin": allowed_origins}

    bearer = request.headers.get("Authorization")
    if not bearer:
        return ("No Authorization header provided!", 401, headers)
    id_token = bearer.split()[1]

    try:
        decoded_token = auth.verify_id_token(id_token)
        uid = decoded_token["uid"]
        print(uid)
    except Exception as error:  # pylint: disable=W0718
        return (f"Invalid Token: {str(error)}", 403, headers)

    content_type = request.headers.get("content-type")
    if content_type == "application/json":
        request_json = request.get_json(silent=True)
        return (f"The json body: {request_json}", 200, headers)
    return (
        "Successfully Authenticated! Method: "
        + f"{request.method} Path: {request.path} Args: {request.args.to_dict()}",
        200,
        headers,
    )


@functions_framework.http
def cors_enabled_function(request):
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
    # Set CORS headers for the preflight request
    if request.method == "OPTIONS":
        # Allows GET requests from any origin with the Content-Type
        # header and caches preflight response for an 3600s
        headers = {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Max-Age": "3600",
        }

        return ("", 204, headers)

    # Set CORS headers for the main request
    headers = {"Access-Control-Allow-Origin": "*"}

    return ("Hello World!", 200, headers)


@functions_framework.http
def cors_enabled_function_auth(request):
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

    # Set CORS headers for preflight requests
    if request.method == "OPTIONS":
        # Allows GET requests from origin https://mydomain.com with
        # Authorization header
        headers = {
            "Access-Control-Allow-Origin": "https://mydomain.com",
            "Access-Control-Allow-Methods": "GET",
            "Access-Control-Allow-Headers": "Authorization",
            "Access-Control-Max-Age": "3600",
            "Access-Control-Allow-Credentials": "true",
        }
        return ("", 204, headers)

    # Set CORS headers for main requests
    headers = {
        "Access-Control-Allow-Origin": "https://mydomain.com",
        "Access-Control-Allow-Credentials": "true",
    }

    return ("Hello World!", 200, headers)
