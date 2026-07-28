import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/layout/Layout";
import { Dashboard } from "./pages/Dashboard";
import { Send } from "./pages/Send";
import { Receive } from "./pages/Receive";
import { Transactions } from "./pages/Transactions";
import { Swap } from "./pages/Swap";
import { Pools } from "./pages/Pools";
import { Mint } from "./pages/Mint";
import { TokenLeaderboard } from "./pages/TokenLeaderboard";
import { Toaster } from "react-hot-toast";
import { WalletProvider } from "./contexts/WalletContext";
import { ThemeProvider } from "./contexts/ThemeContext";

function App() {
  return (
    <ThemeProvider>
      <WalletProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/send" element={<Send />} />
            <Route path="/receive" element={<Receive />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/swap" element={<Swap />} />
            <Route path="/pools" element={<Pools />} />
            <Route path="/mint" element={<Mint />} />
            <Route path="/leaderboard" element={<TokenLeaderboard />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
        <Toaster 
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#1C1C1E',
              color: '#FAFAFA',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: '12px',
            }
          }}
        />
      </Router>
      </WalletProvider>
    </ThemeProvider>
  );
}

export default App;
