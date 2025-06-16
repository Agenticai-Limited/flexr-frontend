import { useState, useEffect, useRef } from 'react';
import { debounce } from 'lodash';
import { Message, UserInfo, UploadedFile, ServiceType } from '../types';
import { startQaTask, BASE_URL } from '../services/api';
import { ChatMessage } from './ChatMessage';
import { LoadingIndicator } from './LoadingIndicator'
import { ChatbotIdentity } from './ChatbotIdentity'
import { v4 as uuidv4 } from 'uuid';
import logo from '../assets/logo.png';

const STORAGE_KEY = 'qa_chat_messages';

interface QAChatInterfaceProps {
    userInfo: UserInfo;
}

const commonQuestions = [
    "Can I change my bank account details?",
    "Can I change my payment date?",
    "Can I change my payment period?",
    "Can I add a new authority to the account?",
    "What information do you hold about me?",
    "Is my account active?",
    "Can I get my bond refunded?",
    "Do you mind us asking why you are thinking of closing your account?",
    "How do I order a new card?",
    "Can I order another card?",
    "Can I cancel a card?",
    "Can I suspend my card?",
    "Can the courier leave my card without a signature?",
    "How long will my card take to arrive?",
    "Why has my card not arrived?",
    "Can I use my card straight away?",
    "What is the limit on my card?",
    "Can I change the card limit?",
    "Can we preload the card?",
    "Why is my card not working?",
    "Why did my card decline?",
    "Can you replace my card?",
    "What is my pin?"
];

