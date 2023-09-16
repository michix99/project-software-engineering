"""Utility methods for handling the request."""
from flask import Request
from logger_utils import Logger

logger = Logger(component="request_helper")


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
