"""Utility enums for handling requests."""
from enum import Enum


class Role(Enum):
    """The roles a user can have."""

    ADMIN = "admin"
    EDITOR = "editor"
    REQUESTER = "requester"
