"""
    Handles request against the api endpoint.
"""
import json
from flask import Request
from firebase_admin import auth, exceptions
from auth_utils import UserInfo
from enums import Role
from request_helper import get_body
from logger_utils import Logger

logger = Logger(component="api_handler")


def api_handler(  # pylint: disable=too-many-return-statements, too-many-branches, too-many-statements
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
        case "PUT" if path_segments[1] == "setRole":
            if Role.ADMIN not in user_info.roles:
                error_message = "User does not have required rights to perform request!"
                logger.error(error_message)
                return (error_message, 403, headers)
            headers["Access-Control-Allow-Methods"] = "PUT"
            body = get_body(request)

            required_fields = ["target_user_id", "role"]
            if not body or not all(
                attributes in body for attributes in required_fields
            ):
                error_message = (
                    "Not all required fields are provided! Required fields are: "
                    + ", ".join(required_fields)
                )
                logger.error(error_message)
                return (error_message, 400, headers)

            claims = {}
            logger.error(body["role"])
            match body["role"]:
                case Role.ADMIN.value:
                    claims = {
                        Role.ADMIN: True,
                        Role.EDITOR: False,
                        Role.REQUESTER: False,
                    }
                case Role.EDITOR.value:
                    claims = {
                        Role.ADMIN: False,
                        Role.EDITOR: True,
                        Role.REQUESTER: False,
                    }
                case Role.REQUESTER.value:
                    claims = {
                        Role.ADMIN: False,
                        Role.EDITOR: False,
                        Role.REQUESTER: True,
                    }

            try:
                auth.set_custom_user_claims(body["target_user_id"], claims)
            except ValueError as error:
                logger.error(f"Error while setting custom claims: {error}")
                return ("User ID or custom claim invalid!", 400, headers)
            except exceptions.FirebaseError as error:
                logger.error(f"Error while setting custom claims: {error}")
                return (error.code, 500, headers)
            return (json.dumps({"id": body["target_user_id"]}), 200, headers)
        case "PUT" if path_segments[1] == "updateUser":
            headers["Access-Control-Allow-Methods"] = "PUT"
            body = get_body(request)

            required_fields = ["target_user_id", "display_name", "email"]
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
                    email=body["email"],
                )
            except ValueError as error:
                logger.error(f"Error while setting display name: {error}")
                return ("User ID invalid!", 400, headers)
            except exceptions.FirebaseError as error:
                logger.error(f"Error while setting display name: {error}")
                return (error.code, 500, headers)
            return (json.dumps({"id": body["target_user_id"]}), 200, headers)
        case "GET" if path_segments[1] == "user":
            headers["Access-Control-Allow-Methods"] = "GET"
            if Role.ADMIN not in user_info.roles and Role.EDITOR not in user_info.roles:
                error_message = "User does not have required rights to perform request!"
                logger.error(error_message)
                return (error_message, 403, headers)

            try:
                if len(path_segments) != 3:
                    exported_user_records = auth.list_users()
                    exported_user_records = exported_user_records.users
                # For loading only one user
                else:
                    exported_user_records = [auth.get_user(path_segments[2])]

                users = []
                for record in exported_user_records:
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
                return (
                    (users, 200, headers)
                    if len(path_segments) != 3
                    else (users[0], 200, headers)
                )
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
