"""
Mock class for mutiple test files.
"""


class MockUserReference:  # pylint: disable=R0903
    """Mock implementation of a user reference."""

    display_name: str
    uid: str = "uid"
    email: str = "email"
    disabled: bool = False
    custom_claims: dict = {"admin": True}

    def __init__(self, display_name) -> None:
        self.display_name = display_name


class MockDocReference:  # pylint: disable=R0903
    """Mock implementation of a document reference."""

    exists: bool
    id: str
    name: str
    additional_attributes: dict

    def __init__(
        self, exists, identifier=None, name=None, additional_attributes=None
    ) -> None:
        self.exists = exists
        self.id = identifier  # pylint: disable=C0103
        self.name = name
        self.additional_attributes = additional_attributes

    def to_dict(self) -> dict:
        """Parses the element to a dictionary."""
        return {"name": self.name, **(self.additional_attributes or {})}
