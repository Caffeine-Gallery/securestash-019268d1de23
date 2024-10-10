import Bool "mo:base/Bool";
import Hash "mo:base/Hash";

import Array "mo:base/Array";
import Blob "mo:base/Blob";
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

  private stable var fileEntries : [(Principal, [Text])] = [];
  private var files = HashMap.HashMap<Principal, HashMap.HashMap<Text, [FileChunk]>>(0, Principal.equal, Principal.hash);

  public shared(msg) func isRegistered() : async Bool {
    Option.isSome(files.get(msg.caller))
  };

  public shared(msg) func registerUser() : async () {
    switch (files.get(msg.caller)) {
      case null {
        files.put(msg.caller, HashMap.HashMap<Text, [FileChunk]>(0, Text.equal, Text.hash));
      };
      case _ {};
    };
  };

  public shared(msg) func uploadFileChunk(name: Text, chunk: Blob, index: Nat, totalChunks: Nat) : async () {
    switch (files.get(msg.caller)) {
      case null {
        let newFileMap = HashMap.HashMap<Text, [FileChunk]>(0, Text.equal, Text.hash);
        newFileMap.put(name, [{ name = name; chunk = chunk; index = index; totalChunks = totalChunks }]);
        files.put(msg.caller, newFileMap);
      };
      case (?userFiles) {
        switch (userFiles.get(name)) {
          case null {
            userFiles.put(name, [{ name = name; chunk = chunk; index = index; totalChunks = totalChunks }]);
          };
          case (?existingChunks) {
            let newChunks = Array.append(existingChunks, [{ name = name; chunk = chunk; index = index; totalChunks = totalChunks }]);
            let sortedChunks = Array.sort(newChunks, func (a: FileChunk, b: FileChunk) : { #less; #equal; #greater } {
              if (a.index < b.index) #less else if (a.index > b.index) #greater else #equal
            });
            userFiles.put(name, sortedChunks);
          };
        };
      };
    };
  };

  public shared(msg) func getFiles() : async [{ name: Text }] {
    switch (files.get(msg.caller)) {
      case null { [] };
      case (?userFiles) {
        Iter.toArray(Iter.map(userFiles.keys(), func (name: Text) : { name: Text } { { name = name } }))
      };
    };
  };

  public shared(msg) func getTotalChunks(name: Text) : async Nat {
    switch (files.get(msg.caller)) {
      case null { 0 };
      case (?userFiles) {
        switch (userFiles.get(name)) {
          case null { 0 };
          case (?chunks) {
            if (chunks.size() > 0) {
              chunks[0].totalChunks
            } else {
              0
            };
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
          case (?chunks) {
            switch (Array.find(chunks, func (chunk: FileChunk) : Bool { chunk.index == index })) {
              case null { null };
              case (?foundChunk) { ?foundChunk.chunk };
            };
          };
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
      Iter.map<(Principal, HashMap.HashMap<Text, [FileChunk]>), (Principal, [Text])>(
        files.entries(),
        func ((principal, userFiles): (Principal, HashMap.HashMap<Text, [FileChunk]>)) : (Principal, [Text]) {
          (principal, Iter.toArray(userFiles.keys()))
        }
      )
    );
  };

  system func postupgrade() {
    files := HashMap.fromIter<Principal, HashMap.HashMap<Text, [FileChunk]>>(
      Iter.map<(Principal, [Text]), (Principal, HashMap.HashMap<Text, [FileChunk]>)>(
        fileEntries.vals(),
        func ((principal, fileNames): (Principal, [Text])) : (Principal, HashMap.HashMap<Text, [FileChunk]>) {
          let userFiles = HashMap.HashMap<Text, [FileChunk]>(0, Text.equal, Text.hash);
          for (name in fileNames.vals()) {
            userFiles.put(name, []);
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
