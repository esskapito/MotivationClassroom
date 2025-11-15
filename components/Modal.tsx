import React, { useEffect, useMemo } from 'react';

interface ModalProps {
    title: string;
    message: string;
    onClose: () => void;
}

const Modal: React.FC<ModalProps> = ({ title, message, onClose }) => {
    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
           if (event.key === 'Escape') {
              onClose();
           }
        };
        window.addEventListener('keydown', handleEsc);
        return () => {
           window.removeEventListener('keydown', handleEsc);
        };
    }, [onClose]);

    const formattedMessage = useMemo(() => {
        if (!message) return '';
        // Basic security: escape HTML tags that are not part of our markdown
        let html = message
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");

        // Process markdown blocks (lists)
        html = html.replace(/^((\s*[*+-]\s+.*)(\n|$))+/gm, (match) => {
            const items = match.trim().split('\n').map(item => `<li>${item.replace(/^\s*[*+-]\s+/, '')}</li>`).join('');
            return `<ul>${items}</ul>`;
        });

        // Process inline markdown (bold)
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        // Finally, convert newlines to <br> for non-block elements
        html = html.replace(/\n/g, '<br />');
        
        // Clean up <br> tags that might have been added around blocks
        html = html.replace(/<\/ul><br \/>/g, '</ul>');
        html = html.replace(/<br \/><ul>/g, '<ul>');
        
        return html;
    }, [message]);


    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50 animate-fade-in"
            onClick={onClose}
        >
            <div 
                className="bg-gray-800 p-8 rounded-xl shadow-2xl max-w-md w-full text-left transform transition-all animate-fade-in-up"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="text-2xl font-bold mb-4">{title}</h3>
                <div className="text-gray-300 mb-6 whitespace-pre-wrap max-h-96 overflow-y-auto prose prose-invert prose-p:my-2 prose-ul:my-2" dangerouslySetInnerHTML={{ __html: formattedMessage }}></div>
                <button 
                    onClick={onClose}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition duration-300 block ml-auto"
                >
                    Fermer
                </button>
            </div>
        </div>
    );
};

export default Modal;