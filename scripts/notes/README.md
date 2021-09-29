## Release Note Generation

This utility iterates over tags in the relevant repositories and generates formatted commit messages for each one.

Requires Rust
* https://rustup.rs/
* https://doc.rust-lang.org/stable/book/title-page.html

Running from the IDE
* navigate to `main.rs`
* execute `Run` in your IDE

Running from the command line
* navigate to `notes` directory
* execute `cargo run --package notes --bin notes`

By default, this will look back to the previous tag and 
find all commits from that tag to HEAD. A future enhancement 
might be to use a config that allows the user to predefine 
from-to commit hashes for a more narrow range of commits. 