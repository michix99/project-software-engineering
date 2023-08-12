"""The models for the db entities."""
from dataclasses import dataclass


@dataclass
class Course:
    """Class to describe a course of the IU."""

    course_abbreviation: str
    name: str


@dataclass
class professor:
    """Class to describe a professor of the IU."""

    email: str
    name_first: str
    name_last: str


@dataclass
class student:
    """Class to describe a student of the IU."""

    email: str
    name_first: str
    name_last: str


@dataclass
class admin:
    """Class to describe an admin of the IU."""

    email: str
    name_first: str
    name_last: str


@dataclass
class ticket:
    """Class to describe a ticket."""

    description: str
    course_abbreviation: str
    title: str
