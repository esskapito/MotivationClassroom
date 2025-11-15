
import React from 'react';

const Spinner: React.FC = () => {
    return (
        <div className="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full" role="status">
            <span className="sr-only">Chargement...</span>
        </div>
    );
};

export default Spinner;
