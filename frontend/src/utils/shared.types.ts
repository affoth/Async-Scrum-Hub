export type APIError = {
	detail?: {
		error?: {
			code?: string;
			message?: string;
		};
	};
	error?: {
		code?: string;
		message?: string;
	};
};
