"""
    Handles request against the api endpoint.
"""
from flask import Request
from firebase_admin import auth, exceptions
from auth_utils import UserInfo
from enums import Role
from request_helper import get_body
from logger_utils import Logger

logger = Logger(component="api_handler")


def api_handler(  # pylint: disable=too-many-return-statements
    request: Request, path_segments: list[str], headers: dict, user_info: UserInfo
) -> tuple:
    """Handles all non-data related requests.

    Args:
        request (flask.Request) - The request object.
        path_segments - The parsed list of request path segements.
        headers - The access control allow headers for the response.
        user_info - The parsed information about the requester.
    Returns:
        The response text, or any set of values that can be turned into a
        Response object using `make_response`
    """
    match request.method:
        case "POST" if path_segments[1] == "setRole":
            if Role.ADMIN not in user_info.roles:
                error_message = "User does not have required rights to perform request!"
                logger.error(error_message)
                return (error_message, 403, headers)
            headers["Access-Control-Allow-Methods"] = "POST"
            body = get_body(request)

            required_fields = ["target_user_id", "role", "value"]
            if not body or not all(
                attributes in body for attributes in required_fields
            ):
                error_message = (
                    "Not all required fields are provided! Required fields are: "
                    + ", ".join(required_fields)
                )
                logger.error(error_message)
                return (error_message, 400, headers)

            try:
                auth.set_custom_user_claims(
                    body["target_user_id"], {body["role"]: body["value"]}
                )
            except ValueError as error:
                logger.error(f"Error while setting custom claims: {error}")
                return ("User ID or custom claim invalid!", 400, headers)
            except exceptions.FirebaseError as error:
                logger.error(f"Error while setting custom claims: {error}")
                return (error.code, 500, headers)
            return ("", 200, headers)
        case "POST" if path_segments[1] == "setDisplayName":
            headers["Access-Control-Allow-Methods"] = "POST"
            body = get_body(request)

            required_fields = ["target_user_id", "display_name"]
            if not body or not all(
                attributes in body for attributes in required_fields
            ):
                error_message = (
                    "Not all required fields are provided! Required fields are: "
                    + ", ".join(required_fields)
                )
                logger.error(error_message)
                return (error_message, 400, headers)

            if (
                Role.ADMIN not in user_info.roles
                and body["target_user_id"] != user_info.user_id
            ):
                error_message = "User does not have required rights to perform request!"
                logger.error(error_message)
                return (error_message, 403, headers)
            try:
                auth.update_user(
                    body["target_user_id"],
                    display_name=body["display_name"],
                )
            except ValueError as error:
                logger.error(f"Error while setting display name: {error}")
                return ("User ID invalid!", 400, headers)
            except exceptions.FirebaseError as error:
                logger.error(f"Error while setting display name: {error}")
                return (error.code, 500, headers)
            return ("", 200, headers)
        case "GET" if path_segments[1] == "user":
            headers["Access-Control-Allow-Methods"] = "GET"
            if Role.ADMIN not in user_info.roles:
                error_message = "User does not have required rights to perform request!"
                logger.error(error_message)
                return (error_message, 403, headers)

            try:
                exported_user_records = auth.list_users()

                users = []
                for record in exported_user_records.users:
                    parsed_user = {
                        "id": record.uid,
                        "email": record.email,
                        "display_name": record.display_name,
                        "disabled": record.disabled,
                        "admin": record.custom_claims is not None
                        and record.custom_claims.get("admin", False) is True,
                        "editor": record.custom_claims is not None
                        and record.custom_claims.get("editor", False) is True,
                        "requester": record.custom_claims is not None
                        and record.custom_claims.get("requester", False) is True,
                    }
                    users.append(parsed_user)
                return (users, 200, headers)
            except ValueError as error:
                logger.error(f"Error while loading users: {error}")
                return (
                    "Parameter max_results or page_token are invalid!",
                    400,
                    headers,
                )
            except exceptions.FirebaseError as error:
                logger.error(f"Error while retrieving the user accounts: {error}")
                return (error.code, 500, headers)

    return ("Invalid Request", 400, headers)
