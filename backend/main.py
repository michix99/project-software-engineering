"""
    Main entry point for the Cloud Function.
"""
from os import getenv
import json
from dataclasses import fields
import functions_framework
from firebase_admin import initialize_app
from google.cloud.firestore_v1.base_query import FieldFilter
from flask import Request
from logger_utils import Logger
from auth_utils import is_authenticated
from db_operator import DatabaseOperator
from data_model import Course
from version import __version__

initialize_app()
logger = Logger(component="main")


@functions_framework.http
def request_handler(request: Request):  # pylint: disable=R0911
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
        # Allows GET requests from any origin with the Content-Type
        # header and caches preflight response for an 3600s
        headers = {
            "Access-Control-Allow-Origin": allowed_origins,
            "Access-Control-Allow-Methods": "GET",
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

    successfully_authenticated, error_status, error_message = is_authenticated(request)
    if not successfully_authenticated:
        return (error_message, error_status, headers)

    path_segments = request.path.split("/")
    valid_path_segments = [
        segment for segment in path_segments if segment
    ]  # Remove empty entries

    if not valid_path_segments:
        return ("Invalid Request", 400, headers)

    # For Requests against an entity, schema: https://<api>/<entity>
    if len(valid_path_segments) == 1:
        match valid_path_segments[0]:
            case "course" if request.method == "GET":
                response_code, response_message = DatabaseOperator().read_all("course")
                if response_code == 200:
                    return (json.dumps(response_message), response_code, headers)
                return (response_message, response_code, headers)
            case "course" if request.method == "POST":
                body = get_body(request)
                course_field_names = get_field_names(Course)
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
                    key: body[key] for key in get_field_names(Course) if key in body
                }
                duplication_filters = get_field_filters(only_relevant_attr)
                response_code, response_message = DatabaseOperator().create(
                    "course",
                    Course(
                        course_abbreviation=body["course_abbreviation"],
                        name=body["name"],
                    ),
                    duplication_filters=duplication_filters,
                )

                if response_code not in (201, 409):
                    return (response_message, response_code, headers)
                return (json.dumps({"id": response_message}), response_code, headers)

    # For Requests against specific elements, schema: https://<api>/<entity>/<id>
    elif len(valid_path_segments) == 2:
        match valid_path_segments[0]:
            case "course" if request.method == "GET":
                response_code, response_message = DatabaseOperator().read(
                    "course", valid_path_segments[1]
                )
                if response_code == 200:
                    return (json.dumps(response_message), response_code, headers)
                return (response_message, response_code, headers)
            case "course" if request.method == "PUT":
                body = get_body(request)
                course_field_names = get_field_names(Course)
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

                response_code, response_message = DatabaseOperator().update(
                    "course",
                    only_relevant_attr,
                    valid_path_segments[1],
                    duplication_filters,
                )
                if response_code in (200, 409):
                    return (
                        json.dumps({"id": response_message}),
                        response_code,
                        headers,
                    )
                return (response_message, response_code, headers)
            case "course" if request.method == "DELETE":
                response_code, response_message = DatabaseOperator().delete(
                    "course", valid_path_segments[1]
                )
                if response_code == 204:
                    return ("", response_code, headers)
                return (response_message, response_code, headers)

    return ("Invalid Request", 400, headers)


def get_body(request: Request) -> dict:
    """Parses the request body to a dict.
    Args:
        request -- The HTTP request body.
    Returns:
        The parsed body as dict.
    """
    content_type = request.headers.get("content-type")
    if not content_type == "application/json":
        logger.error(f"Expected JSON body but was: {content_type}")
        return None
    request_json = request.get_json(silent=True)
    logger.info(f"Sucessfully loaded json body: {request_json}")
    return request_json


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
