from abc import ABC, abstractmethod
from typing import Literal, Self, TypedDict


class Identity(ABC):
    """
    Represents a user identity.
    """

    @property
    @abstractmethod
    def uid(self) -> str:
        """
        The unique identifier for the identity.
        """
        raise NotImplementedError

    @property
    @abstractmethod
    def name(self) -> str:
        """
        The name which user wants to be called as.
        """
        raise NotImplementedError

    @property
    @abstractmethod
    def mail(self) -> str | None:
        """
        The email address of the identity, if available.
        """
        raise NotImplementedError

    @property
    @abstractmethod
    def token(self) -> str:
        """
        The token associated with the identity.
        """
        raise NotImplementedError

    @abstractmethod
    def check(self) -> bool:
        """
        Checks if the identity is valid.

        Returns:
            bool: True if the identity is valid, otherwise False.
        """
        raise NotImplementedError


class Authenticator(ABC):
    """
    Authenticates an identity.
    """

    @abstractmethod
    async def authenticate(self, token: str) -> Identity | None:
        """
        Authenticates a user using a token.

        Args:
            token: The token to authenticate.

        Returns:
            The identity if the token is valid, otherwise None.
        """
        raise NotImplementedError
