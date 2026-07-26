#![cfg(test)]
use soroban_sdk::{testutils::Address as _, Address, Env, String};

use super::*;

// Minimal mock token that implements transfer/balance for testing.
// Placed here so tests can deploy it alongside the main contract.
mod mock_token {
    use soroban_sdk::{contract, contractimpl, contracttype, Address, Env};

    #[derive(Clone)]
    #[contracttype]
    pub enum Key {
        Bal(Address),
    }

    #[contract]
    pub struct MockToken;

    #[contractimpl]
    impl MockToken {
        pub fn transfer(env: Env, from: Address, to: Address, amount: i128) {
            from.require_auth();
            let fb: i128 = env
                .storage()
                .persistent()
                .get(&Key::Bal(from.clone()))
                .unwrap_or(0);
            assert!(fb >= amount, "insufficient token balance");
            env.storage()
                .persistent()
                .set(&Key::Bal(from), &(fb - amount));
            let tb: i128 = env
                .storage()
                .persistent()
                .get(&Key::Bal(to.clone()))
                .unwrap_or(0);
            env.storage()
                .persistent()
                .set(&Key::Bal(to), &(tb + amount));
        }

        pub fn balance(env: Env, id: Address) -> i128 {
            env.storage()
                .persistent()
                .get(&Key::Bal(id))
                .unwrap_or(0)
        }

        pub fn mint(env: Env, admin: Address, to: Address, amount: i128) {
            admin.require_auth();
            let b: i128 = env
                .storage()
                .persistent()
                .get(&Key::Bal(to.clone()))
                .unwrap_or(0);
            env.storage()
                .persistent()
                .set(&Key::Bal(to), &(b + amount));
        }
    }
}

/// Returns (env, contract_id, organizer, token_address).
fn setup() -> (Env, Address, Address, Address) {
    let env = Env::default();
    env.mock_all_auths();

    let organizer = Address::generate(&env);
    let token_addr = env.register(mock_token::MockToken, ());
    let contract_id = env.register(HackathonJudging, ());

    let client = HackathonJudgingClient::new(&env, &contract_id);
    let split = soroban_sdk::vec![&env, 5000u32, 3000u32, 2000u32];
    client.init(&organizer, &token_addr, &3, &split);

    (env, contract_id, organizer, token_addr)
}

// ── Happy-path: full lifecycle ──────────────────────────────────────

#[test]
fn test_full_happy_path() {
    let (env, cid, organizer, token_addr) = setup();
    let client = HackathonJudgingClient::new(&env, &cid);

    let judge1 = Address::generate(&env);
    let judge2 = Address::generate(&env);
    let team1 = Address::generate(&env);
    let team2 = Address::generate(&env);
    let team3 = Address::generate(&env);
    let funder = Address::generate(&env);

    // Register judges
    client.add_judge(&organizer, &judge1);
    client.add_judge(&organizer, &judge2);

    // Register submissions
    let s1 = client.add_submission(&organizer, &String::from_str(&env, "Alpha"), &team1);
    let s2 = client.add_submission(&organizer, &String::from_str(&env, "Beta"), &team2);
    let s3 = client.add_submission(&organizer, &String::from_str(&env, "Gamma"), &team3);
    assert_eq!(client.get_submission_count(), 3);

    // Fund pool
    let token = mock_token::MockTokenClient::new(&env, &token_addr);
    token.mint(&organizer, &funder, &100_000_000);
    client.fund_pool(&funder, &50_000_000);
    assert_eq!(client.get_pool_balance(), 50_000_000);

    // Scores: Alpha=90+70=160/2=80, Beta=80, Gamma=95
    client.submit_score(&judge1, &s1, &90);
    client.submit_score(&judge1, &s2, &80);
    client.submit_score(&judge2, &s1, &70);
    client.submit_score(&judge2, &s3, &95);

    // Leaderboard check
    let lb = client.get_leaderboard();
    assert_eq!(lb.len(), 3);
    // Gamma 95 > Alpha 80 >= Beta 80
    assert_eq!(lb.get(0).unwrap().id, s3);
    assert_eq!(lb.get(0).unwrap().avg_x100, 9500);

    // Distribute
    client.distribute_prizes(&organizer);
    assert!(client.is_distributed());
    assert_eq!(client.get_pool_balance(), 0);

    // Gamma 50% = 25M
    let g_bal = token.balance(&team3);
    assert_eq!(g_bal, 25_000_000);
}

// ── Auth tests ──────────────────────────────────────────────────────

#[test]
#[should_panic(expected = "caller is not the organizer")]
fn test_non_organizer_add_judge() {
    let (env, cid, _, _) = setup();
    let client = HackathonJudgingClient::new(&env, &cid);
    let rando = Address::generate(&env);
    let judge = Address::generate(&env);
    client.add_judge(&rando, &judge);
}

