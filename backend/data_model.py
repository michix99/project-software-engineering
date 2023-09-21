"""The models for the db entities."""
from dataclasses import dataclass


@dataclass
class Course:
    """Class to describe a course of the IU."""

    course_abbreviation: str = ""
    name: str = ""


@dataclass
class Role:
    """Class to describe a role of an User"""

    name: str


@dataclass
class User:
    """Class to describe an user of the IU."""

    email: str
    name_first: str
    name_last: str
    role: str


@dataclass
class Ticket:
    """Class to describe a ticket."""

    description: str
    course_id: str
    title: str
    status: str


@dataclass
class Comment:
    """Class to describe a comment for a ticket."""

    content: str
    ticket_id: str


ENTITY_MAPPINGS = {
    "course": Course,
    "role": Role,
    "user": User,
    "ticket": Ticket,
    "comment": Comment,
}
