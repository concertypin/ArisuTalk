from typing import TypedDict

from bson import ObjectId
from pydantic import BaseModel


class UserTypedDict(TypedDict):
    _id: ObjectId
    name: str
    authenticated: str


class UserPydantic(BaseModel):
    _id: ObjectId  # Generated from database ObjectId
    name: str
    authenticated: str  # Generated from authenticated uid
