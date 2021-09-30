use std::fs;
use std::path::Path;
use std::string::String;

use serde::{Deserialize, Serialize};
use serde_json::Result;
use titlecase::titlecase;

mod git;
mod jira;

fn main() {
    let config: Result<Config> = parse_config();
    // TODO: Parallelize
    for repo in config.unwrap().repos {
        let header: Vec<String> = vec![format!("\n\n{}:", titlecase(repo.name.clone().as_str()))];
        let messages: Vec<String> = checkout_and_generate_log_messages(repo.name, repo.tag_pattern.clone(), repo.from_commit.clone(), repo.to_commit.clone());
        for m in [header, messages].concat() {
            println!("{}", m);
        }
    }
}

fn checkout_and_generate_log_messages(directory: String, tag_pattern: Option<String>, from_commit: Option<String>, to_commit: Option<String>) -> Vec<String> {
    let exists: bool = Path::new(directory.clone().as_str()).is_dir();
    if !exists {
        git::checkout_repo(directory.clone());
    }
    let tags: Vec<String> = git::list_tags(directory.clone(), tag_pattern.unwrap_or("refs/tags/RC_".to_string()));
    let from: String = from_commit.unwrap_or(tags.clone().get(tags.len() - 1).unwrap().clone());
    let to: String = to_commit.unwrap_or(git::get_head_commit(directory.clone()));
    let messages: Vec<String> = git::get_commit_messages(directory.clone(), from, to);
    return jira::update_with_jira_link(messages);
}

#[derive(Serialize, Deserialize)]
struct Config {
    repos: Vec<Repo>,
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
