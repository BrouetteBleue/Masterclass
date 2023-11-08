import { useState, useCallback, useContext, createContext } from 'react';

const CurrentUrlContext = createContext({
    currentUrl: null,
    setCurrentUrl: (url: string | null) => {},
});

// hook to get the current url
export const useCurrentUrl = () => {
    return useContext(CurrentUrlContext);
};

// provider to wrap a component and provide the current url
export const CurrentUrlProvider = ({ children }) => {
    const [currentUrl, setCurrentUrl] = useState<string | null>(null);

    const handleSetCurrentUrl = useCallback((url : string) => {
        setCurrentUrl(url);
      }, []);

    return (
        <CurrentUrlContext.Provider value={{ currentUrl, setCurrentUrl: handleSetCurrentUrl }}>
            {children}
        </CurrentUrlContext.Provider>
    );
};