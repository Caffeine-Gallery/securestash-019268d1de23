export const idlFactory = ({ IDL }) => {
  return IDL.Service({
    'checkFileExists' : IDL.Func([IDL.Text], [IDL.Bool], []),
    'deleteFile' : IDL.Func([IDL.Text], [IDL.Bool], []),
    'getFileChunk' : IDL.Func(
        [IDL.Text, IDL.Nat],
        [IDL.Opt(IDL.Vec(IDL.Nat8))],
        [],
      ),
    'getFileSize' : IDL.Func([IDL.Text], [IDL.Nat], []),
    'getFileType' : IDL.Func([IDL.Text], [IDL.Opt(IDL.Text)], []),
    'getFiles' : IDL.Func(
        [],
        [
          IDL.Vec(
            IDL.Record({
              'name' : IDL.Text,
              'size' : IDL.Nat,
              'fileType' : IDL.Text,
            })
          ),
        ],
        [],
      ),
    'getTotalChunks' : IDL.Func([IDL.Text], [IDL.Nat], []),
    'isRegistered' : IDL.Func([], [IDL.Bool], []),
    'registerUser' : IDL.Func([], [], []),
    'uploadFileChunk' : IDL.Func(
        [IDL.Text, IDL.Vec(IDL.Nat8), IDL.Nat, IDL.Nat, IDL.Text],
        [],
        [],
      ),
  });
};
export const init = ({ IDL }) => { return []; };
