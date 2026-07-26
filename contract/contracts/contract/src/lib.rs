#![no_std]
use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, symbol_short, token, Address, Env, Map,
    String, Vec,
};

// ── TTL bump policy ──────────────────────────────────────────────────
// Persistent entries are bumped to ~1 year (630 720 ledgers @ 5 s each)
// with extend_to ≈ 2 years, so no data expires mid-hackathon.
const TTL_THRESHOLD: u32 = 630_720;
const TTL_EXTEND_TO: u32 = 1_261_440;

// ── Types ────────────────────────────────────────────────────────────

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    // Instance (global config – shared TTL)
    Organizer,
    Token,
    TopN,
    PayoutSplit,
    Distributed,
    PoolBalance,
    SubmissionCount,
    Judges,
    Submissions,
    // Persistent (per-key TTL – extended on every write)
    ScoreSum(u64),
    ScoreCount(u64),
    HasJudged(u64, Address),
}

#[derive(Clone)]
#[contracttype]
pub struct SubmissionData {
    pub id: u64,
    pub name: String,
    pub team_address: Address,
}

#[derive(Clone)]
#[contracttype]
pub struct LeaderboardEntry {
    pub id: u64,
    pub name: String,
    pub team_address: Address,
    /// Average score × 100 (e.g. 85.50 → 8550) for integer precision.
    pub avg_x100: u32,
    pub votes: u32,
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    Unauthorized = 1,
    AlreadyScored = 2,
    ScoreTooHigh = 3,
    AlreadyDistributed = 4,
    InvalidSplit = 5,
    NoScores = 6,
}

// ── Contract ─────────────────────────────────────────────────────────

#[contract]
pub struct HackathonJudging;

#[contractimpl]
impl HackathonJudging {
    /// Set up the hackathon. `payout_split` is a Vec of basis-point
    /// allocations per rank (must sum to 10 000, length == top_n).
    pub fn init(
        env: Env,
        organizer: Address,
        token: Address,
        top_n: u32,
        payout_split: Vec<u32>,
    ) {
        assert!(
            payout_split.len() == top_n,
            "split length must equal top_n"
        );
        let mut total: u32 = 0;
        for i in 0..payout_split.len() {
            total += payout_split.get(i).unwrap();
        }
        assert!(total == 10_000, "payout split must sum to 10000");

        env.storage().instance().set(&DataKey::Organizer, &organizer);
        env.storage().instance().set(&DataKey::Token, &token);
        env.storage().instance().set(&DataKey::TopN, &top_n);
        env.storage()
            .instance()
            .set(&DataKey::PayoutSplit, &payout_split);
        env.storage()
            .instance()
            .set(&DataKey::Distributed, &false);
        env.storage()
            .instance()
            .set(&DataKey::PoolBalance, &0i128);
        env.storage()
            .instance()
            .set(&DataKey::SubmissionCount, &0u64);
        env.storage()
            .instance()
            .set(&DataKey::Judges, &Map::<Address, bool>::new(&env));
        env.storage()
            .instance()
            .set(&DataKey::Submissions, &Map::<u64, SubmissionData>::new(&env));
    }

    // ── Organizer-only write paths ──────────────────────────────────

    pub fn add_judge(env: Env, caller: Address, judge: Address) {
        Self::require_organizer(&env, &caller);
        Self::require_not_distributed(&env);
        let mut judges: Map<Address, bool> =
            env.storage().instance().get(&DataKey::Judges).unwrap();
        judges.set(judge.clone(), true);
        env.storage().instance().set(&DataKey::Judges, &judges);
        env.events()
            .publish((symbol_short!("JudgeAdd"),), (judge,));
    }

    pub fn add_submission(
        env: Env,
        caller: Address,
        name: String,
        team_address: Address,
    ) -> u64 {
        Self::require_organizer(&env, &caller);
        Self::require_not_distributed(&env);
        let id: u64 = env
            .storage()
            .instance()
            .get(&DataKey::SubmissionCount)
            .unwrap();
        let mut subs: Map<u64, SubmissionData> = env
            .storage()
            .instance()
            .get(&DataKey::Submissions)
            .unwrap();
        subs.set(
            id,
            SubmissionData {
                id,
                name: name.clone(),
                team_address: team_address.clone(),
            },
        );
        env.storage().instance().set(&DataKey::Submissions, &subs);
        env.storage()
            .instance()
            .set(&DataKey::SubmissionCount, &(id + 1));
        // Seed score accumulators in persistent storage
        env.storage()
            .persistent()
            .set(&DataKey::ScoreSum(id), &0i128);
        env.storage()
            .persistent()
            .set(&DataKey::ScoreCount(id), &0u32);
        env.storage()
            .persistent()
            .extend_ttl(&DataKey::ScoreSum(id), TTL_THRESHOLD, TTL_EXTEND_TO);
        env.storage()
            .persistent()
            .extend_ttl(&DataKey::ScoreCount(id), TTL_THRESHOLD, TTL_EXTEND_TO);
        env.events()
            .publish((symbol_short!("SubAdd"),), (id, name, team_address));
        id
    }

