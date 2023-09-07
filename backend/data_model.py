"""The models for the db entities."""
from dataclasses import dataclass
from enum import Enum


@dataclass
class Course:
    """Class to describe a course of the IU."""

    course_abbreviation: str = ""
    name: str = ""


@dataclass
class Role:
    """Class to describe a role of an User"""
    
    role: str


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
    author: str


@dataclass
class Comment:
    """Class to describe a comment for a ticket."""

    author: str
    contents: str
    ticket_id: str


@dataclass
class Status:
    """Class to describe a Status of a ticket"""

    status: str


class Entities(Enum):
    """Enum with all the classes"""

    COURSE = Course
    ROLE = Role
    USER = User
    TICKET = Ticket
    COMMENT = Comment
    STATUS = Status


entity_mapping = {
    "course": Course,
    "role": Role,
    "user": User,
    "ticket": Ticket,
    "comment": Comment,
    "status": Status,
}
