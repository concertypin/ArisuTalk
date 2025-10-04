## Deployment overview

This document describes how builds are mapped to public sites (channels), how they are triggered, and which build-time environment variables are provided to the frontend (for example, check `frontend/script/envbuild.js`). Use this as the canonical how-to for tagging / pushing code to publish builds.

### Channels and hostnames

- spark.arisutalk.moe — "Spark" channel
  - Trigger: any commit to `main` branch (CI builds on main produce `spark` channel)

- dev.arisutalk.moe — "Dev" channel
  - Trigger: pushing tags that start with `dev` (for example `dev123`, `dev-2025-10-02`) — CI sets channel `dev` and version from the tag

- arisutalk.moe — "Production" / "Prod" channel
  - Trigger: pushing tags that start with `v` (for example `v1.2.3`) — CI sets channel `prod` and uses the tag to set version name and URL

- *-arisutalk-preview.netlify.app — "PR" channel
  - Trigger: pull request preview builds on Netlify (Netlify provides `NETLIFY` and `COMMIT_REF` environment variables)

Notes
- The concrete hostname used depends on your hosting and DNS configuration. The above entries map the logical channel to the expected public URL patterns used by the project.
