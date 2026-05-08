"use client";

import React, { createContext, useContext, useState } from "react";
import FeedbackModal from "./FeedbackModal";

interface FeedbackContextType {
    triggerFeedback: (title?: string, message?: string) => void;
    openFeedback: (title?: string, message?: string) => void;
}

const FeedbackContext = createContext<FeedbackContextType | undefined>(undefined);

// Helper: should we show feedback for a given count?
// Shows on the 1st time, then every 5th time after (1, 5, 10, 15...)
const shouldShowFeedback = (count: number) => count === 1 || count % 5 === 0;

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [modalConfig, setModalConfig] = useState({ title: "", message: "" });

    // Called from Generate/Evaluate pages after the generate button is used
    const triggerFeedback = (title?: string, message?: string) => {
        let featureCount = parseInt(localStorage.getItem("feature_use_count") || "0");
        featureCount += 1;
        localStorage.setItem("feature_use_count", featureCount.toString());

        if (shouldShowFeedback(featureCount)) {
            setModalConfig({
                title: title || "We value your feedback!",
                message: message || "How is your experience with SRS Studio so far?",
            });
            setTimeout(() => setIsOpen(true), 2000);
        }
    };

    // Called directly (e.g. sidebar button) — shows immediately, no counter gate
    const openFeedback = (title?: string, message?: string) => {
        setModalConfig({
            title: title || "We value your feedback!",
            message: message || "How is your experience with SRS Studio so far?",
        });
        setIsOpen(true);
    };

    return (
        <FeedbackContext.Provider value={{ triggerFeedback, openFeedback }}>
            {children}
            <FeedbackModal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                title={modalConfig.title || undefined}
                message={modalConfig.message || undefined}
            />
        </FeedbackContext.Provider>
    );
}

export const useFeedback = () => {
    const context = useContext(FeedbackContext);
    if (!context) {
        throw new Error("useFeedback must be used within a FeedbackProvider");
    }
    return context;
};
