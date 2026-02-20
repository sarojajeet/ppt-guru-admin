import { useLocation } from "react-router-dom";
import { useState } from "react";
import ReactMarkdown from "react-markdown";

const A4Editor = () => {
    const { state } = useLocation();
    const [pages, setPages] = useState(state.pages);

    const updatePage = (i, value) => {
        const updated = [...pages];
        updated[i].content = value;
        setPages(updated);
    };

    return (
        <div className="h-screen flex bg-gray-200 p-4">
            <div className="flex-1 bg-white p-8 shadow">
                {pages.map((p, i) => (
                    <textarea
                        key={i}
                        value={p.content}
                        onChange={(e) => updatePage(i, e.target.value)}
                        className="w-full h-60 mb-6"
                    />
                ))}
                <button onClick={() => exportA4(pages)}>Export PDF</button>
            </div>
        </div>
    );
};

export default A4Editor;