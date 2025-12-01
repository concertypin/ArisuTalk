/**
 * @fileoverview Platform-specific utilities and configurations.
 * This file is intended to be customized based on the deployment environment.
 * Platform-specific code should only be included here.
 */

import type { RuntimeSecret, RuntimeVariable } from "@/types";

export type Bindings = {
    Bindings: RuntimeSecret & RuntimeVariable;
};
