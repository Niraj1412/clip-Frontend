import React, { createContext, useState } from 'react';


export const UserLoggedinContext = createContext();

export const UserLoggedinProvider = ({ children }) => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    return (
        <UserLoggedinContext.Provider value={{ isLoggedIn, setIsLoggedIn }}>
            {children}
        </UserLoggedinContext.Provider>
    );
};
