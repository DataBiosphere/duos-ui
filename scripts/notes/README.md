## Release Note Generation

This utility generates formatted commit messages for each
configured github repository. By default, this assumes all
repos exist in https://github.com/DataBiosphere and that
all linkable jira tickets exist in https://broadworkbench.atlassian.net

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
on the underlying command line `git` installation.

### Configuration

Configurations are defined in [config.json](config.json)

* `name` is always required.
  * Name refers to the github repository name
* `title` is optional, defaults to title-cased `name` 
* `tag_pattern` is optional, defaults to `refs/tags/RC_`. 
  * Tag pattern is used to determine which tags are release tags. With an ordered array of these, we can navigate back to any release we might need to.
* `from_commit` is optional, defaults to the most recent release tag.
* `to_commit` is optional, defaults to the short hash of `HEAD`.

```json
{
  "repos": [
    {
      "name": "duos-ui",
      "title": "DUOS",
      "tag_pattern": "production_"
    },
    {
      "name": "consent",
      "tag_pattern": "refs/tags/RC_",
      "from_commit": "refs/tags/RC_Monolith-2021-09-27",
      "to_commit": "109abf7"
    },
    {
      "name": "consent-ontology",
      "tag_pattern": "refs/tags/RC_",
      "from_commit": "refs/tags/RC_Virgo-2021-09-07",
      "to_commit": "refs/tags/RC_Monolith-2021-09-27"
    }
  ]
}
```

### Testing

Run `cargo test` to run all tests
