# Dedicated Server Storage API Specification

This document outlines the REST API endpoints expected by the `Server*Adapter` implementations.
The base URL is assumed to be `http://localhost:3000`.

## Assets

### `POST /assets`
Uploads a new asset.
- **Request:** `multipart/form-data` with `file` field.
- **Query Params:** `name` (optional)
- **Response:** JSON `{ "id": "local://server/filename.ext" }` (The ID is a URL)

### `GET /assets/:filename`
Retrieves an asset file.
- **Response:** Binary file content.

## Characters

### `GET /characters`
Retrieves all characters.
- **Response:** JSON array of `Character` objects.

### `GET /characters/:id`
Retrieves a specific character.
- **Response:** JSON `Character` object.

### `POST /characters`
Creates or updates a character.
- **Request:** JSON `Character` object.
- **Response:** 200 OK.

### `DELETE /characters/:id`
Deletes a character.
- **Response:** 200 OK.

## Chats

### `GET /chats`
Retrieves all chats.
- **Response:** JSON array of `LocalChat` objects.

### `GET /chats/:id`
Retrieves a specific chat.
- **Response:** JSON `LocalChat` object.

### `POST /chats`
Creates a new chat.
- **Request:** JSON `{ "characterId": "...", "title": "..." }`
- **Response:** JSON `{ "id": "..." }`

### `DELETE /chats/:id`
Deletes a chat.
- **Response:** 200 OK.

### `GET /chats/:id/messages`
Retrieves messages for a chat.
- **Response:** JSON array of `Message` objects.

### `POST /chats/:id/messages`
Adds a message to a chat.
- **Request:** JSON `Message` object.
- **Response:** 200 OK.

### `PUT /chats/:id/messages/:messageId`
Updates a message.
- **Request:** JSON `{ "content": ... }`
- **Response:** 200 OK.

### `DELETE /chats/:id/messages/:messageId`
Deletes a message.
- **Response:** 200 OK.

## Personas

### `GET /personas`
Retrieves all personas.
- **Response:** JSON array of `Persona` objects.

### `POST /personas`
Creates or updates a persona.
- **Request:** JSON `Persona` object.
- **Response:** 200 OK.

### `PUT /personas/:id`
Updates a persona.
- **Request:** JSON `Persona` object.
- **Response:** 200 OK.

### `DELETE /personas/:id`
Deletes a persona.
- **Response:** 200 OK.

### `GET /personas/active`
Gets the active persona ID.
- **Response:** JSON `{ "id": "..." }` or `{ "id": null }`

### `PUT /personas/active`
Sets the active persona ID.
- **Request:** JSON `{ "id": "..." }`
- **Response:** 200 OK.

## Settings

### `GET /settings`
Retrieves application settings.
- **Response:** JSON `Settings` object.

### `POST /settings`
Saves application settings.
- **Request:** JSON `Settings` object.
- **Response:** 200 OK.
