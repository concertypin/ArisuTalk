ArisuTalk can use some files to import/export characters or other data.

### .arisc: Character Contact File

This is a custom file format used by ArisuTalk to store character data, including metadata and associated assets. It's deflated, CBOR-encoded data. Inner schema is described [here](https://github.com/arisutalk/character-spec).
Character contact files is intended to be shared between users, so it usually contains all the necessary data to use the character in another instance of ArisuTalk. When exporting a character, ArisuTalk will package all local assets (like images and audio files) into the `.arisc` file by converting them to base64-encoded data URLs.

> [!NOTE]
> Usually, `.arisc` files doesn't have chat history, inlay data, or other user-specific data.
> But it may contain it and ArisuTalk will import them if present.

This is actually same as [Character Dump File](#arisp-character-dump-file), and `.arisc` files can be used where `.arisp` files are accepted. The only difference is the intended use case.

### .arisp: Character Dump File

This is a custom file format used by ArisuTalk to store character data for backup purposes. Check out [character contract file](#arisc-character-contact-file) for more details about the inner schema.
Its main purpose is "describe as-is" dump of a character, so when exporting a character, ArisuTalk will reference local assets as file paths instead of embedding them as base64-encoded data URLs. Also, chat history and inlay data are included by default.

### .arisi: Instruction Preset

This is a custom file format used by ArisuTalk to store instruction presets for AI. Not documented yet, not used yet.
