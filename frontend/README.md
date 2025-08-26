# ArisuTalk Frontend

This is the frontend component of the ArisuTalk AI chat application.

## Developer's guide
- Use JSDoc. Migration to TypeScript is planned.
  - Don't use only `Object` type. Define proper type or interface.
  - You can use .d.ts files too.
- Make `id` element. It could be used by plugins.
- Try to keep your code up to 300 lines.
- Keep `async` in function declaration even if it can be omitted.
- Avoid using HTML string in JS file.
- Use JSDoc. Said twice for emphasis.

## How to Start Server

```bash
git clone https://github.com/concertypin/ArisuTalk
cd ArisuTalk/frontend
pnpm i
pnpm dev
```

### License
이 프로젝트는 Apache License 2.0 라이선스를 따릅니다. 포크 이전에 생성된 커밋에 대해서는 CC BY-NC 4.0 라이선스를 따릅니다.
자세한 내용은 ../LICENSE 파일과 NOTICE 파일을 참고하세요.
