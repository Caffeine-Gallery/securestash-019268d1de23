import Blob "mo:base/Blob";
import Bool "mo:base/Bool";
import Hash "mo:base/Hash";

import Array "mo:base/Array";
import HashMap "mo:base/HashMap";
import Iter "mo:base/Iter";
import Principal "mo:base/Principal";
import Text "mo:base/Text";

actor {
  type File = {
    name: Text;
    content: Blob;
  };

  private stable var fileEntries : [(Principal, [File])] = [];
  private var files = HashMap.HashMap<Principal, [File]>(0, Principal.equal, Principal.hash);

  public shared(msg) func isRegistered() : async Bool {
    files.get(msg.caller) != null
  };

  public shared(msg) func registerUser() : async () {
    if (files.get(msg.caller) == null) {
      files.put(msg.caller, []);
    };
  };

  public shared(msg) func uploadFile(name: Text, content: Blob) : async () {
    switch (files.get(msg.caller)) {
      case null {
        files.put(msg.caller, [{ name = name; content = content }]);
      };
      case (?userFiles) {
        files.put(msg.caller, Array.append(userFiles, [{ name = name; content = content }]));
      };
    };
  };

  public shared(msg) func getFiles() : async [{ name: Text }] {
    switch (files.get(msg.caller)) {
      case null { [] };
      case (?userFiles) {
        Array.map(userFiles, func (file: File) : { name: Text } {
          { name = file.name }
        })
      };
    };
  };

  public shared(msg) func getFile(name: Text) : async ?Blob {
    switch (files.get(msg.caller)) {
      case null { null };
      case (?userFiles) {
        switch (Array.find(userFiles, func (file: File) : Bool { file.name == name })) {
          case null { null };
          case (?file) { ?file.content };
        };
      };
    };
  };

  public shared(msg) func deleteFile(name: Text) : async Bool {
    switch (files.get(msg.caller)) {
      case null { false };
      case (?userFiles) {
        let newFiles = Array.filter(userFiles, func (file: File) : Bool { file.name != name });
        if (newFiles.size() < userFiles.size()) {
          files.put(msg.caller, newFiles);
          true
        } else {
          false
        };
      };
    };
  };

  system func preupgrade() {
    fileEntries := Iter.toArray(files.entries());
  };

  system func postupgrade() {
    files := HashMap.fromIter<Principal, [File]>(fileEntries.vals(), 1, Principal.equal, Principal.hash);
  };
};
