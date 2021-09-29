use std::path::Path;
use std::string::String;
use std::fs;

use serde::{Deserialize, Serialize};
use serde_json::Result;

mod git;
mod jira;

fn main() {
    let config: Result<Config> = parse_config();
    for repo in config.unwrap().repos {
        checkout_and_log_repo(repo.name, repo.tag_pattern.clone(), repo.from_commit.clone(), repo.to_commit.clone());
    }
}

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

#[derive(Serialize, Deserialize)]
struct Config {
    repos: Vec<Repo>
}

#[derive(Serialize, Deserialize)]
struct Repo {
    name: String,
    tag_pattern: Option<String>,
    from_commit: Option<String>,
    to_commit: Option<String>,
}

fn parse_config() -> Result<Config> {
    let data: String = fs::read_to_string("./config.json").unwrap();
    let c: Config = serde_json::from_str(data.as_str())?;
    Ok(c)
}
