import { useState, useCallback, useContext, createContext, useEffect } from 'react';

const NavigationContext = createContext({
    currentTitle: "Home",
    canGoBack: false,
    setCurrentTitle: (title: string) => {},
    setCanGoBack: (canGoBack: boolean) => {}
  });
  
  export const useNavigationContext = () => {
    return useContext(NavigationContext);
  }

  export const NavigationProvider = ({ children }) => {
    const [currentTitle, setCurrentTitle] = useState("Home");
    const [canGoBack, setCanGoBack] = useState(false);

    const handleSetCurrentTitle = useCallback((title: string) => {
      setCurrentTitle(title);
    }, []);
  
    const handleSetCanGoBack = useCallback((canGoBack: boolean) => {
      setCanGoBack(canGoBack);
    }, []);
  
    return (
      <NavigationContext.Provider value={{
        currentTitle,
        canGoBack,
        setCurrentTitle: handleSetCurrentTitle,
        setCanGoBack: handleSetCanGoBack
      }}>
        {children}
      </NavigationContext.Provider>
    );
  };