    pub fn fund_pool(env: Env, funder: Address, amount: i128) {
        funder.require_auth();
        Self::require_not_distributed(&env);
        assert!(amount > 0, "amount must be positive");
        let token_addr: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        token::Client::new(&env, &token_addr).transfer(
            &funder,
            &env.current_contract_address(),
            &amount,
        );
        let mut bal: i128 = env
            .storage()
            .instance()
            .get(&DataKey::PoolBalance)
            .unwrap();
        bal += amount;
        env.storage()
            .instance()
            .set(&DataKey::PoolBalance, &bal);
        env.events()
            .publish((symbol_short!("PoolFund"),), (funder, amount, bal));
    }

    pub fn distribute_prizes(env: Env, caller: Address) {
        Self::require_organizer(&env, &caller);
        Self::require_not_distributed(&env);

        let subs: Map<u64, SubmissionData> = env
            .storage()
            .instance()
            .get(&DataKey::Submissions)
            .unwrap();
        let top_n: u32 = env.storage().instance().get(&DataKey::TopN).unwrap();
        let split: Vec<u32> = env
            .storage()
            .instance()
            .get(&DataKey::PayoutSplit)
            .unwrap();
        let pool: i128 = env
            .storage()
            .instance()
            .get(&DataKey::PoolBalance)
            .unwrap();
        let token_addr: Address = env.storage().instance().get(&DataKey::Token).unwrap();

        // Build ranked list (id, avg × 10 000)
        let ids = subs.keys();
        let mut ranked: Vec<(u64, i128)> = Vec::new(&env);
        for i in 0..ids.len() {
            let id = ids.get(i).unwrap();
            let sum: i128 = env
                .storage()
                .persistent()
                .get(&DataKey::ScoreSum(id))
                .unwrap_or(0);
            let cnt: u32 = env
                .storage()
                .persistent()
                .get(&DataKey::ScoreCount(id))
                .unwrap_or(0);
            if cnt > 0 {
                ranked.push_back((id, (sum * 10_000) / cnt as i128));
            }
        }
        assert!(!ranked.is_empty(), "no scores submitted");

        // Bubble-sort descending by avg score
        let len = ranked.len();
        for i in 0..len {
            for j in 0..len - 1 - i {
                let a = ranked.get(j).unwrap();
                let b = ranked.get(j + 1).unwrap();
                if a.1 < b.1 {
                    ranked.set(j, b);
                    ranked.set(j + 1, a);
                }
            }
        }

        // ── Effects before interactions (CEI) ────────────────────────
        env.storage()
            .instance()
            .set(&DataKey::Distributed, &true);
        env.storage()
            .instance()
            .set(&DataKey::PoolBalance, &0i128);

        // ── Interactions: pay winners ────────────────────────────────
        let pay_count = if top_n < ranked.len() {
            top_n
        } else {
            ranked.len()
        };
        let mut winner_ids: Vec<u64> = Vec::new(&env);
        let mut winner_addrs: Vec<Address> = Vec::new(&env);
        let mut winner_amounts: Vec<i128> = Vec::new(&env);
        let token_client = token::Client::new(&env, &token_addr);

        for i in 0..pay_count {
            let (id, _) = ranked.get(i).unwrap();
            let sub = subs.get(id).unwrap();
            let bps = split.get(i).unwrap() as i128;
            let amount = (pool * bps) / 10_000;
            if amount > 0 {
                token_client.transfer(
                    &env.current_contract_address(),
                    &sub.team_address,
                    &amount,
                );
                winner_ids.push_back(id);
                winner_addrs.push_back(sub.team_address);
                winner_amounts.push_back(amount);
            }
        }

        env.events().publish(
            (symbol_short!("Distribut"),),
            (winner_ids, winner_addrs, winner_amounts),
        );
    }

    // ── Judge write path ────────────────────────────────────────────

