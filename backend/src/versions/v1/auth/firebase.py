import firebase_admin
from firebase_admin import auth, credentials
from firebase_admin.auth import (
    ExpiredIdTokenError,
    InvalidIdTokenError,
    RevokedIdTokenError,
    UserNotFoundError,
)

from .identity import Authenticator, Identity


class FirebaseIdentity(Identity):
    """
    Represents a user identity from Firebase.
    """

    _user_record: auth.UserRecord
    _token: str

    def __init__(self, user_record: auth.UserRecord, token: str):
        self._user_record = user_record
        self._token = token

    @property
    def uid(self) -> str:
        # It is absolutely guaranteed that uid is not None.
        # It is cause Firebase library doesn't typed it properly.
        return self._user_record.uid  # type: ignore

    @property
    def name(self) -> str:
        return self._user_record.display_name or "Unknown"

    @property
    def mail(self) -> str | None:
        return self._user_record.email

    @property
    def token(self) -> str:
        return self._token

    def check(self) -> bool:
        try:
            auth.verify_id_token(self.token, check_revoked=True)
            return True
        except UserNotFoundError:
            return False


class FirebaseAuthenticator(Authenticator):
    """
    Authenticates a user using Firebase.
    """

    def __init__(self):
        if not firebase_admin._apps:
            # GOOGLE_APPLICATION_CREDENTIALS environment variable must be set.
            cred = credentials.ApplicationDefault()
            firebase_admin.initialize_app(cred)

    async def authenticate(self, token: str) -> Identity | None:
        try:
            decoded_token = auth.verify_id_token(token)

            # Check the provider
            provider = decoded_token.get("firebase", {}).get("sign_in_provider")
            if provider not in ["google.com", "github.com"]:
                return None

            uid = decoded_token["uid"]
            user_record = auth.get_user(uid)
            return FirebaseIdentity(user_record, token)
        except (
            ValueError,
            ExpiredIdTokenError,
            InvalidIdTokenError,
            RevokedIdTokenError,
            UserNotFoundError,
        ):
            return None
