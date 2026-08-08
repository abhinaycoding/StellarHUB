import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/layout/Layout";
import { Dashboard } from "./pages/Dashboard";
import { Send } from "./pages/Send";
import { Receive } from "./pages/Receive";
import { Transactions } from "./pages/Transactions";
import { Swap } from "./pages/Swap";
import { Pools } from "./pages/Pools";
import { Mint } from "./pages/Mint";
import { NFTs } from "./pages/NFTs";
import { Network } from "./pages/Network";
import { TokenLeaderboard } from "./pages/TokenLeaderboard";
import { AddressBook } from "./pages/AddressBook";
import { Settings } from "./pages/Settings";
import { SorobanStudio } from "./pages/SorobanStudio";
import { TransactionBuilder } from "./pages/TransactionBuilder";
import { Toaster } from "react-hot-toast";
import { WalletProvider } from "./contexts/WalletContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { SettingsProvider } from "./contexts/SettingsContext";
import { AddressBookProvider } from "./contexts/AddressBookContext";
import { NotificationProvider } from "./contexts/NotificationContext";

function App() {
  return (
    <ThemeProvider>
      <SettingsProvider>
        <AddressBookProvider>
          <NotificationProvider>
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
                    <Route path="/nfts" element={<NFTs />} />
                    <Route path="/network" element={<Network />} />
                    <Route path="/leaderboard" element={<TokenLeaderboard />} />
                    <Route path="/address-book" element={<AddressBook />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/studio" element={<SorobanStudio />} />
                    <Route path="/tx-builder" element={<TransactionBuilder />} />
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
          </NotificationProvider>
        </AddressBookProvider>
      </SettingsProvider>
    </ThemeProvider>
  );
}

export default App;
