import React, { createContext, useContext, useState, useEffect } from 'react';

export interface AddressBookContact {
  id: string;
  name: string;
  address: string;
}

interface AddressBookContextType {
  contacts: AddressBookContact[];
  addContact: (contact: Omit<AddressBookContact, 'id'>) => void;
  updateContact: (contact: AddressBookContact) => void;
  removeContact: (id: string) => void;
}

const AddressBookContext = createContext<AddressBookContextType | undefined>(undefined);

export function AddressBookProvider({ children }: { children: React.ReactNode }) {
  const [contacts, setContacts] = useState<AddressBookContact[]>(() => {
    const saved = localStorage.getItem('stellar-hub-address-book');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse address book from local storage', e);
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('stellar-hub-address-book', JSON.stringify(contacts));
  }, [contacts]);

  const addContact = (contact: Omit<AddressBookContact, 'id'>) => {
    const newContact: AddressBookContact = {
      ...contact,
      id: crypto.randomUUID(),
    };
    setContacts(prev => [...prev, newContact]);
  };

  const updateContact = (updatedContact: AddressBookContact) => {
    setContacts(prev => prev.map(c => c.id === updatedContact.id ? updatedContact : c));
  };

  const removeContact = (id: string) => {
    setContacts(prev => prev.filter(c => c.id !== id));
  };

  return (
    <AddressBookContext.Provider value={{ contacts, addContact, updateContact, removeContact }}>
      {children}
    </AddressBookContext.Provider>
  );
}

export function useAddressBook() {
  const context = useContext(AddressBookContext);
  if (context === undefined) {
    throw new Error('useAddressBook must be used within an AddressBookProvider');
  }
  return context;
}
