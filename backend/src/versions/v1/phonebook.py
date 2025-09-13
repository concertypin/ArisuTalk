import os
from contextlib import asynccontextmanager
from enum import Enum

import bson
import fastapi
import fastapi.security as fastsec
import pymongo
from pydantic import BaseModel

from versions.v1.declare.character import CharacterTypedDict
from versions.v1.declare.user import UserTypedDict
from versions.v1.persistence.primal.mongo import (AsyncCollection,
                                                  MongoDBConnection)

db: MongoDBConnection
col: "AsyncCollection[CharacterTypedDict]"
user_col: "AsyncCollection[UserTypedDict]"
PAGE_SIZE = 20

@asynccontextmanager
async def lifespan(app: fastapi.FastAPI):
    # on startup
    global db, col,user_col
    db = MongoDBConnection(os.environ["CONNECTION_STRING"], os.environ["DATABASE_NAME"])
    await db.connect()
    col = await db.get_collection("PhonebookCol")
    user_col = await db.get_collection("UsersCol")

    yield
    # on shutdown

    await db.close()


router = fastapi.APIRouter(lifespan=lifespan, tags=["Phonebook"])


class PhonebookEntry(BaseModel):
    name: str
    description: str  # This is kind of brief, limited up to 300 characters
    id: str  # Database ID
    creator_name: str # Human-readable

class SortByQueryOption(Enum):
    newest = "newest"
    im_feeling_lucky = "im_feeling_lucky"  # Random order
    most_popular = "most_popular"  # Most popular entries


@router.get("/", summary="Get phonebook list")
async def read_phonebook(
    page: int, sort_by: SortByQueryOption | None = None
) -> list[PhonebookEntry]:
    """
    Get a list of phonebook entries.

    Args:
        page (int): Page number (1-indexed).
        sort_by (SortByQueryOption, optional): Sorting option. Defaults to None, which collects without specific order.
    """
    if page < 1:
        raise fastapi.HTTPException(
            status_code=400, detail="Page number must be at least 1"
        )
    skip = (page - 1) * PAGE_SIZE

    if sort_by == SortByQueryOption.newest:
        cursor = col.find().sort("_id", -1).skip(skip).limit(PAGE_SIZE)

    elif sort_by == SortByQueryOption.im_feeling_lucky:
        cursor = await col.aggregate([{"$sample": {"size": PAGE_SIZE}}])

    elif sort_by == SortByQueryOption.most_popular:
        cursor = col.find().sort("_metadata.downloaded", -1).skip(skip).limit(PAGE_SIZE)

    elif sort_by is None:
        # No specific order, let DB choose
        cursor = col.find().skip(skip).limit(PAGE_SIZE)
    else:
        # pyright: ignore[reportUndefinedVariable]
        raise fastapi.HTTPException(status_code=400, detail="Invalid sort_by option")

    return [
        PhonebookEntry(
            name=i.get("name"),
            description=i.get("_metadata")["creator_description"],
            id=str(i.get("_id")),
        )
        async for i in cursor
    ]


@router.get("/{entry_id}", summary="Get phonebook entry by ID")
async def read_phonebook_entry(entry_id: str) -> PhonebookEntry | None:
    """
    Get a phonebook entry by its ID.

    Args:
        entry_id (str): The ID of the phonebook entry.

    Returns:
        PhonebookEntry | None: The phonebook entry if found, otherwise None.
    """
    document = await col.find_one({"_id": bson.ObjectId(entry_id)})
    if document is None:
        return None
    creator_id=document.get("_metadata")["creator"]
    creator=await user_col.find_one({"_id":creator_id})

    return PhonebookEntry(
        name=document.get("name"),
        description=document.get("_metadata")["creator_description"],
        id=str(document.get("_id")),
        creator_name=
    )


@router.post("/{entry_id}/download", summary="Download character from phonebook")
async def download_character(entry_id: str) -> CharacterModel | None:
    """
    Download a character from the phonebook by its ID.

    Args:
        entry_id (str): The ID of the phonebook entry.
    Returns:
        CharacterModel | None: The character model if found, otherwise None.
    """
    return await col.find_one_and_update(
        {"_id": bson.ObjectId(entry_id)}, {"$inc": {"_metadata.downloaded": 1}}
    )


@router.delete("/{entry_id}", summary="Delete phonebook entry by ID")
async def delete_phonebook_entry(
    entry_id: str,
    token: fastsec.HTTPAuthorizationCredentials = fastapi.Depends(
        fastsec.HTTPBearer(auto_error=True)
    ),
) -> bool:
    """
    Delete a phonebook entry by its ID.

    Args:
        entry_id (str): The ID of the phonebook entry.
        token (HTTPAuthorizationCredentials): Authorization credentials from request header.

    Returns:
        bool: True if the entry was deleted, otherwise False.
    """
    # You can access the token string with token.credentials
    target = await col.find_one({"_id": bson.ObjectId(entry_id)})
