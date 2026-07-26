import { Buffer } from "buffer";
import { Address } from "@stellar/stellar-sdk";
import {
  AssembledTransaction,
  Client as ContractClient,
  ClientOptions as ContractClientOptions,
  MethodOptions,
  Result,
  Spec as ContractSpec,
} from "@stellar/stellar-sdk/contract";
import type {
  u32,
  i32,
  u64,
  i64,
  u128,
  i128,
  u256,
  i256,
  Option,
  Timepoint,
  Duration,
} from "@stellar/stellar-sdk/contract";
export * from "@stellar/stellar-sdk";
export * as contract from "@stellar/stellar-sdk/contract";
export * as rpc from "@stellar/stellar-sdk/rpc";

if (typeof window !== "undefined") {
  //@ts-ignore Buffer exists
  window.Buffer = window.Buffer || Buffer;
}


export const networks = {
  testnet: {
    networkPassphrase: "Test SDF Network ; September 2015",
    contractId: "CASFKDX6OO52YZJ2A6INT2QK76YTPSLLBRNNXQAS7G6YIQZJ7PYOYEV2",
  }
} as const

export const Errors = {
  1: {message:"Unauthorized"},
  2: {message:"AlreadyScored"},
  3: {message:"ScoreTooHigh"},
  4: {message:"AlreadyDistributed"},
  5: {message:"InvalidSplit"},
  6: {message:"NoScores"}
}

export type DataKey = {tag: "Organizer", values: void} | {tag: "Token", values: void} | {tag: "TopN", values: void} | {tag: "PayoutSplit", values: void} | {tag: "Distributed", values: void} | {tag: "PoolBalance", values: void} | {tag: "SubmissionCount", values: void} | {tag: "Judges", values: void} | {tag: "Submissions", values: void} | {tag: "ScoreSum", values: readonly [u64]} | {tag: "ScoreCount", values: readonly [u64]} | {tag: "HasJudged", values: readonly [u64, string]};


export interface SubmissionData {
  id: u64;
  name: string;
  team_address: string;
}


export interface LeaderboardEntry {
  /**
 * Average score × 100 (e.g. 85.50 → 8550) for integer precision.
 */
avg_x100: u32;
  id: u64;
  name: string;
  team_address: string;
  votes: u32;
}

