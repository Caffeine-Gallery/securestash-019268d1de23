import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface _SERVICE {
  'deleteFile' : ActorMethod<[string], boolean>,
  'getFileChunk' : ActorMethod<[string, bigint], [] | [Uint8Array | number[]]>,
  'getFiles' : ActorMethod<[], Array<{ 'name' : string, 'size' : bigint }>>,
  'getTotalChunks' : ActorMethod<[string], bigint>,
  'isRegistered' : ActorMethod<[], boolean>,
  'registerUser' : ActorMethod<[], undefined>,
  'uploadFileChunk' : ActorMethod<
    [string, Uint8Array | number[], bigint, bigint],
    undefined
  >,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
