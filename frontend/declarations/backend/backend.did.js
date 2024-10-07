export const idlFactory = ({ IDL }) => {
  return IDL.Service({
    'isRegistered' : IDL.Func([], [IDL.Bool], []),
    'registerUser' : IDL.Func([], [IDL.Text], []),
  });
};
export const init = ({ IDL }) => { return []; };
