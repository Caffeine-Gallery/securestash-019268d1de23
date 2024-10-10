import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface _SERVICE {
  'deleteFile' : ActorMethod<[string], boolean>,
  'getFile' : ActorMethod<[string], [] | [Uint8Array | number[]]>,
  'getFiles' : ActorMethod<[], Array<{ 'name' : string }>>,
  'isRegistered' : ActorMethod<[], boolean>,
  'registerUser' : ActorMethod<[], undefined>,
  'uploadFile' : ActorMethod<[string, Uint8Array | number[]], undefined>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
