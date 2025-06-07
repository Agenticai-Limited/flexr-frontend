import { useState, useEffect, useRef } from 'react';
import { Message, UserInfo, UploadedFile } from '../types';
import { startQaTask, BASE_URL } from '../services/api';
import { ChatMessage } from './ChatMessage';
import { LoadingIndicator } from './LoadingIndicator'
import { ChatbotIdentity } from './ChatbotIdentity'
import logo from '../assets/logo.png';

interface QAChatInterfaceProps {
    userInfo: UserInfo;
}

export const QAChatInterface = ({ userInfo }: QAChatInterfaceProps) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);

    // Add a ref to hold the EventSource instance
    const eventSourceRef = useRef<EventSource | null>(null);

    useEffect(() => {
        const welcomeMessage: Message = {
            id: Date.now().toString(),
            role: 'assistant',
            content: `Welcome to Nova Assistant! 👋\n\nHow can I help you today? Please describe your issue..`,
            timestamp: new Date().toISOString(),
        };
        setMessages([welcomeMessage]);

        // Clean up the event source when the component unmounts
        return () => {
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
            }
        };
    }, []);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!(inputMessage.trim() || uploadedFile?.url)) return;

        setIsLoading(true);

        const userMessageContent = inputMessage.trim();
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
            optFeedback: false,
            metadata: {
                isStreaming: true,
                streamingContent: 'Seeking the best answer...',
            }
        };

        setMessages((prev) => [...prev, userMessage, assistantMessage]);
        setInputMessage('');

        try {
            const { task_id } = await startQaTask({
                query: userMessageContent,
                file_path: uploadedFile?.url || '',
            });

            const eventSource = new EventSource(`${BASE_URL}/api/task-progress/${task_id}`);
            eventSourceRef.current = eventSource;

            eventSource.onmessage = (event) => {
                const data = JSON.parse(event.data);

                if (data.type === 'error') {
                    console.error('SSE Error:', data.message);
                    setMessages(prev => prev.map(msg =>
                        msg.id === assistantMessageId
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
                        msg.id === assistantMessageId
                            ? { ...msg, content: '', metadata: { isStreaming: false } }
                            : msg
                    ));

                    setIsLoading(false);
                    setMessages(prev => prev.map(msg =>
                        msg.id === assistantMessageId
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
                    msg.id === assistantMessageId
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
        <div className="flex h-screen bg-gradient-to-b from-primary-50 to-white">
            <div className="flex-1 flex flex-col min-w-0 bg-white shadow-soft overflow-hidden">
                <ChatbotIdentity name="FlexR Nova" logoUrl={logo} />
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50 to-white chat-container">
                    {messages.map((message) => (
                        <ChatMessage key={message.id} message={message} userName={userInfo.name} />
                    ))}
                    {isLoading && <LoadingIndicator chatbotName="Nova Assistant" />}
                </div>

                {/* Input Area */}
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