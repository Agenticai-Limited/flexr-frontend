import { Message } from '../types';
import logo from '../assets/logo.png';
import { useState } from 'react';
import { sendFeedback } from '../services/api';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ChatMessageProps {
    message: Message;
    userName?: string;
}

interface FeedbackState {
    liked?: boolean;
    reason?: string;
    submitted: boolean;
}

export const ChatMessage = ({ message, userName = "U" }: ChatMessageProps) => {
    const [feedback, setFeedback] = useState<FeedbackState>({ submitted: false });
    const [showFeedbackInput, setShowFeedbackInput] = useState(false);
    const [isSourceExpanded, setIsSourceExpanded] = useState(false);

    const handleFeedback = async (liked: boolean) => {
        setFeedback(prev => ({ ...prev, liked }));
        setShowFeedbackInput(true);
    };

    const submitFeedback = async () => {
        if (feedback.liked === undefined) return;

        try {
            await sendFeedback({
                messageId: message.id,
                liked: feedback.liked,
                reason: feedback.reason,
                content: message.content,
                metadata: message.metadata,
            });
            setFeedback(prev => ({ ...prev, submitted: true }));
            setShowFeedbackInput(false);
        } catch (error) {
            console.error('Failed to submit feedback:', error);
        }
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

                {message.optFeedback && !feedback.submitted && (
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
                                    placeholder="Tell us why... (optional)"
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
                                        onClick={() => setShowFeedbackInput(false)}
                                        className="text-sm px-3 py-1 rounded-md bg-gray-50 text-gray-600 hover:bg-gray-100"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div className="mt-1 text-xs text-gray-400">
                    {message.role === 'user' ? userName : 'Nova'} • {new Date(message.timestamp).toLocaleTimeString()}
                </div>
            </div>
        </div>
    );
};