export const QAChatInterface = ({ userInfo }: QAChatInterfaceProps) => {
    const [messages, setMessages] = useState<Message[]>(() => {
        const savedMessages = sessionStorage.getItem(STORAGE_KEY);
        if (savedMessages) {
            return JSON.parse(savedMessages);
        }

        const welcomeMessage: Message = {
            id: Date.now().toString(),
            role: 'assistant',
            content: `Welcome to Nova Assistant! 👋\n\nHow can I help you today?`,
            timestamp: new Date().toISOString(),
        };
        return [welcomeMessage];
    });

    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showCommonQuestions, setShowCommonQuestions] = useState(true);
    const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
    const [displayedQuestions, setDisplayedQuestions] = useState<string[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const eventSourceRef = useRef<EventSource | null>(null);

    // Auto scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }, [messages]);

    useEffect(() => {
        const shuffledQuestions = [...commonQuestions].sort(() => 0.5 - Math.random());
        setDisplayedQuestions(shuffledQuestions.slice(0, 5));
        // setShowCommonQuestions(false);
    }, []);

    useEffect(() => {
        return () => {
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
            }
        };
    }, []);


    const handleQuestionClick = debounce((question: string) => {
        setInputMessage(question);
        handleSendMessage({ preventDefault: () => { } } as React.FormEvent, question);
    }, 300);

    const handleSendMessage = async (e: React.FormEvent, messageContent?: string) => {
        setShowCommonQuestions(false);
        e.preventDefault();
        const currentMessage = messageContent || inputMessage.trim();
        if (!currentMessage && !uploadedFile?.url) return;

        setIsLoading(true);

        const userMessageContent = currentMessage;
        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: userMessageContent,
            timestamp: new Date().toISOString(),
        };

        const assistantMessageId = (Date.now() + 1).toString();
        const assistantMessage: Message = {
            id: assistantMessageId,
            role: 'assistant',
            content: 'Thinking...',
            timestamp: new Date().toISOString(),
            optFeedback: true,
            metadata: {
                isStreaming: true,
                streamingContent: 'Seeking the best answer...',
            }
        };

        setMessages((prev) => [...prev, userMessage, assistantMessage]);
        setInputMessage('');

        try {
            const { message_id } = await startQaTask({
                query: userMessageContent,
                file_path: uploadedFile?.url || '',
            });

            setMessages(prev => prev.map(msg =>
                msg.id === assistantMessageId
                    ? { ...msg, id: message_id }
                    : msg
            ));

            const eventSource = new EventSource(`${BASE_URL}/api/task-progress/${message_id}`);
            eventSourceRef.current = eventSource;

            eventSource.onmessage = (event) => {
                const data = JSON.parse(event.data);

                if (data.type === 'error') {
                    console.error('SSE Error:', data.message);
                    setMessages(prev => prev.map(msg =>
                        msg.id === message_id
                            ? { ...msg, content: "Service not available. Please try again later.", metadata: { isStreaming: false } }
                            : msg
                    ));
                    setIsLoading(false);
                    eventSource.close();
                    return;
                }

                if (data.stage === 'end') {
                    const finalText = data.message;
                    // First, mark the message as no longer streaming and clear content
                    setMessages(prev => prev.map(msg =>
                        msg.id === message_id
                            ? { ...msg, content: '', metadata: { isStreaming: false } }
                            : msg
                    ));

                    setIsLoading(false);
                    setMessages(prev => prev.map(msg =>
                        msg.id === message_id
                            ? { ...msg, content: finalText }
                            : msg
                    ));
                    // typing effect
                    // let i = 0;
                    // const typingInterval = setInterval(() => {
                    //     if (i < finalText.length) {
                    //         setMessages(prev => prev.map(msg =>
                    //             msg.id === assistantMessageId
                    //                 ? { ...msg, content: finalText.slice(0, i + 1) }
                    //                 : msg
                    //         ));
                    //         i++;
                    //     } else {
                    //         clearInterval(typingInterval);
                    //         setIsLoading(false);
                    //     }
                    // }, 20); // Typing speed in ms

                    eventSource.close();
                } else {
                    setMessages(prev => prev.map(msg =>
                        msg.id === assistantMessageId
                            ? { ...msg, metadata: { ...msg.metadata, streamingContent: data.status } }
                            : msg
                    ));
                }
            };

            eventSource.onerror = () => {
                console.error('SSE connection error.');
                setMessages(prev => prev.map(msg =>
                    msg.id === message_id
                        ? { ...msg, content: "Service not available. Please try again later.", metadata: { isStreaming: false } }
                        : msg
                ));
                setIsLoading(false);
                eventSource.close();
            };

        } catch (err: any) {
            console.error('Failed to start task:', err.message);
            setMessages(prev => prev.map(msg =>
                msg.id === assistantMessageId
                    ? { ...msg, content: "Failed to start the task. Please try again.", metadata: { isStreaming: false } }
                    : msg
            ));
            setIsLoading(false);
        }
    };

    // const handleQuestionClick = (question: string) => {
    //     setInputMessage(question);
    // };

    const handleFileUploaded = (file: UploadedFile) => {
        console.log('File uploaded:', file);

        setUploadedFile(file);
        setMessages((prev) => [
            ...prev,
            {
                id: Date.now().toString(),
                role: 'user',
                content: file.thumbnailUrl ?
                    `<div>
                        <img src="${file.thumbnailUrl}" alt="${file.name}" style="max-width: 80px;" />
                        <div className="text-sm text-gray-500">${file.name}</div>
                    </div>` :
                    `<div>
                        <img src="${file.base64}" alt="${file.name}" style="max-width: 300px;" />
                    </div>`,
                timestamp: new Date().toISOString(),
                renderHTML: true,
            },
        ]);
    };

    return (
        <div className="flex flex-col h-screen bg-gradient-to-b from-primary-50 to-white">

            <div className="flex-1 flex flex-col min-w-0 bg-white shadow-soft overflow-hidden">
                <ChatbotIdentity name="Nova" logoUrl={logo} />

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50 to-white chat-container">
                    {messages.map((message) => (
                        <ChatMessage key={message.id} message={message} userName={userInfo.name} />
                    ))}
                    {isLoading && <LoadingIndicator chatbotName="Nova Assistant" />}
                    <div ref={messagesEndRef} /> {/* Scroll anchor */}
                </div>

                {/* FAQ Section */}
                {showCommonQuestions && (<div className="px-4 pt-2 pb-1 border-t border-gray-100">
                    <h3 className="text-left text-sm font-semibold text-gray-600 mb-3">Frequently Asked Questions</h3>
                    <div className="flex flex-wrap gap-2">
                        {displayedQuestions.map((question, index) => (
                            <button
                                key={index}
                                onClick={() => handleQuestionClick(question)}
                                className="px-3 py-1 text-xs font-medium text-primary-600 bg-primary-50 rounded-full hover:bg-primary-100 transition-colors"
                            >
                                {question}
                            </button>
                        ))}
                    </div>
                </div>)}

                {/* Input Area - keeping original styles */}
                <div className="p-4 border-t border-gray-100 bg-white">
                    <div className="flex items-end space-x-4">
                        {/* <FileUpload onFileUploaded={handleFileUploaded} /> */}
                        <form onSubmit={handleSendMessage} className="flex-1 flex space-x-2">
                            <input
                                type="text"
                                value={inputMessage}
                                onChange={(e) => setInputMessage(e.target.value)}
                                placeholder="Type your message..."
                                className="flex-1 rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm transition-colors"
                                disabled={isLoading}
                            />
                            <button
                                type="submit"
                                disabled={isLoading || !(inputMessage.trim() || uploadedFile?.url)}
                                className="inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-[#0B93F6] hover:bg-[#0A84DD] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0B93F6] disabled:opacity-50 transition-all duration-150 ease-in-out"
                            >
                                {isLoading ? (
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : null}
                                {isLoading ? 'Sending...' : 'Send'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};