"""The models for the db entities."""
from dataclasses import dataclass
from auth_utils import UserInfo, get_user_name_by_id
from db_operator import DatabaseOperator


@dataclass
class Course:
    """Class to describe a course of the IU."""

    course_abbreviation: str = ""
    name: str = ""


@dataclass
class Ticket:
    """Class to describe a ticket."""

    description: str
    course_id: str
    title: str
    status: str
    priority: str
    assignee_id: str
    type: str

    @classmethod
    def resolve_refs(cls, element: dict, user_info: UserInfo) -> dict:
        """Resolves the references to course and assignee.
        Args:
            element -- the ticket reference loaded
            user_info -- the authenticated user information
        Returns:
            The element with resolved course and assignee.
        """
        response, course = DatabaseOperator(user_info).read(
            "course", Course, element["course_id"]
        )

        if response == 200:
            element = {
                **element,
                "course_name": course["name"],
                "course_abbreviation": course["course_abbreviation"],
            }

        if element.get("assignee_id") is not None:
            element["assignee_name"] = get_user_name_by_id(element["assignee_id"])

        return element


@dataclass
class Comment:
    """Class to describe a comment for a ticket."""

    content: str
    ticket_id: str


@dataclass
class TicketHistory:
    """Class to describe the history of a ticket."""

    ticket_id: str
    changed_values: dict
    previous_values: dict

    @classmethod
    def resolve_refs(cls, element: dict, user_info: UserInfo) -> dict:
        """Resolves the references to course and assignee.
        Args:
            element -- the ticket reference loaded
            user_info -- the authenticated user information
        Returns:
            The element with resolved course and assignee.
        """
        if element.get("previous_values", {}).get("course_id"):
            response, course = DatabaseOperator(user_info).read(
                "course", Course, element["previous_values"]["course_id"]
            )

            if response == 200:
                element["previous_values"] = {
                    **element["previous_values"],
                    "course_name": course["name"],
                    "course_abbreviation": course["course_abbreviation"],
                }

        if element.get("changed_values", {}).get("course_id"):
            response, course = DatabaseOperator(user_info).read(
                "course", Course, element["changed_values"]["course_id"]
            )

            if response == 200:
                element["changed_values"] = {
                    **element["changed_values"],
                    "course_name": course["name"],
                    "course_abbreviation": course["course_abbreviation"],
                }

        if element.get("previous_values", {}).get("assignee_id") is not None:
            element["previous_values"]["assignee_name"] = get_user_name_by_id(
                element["previous_values"]["assignee_id"]
            )

        if element.get("changed_values", {}).get("assignee_id") is not None:
            element["changed_values"]["assignee_name"] = get_user_name_by_id(
                element["changed_values"]["assignee_id"]
            )

        return element


ENTITY_MAPPINGS = {
    "course": Course,
    "ticket": Ticket,
    "comment": Comment,
    "ticket_history": TicketHistory,
}
