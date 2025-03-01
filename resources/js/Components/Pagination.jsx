import React from 'react';
import { Link } from '@inertiajs/react';

export default function Pagination({ links }) {
    if (!links || links.length === 3 && links[1].url === null) {
        return null;
    }

    return (
        <div className="flex flex-wrap -mb-1">
            {links.map((link, key) => {
                return (
                    <Link
                        key={key}
                        href={link.url}
                        className={`mr-1 mb-1 px-4 py-2 text-sm border rounded 
                            ${link.url === null 
                                ? 'text-gray-500' 
                                : ''} 
                            ${link.active 
                                ? 'border-indigo-500 bg-indigo-500 text-white' 
                                : 'border-gray-300 hover:bg-gray-50'}`}
                        dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                );
            })}
        </div>
    );
}