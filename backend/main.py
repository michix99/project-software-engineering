"""
    Main entry point for the Cloud Function.
"""
from os import getenv
import json
import functions_framework
from firebase_admin import initialize_app
from version import __version__
from logger_utils import Logger
from auth_utils import is_authenticated
from db_utils import create, read, read_all, delete, update
from data_modell import Course
from google.cloud.firestore_v1.base_query import FieldFilter
from dataclasses import fields

initialize_app()
logger = Logger(component="main")


@functions_framework.http
def request_handler(request):
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
            "Access-Control-Max-Age": "3600",
            "Access-Control-Allow-Credentials": "true",
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

    if len(valid_path_segments) == 1:
        match valid_path_segments[0]:
            case "course" if request.method == "GET":
                response_code, response_message = read_all("course")
                if response_code == 200:
                    return (json.dumps(response_message), response_code, headers)
                return (response_message, response_code, headers)
            case "course" if request.method == "POST":
                body = get_body(request)
                course_field_names = get_field_names(Course)
                if not all(field_name in body for field_name in course_field_names):
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
                response_code, response_message = create(
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

    elif len(valid_path_segments) == 2:
        match valid_path_segments[0]:
            case "course" if request.method == "GET":
                response_code, response_message = read("course", valid_path_segments[1])
                if response_code == 200:
                    return (json.dumps(response_message), response_code, headers)
                return (response_message, response_code, headers)
            case "course" if request.method == "PUT":
                body = get_body(request)
                course_field_names = get_field_names(Course)
                if not all(field_name in body for field_name in course_field_names):
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

                response_code, response_message = update(
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
                response_code, response_message = delete(
                    "course", valid_path_segments[1]
                )
                if response_code == 204:
                    return ("", response_code, headers)
                return (response_message, response_code, headers)

    return ("Invalid Request", 400, headers)

    # create(
    #     "course",
    #     Course(course_abbreviation="ISEF01", name="Projekt Software Engineering"),
    # )

    # delete("course", "9ced3577-721e-4c5b-8f68-39781c00c4c2")

    # update("course", {"name": "neu"}, "0a4d21f7-e432-4fd4-9a13-076709f543dd")
    # update("course", Course(None, "neu"), "0a4d21f7-e432-4fd4-9a13-076709f543dd") # Caution: this will reset the abbreviation field

    # print(read("course", "189d0d9f-9dbb-437a-ab5f-a4b5a67d948c"))
    # print(find_all("course", FieldFilter("course_abbreviation", "==", "ISEF01")))

    # print(read_all("course"))


def get_body(request) -> dict:
    content_type = request.headers.get("content-type")
    if not content_type == "application/json":
        logger.error(f"Expected JSON body but was: {content_type}", content_type)
        return None
    request_json = request.get_json(silent=True)
    logger.info(f"Sucessfully loaded json body: {request_json}")
    return request_json


def get_field_names(class_type) -> list[str]:
    field_elems = fields(class_type)
    return [x.name for x in field_elems]


def get_field_filters(fields: dict) -> list[FieldFilter]:
    conditions = [(key, "==", fields[key]) for key in fields]
    return [FieldFilter(*_c) for _c in conditions]
