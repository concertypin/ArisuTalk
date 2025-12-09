export type AccessLevel =
    | "main-public"
    | "main-private"
    | "secret-public"
    | "secret-private"
    | "public"
    | "private"
    | "secretPublic"
    | "secretPrivate";

export interface Requirement {
    affection: number;
    intimacy: number;
    trust: number;
    romantic_interest: number;
}

export const requirements: Record<AccessLevel, Requirement> = {
    "main-public": {
        affection: 0,
        intimacy: 0,
        trust: 0,
        romantic_interest: 0,
    },
    "main-private": {
        affection: 0.5,
        intimacy: 0.5,
        trust: 0.5,
        romantic_interest: 0,
    },
    "secret-public": {
        affection: 0.7,
        intimacy: 0.7,
        trust: 0.7,
        romantic_interest: 0.4,
    },
    "secret-private": {
        affection: 0.9,
        intimacy: 0.9,
        trust: 0.9,
        romantic_interest: 0.9,
    },
    public: { affection: 0, intimacy: 0, trust: 0, romantic_interest: 0 },
    private: {
        affection: 0.75,
        intimacy: 0.6,
        trust: 0.8,
        romantic_interest: 0.5,
    },
    secretPublic: {
        affection: 0.7,
        intimacy: 0.7,
        trust: 0.7,
        romantic_interest: 0.4,
    },
    secretPrivate: {
        affection: 0.9,
        intimacy: 0.9,
        trust: 0.9,
        romantic_interest: 0.9,
    },
};

export interface SNSCharacter {
    hypnosis?: {
        enabled?: boolean;
        sns_full_access?: boolean;
        secret_account_access?: boolean;
        [key: string]: any;
    };
    [key: string]: any;
}

export interface SNSCharacterState {
    affection?: number;
    intimacy?: number;
    trust?: number;
    romantic_interest?: number;
    [key: string]: any;
}

export function checkSNSAccess(
    character: SNSCharacter,
    accessLevel: string,
    characterState: SNSCharacterState | null,
): boolean {
    const state = characterState || {
        affection: 0.2,
        intimacy: 0.2,
        trust: 0.2,
        romantic_interest: 0,
    };
    const hypnosis = character.hypnosis || {};

    if (hypnosis.enabled) {
        if (hypnosis.sns_full_access) {
            return true;
        }
        if (accessLevel.includes("secret") && hypnosis.secret_account_access) {
            return true;
        }
    }

    if (accessLevel === "main-public" || accessLevel === "public") {
        return true;
    }

    const level = accessLevel as AccessLevel;
    const required = requirements[level] || requirements.public;

    const hasAccess =
        (state.affection || 0) >= required.affection &&
        (state.intimacy || 0) >= required.intimacy &&
        (state.trust || 0) >= required.trust &&
        (state.romantic_interest || 0) >= required.romantic_interest;

    return hasAccess;
}
