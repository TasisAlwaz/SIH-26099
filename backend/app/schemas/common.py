from typing import Generic, TypeVar, List
from enum import Enum
from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class MatchRelationship(str, Enum):
    IDENTICAL = "IDENTICAL"
    DUPLICATE = "DUPLICATE"
    NEAR_DUPLICATE = "NEAR_DUPLICATE"
    FUNCTIONALLY_EQUIVALENT = "FUNCTIONALLY_EQUIVALENT"
    NOT_EQUIVALENT = "NOT_EQUIVALENT"


class ApprovalStatus(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    MODIFIED = "MODIFIED"


class MaterialStatus(str, Enum):
    STANDARDIZED = "STANDARDIZED"
    PENDING_REVIEW = "PENDING_REVIEW"
    UNMATCHED = "UNMATCHED"
    FLAGGED = "FLAGGED"


class BaseSchema(BaseModel):
    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
        alias_generator=to_camel,
    )


T = TypeVar("T")


class PaginatedResponse(BaseModel, Generic[T]):
    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
        alias_generator=to_camel,
    )
    items: List[T]
    total: int
    page: int
    page_size: int
    total_pages: int

