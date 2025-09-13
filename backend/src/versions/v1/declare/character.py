from typing import TypedDict

from pydantic import BaseModel, Field

from versions.v1.declare.user import UserPydantic, UserTypedDict

###-------------------------
### Pydantic versions below


class CharacterPydantic(BaseModel):
    name: str
    avatar: str | None = None  # URL to avatar image
    prompt: str
    response_time: int = Field(
        ..., serialization_alias="responseTime", json_schema_extra={"type": "string"}
    )
    thinking_time: int = Field(
        ..., serialization_alias="thinkingTime", json_schema_extra={"type": "string"}
    )
    reactivity: int = Field(..., json_schema_extra={"type": "string"})
    tone: int = Field(..., json_schema_extra={"type": "string"})
    memories: list[str]
    stickers: "list[StickerPydantic]"
    _metadata: "CharacterMetadataPydantic"


class CharacterMetadataPydantic(BaseModel):
    downloaded: int = 0  # Number of times this character has been downloaded
    creator_description: str = Field(..., alias="creatorDescription")
    creator: "UserPydantic"


class StickerPydantic(BaseModel):
    id: int
    name: str
    type: str
    data_url: str = Field(..., alias="dataUrl")
    original_size: int = Field(..., alias="originalSize")
    size: int


#### ------------------------
### TypedDict versions below


class CharacterTypedDict(TypedDict):
    name: str
    avatar: str | None
    prompt: str
    response_time: int
    thinking_time: int
    reactivity: int
    tone: int
    memories: list[str]
    stickers: "list[StickerTypedDict]"
    _metadata: "CharacterMetadataTypedDict"


class CharacterMetadataTypedDict(TypedDict):
    downloaded: int
    creator_description: str
    creator: "UserTypedDict"


class StickerTypedDict(TypedDict):
    id: int
    name: str
    type: str
    data_url: str
    original_size: int
    size: int
