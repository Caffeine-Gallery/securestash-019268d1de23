export const idlFactory = ({ IDL }) => {
  return IDL.Service({
    'deleteFile' : IDL.Func([IDL.Text], [IDL.Bool], []),
    'getFileChunk' : IDL.Func(
        [IDL.Text, IDL.Nat],
        [IDL.Opt(IDL.Vec(IDL.Nat8))],
        [],
      ),
    'getFiles' : IDL.Func([], [IDL.Vec(IDL.Record({ 'name' : IDL.Text }))], []),
    'getTotalChunks' : IDL.Func([IDL.Text], [IDL.Nat], []),
    'isRegistered' : IDL.Func([], [IDL.Bool], []),
    'registerUser' : IDL.Func([], [], []),
    'uploadFileChunk' : IDL.Func(
        [IDL.Text, IDL.Vec(IDL.Nat8), IDL.Nat, IDL.Nat],
        [],
        [],
      ),
  });
};
export const init = ({ IDL }) => { return []; };
