#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Address, Env, Vec};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Holder {
    pub address: Address,
    pub balance: i128,
    pub timestamp: u64,
}

#[contracttype]
pub enum DataKey {
    Holder(Address), // map of address to Holder
    Holders, // list of all holder addresses
}

#[contract]
pub struct TokenLeaderboardContract;

#[contractimpl]
impl TokenLeaderboardContract {
    /// Update or record a holder's balance.
    /// In a real system, this might be permissioned or triggered by the token contract itself.
    pub fn update_holder(env: Env, address: Address, balance: i128) {
        let timestamp = env.ledger().timestamp();
        
        let mut holders: Vec<Address> = env
            .storage()
            .persistent()
            .get(&DataKey::Holders)
            .unwrap_or(Vec::new(&env));

        if !env.storage().persistent().has(&DataKey::Holder(address.clone())) {
            holders.push_back(address.clone());
            env.storage().persistent().set(&DataKey::Holders, &holders);
        }

        let holder_data = Holder {
            address: address.clone(),
            balance,
            timestamp,
        };

        env.storage()
            .persistent()
            .set(&DataKey::Holder(address.clone()), &holder_data);

        // Emit an event for real-time frontend updates
        env.events()
            .publish((symbol_short!("holder_up"), address), (balance, timestamp));
    }

    /// Alias for update_holder
    pub fn record_holder(env: Env, address: Address, balance: i128) {
        Self::update_holder(env, address, balance)
    }

    /// Get details of a specific holder
    pub fn get_holder(env: Env, address: Address) -> Option<Holder> {
        env.storage()
            .persistent()
            .get(&DataKey::Holder(address))
    }

    /// Get total number of unique holders
    pub fn get_total_holders(env: Env) -> u32 {
        let holders: Vec<Address> = env
            .storage()
            .persistent()
            .get(&DataKey::Holders)
            .unwrap_or(Vec::new(&env));
        holders.len()
    }

    /// Get the leaderboard, optionally limited in size.
    /// This is a basic implementation. In production with millions of holders,
    /// a more efficient off-chain indexing or specialized contract data structure would be used.
    pub fn get_leaderboard(env: Env, limit: u32) -> Vec<Holder> {
        let holders: Vec<Address> = env
            .storage()
            .persistent()
            .get(&DataKey::Holders)
            .unwrap_or(Vec::new(&env));
        
        let mut all_holders = Vec::new(&env);
        for h_addr in holders.iter() {
            if let Some(holder) = env.storage().persistent().get::<_, Holder>(&DataKey::Holder(h_addr)) {
                all_holders.push_back(holder);
            }
        }
        
        // Let frontend handle sorting if Soroban sorting isn't natively exposed/efficient here.
        // Returning unsorted list for simplicity, frontend will sort by balance descending.
        all_holders
    }
    
    /// Get the rank of a specific holder
    pub fn get_rank(env: Env, address: Address) -> u32 {
        let target_holder = Self::get_holder(env.clone(), address.clone());
        if target_holder.is_none() {
            return 0;
        }
        
        let target_balance = target_holder.unwrap().balance;
        
        let holders: Vec<Address> = env
            .storage()
            .persistent()
            .get(&DataKey::Holders)
            .unwrap_or(Vec::new(&env));
            
        let mut rank = 1;
        
        for h_addr in holders.iter() {
            if h_addr != address {
                if let Some(holder) = env.storage().persistent().get::<_, Holder>(&DataKey::Holder(h_addr)) {
                    if holder.balance > target_balance {
                        rank += 1;
                    }
                }
            }
        }
        
        rank
    }
}
