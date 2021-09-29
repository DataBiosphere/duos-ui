use std::path::Path;
use std::string::String;

mod git;
mod jira;

// TODOs:
// 1. Do this as via configuration options
// 2. Add docs everywhere

fn main() {
    checkout_and_log_repo("duos-ui".to_string(), Some("production_".to_string()), None, None);
    checkout_and_log_repo("consent".to_string(), None, None, None);
    checkout_and_log_repo("consent-ontology".to_string(), None, None, None);
}

// For each repo ...
// 1. check out
// 2. get array of RC/pattern tags (default is "refs/tags/RC_")
// 3. generate formatted messages from_commit (default is previous release tag) -> to_commit (default HEAD)
// 4. delete checked out repo
fn checkout_and_log_repo(directory: String, tag_pattern: Option<String>, from_commit: Option<String>, to_commit: Option<String>) {
    let exists: bool = Path::new(directory.clone().as_str()).is_dir();
    if !exists {
        git::checkout_repo(directory.clone());
    }
    let tags: Vec<String> = git::list_tags(directory.clone(), tag_pattern.unwrap_or("refs/tags/RC_".to_string()));
    let from: String = from_commit.unwrap_or(tags.clone().get(tags.len() - 1).unwrap().clone());
    let to: String = to_commit.unwrap_or(git::get_head_commit(directory.clone()));
    let messages: Vec<String> = git::get_commit_messages(directory.clone(), from, to);
    let linked_messages: Vec<String> = jira::update_with_jira_link(messages);
    print!("\n\n{}\n", directory.clone());
    for s in linked_messages { println!("{}", s); }
}