export interface Client {
  /**
   * Construct and simulate a init transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Set up the hackathon. `payout_split` is a Vec of basis-point
   * allocations per rank (must sum to 10 000, length == top_n).
   */
  init: ({organizer, token, top_n, payout_split}: {organizer: string, token: string, top_n: u32, payout_split: Array<u32>}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a add_judge transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  add_judge: ({caller, judge}: {caller: string, judge: string}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a fund_pool transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  fund_pool: ({funder, amount}: {funder: string, amount: i128}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a get_token transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_token: (options?: MethodOptions) => Promise<AssembledTransaction<string>>

  /**
   * Construct and simulate a get_top_n transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_top_n: (options?: MethodOptions) => Promise<AssembledTransaction<u32>>

  /**
   * Construct and simulate a get_judges transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_judges: (options?: MethodOptions) => Promise<AssembledTransaction<Map<string, boolean>>>

  /**
   * Construct and simulate a has_judged transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  has_judged: ({submission_id, judge}: {submission_id: u64, judge: string}, options?: MethodOptions) => Promise<AssembledTransaction<boolean>>

  /**
   * Construct and simulate a submit_score transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  submit_score: ({judge, submission_id, score}: {judge: string, submission_id: u64, score: u32}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a get_organizer transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_organizer: (options?: MethodOptions) => Promise<AssembledTransaction<string>>

  /**
   * Construct and simulate a add_submission transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  add_submission: ({caller, name, team_address}: {caller: string, name: string, team_address: string}, options?: MethodOptions) => Promise<AssembledTransaction<u64>>

  /**
   * Construct and simulate a is_distributed transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  is_distributed: (options?: MethodOptions) => Promise<AssembledTransaction<boolean>>

  /**
   * Construct and simulate a get_leaderboard transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_leaderboard: (options?: MethodOptions) => Promise<AssembledTransaction<Array<LeaderboardEntry>>>

  /**
   * Construct and simulate a get_submissions transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_submissions: (options?: MethodOptions) => Promise<AssembledTransaction<Map<u64, SubmissionData>>>

  /**
   * Construct and simulate a get_payout_split transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_payout_split: (options?: MethodOptions) => Promise<AssembledTransaction<Array<u32>>>

  /**
   * Construct and simulate a get_pool_balance transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_pool_balance: (options?: MethodOptions) => Promise<AssembledTransaction<i128>>

  /**
   * Construct and simulate a distribute_prizes transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  distribute_prizes: ({caller}: {caller: string}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a get_submission_count transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_submission_count: (options?: MethodOptions) => Promise<AssembledTransaction<u64>>

}
export class Client extends ContractClient {
  static async deploy<T = Client>(
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options: MethodOptions &
      Omit<ContractClientOptions, "contractId"> & {
        /** The hash of the Wasm blob, which must already be installed on-chain. */
        wasmHash: Buffer | string;
        /** Salt used to generate the contract's ID. Passed through to {@link Operation.createCustomContract}. Default: random. */
        salt?: Buffer | Uint8Array;
        /** The format used to decode `wasmHash`, if it's provided as a string. */
        format?: "hex" | "base64";
      }
  ): Promise<AssembledTransaction<T>> {
    return ContractClient.deploy(null, options)
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "AAAABAAAAAAAAAAAAAAABUVycm9yAAAAAAAABgAAAAAAAAAMVW5hdXRob3JpemVkAAAAAQAAAAAAAAANQWxyZWFkeVNjb3JlZAAAAAAAAAIAAAAAAAAADFNjb3JlVG9vSGlnaAAAAAMAAAAAAAAAEkFscmVhZHlEaXN0cmlidXRlZAAAAAAABAAAAAAAAAAMSW52YWxpZFNwbGl0AAAABQAAAAAAAAAITm9TY29yZXMAAAAG",
        "AAAAAgAAAAAAAAAAAAAAB0RhdGFLZXkAAAAADAAAAAAAAAAAAAAACU9yZ2FuaXplcgAAAAAAAAAAAAAAAAAABVRva2VuAAAAAAAAAAAAAAAAAAAEVG9wTgAAAAAAAAAAAAAAC1BheW91dFNwbGl0AAAAAAAAAAAAAAAAC0Rpc3RyaWJ1dGVkAAAAAAAAAAAAAAAAC1Bvb2xCYWxhbmNlAAAAAAAAAAAAAAAAD1N1Ym1pc3Npb25Db3VudAAAAAAAAAAAAAAAAAZKdWRnZXMAAAAAAAAAAAAAAAAAC1N1Ym1pc3Npb25zAAAAAAEAAAAAAAAACFNjb3JlU3VtAAAAAQAAAAYAAAABAAAAAAAAAApTY29yZUNvdW50AAAAAAABAAAABgAAAAEAAAAAAAAACUhhc0p1ZGdlZAAAAAAAAAIAAAAGAAAAEw==",
        "AAAAAQAAAAAAAAAAAAAADlN1Ym1pc3Npb25EYXRhAAAAAAADAAAAAAAAAAJpZAAAAAAABgAAAAAAAAAEbmFtZQAAABAAAAAAAAAADHRlYW1fYWRkcmVzcwAAABM=",
        "AAAAAQAAAAAAAAAAAAAAEExlYWRlcmJvYXJkRW50cnkAAAAFAAAAQUF2ZXJhZ2Ugc2NvcmUgw5cgMTAwIChlLmcuIDg1LjUwIOKGkiA4NTUwKSBmb3IgaW50ZWdlciBwcmVjaXNpb24uAAAAAAAACGF2Z194MTAwAAAABAAAAAAAAAACaWQAAAAAAAYAAAAAAAAABG5hbWUAAAAQAAAAAAAAAAx0ZWFtX2FkZHJlc3MAAAATAAAAAAAAAAV2b3RlcwAAAAAAAAQ=",
        "AAAAAAAAAHhTZXQgdXAgdGhlIGhhY2thdGhvbi4gYHBheW91dF9zcGxpdGAgaXMgYSBWZWMgb2YgYmFzaXMtcG9pbnQKYWxsb2NhdGlvbnMgcGVyIHJhbmsgKG11c3Qgc3VtIHRvIDEwIDAwMCwgbGVuZ3RoID09IHRvcF9uKS4AAAAEaW5pdAAAAAQAAAAAAAAACW9yZ2FuaXplcgAAAAAAABMAAAAAAAAABXRva2VuAAAAAAAAEwAAAAAAAAAFdG9wX24AAAAAAAAEAAAAAAAAAAxwYXlvdXRfc3BsaXQAAAPqAAAABAAAAAA=",
        "AAAAAAAAAAAAAAAJYWRkX2p1ZGdlAAAAAAAAAgAAAAAAAAAGY2FsbGVyAAAAAAATAAAAAAAAAAVqdWRnZQAAAAAAABMAAAAA",
        "AAAAAAAAAAAAAAAJZnVuZF9wb29sAAAAAAAAAgAAAAAAAAAGZnVuZGVyAAAAAAATAAAAAAAAAAZhbW91bnQAAAAAAAsAAAAA",
        "AAAAAAAAAAAAAAAJZ2V0X3Rva2VuAAAAAAAAAAAAAAEAAAAT",
        "AAAAAAAAAAAAAAAJZ2V0X3RvcF9uAAAAAAAAAAAAAAEAAAAE",
        "AAAAAAAAAAAAAAAKZ2V0X2p1ZGdlcwAAAAAAAAAAAAEAAAPsAAAAEwAAAAE=",
        "AAAAAAAAAAAAAAAKaGFzX2p1ZGdlZAAAAAAAAgAAAAAAAAANc3VibWlzc2lvbl9pZAAAAAAAAAYAAAAAAAAABWp1ZGdlAAAAAAAAEwAAAAEAAAAB",
        "AAAAAAAAAAAAAAAMc3VibWl0X3Njb3JlAAAAAwAAAAAAAAAFanVkZ2UAAAAAAAATAAAAAAAAAA1zdWJtaXNzaW9uX2lkAAAAAAAABgAAAAAAAAAFc2NvcmUAAAAAAAAEAAAAAA==",
        "AAAAAAAAAAAAAAANZ2V0X29yZ2FuaXplcgAAAAAAAAAAAAABAAAAEw==",
        "AAAAAAAAAAAAAAAOYWRkX3N1Ym1pc3Npb24AAAAAAAMAAAAAAAAABmNhbGxlcgAAAAAAEwAAAAAAAAAEbmFtZQAAABAAAAAAAAAADHRlYW1fYWRkcmVzcwAAABMAAAABAAAABg==",
        "AAAAAAAAAAAAAAAOaXNfZGlzdHJpYnV0ZWQAAAAAAAAAAAABAAAAAQ==",
        "AAAAAAAAAAAAAAAPZ2V0X2xlYWRlcmJvYXJkAAAAAAAAAAABAAAD6gAAB9AAAAAQTGVhZGVyYm9hcmRFbnRyeQ==",
        "AAAAAAAAAAAAAAAPZ2V0X3N1Ym1pc3Npb25zAAAAAAAAAAABAAAD7AAAAAYAAAfQAAAADlN1Ym1pc3Npb25EYXRhAAA=",
        "AAAAAAAAAAAAAAAQZ2V0X3BheW91dF9zcGxpdAAAAAAAAAABAAAD6gAAAAQ=",
        "AAAAAAAAAAAAAAAQZ2V0X3Bvb2xfYmFsYW5jZQAAAAAAAAABAAAACw==",
        "AAAAAAAAAAAAAAARZGlzdHJpYnV0ZV9wcml6ZXMAAAAAAAABAAAAAAAAAAZjYWxsZXIAAAAAABMAAAAA",
        "AAAAAAAAAAAAAAAUZ2V0X3N1Ym1pc3Npb25fY291bnQAAAAAAAAAAQAAAAY=" ]),
      options
    )
  }
  public readonly fromJSON = {
    init: this.txFromJSON<null>,
        add_judge: this.txFromJSON<null>,
        fund_pool: this.txFromJSON<null>,
        get_token: this.txFromJSON<string>,
        get_top_n: this.txFromJSON<u32>,
        get_judges: this.txFromJSON<Map<string, boolean>>,
        has_judged: this.txFromJSON<boolean>,
        submit_score: this.txFromJSON<null>,
        get_organizer: this.txFromJSON<string>,
        add_submission: this.txFromJSON<u64>,
        is_distributed: this.txFromJSON<boolean>,
        get_leaderboard: this.txFromJSON<Array<LeaderboardEntry>>,
        get_submissions: this.txFromJSON<Map<u64, SubmissionData>>,
        get_payout_split: this.txFromJSON<Array<u32>>,
        get_pool_balance: this.txFromJSON<i128>,
        distribute_prizes: this.txFromJSON<null>,
        get_submission_count: this.txFromJSON<u64>
  }
}