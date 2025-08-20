

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useContext } from 'react';
import { UserContext } from '../context/auth_context';


const useUserAuthContext = (): any => {
  const context = useContext(UserContext);

  if (!context) {
    throw new Error('useAuthContext must be used inside an AuthContextProvider');
  }

  return context;
};

export default useUserAuthContext;