#[test]
#[should_panic(expected = "caller is not the organizer")]
fn test_non_organizer_add_submission() {
    let (env, cid, _, _) = setup();
    let client = HackathonJudgingClient::new(&env, &cid);
    let rando = Address::generate(&env);
    let team = Address::generate(&env);
    client.add_submission(&rando, &String::from_str(&env, "X"), &team);
}

#[test]
#[should_panic(expected = "caller is not the organizer")]
fn test_non_organizer_distribute() {
    let (env, cid, _, _) = setup();
    let client = HackathonJudgingClient::new(&env, &cid);
    let rando = Address::generate(&env);
    client.distribute_prizes(&rando);
}

// ── Scoring edge-cases ──────────────────────────────────────────────

#[test]
#[should_panic(expected = "already scored this submission")]
fn test_double_scoring() {
    let (env, cid, organizer, _) = setup();
    let client = HackathonJudgingClient::new(&env, &cid);
    let judge = Address::generate(&env);
    let team = Address::generate(&env);
    client.add_judge(&organizer, &judge);
    let s = client.add_submission(&organizer, &String::from_str(&env, "X"), &team);
    client.submit_score(&judge, &s, &50);
    client.submit_score(&judge, &s, &60); // panics
}

#[test]
#[should_panic(expected = "score must be 0-100")]
fn test_score_over_100() {
    let (env, cid, organizer, _) = setup();
    let client = HackathonJudgingClient::new(&env, &cid);
    let judge = Address::generate(&env);
    let team = Address::generate(&env);
    client.add_judge(&organizer, &judge);
    let s = client.add_submission(&organizer, &String::from_str(&env, "X"), &team);
    client.submit_score(&judge, &s, &101);
}

#[test]
#[should_panic(expected = "not a registered judge")]
fn test_unregistered_judge() {
    let (env, cid, organizer, _) = setup();
    let client = HackathonJudgingClient::new(&env, &cid);
    let rando = Address::generate(&env);
    let team = Address::generate(&env);
    let s = client.add_submission(&organizer, &String::from_str(&env, "X"), &team);
    client.submit_score(&rando, &s, &50);
}

// ── Post-distribution rejections ────────────────────────────────────

#[test]
#[should_panic(expected = "prizes already distributed")]
fn test_fund_after_distribute() {
    let (env, cid, organizer, token_addr) = setup();
    let client = HackathonJudgingClient::new(&env, &cid);
    let team = Address::generate(&env);
    let funder = Address::generate(&env);
    let token = mock_token::MockTokenClient::new(&env, &token_addr);

    let s = client.add_submission(&organizer, &String::from_str(&env, "X"), &team);
    token.mint(&organizer, &funder, &10_000_000);
    client.fund_pool(&funder, &5_000_000);

    let judge = Address::generate(&env);
    client.add_judge(&organizer, &judge);
    client.submit_score(&judge, &s, &85);
    client.distribute_prizes(&organizer);

    client.fund_pool(&funder, &5_000_000); // panics
}

// ── Init validation ─────────────────────────────────────────────────

#[test]
#[should_panic(expected = "payout split must sum to 10000")]
fn test_init_bad_split_sum() {
    let env = Env::default();
    env.mock_all_auths();
    let org = Address::generate(&env);
    let tok = env.register(mock_token::MockToken, ());
    let cid = env.register(HackathonJudging, ());
    let c = HackathonJudgingClient::new(&env, &cid);
    let split = soroban_sdk::vec![&env, 5000u32, 3000u32, 1000u32]; // 9000 != 10000
    c.init(&org, &tok, &3, &split);
}

#[test]
#[should_panic(expected = "split length must equal top_n")]
fn test_init_split_length_mismatch() {
    let env = Env::default();
    env.mock_all_auths();
    let org = Address::generate(&env);
    let tok = env.register(mock_token::MockToken, ());
    let cid = env.register(HackathonJudging, ());
    let c = HackathonJudgingClient::new(&env, &cid);
    let split = soroban_sdk::vec![&env, 10000u32]; // length 1 != top_n 3
    c.init(&org, &tok, &3, &split);
}

// ── Pool tracking ───────────────────────────────────────────────────

#[test]
fn test_pool_balance_tracking() {
    let (env, cid, organizer, token_addr) = setup();
    let client = HackathonJudgingClient::new(&env, &cid);
    let funder = Address::generate(&env);
    let token = mock_token::MockTokenClient::new(&env, &token_addr);
    token.mint(&organizer, &funder, &200_000_000);

    client.fund_pool(&funder, &30_000_000);
    assert_eq!(client.get_pool_balance(), 30_000_000);

    client.fund_pool(&funder, &20_000_000);
    assert_eq!(client.get_pool_balance(), 50_000_000);
}

#[test]
#[should_panic(expected = "amount must be positive")]
fn test_fund_zero_amount() {
    let (env, cid, organizer, token_addr) = setup();
    let client = HackathonJudgingClient::new(&env, &cid);
    let funder = Address::generate(&env);
    let token = mock_token::MockTokenClient::new(&env, &token_addr);
    token.mint(&organizer, &funder, &10_000_000);
    client.fund_pool(&funder, &0);
}
