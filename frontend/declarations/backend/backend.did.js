export const idlFactory = ({ IDL }) => {
  return IDL.Service({
    'deleteFile' : IDL.Func([IDL.Text], [IDL.Bool], []),
    'getFile' : IDL.Func([IDL.Text], [IDL.Opt(IDL.Vec(IDL.Nat8))], []),
    'getFiles' : IDL.Func([], [IDL.Vec(IDL.Record({ 'name' : IDL.Text }))], []),
    'isRegistered' : IDL.Func([], [IDL.Bool], []),
    'registerUser' : IDL.Func([], [], []),
    'uploadFile' : IDL.Func([IDL.Text, IDL.Vec(IDL.Nat8)], [], []),
  });
};
export const init = ({ IDL }) => { return []; };
