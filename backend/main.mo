import Bool "mo:base/Bool";
import Hash "mo:base/Hash";

import Array "mo:base/Array";
import Blob "mo:base/Blob";
import Buffer "mo:base/Buffer";
import HashMap "mo:base/HashMap";
import Iter "mo:base/Iter";
import Nat "mo:base/Nat";
import Principal "mo:base/Principal";
import Text "mo:base/Text";
import Option "mo:base/Option";

actor {
  type FileChunk = {
    chunk: Blob;
    index: Nat;
  };

  type File = {
    name: Text;
    chunks: [FileChunk];
    totalSize: Nat;
    fileType: Text;
  };

  type UserFiles = HashMap.HashMap<Text, File>;

  private stable var stableFiles : [(Principal, [(Text, File)])] = [];
  private var files = HashMap.HashMap<Principal, UserFiles>(0, Principal.equal, Principal.hash);

  private func getUserFiles(user: Principal) : UserFiles {
    switch (files.get(user)) {
      case null {
        let newFileMap = HashMap.HashMap<Text, File>(0, Text.equal, Text.hash);
        files.put(user, newFileMap);
        newFileMap
      };
      case (?existingFiles) existingFiles;
    };
  };

  public shared(msg) func isRegistered() : async Bool {
    Option.isSome(files.get(msg.caller))
  };

  public shared(msg) func registerUser() : async () {
    ignore getUserFiles(msg.caller);
  };

  public shared(msg) func checkFileExists(name: Text) : async Bool {
    Option.isSome(getUserFiles(msg.caller).get(name))
  };

  public shared(msg) func uploadFileChunk(name: Text, chunk: Blob, index: Nat, totalChunks: Nat, fileType: Text) : async () {
    let userFiles = getUserFiles(msg.caller);
    let fileChunk = { chunk = chunk; index = index };

    switch (userFiles.get(name)) {
      case null {
        userFiles.put(name, { name = name; chunks = [fileChunk]; totalSize = chunk.size(); fileType = fileType });
      };
      case (?existingFile) {
        let updatedChunks = Array.append(existingFile.chunks, [fileChunk]);
        userFiles.put(name, { 
          name = name; 
          chunks = updatedChunks; 
          totalSize = existingFile.totalSize + chunk.size(); 
          fileType = fileType 
        });
      };
    };
  };

  public shared(msg) func getFiles() : async [{ name: Text; size: Nat; fileType: Text }] {
    Iter.toArray(Iter.map(getUserFiles(msg.caller).vals(), func (file: File) : { name: Text; size: Nat; fileType: Text } {
      { name = file.name; size = file.totalSize; fileType = file.fileType }
    }))
  };

  public shared(msg) func getTotalChunks(name: Text) : async Nat {
    switch (getUserFiles(msg.caller).get(name)) {
      case null 0;
      case (?file) file.chunks.size();
    };
  };

  public shared(msg) func getFileChunk(name: Text, index: Nat) : async ?Blob {
    switch (getUserFiles(msg.caller).get(name)) {
      case null null;
      case (?file) {
        switch (Array.find(file.chunks, func (chunk: FileChunk) : Bool { chunk.index == index })) {
          case null null;
          case (?foundChunk) ?foundChunk.chunk;
        };
      };
    };
  };

  public shared(msg) func getFileSize(name: Text) : async Nat {
    switch (getUserFiles(msg.caller).get(name)) {
      case null 0;
      case (?file) file.totalSize;
    };
  };

  public shared(msg) func getFileType(name: Text) : async ?Text {
    switch (getUserFiles(msg.caller).get(name)) {
      case null null;
      case (?file) ?file.fileType;
    };
  };

  public shared(msg) func deleteFile(name: Text) : async Bool {
    Option.isSome(getUserFiles(msg.caller).remove(name))
  };

  system func preupgrade() {
    let entries : Iter.Iter<(Principal, UserFiles)> = files.entries();
    stableFiles := Iter.toArray(
      Iter.map<(Principal, UserFiles), (Principal, [(Text, File)])>(
        entries,
        func ((principal, userFiles) : (Principal, UserFiles)) : (Principal, [(Text, File)]) {
          (principal, Iter.toArray(userFiles.entries()))
        }
      )
    );
  };

  system func postupgrade() {
    files := HashMap.fromIter<Principal, UserFiles>(
      Iter.map<(Principal, [(Text, File)]), (Principal, UserFiles)>(
        stableFiles.vals(),
        func ((principal, userFileEntries) : (Principal, [(Text, File)])) : (Principal, UserFiles) {
          let userFiles = HashMap.HashMap<Text, File>(0, Text.equal, Text.hash);
          for ((name, file) in userFileEntries.vals()) {
            userFiles.put(name, file);
          };
          (principal, userFiles)
        }
      ),
      0,
      Principal.equal,
      Principal.hash
    );
    stableFiles := [];
  };
};
