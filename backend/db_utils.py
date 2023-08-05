from firebase_admin import firestore
from uuid import uuid4
from dataclasses import asdict, is_dataclass
from google.cloud.firestore_v1.base_query import (
    FieldFilter,
    BaseCompositeFilter,
    StructuredQuery,
)
from google.cloud.firestore_v1.base_document import BaseDocumentReference
from google.cloud import exceptions
from datetime import datetime

from logger_utils import Logger

logger = Logger(component="db_utils")


def create(
    collection: str,
    data: object,
    document_id=str(uuid4()),
    duplication_filters: list[FieldFilter] = [],
) -> tuple[int, str]:
    db = firestore.client()

    try:
        coll_ref = db.collection(collection)
        db_collection = coll_ref.get()
    except TimeoutError as error:
        error_message = f"Timed out while trying to get reference for collection {collection}: {str(error)}"
        logger.error(error_message)
        return 500, error_message

    if not db_collection:
        return 500, f"Cannot create document! Collection does not exist: '{collection}'"

    if duplication_filters:
        successful, duplicates = find(collection, duplication_filters)
        if not successful:
            return 500, "Could not check for duplicates!"
        duplicate_ids = [doc.id for doc in duplicates]
        if duplicate_ids:
            return 409, duplicate_ids[0]

    new_data = asdict(data) if is_dataclass(data) else data
    new_data["created_at"] = datetime.utcnow().isoformat()
    new_data["modified_at"] = datetime.utcnow().isoformat()

    try:
        # Element will be overwritten if exists
        coll_ref.document(document_id).set(new_data)
    except TimeoutError as error:
        error_message = (
            f"Timed out while trying to create entry in {collection}: {str(error)}"
        )
        logger.error(error_message)
        return 500, error_message
    logger.info(f"Created entry in collection: {collection}, ID: {document_id}")
    return 201, document_id


def update(
    collection: str,
    update_data: object,
    document_id: str,
    duplication_filters: list[FieldFilter] = [],
) -> tuple[int, str]:
    db = firestore.client()
    elem_ref = db.collection(collection).document(document_id)

    if duplication_filters:
        successful, duplicates = find(collection, duplication_filters)
        if not successful:
            return 500, "Could not check for duplicates!"
        duplicate_ids = [doc.id for doc in duplicates]
        if duplicate_ids:
            return 409, duplicate_ids[0]

    update_data = asdict(update_data) if is_dataclass(update_data) else update_data

    try:
        elem_ref.update(update_data)
        elem_ref.update({"modified_at": datetime.utcnow().isoformat()})
    except exceptions.NotFound as error:
        logger.error(f"Error while updating the entry: {error}")
        return 404, "Element not found!"
    except TimeoutError as error:
        error_message = (
            f"Timed out while trying to update entry in {collection}: {str(error)}"
        )
        logger.error(error_message)
        return 500, error_message

    logger.info(f"Updated entry in collection '{collection}', with ID '{document_id}'")
    return 200, document_id


def read(collection: str, document_id: str) -> tuple[int, str | dict]:
    db = firestore.client()
    elem_ref = db.collection(collection).document(document_id)

    try:
        element = elem_ref.get()
        if element.exists:
            logger.info(
                f"Selected element '{document_id}' in collection '{collection}'."
            )
            return 200, element.to_dict()
        else:
            return 404, "Element not found!"
    except TimeoutError as error:
        error_message = (
            f"Timed out while trying to read entry in {collection}: {str(error)}"
        )
        logger.error(error_message)
        return 500, error_message


def read_all(collection: str) -> tuple[int, str | list[dict]]:
    db = firestore.client()
    try:
        all_element_refs = db.collection(collection).stream()
        all_elements = [element.to_dict() for element in all_element_refs]
    except TimeoutError as error:
        error_message = (
            f"Timed out while trying to read all entries for {collection}: {str(error)}"
        )
        logger.error(error_message)
        return 500, error_message
    logger.info(f"Selected elements for collection '{collection}'.")
    return 200, all_elements


def find(
    collection: str, filters: list[FieldFilter], limit: int = 1
) -> tuple[bool, list[BaseDocumentReference]]:
    db = firestore.client()
    try:
        filtered_elements = (
            db.collection(collection)
            .where(
                filter=BaseCompositeFilter(
                    operator=StructuredQuery.CompositeFilter.Operator.AND,
                    filters=filters,
                )
            )
            .limit(limit)
        )
        refs = filtered_elements.stream()
    except ValueError as error:
        logger.error(f"Filter field is not known! {error}")
        return False, None
    except TimeoutError as error:
        error_message = (
            f"Timed out while trying to create entry in {collection}: {str(error)}"
        )
        logger.error(error_message)
        return False, None

    logger.info(f"Searched max. {limit} element(s) for collection '{collection}'.")
    return True, refs


def find_all(collection: str, filters: list[FieldFilter]) -> tuple[bool, list[dict]]:
    db = firestore.client()
    try:
        filtered_elements = db.collection(collection).where(
            filter=BaseCompositeFilter(
                operator=StructuredQuery.CompositeFilter.Operator.AND,
                filters=filters,
            )
        )
        elements = [element.to_dict() for element in filtered_elements.stream()]
    except ValueError as error:
        logger.error(f"Filter field is not known! {error}")
        return False, None
    except TimeoutError as error:
        logger.error(
            f"Timed out while trying to find entries in {collection}: {str(error)}"
        )
        return False, None

    logger.info(f"Searched elements for collection '{collection}'.")
    return True, elements


def delete(collection: str, document_id: str) -> tuple[int, str]:
    db = firestore.client()
    try:
        db.collection(collection).document(document_id).delete()
    except TimeoutError as error:
        error_message = (
            f"Timed out while trying to delete entry in {collection}: {str(error)}"
        )
        logger.error(error_message)
        return 500, error_message
    logger.info(f"Deleted element wit ID '{document_id}' in collection '{collection}'")
    return 204, None
