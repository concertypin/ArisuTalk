import os
from typing import TypedDict

from bson import ObjectId
from pymongo.asynchronous.collection import AsyncCollection

from versions.v1.declare.user import UserTypedDict
from versions.v1.persistence.primal.mongo import MongoDBConnection

db: MongoDBConnection
user_col: "AsyncCollection[UserTypedDict]"


async def init():
    global db, user_col
    db = MongoDBConnection(os.environ["CONNECTION_STRING"], os.environ["DATABASE_NAME"])
    await db.connect()
    user_col = await db.get_collection("users")


async def get_user(user_id: ObjectId) -> UserTypedDict | None:
    return await user_col.find_one({"_id": user_id})


async def create_user(user: UserTypedDict) -> ObjectId:
    result = await user_col.insert_one(user)
    return result.inserted_id
