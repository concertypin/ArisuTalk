from pymongo import AsyncMongoClient
from pymongo.asynchronous.collection import AsyncCollection
from pymongo.asynchronous.database import AsyncDatabase


class MongoDBConnection[T: dict]:
    _uri: str
    _db_name: str
    _client: AsyncMongoClient | None
    _db: AsyncDatabase[T] | None

    def __init__(self, uri: str, db_name: str) -> None:
        self._uri = uri
        self._db_name = db_name
        self._client = None
        self._db = None

    async def connect(self) -> None:
        self._client = AsyncMongoClient(self._uri)
        await self._client.aconnect()

        self._db = self._client[self._db_name]

    async def close(self) -> None:
        if self._client:
            await self._client.aclose()
            self._client = None
            self._db = None

    async def get_collection(self, collection_name: str) -> AsyncCollection[T]:
        if self._db is None:
            raise Exception("Database connection is not established.")
        return self._db[collection_name]
