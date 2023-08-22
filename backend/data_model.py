"""The models for the db entities."""
from dataclasses import dataclass


@dataclass
class Course:
    """Class to describe a course of the IU."""

    course_abbreviation: str
    name: str


@dataclass
class Admin:
    """Class to describe an admin of the IU."""

    email: str
    name_first: str
    name_last: str


@dataclass
class User:
    """Class to describe an user of the IU."""

    email: str
    name_first: str
    name_last: str
    is_professor: None
    is_student: None


@dataclass
class Ticket:
    """Class to describe a ticket."""

    description: str
    course_id: str
    title: str
    author: str


@dataclass
class Comment:
    """Class to describe a comment."""

    author: str
    contents: str
    ticket_id: str
