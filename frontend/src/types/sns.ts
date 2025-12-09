export type AffectionState = {
	affection: number;
	intimacy: number;
	trust: number;
	romantic_interest: number;
};

export type SNSPost = {
	id: string;
	type?: string;
	content?: string;
	caption?: string; // Used as fallback for content in some components
	timestamp: string | number; // timestamp in generic sense
	likes: number;
	comments: number;
	affection_state?: AffectionState;
	access_level?: string;
	accessLevel?: string; // Used in UI components
	importance?: number;
	tags?: string[];
	reason?: string;
	image?: string;
	stickerId?: string;
	isSecret?: boolean; // Used in SNSPostModal
	isNew?: boolean; // Used in SNSPostModal
};
