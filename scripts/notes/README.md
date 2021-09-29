## Release Note Generation

This utility iterates over tags in the relevant repositories and generates 
formatted commit messages for each one.

Requires Rust
* https://rustup.rs/
* https://doc.rust-lang.org/stable/book/title-page.html

Running from the IDE
* navigate to `main.rs`
* execute `Run` in your IDE

Running from the command line
* navigate to `notes` directory
* execute `cargo run --package notes --bin notes`

By default, this will look back to the most recent release tag and 
find all commits from that tag to HEAD. This behavior can be changed
by updating `config.json`. Add a `from_commit` and/or a `to_commit` 
to each repo that requires customized log generation. Commits 
specified in this way can be either tags or hashes as it relies 
on the underlying command line `git` implementation.
