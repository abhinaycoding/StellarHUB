import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { connectWallet, disconnectWallet } from '@/services/stellar';
import toast from 'react-hot-toast';
import { isConnected, getAddress } from '@stellar/freighter-api';

interface WalletContextType {
  address: string | null;
  isConnecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    // Check if wallet was already connected on load
    const checkConnection = async () => {
      try {
        const connectedRes = await isConnected();
        if (connectedRes.isConnected) {
          const addressRes = await getAddress();
          if (addressRes.address) setAddress(addressRes.address);
        }
      } catch (error) {
        console.error("Error checking wallet connection:", error);
      }
    };
    checkConnection();
  }, []);

  const connect = async () => {
    setIsConnecting(true);
    try {
      const publicKey = await connectWallet();
      if (publicKey) {
        setAddress(publicKey);
        toast.success("Wallet connected successfully");
      } else {
        toast.error("Failed to connect wallet");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to connect wallet");
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    disconnectWallet();
    setAddress(null);
    toast.success("Wallet disconnected");
  };

  return (
    <WalletContext.Provider value={{ address, isConnecting, connect, disconnect }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}
