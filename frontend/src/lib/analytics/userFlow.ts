/**
 * Utility helpers for logging sanitized user-flow analytics events.
 */
import { trackEvent } from "../stores/firebaseAnalytics";
import type { AnalyticsEventPayload } from "../services/firebaseAnalytics";

type DeviceType = "mobile" | "desktop";

type PhonebookAccessStatePayload = "enabled" | "disabled" | "unknown";

type PhonebookAccessBlockedReason = "auth_required" | "disabled" | "unknown";

type PhonebookRetryReason = "error" | "empty" | "manual";

type PhonebookImportError = "not_signed_in" | "unknown";

type ChatSelectionKind = "existing_single" | "existing_multiple" | "new_chat";

type CharacterModalMode = "edit" | "create";

type UserFlowEventMap = {
	app_initialized: {
		device_type: DeviceType;
		chat_room_count: number;
		active_chat: boolean;
	};
	chat_created: {
		device_type: DeviceType;
		rooms_before: number;
	};
	chat_selected: {
		device_type: DeviceType;
		existing_room_count: number;
		selection_kind: ChatSelectionKind;
	};
	mobile_character_select: {
		has_existing_rooms: boolean;
		room_count: number;
	};
	sns_feed_opened: {
		device_type: DeviceType;
	};
	character_modal_opened: {
		device_type: DeviceType;
		mode: CharacterModalMode;
	};
	phonebook_opened: {
		auth_status: "signed_in" | "guest";
		access_state: PhonebookAccessStatePayload;
	};
	phonebook_access_blocked: {
		reason: PhonebookAccessBlockedReason;
	};
	phonebook_import_attempt: {
		encrypted: boolean;
	};
	phonebook_import_result: {
		outcome: "success" | "failure";
		encrypted: boolean;
		error_type?: PhonebookImportError;
	};
	phonebook_retry: {
		reason: PhonebookRetryReason;
	};
};

export type UserFlowEventName = keyof UserFlowEventMap;

export type UserFlowEventPayload<Name extends UserFlowEventName> =
	UserFlowEventMap[Name];

/**
 * Sanitize event payload values before forwarding to Firebase Analytics.
 *
 * @param {AnalyticsEventPayload} payload Analytics payload candidate.
 * @returns {AnalyticsEventPayload} Sanitized payload without nullish entries.
 */
function sanitizePayload(
	payload: AnalyticsEventPayload,
): AnalyticsEventPayload {
	return Object.fromEntries(
		Object.entries(payload).filter(
			([, value]) => value !== undefined && value !== null,
		),
	);
}

/**
 * Log a pre-defined user-flow analytics event. Only safe metadata is captured.
 *
 * @param {UserFlowEventName} name Event identifier.
 * @param {UserFlowEventPayload<Name>} payload Event payload adhering to the schema.
 * @returns {Promise<void>} Completion promise when the analytics log resolves.
 */
export async function logUserFlowEvent<Name extends UserFlowEventName>(
	name: Name,
	payload: UserFlowEventPayload<Name>,
): Promise<void> {
	const sanitized = sanitizePayload(payload);
	await trackEvent(`flow_${name}`, sanitized);
}
