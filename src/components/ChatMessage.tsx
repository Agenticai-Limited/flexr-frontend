import { Message } from '../types';
import logo from '../assets/logo.png';
import { useState, useCallback, useEffect, useRef } from 'react';
import { sendFeedback } from '../services/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { debounce } from 'lodash';

const StreamingIndicator = () => (
    <div className="flex items-center space-x-2">
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-75"></div>
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-150"></div>
    </div>
);

interface ChatMessageProps {
    message: Message;
    userName?: string;
    onUpdateMessage: (messageId: string, updates: Partial<Message>) => void;
}

interface FeedbackState {
    liked?: boolean;
    reason?: string;
}

interface FeedbackStatus {
    type: 'success' | 'error';
    message: string;
}

export const ChatMessage = ({ message, userName = "U", onUpdateMessage }: ChatMessageProps) => {
    const [showFeedbackInput, setShowFeedbackInput] = useState(false);
    const [isSourceExpanded, setIsSourceExpanded] = useState(false);
    const [feedbackStatus, setFeedbackStatus] = useState<FeedbackStatus | null>(null);
    const [feedback, setFeedback] = useState<FeedbackState>({});
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const debouncedSubmit = useCallback(
        debounce(async (messageId: string, liked: boolean, reason?: string) => {
            try {
                const response = await sendFeedback({
                    messageId,
                    liked,
                    reason,
                });

                if (response.status === 'success') {
                    onUpdateMessage(messageId, { feedbackSubmitted: true });
                    setShowFeedbackInput(false);
                    setFeedbackStatus({
                        type: 'success',
                        message: 'Thank you for your feedback!'
                    });
                    if (timeoutRef.current) clearTimeout(timeoutRef.current);
                    timeoutRef.current = setTimeout(() => {
                        setFeedbackStatus(null);
                    }, 3000);
                } else {
                    setFeedbackStatus({
                        type: 'error',
                        message: response.message || 'Failed to submit feedback, please try again later'
                    });
                }
            } catch (error) {
                console.error('Failed to submit feedback:', error);
                setFeedbackStatus({
                    type: 'error',
                    message: 'Failed to submit feedback, please try again later'
                });
            }
        }, 500),
        [onUpdateMessage]
    );

    useEffect(() => {
        return () => {
            debouncedSubmit.cancel();
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [debouncedSubmit]);

    const handleFeedback = (liked: boolean) => {
        setFeedback({ liked });
        setFeedbackStatus(null);
        if (liked) {
            debouncedSubmit(message.id, true);
        } else {
            setShowFeedbackInput(true);
        }
    };

    const submitFeedback = () => {
        if (feedback.liked === undefined) return;

        debouncedSubmit(
            message.id,
            feedback.liked,
            feedback.reason,
        );
    };

    const handleMessageClick = (e: React.MouseEvent) => {
        if (message.onClick) {
            message.onClick(e);
        }
    };

    const sourceRegex = /<details>.*?<summary>\s*Sources?\s*<\/summary>(.*?)<\/details>/s;
    const match = message.content.match(sourceRegex);

    const mainContent = match ? message.content.replace(sourceRegex, '').trim() : message.content;
    const sourceContent = match ? match[1].trim() : null;

    if (message.metadata?.isStreaming) {
        return (
            <div className="flex justify-start">
                <div className="message-bubble assistant max-w-[80%] rounded-lg p-4 shadow-sm">
                    <div className="flex items-center space-x-3">
                        <StreamingIndicator />
                        <div className="text-gray-700">{message.metadata.streamingContent || 'Thinking...'}</div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
                className={`message-bubble ${message.role} max-w-[80%] rounded-lg p-4 shadow-sm ${message.onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
                onClick={handleMessageClick}
            >
                {message.renderHTML ? (
                    <div dangerouslySetInnerHTML={{ __html: mainContent }} />
                ) : (
                    <div className="prose prose-sm max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {mainContent}
                        </ReactMarkdown>
                        {sourceContent && (
                            <div className="mt-3 border-t pt-2">
                                <button
                                    onClick={() => setIsSourceExpanded(!isSourceExpanded)}
                                    className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
                                >
                                    <svg
                                        className={`w-4 h-4 transform transition-transform ${isSourceExpanded ? 'rotate-180' : ''}`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M19 9l-7 7-7-7"
                                        />
                                    </svg>
                                    Source
                                </button>
                                {isSourceExpanded && (
                                    <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {sourceContent}
                                        </ReactMarkdown>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

            {message.optFeedback && !message.feedbackSubmitted && message.metadata?.status && (
                    <div className="mt-3 border-t pt-3">
                        {!showFeedbackInput ? (
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => handleFeedback(true)}
                                    className="text-sm px-3 py-1 rounded-md bg-green-50 text-green-600 hover:bg-green-100"
                                >
                                    👍 Helpful
                                </button>
                                <button
                                    onClick={() => handleFeedback(false)}
                                    className="text-sm px-3 py-1 rounded-md bg-red-50 text-red-600 hover:bg-red-100"
                                >
                                    👎 Not Helpful
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <textarea
                                    placeholder="How could this question have been better answered. Please give an example."
                                    value={feedback.reason || ''}
                                    onChange={(e) => setFeedback(prev => ({ ...prev, reason: e.target.value }))}
                                    className="w-full p-2 text-sm border rounded-md"
                                    rows={2}
                                />
                                <div className="flex space-x-2">
                                    <button
                                        onClick={submitFeedback}
                                        className="text-sm px-3 py-1 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100"
                                    >
                                        Submit
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowFeedbackInput(false);
                                            setFeedbackStatus(null);
                                        }}
                                        className="text-sm px-3 py-1 rounded-md bg-gray-50 text-gray-600 hover:bg-gray-100"
                                    >
                                        Cancel
                                    </button>
                                </div>
                                {feedbackStatus?.type === 'error' && (
                                    <div className="text-sm mt-2 px-3 py-2 rounded-md bg-red-50 text-red-600">
                                        {feedbackStatus.message}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
                {message.feedbackSubmitted && feedbackStatus?.type === 'success' && (
                    <div className="mt-2 text-sm px-4 py-2 rounded-lg bg-green-50 text-green-700">
                        {feedbackStatus.message}
                    </div>
                )}

                <div className="mt-1 text-xs text-gray-400">
                    {message.role === 'user' ? userName : 'Nova'} • {new Date(message.timestamp).toLocaleTimeString()}
                </div>
            </div>
        </div>
    );
};