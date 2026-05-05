"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import FeedbackModal from "./FeedbackModal";

interface FeedbackContextType {
    triggerFeedback: (title?: string, message?: string) => void;
}

const FeedbackContext = createContext<FeedbackContextType | undefined>(undefined);

// Helper: should we show feedback for a given count?
// Shows on the 1st time, then every 5th time after (1, 5, 10, 15...)
const shouldShowFeedback = (count: number) => count === 1 || count % 5 === 0;

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [modalConfig, setModalConfig] = useState({ title: "", message: "" });

    // Called from Generate/Evaluate pages after a feature is used
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

    useEffect(() => {
        // Track website visits (sessions separated by at least 1 hour)
        const trackVisit = () => {
            const lastVisit = localStorage.getItem("last_visit_timestamp");
            const now = Date.now();
            const ONE_HOUR = 60 * 60 * 1000;

            if (!lastVisit || now - parseInt(lastVisit) > ONE_HOUR) {
                let visitCount = parseInt(localStorage.getItem("total_visits") || "0");
                visitCount += 1;
                localStorage.setItem("total_visits", visitCount.toString());
                localStorage.setItem("last_visit_timestamp", now.toString());

                // Show on 1st visit, then every 5th visit
                if (shouldShowFeedback(visitCount)) {
                    setTimeout(() => {
                        setModalConfig({
                            title: visitCount === 1 ? "Welcome to SRS Studio!" : "Enjoying SRS Studio?",
                            message: visitCount === 1
                                ? "We'd love to know what you think on your first visit."
                                : `You've visited us ${visitCount} times! How are we doing?`,
                        });
                        setIsOpen(true);
                    }, 3000);
                }
            }
        };

        trackVisit();
    }, []);

    return (
        <FeedbackContext.Provider value={{ triggerFeedback }}>
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
