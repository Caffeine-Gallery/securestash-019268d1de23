import Bool "mo:base/Bool";
import Hash "mo:base/Hash";
import Text "mo:base/Text";

import Principal "mo:base/Principal";
import HashMap "mo:base/HashMap";
import Error "mo:base/Error";

actor {
  let users = HashMap.HashMap<Principal, Bool>(10, Principal.equal, Principal.hash);

  public shared(msg) func registerUser() : async Text {
    let caller = msg.caller;
    if (users.get(caller) == null) {
      users.put(caller, true);
      return "User registered successfully";
    } else {
      return "User already registered";
    }
  };

  public shared(msg) func isRegistered() : async Bool {
    let caller = msg.caller;
    switch (users.get(caller)) {
      case (null) { false };
      case (?isRegistered) { isRegistered };
    };
  };
}
