"""
    Testing the logger utility methods.
"""
from unittest import mock
from collections import namedtuple
import pytest
from google.cloud.firestore_v1.base_query import FieldFilter
from google.cloud import exceptions
from db_operator import DatabaseOperator
from data_model import Course, Ticket
from enums import Role
from auth_utils import UserInfo


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


class MockUserReference:  # pylint: disable=R0903
    """Mock implementation of a user reference."""

    display_name: str

    def __init__(self, display_name) -> None:
        self.display_name = display_name


class TestDbOperator:  # pylint: disable=R0904
    """Contains tests for the database operator."""

    @pytest.fixture(scope="session", name="db_operator")
    def fixture_db_operator(self) -> DatabaseOperator:
        """Create a fake "DatabaseOperator" for testing purpose."""
        with mock.patch("firebase_admin.firestore.client"):
            user_info = UserInfo("123", [Role.ADMIN])
            db_operator = DatabaseOperator(user_info)
            return db_operator

    def test_create_successful(self, db_operator) -> None:
        """Tests a successful database entity creation."""
        with mock.patch.object(db_operator.db_client, "collection") as collection_mock:
            collection_mock.return_value = collection_return_mock = mock.Mock()
            collection_return_mock.get.return_value = "exists"

            return_code, return_message = db_operator.create(
                "test", {"new": "entity"}, "dummy_id"
            )

            assert return_code == 201
            assert return_message == "dummy_id"

    def test_create_successful_with_dataclass(self, db_operator) -> None:
        """Tests a successful database entity creation with a dataclass element to create."""
        with mock.patch.object(db_operator.db_client, "collection") as collection_mock:
            collection_mock.return_value = collection_return_mock = mock.Mock()
            collection_return_mock.get.return_value = "exists"

            return_code, return_message = db_operator.create(
                "test", Course("abbreviation", "name"), "another_dummy_id"
            )

            assert return_code == 201
            assert return_message == "another_dummy_id"

    def test_create_failing_timeout_while_collection_loading(self, db_operator) -> None:
        """Tests a failing database entity creation, as not possible to load the collection."""
        with mock.patch.object(db_operator.db_client, "collection") as collection_mock:
            collection_mock.return_value = collection_return_mock = mock.Mock()
            collection_return_mock.get.side_effect = TimeoutError("Timeout Error")

            return_code, return_message = db_operator.create(
                "test", {"new": "entity"}, "dummy_id"
            )

            assert return_code == 500
            assert (
                return_message
                == "Timed out while trying to get reference for collection test: Timeout Error"
            )

    def test_create_failing_unknown_collection(self, db_operator) -> None:
        """Tests a failing database entity creation. Collection does not exist."""
        with mock.patch.object(db_operator.db_client, "collection") as collection_mock:
            collection_mock.return_value = collection_return_mock = mock.Mock()
            collection_return_mock.get.return_value = None

            return_code, return_message = db_operator.create(
                "test", {"new": "entity"}, "dummy_id"
            )

            assert return_code == 500
            assert (
                return_message
                == "Cannot create document! Collection does not exist: 'test'"
            )

    def test_create_failing_cannot_check_duplicates(self, db_operator) -> None:
        """Tests a failing database entity creation. Failing to check for duplicates."""
        with mock.patch.object(
            db_operator.db_client, "collection"
        ) as collection_mock, mock.patch(
            "db_operator.DatabaseOperator.find"
        ) as find_mock:
            collection_mock.return_value = collection_return_mock = mock.Mock()
            collection_return_mock.get.return_value = "exists"
            find_mock.return_value = (False, None)

            return_code, return_message = db_operator.create(
                "test",
                {"new": "entity"},
                "dummy_id",
                [FieldFilter("new", "==", "entity")],
            )

            assert return_code == 500
            assert return_message == "Could not check for duplicates!"

    def test_create_failing_found_duplicates(self, db_operator) -> None:
        """Tests a failing database entity creation. Entry already exists."""
        with mock.patch.object(
            db_operator.db_client, "collection"
        ) as collection_mock, mock.patch(
            "db_operator.DatabaseOperator.find"
        ) as find_mock:
            collection_mock.return_value = collection_return_mock = mock.Mock()
            collection_return_mock.get.return_value = "exists"
            Document = namedtuple("Documents", "id")
            duplicate = Document(id="duplicate_id")
            find_mock.return_value = (True, [duplicate])

            return_code, return_message = db_operator.create(
                "test",
                {"new": "entity"},
                "dummy_id",
                [FieldFilter("new", "==", "entity")],
            )

            assert return_code == 409
            assert return_message == "duplicate_id"

    def test_create_failing_timeout_while_creating(self, db_operator) -> None:
        """Tests a failing database entity creation. Timeout happening while creating."""
        with mock.patch.object(db_operator.db_client, "collection") as collection_mock:
            collection_mock.return_value = collection_return_mock = mock.Mock()
            collection_return_mock.get.return_value = "exists"
            collection_return_mock.document().set.side_effect = TimeoutError(
                "Timeout Error"
            )

            return_code, return_message = db_operator.create(
                "test", {"new": "entity"}, "dummy_id"
            )

            assert return_code == 500
            assert (
                return_message
                == "Timed out while trying to create entry in test: Timeout Error"
            )

    def test_update_successful(self, db_operator) -> None:
        """Tests a successful database entity update."""
        with mock.patch.object(db_operator.db_client, "collection"):
            return_code, return_message = db_operator.update(
                "test", {"new": "updated_entity"}, "dummy_id"
            )

            assert return_code == 200
            assert return_message == "dummy_id"

    def test_update_successful_with_dataclass(self, db_operator) -> None:
        """Tests a successful database entity update with a dataclass element."""
        with mock.patch.object(db_operator.db_client, "collection"):
            return_code, return_message = db_operator.update(
                "test", Course("abbreviation", "updated_name"), "another_dummy_id"
            )

            assert return_code == 200
            assert return_message == "another_dummy_id"

    def test_update_failing_timeout_while_updating(self, db_operator) -> None:
        """Tests a failing database entity update. Timeout happening while updating."""
        with mock.patch.object(db_operator.db_client, "collection") as collection_mock:
            collection_mock.return_value = collection_return_mock = mock.Mock()
            collection_return_mock.document.return_value = element_mock = mock.Mock()
            element_mock.update.side_effect = TimeoutError("Timeout Error")

            return_code, return_message = db_operator.update(
                "test", {"new": "updated_entity"}, "dummy_id"
            )

            assert return_code == 500
            assert (
                return_message
                == "Timed out while trying to update entry in test: Timeout Error"
            )

    def test_update_failing_element_not_found(self, db_operator) -> None:
        """Tests a failing database entity update. Element does not exist."""
        with mock.patch.object(db_operator.db_client, "collection") as collection_mock:
            collection_mock.return_value = collection_return_mock = mock.Mock()
            collection_return_mock.document.return_value = element_mock = mock.Mock()
            element_mock.update.side_effect = exceptions.NotFound("elem not found")

            return_code, return_message = db_operator.update(
                "test", {"new": "updated_entity"}, "dummy_id"
            )

            assert return_code == 404
            assert return_message == "Element not found!"

    def test_update_failing_cannot_check_duplicates(self, db_operator) -> None:
        """Tests a failing database entity update. Not able to check for duplicates."""
        with mock.patch.object(db_operator.db_client, "collection"), mock.patch(
            "db_operator.DatabaseOperator.find"
        ) as find_mock:
            find_mock.return_value = (False, None)

            return_code, return_message = db_operator.update(
                "test",
                {"new": "updated_entity"},
                "dummy_id",
                [FieldFilter("new", "==", "updated_entity")],
            )

            assert return_code == 500
            assert return_message == "Could not check for duplicates!"

    def test_update_failing_found_duplicates(self, db_operator) -> None:
        """Tests a failing database entity update. Element with same attributes exists."""
        with mock.patch.object(db_operator.db_client, "collection"), mock.patch(
            "db_operator.DatabaseOperator.find"
        ) as find_mock:
            Document = namedtuple("Documents", "id")
            duplicate = Document(id="duplicate_id")
            find_mock.return_value = (True, [duplicate])

            return_code, return_message = db_operator.update(
                "test",
                {"new": "updated_entity"},
                "dummy_id",
                [FieldFilter("new", "==", "updated_entity")],
            )

            assert return_code == 409
            assert return_message == "duplicate_id"

    def test_read_successful(self, db_operator) -> None:
        """Tests reading a database entity successfully."""
        with mock.patch.object(
            db_operator.db_client, "collection"
        ) as collection_mock, mock.patch("firebase_admin.auth.get_user") as user_mock:
            collection_mock.return_value = collection_return_mock = mock.Mock()
            collection_return_mock.document.return_value = element_mock = mock.Mock()
            user_mock.side_effect = [
                MockUserReference("Dummy Name"),
                MockUserReference("Another Dummy Name"),
            ]

            element_mock.get.return_value = MockDocReference(
                True, identifier="dummy_id", name="dummy_name"
            )

            return_code, return_message = db_operator.read("test", "dummy_id")

            assert return_code == 200
            assert return_message == {
                "id": "dummy_id",
                "name": "dummy_name",
                "created_by_name": "Dummy Name",
                "modified_by_name": "Another Dummy Name",
            }

    def test_read_failing_not_found(self, db_operator) -> None:
        """Tests reading a database entity failing, as the element was not found."""
        with mock.patch.object(db_operator.db_client, "collection") as collection_mock:
            collection_mock.return_value = collection_return_mock = mock.Mock()
            collection_return_mock.document.return_value = element_mock = mock.Mock()

            element_mock.get.return_value = MockDocReference(False)

            return_code, return_message = db_operator.read("test", "dummy_id")

            assert return_code == 404
            assert return_message == "Element not found!"

    def test_read_failing_with_timeout(self, db_operator) -> None:
        """Tests reading a database entity failing, as the query timed out."""
        with mock.patch.object(db_operator.db_client, "collection") as collection_mock:
            collection_mock.return_value = collection_return_mock = mock.Mock()
            collection_return_mock.document.return_value = element_mock = mock.Mock()

            element_mock.get.side_effect = TimeoutError("Timeout Error")

            return_code, return_message = db_operator.read("test", "dummy_id")

            assert return_code == 500
            assert (
                return_message
                == "Timed out while trying to read entry in test: Timeout Error"
            )

    def test_read_all_successful(self, db_operator) -> None:
        """Tests reading a database collection successfully."""
        with mock.patch.object(
            db_operator.db_client, "collection"
        ) as collection_mock, mock.patch("firebase_admin.auth.get_user") as user_mock:
            collection_mock.return_value = collection_return_mock = mock.Mock()
            collection_return_mock.stream.return_value = [
                MockDocReference(True, "dummy_id", "name"),
                MockDocReference(True, "another_dummy_id", "another_name"),
            ]
            user_mock.side_effect = [
                MockUserReference("Created By Name"),
                MockUserReference("Modified By Name"),
                MockUserReference("Created By Another Name"),
                MockUserReference("Modified By Another Name"),
            ]

            return_code, return_message = db_operator.read_all("test", Course)

            assert return_code == 200
            assert return_message == [
                {
                    "id": "dummy_id",
                    "name": "name",
                    "created_by_name": "Created By Name",
                    "modified_by_name": "Modified By Name",
                },
                {
                    "id": "another_dummy_id",
                    "name": "another_name",
                    "created_by_name": "Created By Another Name",
                    "modified_by_name": "Modified By Another Name",
                },
            ]

    def test_read_all_failing_with_timeout(self, db_operator) -> None:
        """Tests reading a database collection failing, as the query timed out."""
        with mock.patch.object(db_operator.db_client, "collection") as collection_mock:
            collection_mock.return_value = collection_return_mock = mock.Mock()
            collection_return_mock.stream.side_effect = TimeoutError("Timeout Error")

            return_code, return_message = db_operator.read_all("test", Course)

            assert return_code == 500
            assert (
                return_message
                == "Timed out while trying to read all entries for test: Timeout Error"
            )

    def test_read_all_successful_with_references(self, db_operator) -> None:
        """Tests reading a database collection with references to resolve successfully."""
        with mock.patch.object(
            db_operator.db_client, "collection"
        ) as collection_mock, mock.patch(
            "firebase_admin.auth.get_user"
        ) as user_mock, mock.patch(
            "db_operator.DatabaseOperator.read"
        ) as read_mock, mock.patch(
            "firebase_admin.firestore.client"
        ):
            collection_mock.return_value = collection_return_mock = mock.Mock()
            read_mock.return_value = (
                200,
                MockDocReference(
                    True, "dummy_id", "course name", {"course_abbreviation": "abbr"}
                ).to_dict(),
            )
            collection_return_mock.stream.return_value = [
                MockDocReference(
                    True,
                    "dummy_id",
                    "name",
                    {"course_id": "123", "assignee_id": "456"},
                ),
                MockDocReference(
                    True, "another_dummy_id", "another_name", {"course_id": "123"}
                ),
            ]

            user_mock.side_effect = [
                MockUserReference("Created By Name"),
                MockUserReference("Modified By Name"),
                MockUserReference("Assignee Name"),
                MockUserReference("Created By Another Name"),
                MockUserReference("Modified By Another Name"),
            ]

            return_code, return_message = db_operator.read_all("test", Ticket)

            assert return_code == 200
            assert return_message == [
                {
                    "id": "dummy_id",
                    "name": "name",
                    "created_by_name": "Created By Name",
                    "modified_by_name": "Modified By Name",
                    "course_id": "123",
                    "course_name": "course name",
                    "course_abbreviation": "abbr",
                    "assignee_id": "456",
                    "assignee_name": "Assignee Name",
                },
                {
                    "id": "another_dummy_id",
                    "name": "another_name",
                    "created_by_name": "Created By Another Name",
                    "modified_by_name": "Modified By Another Name",
                    "course_id": "123",
                    "course_name": "course name",
                    "course_abbreviation": "abbr",
                },
            ]

    def test_find_successful(self, db_operator) -> None:
        """Tests querying a database entity successfully."""
        with mock.patch.object(db_operator.db_client, "collection") as collection_mock:
            collection_mock.return_value = collection_return_mock = mock.Mock()
            collection_return_mock.where().limit.return_value = (
                filtered_mock
            ) = mock.Mock()
            filtered_mock.stream.return_value = "reference"

            found_successful, return_message = db_operator.find(
                "test", [FieldFilter("new", "==", "updated_entity")]
            )

            assert found_successful is True
            assert return_message == "reference"

    def test_find_failing_with_filter_field_unknown(self, db_operator) -> None:
        """Tests querying a database entity failing, as the filters are not valid."""
        with mock.patch.object(db_operator.db_client, "collection") as collection_mock:
            collection_mock.return_value = collection_return_mock = mock.Mock()
            collection_return_mock.where().limit.side_effect = ValueError("Value Error")

            found_successful, return_message = db_operator.find(
                "test", [FieldFilter("new", "==", "updated_entity")]
            )

            assert found_successful is False
            assert return_message is None

    def test_find_failing_with_timeout(self, db_operator) -> None:
        """Tests querying a database entity failing as the query timed out."""
        with mock.patch.object(db_operator.db_client, "collection") as collection_mock:
            collection_mock.return_value = collection_return_mock = mock.Mock()
            collection_return_mock.where().limit.side_effect = TimeoutError(
                "Timeout Error"
            )

            found_successful, return_message = db_operator.find(
                "test", [FieldFilter("new", "==", "updated_entity")]
            )

            assert found_successful is False
            assert return_message is None

    def test_find_all_successful(self, db_operator) -> None:
        """Tests querying a database collection successfully."""
        with mock.patch.object(db_operator.db_client, "collection") as collection_mock:
            collection_mock.return_value = collection_return_mock = mock.Mock()
            collection_return_mock.where.return_value = filtered_mock = mock.Mock()
            filtered_mock.stream.return_value = [
                MockDocReference(True, name="dummy_id"),
                MockDocReference(True, name="another_dummy_id"),
            ]

            found_successful, return_message = db_operator.find_all(
                "test", [FieldFilter("new", "==", "updated_entity")]
            )

            assert found_successful is True
            assert return_message == [
                {"name": "dummy_id"},
                {"name": "another_dummy_id"},
            ]

    def test_find_all_failing_with_filter_field_unknown(self, db_operator) -> None:
        """Tests querying a database collection failing, as the filters are invalid."""
        with mock.patch.object(db_operator.db_client, "collection") as collection_mock:
            collection_mock.return_value = collection_return_mock = mock.Mock()
            collection_return_mock.where.side_effect = ValueError("Value Error")

            found_successful, return_message = db_operator.find_all(
                "test", [FieldFilter("new", "==", "updated_entity")]
            )

            assert found_successful is False
            assert return_message is None

    def test_find_all_failing_with_timeout(self, db_operator) -> None:
        """Tests querying a database collection failing, as the query timed out."""
        with mock.patch.object(db_operator.db_client, "collection") as collection_mock:
            collection_mock.return_value = collection_return_mock = mock.Mock()
            collection_return_mock.where.side_effect = TimeoutError("Timeout Error")

            found_successful, return_message = db_operator.find_all(
                "test", [FieldFilter("new", "==", "updated_entity")]
            )

            assert found_successful is False
            assert return_message is None

    def test_delete_successful(self, db_operator) -> None:
        """Tests deleting a database entity successfully."""
        return_code, return_message = db_operator.delete("test", "dummy_id")

        assert return_code == 204
        assert return_message is None

    def test_delete_failed_with_timeout(self, db_operator) -> None:
        """Tests deleting a database entity failing, as it timed out."""
        with mock.patch.object(db_operator.db_client, "collection") as collection_mock:
            collection_mock.return_value = collection_return_mock = mock.Mock()
            collection_return_mock.document().delete.side_effect = TimeoutError(
                "Timeout Error"
            )
            return_code, return_message = db_operator.delete("test", "dummy_id")

            assert return_code == 500
            assert (
                return_message
                == "Timed out while trying to delete entry in test: Timeout Error"
            )
