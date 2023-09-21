"""
    Handles request against the data endpoint.
"""
from dataclasses import fields
import json
from flask import Request
from google.cloud.firestore_v1.base_query import FieldFilter
from auth_utils import UserInfo
from request_helper import get_body
from enums import Role
from data_model import Course, Ticket, ENTITY_MAPPINGS
from db_operator import DatabaseOperator
from logger_utils import Logger

logger = Logger(component="data_handler")


def data_handler(  # pylint: disable=too-many-return-statements
    request: Request, path_segments: list[str], headers: dict, user_info: UserInfo
) -> tuple:
    """Handles all data related requests.

    Args:
        request (flask.Request) - The request object.
        path_segments - The parsed list of request path segements.
        headers - The access control allow headers for the response.
        user_info - The parsed information about the requester.
    Returns:
        The response text, or any set of values that can be turned into a
        Response object using `make_response`
    """
    entity_type = path_segments[1].strip().lower()
    logger.debug(f"Request for entity type '{entity_type}'")

    if entity_type not in ENTITY_MAPPINGS:
        return ("Invalid Entity Type", 400, headers)

    if (
        ENTITY_MAPPINGS[entity_type] == Course
        and Role.ADMIN not in user_info.roles
        and request.method != "GET"
    ):
        error_message = "User does not have required rights to modify course!"
        logger.error(error_message)
        return (error_message, 403, headers)

    # For Requests against an entity, schema: https://<api>/<data>/<entity>
    if len(path_segments) == 2:
        match request.method:
            case "GET":
                headers["Access-Control-Allow-Methods"] = "GET"
                response_code, response_message = DatabaseOperator(user_info).read_all(
                    entity_type
                )
                if response_code == 200:
                    return (json.dumps(response_message), response_code, headers)
                return (response_message, response_code, headers)
            case "POST":
                headers["Access-Control-Allow-Methods"] = "POST"
                body = get_body(request)
                course_field_names = get_field_names(ENTITY_MAPPINGS[entity_type])

                if not body or not all(
                    field_name in body for field_name in course_field_names
                ):
                    error_message = (
                        "Not all required fields are provided! Required fields are: "
                        + ", ".join(course_field_names)
                    )
                    logger.error(error_message)
                    return (error_message, 400, headers)

                only_relevant_attr = {
                    key: body[key] for key in course_field_names if key in body
                }

                duplication_filters = get_field_filters(only_relevant_attr)
                response_code, response_message = DatabaseOperator(user_info).create(
                    entity_type,
                    only_relevant_attr,
                    duplication_filters=duplication_filters,
                )

                if response_code not in (201, 409):
                    return (response_message, response_code, headers)
                return (json.dumps({"id": response_message}), response_code, headers)

    # For Requests against specific elements, schema: https://<api>/<data>/<entity>/<id>
    elif len(path_segments) == 3:
        # Extract entity ID from URL
        entity_id = path_segments[2]

        match request.method:
            case "GET":
                headers["Access-Control-Allow-Methods"] = "GET"
                response_code, response_message = DatabaseOperator(user_info).read(
                    entity_type, entity_id
                )
                if response_code == 200:
                    return (json.dumps(response_message), response_code, headers)
                return (response_message, response_code, headers)
            case "PUT":
                headers["Access-Control-Allow-Methods"] = "PUT"
                body = get_body(request)
                course_field_names = get_field_names(ENTITY_MAPPINGS[entity_type])

                if not body or not all(
                    field_name in body for field_name in course_field_names
                ):
                    error_message = (
                        "Not all required fields are provided! Required fields are: "
                        + ", ".join(course_field_names)
                    )
                    logger.error(error_message)
                    return (error_message, 400, headers)

                only_relevant_attr = {
                    key: body[key] for key in course_field_names if key in body
                }
                duplication_filters = get_field_filters(only_relevant_attr)

                response_code, response_message = DatabaseOperator(user_info).update(
                    entity_type,
                    only_relevant_attr,
                    path_segments[2],
                    duplication_filters,
                )
                if response_code in (200, 409):
                    return (
                        json.dumps({"id": response_message}),
                        response_code,
                        headers,
                    )
                return (response_message, response_code, headers)
            case "DELETE":
                if ENTITY_MAPPINGS[entity_type] == Ticket:
                    error_message = "Tickets cannot be deleted!"
                    logger.error(error_message)
                    return (error_message, 405, headers)

                headers["Access-Control-Allow-Methods"] = "DELETE"
                response_code, response_message = DatabaseOperator(user_info).delete(
                    entity_type, path_segments[2]
                )
                if response_code == 204:
                    return ("", response_code, headers)
                return (response_message, response_code, headers)
    return ("Invalid Request", 400, headers)


def get_field_names(class_type: type) -> list[str]:
    """Gets the name of the attributes for a given class.
    Args:
        class_type -- The dataclass type to get the field names from.
    Returns:
        A list of field names.
    """
    field_elems = fields(class_type)
    return [x.name for x in field_elems]


def get_field_filters(fields_to_filter: dict) -> list[FieldFilter]:
    """Creates eq filters for given entity fields. Can be used in queries.
    Args:
        fields -- The fields to create filters for.
    Returns:
        A list with equality filters.
    """
    conditions = [(key, "==", fields_to_filter[key]) for key in fields_to_filter]
    return [FieldFilter(*_c) for _c in conditions]
