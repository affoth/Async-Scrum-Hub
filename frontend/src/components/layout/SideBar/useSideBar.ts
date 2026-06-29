import { useState } from "react";
import { getLegalDocument } from "../../../services/api";
import type { LegalDocuments } from "../../../types/api.types"
type APIError = {
	error?: { code?: string; message?: string };
	detail?: Array<{ msg: string }>;
};

export function useSideBar() {
	//View/UI states
	const [document, setDocument] = useState<LegalDocuments | null>(null);
	const [activeDocument, setActiveDocument] = useState< "privacy" | "terms" | null>(null);
	//Auth states
	const [errors, setErrors] = useState<{doc?: string}>({});
	//Communication states
	const [isLoading, setIsLoading] = useState(false);
	//Routing states

	const openDocument = async (key: "privacy" | "terms" ) => {
		setActiveDocument(key);
		setIsLoading(true);
		setErrors({});

		try {
			const doc = await getLegalDocument(key);
			setDocument(doc);
		} catch (error: unknown) {
			const apiError = error as APIError;
			
			console.error("Failed to load document:", error);
			if (apiError.error?.code === "NOT_FOUND") {
				setErrors({ doc: "Legal document not found" });
			} else {
				setErrors({ doc: "Something went wrong" });
			}
		} finally {
			setIsLoading(false);
		}
	};

	const closeDocument = () => {
		setActiveDocument(null);
		setDocument(null);
	}

	return {
		// state
		document,
		activeDocument,
		isLoading,
		errors,

		// handlers
		openDocument,
		closeDocument,
	};
}
