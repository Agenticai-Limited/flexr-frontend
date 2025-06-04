import { useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './components/LoginPage';
// import { ChatInterface } from './components/ChatInterface';
import { QAChatInterface } from './components/QAChatInterface';
import { UserInfo } from './types';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    const storedLoginState = localStorage.getItem('isLoggedIn');
    return storedLoginState === 'true';
  });

  const [userInfo, setUserInfo] = useState<UserInfo | null>(() => {
    const storedUserInfo = localStorage.getItem('userInfo');
    return storedUserInfo ? JSON.parse(storedUserInfo) : null;
  });

  const handleLoginSuccess = (info: UserInfo) => {
    setIsLoggedIn(true);
    setUserInfo(info);
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('userInfo', JSON.stringify(info));
  };

  if (!isLoggedIn || !userInfo) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <HashRouter>
      <Routes>
        {/* <Route path="/chat" element={<ChatInterface userInfo={userInfo} />} /> */}
        <Route path="/chat" element={<QAChatInterface userInfo={userInfo} />} />
        <Route path="/" element={<Navigate to="/chat" replace />} />
      </Routes>
    </HashRouter>
  );
}

export default App;
