use std::collections::BTreeMap;
use std::path::Path;
use std::string::String;
use std::sync::{Arc, Mutex};

use rayon::prelude::*;
use serde_json::Result;
use titlecase::titlecase;

use config::Config;

mod config;
mod git;
mod jira;

fn main() {
    let config: Result<Config> = config::parse_config("./config.json");

    // Store repo->commit messages in alpha order
    // See https://stackoverflow.com/questions/30559073/cannot-borrow-captured-outer-variable-in-an-fn-closure-as-mutable
    // for why we need to wrap the map in Arc<Mutex<>>. ~TLDR, we need to synchronize on the map
    let message_map: Arc<Mutex<BTreeMap<String, Vec<String>>>> = Arc::new(Mutex::new(BTreeMap::new()));
    config.unwrap().repos.par_iter().for_each(|repo| {
        let title: String = repo.title.clone().unwrap_or(titlecase(repo.name.clone().as_str()));
        let header: Vec<String> = vec![format!("\n\n{}:", title)];
        let messages: Vec<String> = checkout_and_generate_log_messages(repo.name.clone(), repo.tag_pattern.clone(), repo.from_commit.clone(), repo.to_commit.clone());
        message_map.lock().unwrap().insert(title.clone(), [header, messages].concat());
    });

    message_map.lock().unwrap().iter().for_each(|entries| {
        entries.1.iter().for_each(|m| println!("{}", m));
    });
}

/// Generates a list of commit messages from the provided DataBiosphere repo
///
/// * Checks out DataBiosphere repository defined in `directory`
/// * Optionally looks for a history of git tags matching pattern `tag_pattern`.
///   * Unnecessary if both `from_commit` and `to_commit` are defined.
/// * Optionally looks for a from commit in `from_commit`. If not defined,
/// assign `from_commit` to the most recent tag in the list of tags generated from
/// `tag_pattern`
/// * Optionally look for a to commit in `to_commit`. If not defined, assign
/// the hash of `HEAD` to `to_commit`
///
/// # Examples
///
/// Basic usage:
///
/// ```
/// let messages = checkout_and_generate_log_messages("consent", "RC_", None, None);
/// ```
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
