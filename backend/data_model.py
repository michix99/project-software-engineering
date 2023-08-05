"""The models for the db entities."""
from dataclasses import dataclass


@dataclass
class Course:
    """Class to describe a course of the IU."""

    course_abbreviation: str
    name: str
