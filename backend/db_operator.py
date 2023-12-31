"""Utility methods to run database operations."""
from uuid import uuid4
from dataclasses import asdict, is_dataclass
from datetime import datetime
from firebase_admin import firestore
from google.cloud.firestore_v1.base_query import (
    FieldFilter,
    BaseCompositeFilter,
    StructuredQuery,
)
from google.cloud.firestore_v1.base_document import BaseDocumentReference
from google.cloud import exceptions
from google.api_core.exceptions import RetryError
from auth_utils import UserInfo, get_user_name_by_id

from logger_utils import Logger

logger = Logger(component="db_utils")


class DatabaseOperator:
    """Class that hold a connection to the database and runs CRUD operations on it."""

    def __init__(self, user_info: UserInfo) -> None:
        self.db_client = firestore.client()
        self.user_info = user_info

    def create(
        self,
        collection: str,
        data: object,
        document_id=None,
        duplication_filters: list[FieldFilter] = None,
    ) -> tuple[int, str]:
        """Creates a new database entry (document) on a given collection.
        Args:
            collection -- The name of the entity.
            data -- The data that should be used to create a new entry.
            document_id -- The id of the new document.
            duplication_filters -- The filters which should be used to check for duplicates.
        Returns:
            (The response code., The response message.)
        """
        try:
            document_id = document_id or str(uuid4())
            coll_ref = self.db_client.collection(collection)
            db_collection = coll_ref.get(timeout=10)
        except TimeoutError as error:
            error_message = (
                f"Timed out while trying to get reference for collection {collection}: "
                + str(error)
            )
            logger.error(error_message)
            return 500, error_message

        if not db_collection:
            return (
                500,
                f"Cannot create document! Collection does not exist: '{collection}'",
            )

        if duplication_filters:
            successful, duplicate_or_error = self.get_duplicate(
                collection, duplication_filters
            )
            if duplicate_or_error:
                return 409 if successful else 500, duplicate_or_error

        new_data = asdict(data) if is_dataclass(data) else data
        new_data["created_at"] = f"{datetime.utcnow().isoformat()}Z"
        new_data["created_by"] = self.user_info.user_id
        new_data["modified_at"] = f"{datetime.utcnow().isoformat()}Z"
        new_data["modified_by"] = self.user_info.user_id

        try:
            # Element will be overwritten if exists
            coll_ref.document(document_id).set(new_data, timeout=10)
        except (TimeoutError, RetryError) as error:
            error_message = (
                f"Timed out while trying to create entry in {collection}: {str(error)}"
            )
            logger.error(error_message)
            return 500, error_message
        logger.info(f"Created entry in collection: {collection}, ID: {document_id}")
        return 201, document_id

    def update(  # pylint: disable=too-many-arguments
        self,
        collection: str,
        update_data: object,
        document_id: str,
        duplication_filters: list[FieldFilter] = None,
        allowed_updater: str = None,
        history_type: type = None,
    ) -> tuple[int, str]:
        """Updates a given database entry (document) of a given collection.
        Args:
            collection -- The name of the entity.
            update_data -- The data that should be used to update the entry.
            document_id -- The id of the document to update.
            duplication_filters -- The filters which should be used to check for duplicates.
            allowed_updater -- The id of the requester, needs to match the creator id of the item.
        Returns:
            (The response code., The response message.)
        """
        elem_ref = self.db_client.collection(collection).document(document_id)

        if duplication_filters:
            successful, duplicate_or_error = self.get_duplicate(
                collection, duplication_filters
            )
            if duplicate_or_error:
                return (
                    409 if successful and duplicate_or_error != document_id else 500,
                    duplicate_or_error,
                )

        update_data = asdict(update_data) if is_dataclass(update_data) else update_data

        try:
            if allowed_updater or collection == "ticket":
                element = elem_ref.get(timeout=10).to_dict()
                if allowed_updater and element.get("created_by") != allowed_updater:
                    return 403, "Not allowed to update entry!"
                changes = {
                    key: update_data[key]
                    for key in update_data
                    if update_data[key] != element[key]
                }
                if collection == "ticket" and len(changes.keys()) > 0:
                    logger.debug(f"Changes made in ticket: {changes}")
                    history_response_code, history_response = self.create(
                        "ticket_history",
                        history_type(
                            ticket_id=document_id,
                            changed_values=changes,
                            previous_values={key: element[key] for key in changes},
                        ),
                    )
                    if history_response_code != 201:
                        logger.error("Cannot create ticket history entry!")
                        return history_response_code, history_response
                    logger.info(f"Created ticket history entry: {history_response}")
            elem_ref.update(update_data, timeout=10)
            elem_ref.update(
                {"modified_at": f"{datetime.utcnow().isoformat()}Z"}, timeout=10
            )
            elem_ref.update({"modified_by": self.user_info.user_id}, timeout=10)
        except exceptions.NotFound as error:
            logger.error(f"Error while updating the entry: {error}")
            return 404, "Element not found!"
        except (TimeoutError, RetryError) as error:
            logger.error(
                f"Timed out while trying to update entry in {collection}: {str(error)}"
            )
            return 500, "Timed out while trying to update entry!"

        logger.info(
            f"Updated entry in collection '{collection}', with ID '{document_id}'"
        )
        return 200, document_id

    def read(
        self, collection: str, class_type: type, document_id: str
    ) -> tuple[int, str | dict]:
        """Gets the data of specific element on a given collection.
        Args:
            collection -- The name of the entity.
            document_id -- The id of the document to read.
        Returns:
            (The response code., The data of the element or on error the reason.)
        """
        elem_ref = self.db_client.collection(collection).document(document_id)

        try:
            element = elem_ref.get(timeout=10)
            print(element.id)
            if element.exists:
                logger.info(
                    f"Selected element '{document_id}' in collection '{collection}'."
                )
                parsed_element = {
                    **element.to_dict(),
                    "id": element.id,
                    "created_by_name": get_user_name_by_id(
                        element.to_dict().get("created_by")
                    ),
                    "modified_by_name": get_user_name_by_id(
                        element.to_dict().get("modified_by")
                    ),
                }
                if hasattr(class_type, "resolve_refs") and callable(
                    class_type.resolve_refs
                ):
                    parsed_element = class_type.resolve_refs(
                        parsed_element, self.user_info
                    )
                return 200, parsed_element
            return 404, "Element not found!"
        except (TimeoutError, RetryError) as error:
            error_message = (
                f"Timed out while trying to read entry in {collection}: {str(error)}"
            )
            logger.error(error_message)
            return 500, error_message

    def read_all(
        self, collection: str, class_type: type
    ) -> tuple[int, str | list[dict]]:
        """Gets all data elements of a given collection.
        Args:
            collection -- The name of the entity.
        Returns:
            (The response code., The list of elements or on error the reason.)
        """
        try:
            all_element_refs = self.db_client.collection(collection).stream(timeout=10)
            all_elements = []
            for element in all_element_refs:
                parsed_element = {
                    **element.to_dict(),
                    "id": element.id,
                    "created_by_name": get_user_name_by_id(
                        element.to_dict().get("created_by")
                    ),
                    "modified_by_name": get_user_name_by_id(
                        element.to_dict().get("modified_by")
                    ),
                }
                if hasattr(class_type, "resolve_refs") and callable(
                    class_type.resolve_refs
                ):
                    parsed_element = class_type.resolve_refs(
                        parsed_element, self.user_info
                    )
                all_elements.append(parsed_element)

        except (TimeoutError, RetryError) as error:
            error_message = (
                f"Timed out while trying to read all entries for {collection}: "
                + str(error)
            )
            logger.error(error_message)
            return 500, error_message
        logger.info(f"Selected elements for collection '{collection}'.")
        return 200, all_elements

    def find(
        self, collection: str, filters: list[FieldFilter], limit: int = 1
    ) -> tuple[bool, list[BaseDocumentReference]]:
        """Queries a given collection with provided filters and limit.
        Args:
            collection -- The name of the entity.
            filters -- The filter condition used on the query.
            limit -- The number of elements that should be returned.
        Returns:
            (Success Indicator., The list of element references matching the query.)
        """
        try:
            filtered_elements = (
                self.db_client.collection(collection)
                .where(
                    filter=BaseCompositeFilter(
                        operator=StructuredQuery.CompositeFilter.Operator.AND,
                        filters=filters,
                    )
                )
                .limit(limit)
            )
            refs = filtered_elements.stream(timeout=10)
        except ValueError as error:
            logger.error(f"Filter field is not known! {error}")
            return False, None
        except (TimeoutError, RetryError) as error:
            error_message = (
                f"Timed out while searching entry in {collection}: {str(error)}"
            )
            logger.error(error_message)
            return False, None

        logger.info(f"Searched max. {limit} element(s) for collection '{collection}'.")
        return True, refs

    def find_all(
        self, collection: str, class_type: type, filters: list[FieldFilter]
    ) -> tuple[int, list[dict]]:
        """Queries a given collection with provided filters.
        Args:
            collection -- The name of the entity.
            filters -- The filter condition used on the query.
        Returns:
            (The response code., The list of elements matching the query.)
        """
        try:
            filtered_elements = self.db_client.collection(collection).where(
                filter=BaseCompositeFilter(
                    operator=StructuredQuery.CompositeFilter.Operator.AND,
                    filters=filters,
                )
            )
            all_element_refs = filtered_elements.stream(timeout=10)
            all_elements = []
            for element in all_element_refs:
                parsed_element = {
                    **element.to_dict(),
                    "id": element.id,
                    "created_by_name": get_user_name_by_id(
                        element.to_dict().get("created_by")
                    ),
                    "modified_by_name": get_user_name_by_id(
                        element.to_dict().get("modified_by")
                    ),
                }
                if hasattr(class_type, "resolve_refs") and callable(
                    class_type.resolve_refs
                ):
                    parsed_element = class_type.resolve_refs(
                        parsed_element, self.user_info
                    )
                all_elements.append(parsed_element)
        except ValueError as error:
            logger.error(f"Filter field is not known! {error}")
            return 400, None
        except (TimeoutError, RetryError) as error:
            logger.error(
                f"Timed out while trying to find entries in {collection}: {str(error)}"
            )
            return 500, None

        logger.info(f"Searched elements for collection '{collection}'.")
        return 200, all_elements

    def delete(self, collection: str, document_id: str) -> tuple[int, str]:
        """Deletes a specific element on a given collection.
        Args:
            collection -- The name of the entity.
            document_id -- The id of the document to delete.
        Returns:
            (The response code., On error the reason.)
        """
        try:
            self.db_client.collection(collection).document(document_id).delete(
                timeout=10
            )
        except (TimeoutError, RetryError) as error:
            error_message = (
                f"Timed out while trying to delete entry in {collection}: {str(error)}"
            )
            logger.error(error_message)
            return 500, error_message
        logger.info(
            f"Deleted element wit ID '{document_id}' in collection '{collection}'"
        )
        return 204, None

    def get_duplicate(
        self, collection: str, duplication_filters: list[FieldFilter]
    ) -> tuple[bool, str | None]:
        """Loads duplicates for a given colleciton.
        Args:
            collection -- The name of the entity.
            duplication_filters --  The filters which should be used to check for duplicates.
        Returns:
            (Indicator if succesfully checked., The duplication id, none if not found or an error.)
        """
        successful, duplicates = self.find(collection, duplication_filters)
        if not successful:
            return False, "Could not check for duplicates!"
        duplicate_ids = [doc.id for doc in duplicates]
        if duplicate_ids:
            logger.info(
                f"Found duplicate in '{collection}' with ID: {duplicate_ids[0]}"
            )
            return True, duplicate_ids[0]
        return True, None
