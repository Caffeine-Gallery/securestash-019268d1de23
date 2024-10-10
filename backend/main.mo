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
    name: Text;
    chunk: Blob;
    index: Nat;
    totalChunks: Nat;
  };

  type File = {
    name: Text;
    chunks: [FileChunk];
    totalSize: Nat;
  };

  private stable var fileEntries : [(Principal, [Text])] = [];
  private var files = HashMap.HashMap<Principal, HashMap.HashMap<Text, File>>(0, Principal.equal, Principal.hash);

  public shared(msg) func isRegistered() : async Bool {
    Option.isSome(files.get(msg.caller))
  };

  public shared(msg) func registerUser() : async () {
    switch (files.get(msg.caller)) {
      case null {
        files.put(msg.caller, HashMap.HashMap<Text, File>(0, Text.equal, Text.hash));
      };
      case _ {};
    };
  };

  public shared(msg) func uploadFileChunk(name: Text, chunk: Blob, index: Nat, totalChunks: Nat) : async () {
    let userFiles = switch (files.get(msg.caller)) {
      case null {
        let newFileMap = HashMap.HashMap<Text, File>(0, Text.equal, Text.hash);
        files.put(msg.caller, newFileMap);
        newFileMap
      };
      case (?existingFiles) { existingFiles };
    };

    let fileChunk = { name = name; chunk = chunk; index = index; totalChunks = totalChunks };

    switch (userFiles.get(name)) {
      case null {
        userFiles.put(name, { name = name; chunks = [fileChunk]; totalSize = chunk.size() });
      };
      case (?existingFile) {
        let updatedChunks = Array.append(existingFile.chunks, [fileChunk]);
        let sortedChunks = Array.sort(updatedChunks, func (a: FileChunk, b: FileChunk) : { #less; #equal; #greater } {
          if (a.index < b.index) #less else if (a.index > b.index) #greater else #equal
        });
        userFiles.put(name, { name = name; chunks = sortedChunks; totalSize = existingFile.totalSize + chunk.size() });
      };
    };
  };

  public shared(msg) func getFiles() : async [{ name: Text; size: Nat }] {
    switch (files.get(msg.caller)) {
      case null { [] };
      case (?userFiles) {
        Iter.toArray(Iter.map(userFiles.vals(), func (file: File) : { name: Text; size: Nat } {
          { name = file.name; size = file.totalSize }
        }))
      };
    };
  };

  public shared(msg) func getTotalChunks(name: Text) : async Nat {
    switch (files.get(msg.caller)) {
      case null { 0 };
      case (?userFiles) {
        switch (userFiles.get(name)) {
          case null { 0 };
          case (?file) {
            file.chunks.size()
          };
        };
      };
    };
  };

  public shared(msg) func getFileChunk(name: Text, index: Nat) : async ?Blob {
    switch (files.get(msg.caller)) {
      case null { null };
      case (?userFiles) {
        switch (userFiles.get(name)) {
          case null { null };
          case (?file) {
            switch (Array.find(file.chunks, func (chunk: FileChunk) : Bool { chunk.index == index })) {
              case null { null };
              case (?foundChunk) { ?foundChunk.chunk };
            };
          };
        };
      };
    };
  };

  public shared(msg) func getFileSize(name: Text) : async Nat {
    switch (files.get(msg.caller)) {
      case null { 0 };
      case (?userFiles) {
        switch (userFiles.get(name)) {
          case null { 0 };
          case (?file) { file.totalSize };
        };
      };
    };
  };

  public shared(msg) func deleteFile(name: Text) : async Bool {
    switch (files.get(msg.caller)) {
      case null { false };
      case (?userFiles) {
        userFiles.delete(name);
        true
      };
    };
  };

  system func preupgrade() {
    fileEntries := Iter.toArray(
      Iter.map<(Principal, HashMap.HashMap<Text, File>), (Principal, [Text])>(
        files.entries(),
        func ((principal, userFiles): (Principal, HashMap.HashMap<Text, File>)) : (Principal, [Text]) {
          (principal, Iter.toArray(userFiles.keys()))
        }
      )
    );
  };

  system func postupgrade() {
    files := HashMap.fromIter<Principal, HashMap.HashMap<Text, File>>(
      Iter.map<(Principal, [Text]), (Principal, HashMap.HashMap<Text, File>)>(
        fileEntries.vals(),
        func ((principal, fileNames): (Principal, [Text])) : (Principal, HashMap.HashMap<Text, File>) {
          let userFiles = HashMap.HashMap<Text, File>(0, Text.equal, Text.hash);
          for (name in fileNames.vals()) {
            userFiles.put(name, { name = name; chunks = []; totalSize = 0 });
          };
          (principal, userFiles)
        }
      ),
      0,
      Principal.equal,
      Principal.hash
    );
  };
};
