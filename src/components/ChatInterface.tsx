import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Message, ServiceType, UserInfo, UploadedFile } from '../types';
import { sendMessage } from '../services/api';
import { ChatMessage } from './ChatMessage';
import { FileUpload } from './FileUpload';
import { LoadingIndicator } from './LoadingIndicator'
import { ChatbotIdentity } from './ChatbotIdentity'
import logo from '../assets/logo.png';

interface ChatInterfaceProps {
    userInfo: UserInfo;
}

export const ChatInterface = ({ userInfo }: ChatInterfaceProps) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputMessage, setInputMessage] = useState('');
    const [serviceType, setServiceType] = useState<ServiceType>('reception');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
    const [serviceTag, setServiceTag] = useState('Default');

    useEffect(() => {
        const handleServiceSelection = (service: ServiceType) => {
            setServiceType(service);
            const serviceMessage: Message = {
                id: Date.now().toString(),
                role: 'assistant',
                content: `You have selected service: ${service}, please describe your issue.`,
                timestamp: new Date().toISOString(),
            };
            setMessages(prev => [...prev, serviceMessage]);
        };

        // Add initial welcome message
        const welcomeMessage: Message = {
            id: Date.now().toString(),
            role: 'assistant',
            content: `Welcome to Nova Assistant! 👋\n\nHow can I help you today? Please select a service:\n\n<div class="flex flex-wrap gap-2 mt-2">
                ${['reception', 'sales', 'qa', 'img', 'aftersales'].map(type => (
                `<button 
                        data-service="${type}"
                        class="px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
                    >${type === 'qa' ? 'Product Q&A' :
                    type === 'img' ? 'Image Analysis' :
                        type === 'aftersales' ? 'After-sales Service' :
                            type === 'sales' ? 'Sales Support' :
                                'Reception'}</button>`
            )).join('')}
            </div>`,
            timestamp: new Date().toISOString(),
            renderHTML: true,
            onClick: (e: React.MouseEvent) => {
                const button = (e.target as HTMLElement).closest('button');
                if (button) {
                    const service = button.getAttribute('data-service') as ServiceType;
                    if (service) {
                        handleServiceSelection(service);
                        setServiceTag('Selected')
                    }
                }
            }
        };
        setMessages([welcomeMessage]);
    }, []);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!(inputMessage.trim() || uploadedFile?.url)) return;

        setError('');
        setIsLoading(true);

        if (inputMessage.trim()) {
            const newMessage: Message = {
                id: Date.now().toString(),
                role: 'user',
                content: inputMessage.trim(),
                timestamp: new Date().toISOString(),
            };

            setMessages((prev) => [...prev, newMessage]);
            setInputMessage('');
        }

        try {
            const response = await sendMessage(serviceType, {
                query: inputMessage.trim(),
                file_path: uploadedFile?.url || '',
            });

            const assistantMessage: Message = {
                id: response.id,
                role: 'assistant',
                content: response.raw,
                timestamp: new Date().toISOString(),
                optFeedback: true,
                metadata: response.metadata,
            };

            setMessages((prev) => [...prev, assistantMessage]);
        } catch (err: any) {
            setError(err.message || 'Failed to send message');
        } finally {
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
                <ChatbotIdentity name="Nova" logoUrl={logo} />
                {/* Service Type Indicator */}
                <div className="p-4 bg-white/70 backdrop-blur-sm border-b border-gray-100">
                    <div className="flex justify-between items-center">
                        <div className="text-sm font-medium text-gray-600">
                            {serviceTag} Service: <span className="text-primary-600">{serviceType.charAt(0).toUpperCase() + serviceType.slice(1)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600"> 👉 Try</span>
                            <Link
                                to="/smart-chat"
                                className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
                            >
                                SmartServiceSelector
                            </Link>
                        </div>
                    </div>
                </div>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50 to-white chat-container">
                    {messages.map((message) => (
                        <ChatMessage key={message.id} message={message} userName={userInfo.name} />
                    ))}
                    {isLoading && <LoadingIndicator chatbotName="Nova Assistant" />}
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mx-4 mb-4">
                        <div className="text-red-600 text-sm p-3 bg-red-50 rounded-lg border border-red-100">
                            {error}
                        </div>
                    </div>
                )}

                {/* Input Area */}
                <div className="p-4 border-t border-gray-100 bg-white">
                    <div className="flex items-end space-x-4">
                        <FileUpload onFileUploaded={handleFileUploaded} />
                        <form onSubmit={handleSendMessage} className="flex-1 flex space-x-2">
                            <input
                                type="text"
                                value={inputMessage}
                                onChange={(e) => setInputMessage(e.target.value)}
                                placeholder="Ask Nova a question..."
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