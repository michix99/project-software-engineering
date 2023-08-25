"""The models for the db entities."""
from dataclasses import dataclass
from enum import Enum, auto





@dataclass
class Course:
    """Class to describe a course of the IU."""

    course_abbreviation: str
    name: str


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

class Entities(Enum):
    """Enum with all the classes"""

    COURSE = Course
    ROLE = Role
    USER = User
    TICKET = Ticket
    COMMENT = Comment9

entity_mapping = {
    """connecting the enum values to the classes"""
    
    Entities.COURSE: Course,
    Entities.ROLE: Role,
    Entities.USER: User,
    Entities.TICKET: Ticket,
    Entities.COMMENT: Comment,
    }