    pub fn submit_score(env: Env, judge: Address, submission_id: u64, score: u32) {
        judge.require_auth();
        Self::require_not_distributed(&env);
        assert!(score <= 100, "score must be 0-100");

        // Verify registered judge
        let judges: Map<Address, bool> =
            env.storage().instance().get(&DataKey::Judges).unwrap();
        assert!(
            judges.get(judge.clone()).unwrap_or(false),
            "not a registered judge"
        );

        // Verify submission exists
        let subs: Map<u64, SubmissionData> = env
            .storage()
            .instance()
            .get(&DataKey::Submissions)
            .unwrap();
        assert!(
            subs.contains_key(submission_id),
            "submission not found"
        );

        // Prevent double-scoring
        let hj_key = DataKey::HasJudged(submission_id, judge.clone());
        assert!(
            !env.storage()
                .persistent()
                .get::<_, bool>(&hj_key)
                .unwrap_or(false),
            "already scored this submission"
        );

        // Record
        env.storage().persistent().set(&hj_key, &true);
        let sk = DataKey::ScoreSum(submission_id);
        let ck = DataKey::ScoreCount(submission_id);
        let sum: i128 = env.storage().persistent().get(&sk).unwrap_or(0);
        let cnt: u32 = env.storage().persistent().get(&ck).unwrap_or(0);
        env.storage()
            .persistent()
            .set(&sk, &(sum + score as i128));
        env.storage()
            .persistent()
            .set(&ck, &(cnt + 1));

        // Extend TTLs
        env.storage()
            .persistent()
            .extend_ttl(&hj_key, TTL_THRESHOLD, TTL_EXTEND_TO);
        env.storage()
            .persistent()
            .extend_ttl(&sk, TTL_THRESHOLD, TTL_EXTEND_TO);
        env.storage()
            .persistent()
            .extend_ttl(&ck, TTL_THRESHOLD, TTL_EXTEND_TO);

        env.events()
            .publish((symbol_short!("Scored"),), (submission_id, judge, score));
    }

    // ── Read-only helpers ───────────────────────────────────────────

    pub fn get_leaderboard(env: Env) -> Vec<LeaderboardEntry> {
        let subs: Map<u64, SubmissionData> = env
            .storage()
            .instance()
            .get(&DataKey::Submissions)
            .unwrap();
        let ids = subs.keys();
        let mut entries: Vec<LeaderboardEntry> = Vec::new(&env);
        for i in 0..ids.len() {
            let id = ids.get(i).unwrap();
            let sub = subs.get(id).unwrap();
            let sum: i128 = env
                .storage()
                .persistent()
                .get(&DataKey::ScoreSum(id))
                .unwrap_or(0);
            let cnt: u32 = env
                .storage()
                .persistent()
                .get(&DataKey::ScoreCount(id))
                .unwrap_or(0);
            let avg_x100 = if cnt > 0 {
                ((sum * 100) / cnt as i128) as u32
            } else {
                0
            };
            entries.push_back(LeaderboardEntry {
                id: sub.id,
                name: sub.name,
                team_address: sub.team_address,
                avg_x100,
                votes: cnt,
            });
        }
        // Sort descending by avg_x100
        let len = entries.len();
        for i in 0..len {
            for j in 0..len - 1 - i {
                let a = entries.get(j).unwrap();
                let b = entries.get(j + 1).unwrap();
                if a.avg_x100 < b.avg_x100 {
                    entries.set(j, b);
                    entries.set(j + 1, a);
                }
            }
        }
        entries
    }

    pub fn get_pool_balance(env: Env) -> i128 {
        env.storage()
            .instance()
            .get(&DataKey::PoolBalance)
            .unwrap_or(0)
    }

    pub fn get_judges(env: Env) -> Map<Address, bool> {
        env.storage().instance().get(&DataKey::Judges).unwrap()
    }

    pub fn get_submissions(env: Env) -> Map<u64, SubmissionData> {
        env.storage().instance().get(&DataKey::Submissions).unwrap()
    }

    pub fn is_distributed(env: Env) -> bool {
        env.storage()
            .instance()
            .get(&DataKey::Distributed)
            .unwrap_or(false)
    }

    pub fn get_submission_count(env: Env) -> u64 {
        env.storage()
            .instance()
            .get(&DataKey::SubmissionCount)
            .unwrap_or(0)
    }

    pub fn get_organizer(env: Env) -> Address {
        env.storage().instance().get(&DataKey::Organizer).unwrap()
    }

    pub fn get_top_n(env: Env) -> u32 {
        env.storage().instance().get(&DataKey::TopN).unwrap()
    }

    pub fn get_payout_split(env: Env) -> Vec<u32> {
        env.storage()
            .instance()
            .get(&DataKey::PayoutSplit)
            .unwrap()
    }

    pub fn get_token(env: Env) -> Address {
        env.storage().instance().get(&DataKey::Token).unwrap()
    }

    pub fn has_judged(env: Env, submission_id: u64, judge: Address) -> bool {
        env.storage()
            .persistent()
            .get(&DataKey::HasJudged(submission_id, judge))
            .unwrap_or(false)
    }

    // ── Internal helpers ────────────────────────────────────────────

    fn require_organizer(env: &Env, caller: &Address) {
        let organizer: Address = env.storage().instance().get(&DataKey::Organizer).unwrap();
        assert!(*caller == organizer, "caller is not the organizer");
        caller.require_auth();
    }

    fn require_not_distributed(env: &Env) {
        let d: bool = env
            .storage()
            .instance()
            .get(&DataKey::Distributed)
            .unwrap_or(false);
        assert!(!d, "prizes already distributed");
    }
}

mod test;
