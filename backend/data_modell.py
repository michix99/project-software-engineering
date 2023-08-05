from dataclasses import dataclass, fields


@dataclass
class Course:
    """Class to describe a course of the IU."""

    course_abbreviation: str
    name: str
