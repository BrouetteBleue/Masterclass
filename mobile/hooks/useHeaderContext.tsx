import { useState, useCallback, useContext, createContext, useEffect } from 'react';

const NavigationContext = createContext({
    currentTitle: "Home",
    canGoBack: false,
    folderId: null,
    setCurrentTitle: (title: string) => {},
    setCanGoBack: (canGoBack: boolean) => {},
    setFolderId: (folderId: number) => {}
  });
  
  export const useNavigationContext = () => {
    return useContext(NavigationContext);
  }

  export const NavigationProvider = ({ children }) => {
    const [currentTitle, setCurrentTitle] = useState("Home");
    const [canGoBack, setCanGoBack] = useState(false);
    const [folderId, setFolderId] = useState(null);

    const handleSetCurrentTitle = useCallback((title: string) => {
      setCurrentTitle(title);
    }, []);
  
    const handleSetCanGoBack = useCallback((canGoBack: boolean) => {
      setCanGoBack(canGoBack);
    }, []);

    const handleSetFolderId = useCallback((folderId: number) => {
      setFolderId(folderId);
    }, []);
  
    return (
      <NavigationContext.Provider value={{
        currentTitle,
        canGoBack,
        folderId,
        setCurrentTitle: handleSetCurrentTitle,
        setCanGoBack: handleSetCanGoBack,
        setFolderId: handleSetFolderId
      }}>
        {children}
      </NavigationContext.Provider>
    );
  };