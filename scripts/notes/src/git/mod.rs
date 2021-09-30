use std::process::{Command, Output};

use git2::*;
use regex::Regex;

/// Get the url for the repo
pub fn get_remote_origin_url(dir: String) -> String {
    // git -C consent config --get remote.origin.url
    let command: Output = Command::new("git")
        .arg("-C")
        .arg(dir.clone())
        .arg("config")
        .arg("--get")
        .arg("remote.origin.url")
        .output()
        .expect(format!("failed to list origin url: {}", dir.clone()).as_str());
    let origin: String = String::from_utf8(command.stdout)
        .unwrap()
        .lines()
        .next()
        .unwrap()
        .to_string();
    return origin;
}

/// Get formatted commit messages between from and to commits
pub fn get_commit_messages(dir: String, from: String, to: String) -> Vec<String> {
    let origin_url: String = get_remote_origin_url(dir.clone());
    // git -C consent --no-pager log --reverse "--pretty={url}/commit/%h - %s (%an)" {from}..{to}
    let command: Output = Command::new("git")
        .arg("-C")
        .arg(dir.clone())
        .arg("--no-pager")
        .arg("log")
        .arg("--reverse")
        .arg(format!("--pretty={}/commit/%h - %s (%an)", origin_url).as_str())
        .arg(format!("{}..{}", from, to))
        .output()
        .expect(format!("failed to list commits for {}", dir.clone()).as_str());
    let stdout: String = String::from_utf8(command.stdout).unwrap();
    let messages: Vec<String> = stdout
        .lines()
        .map(|s| s.to_string())
        .collect();
    return messages;
}

/// Get 8 character hash for HEAD
pub fn get_head_commit(dir: String) -> String {
    // git -C consent rev-parse --short=8 HEAD
    let command: Output = Command::new("git")
        .arg("-C")
        .arg(dir.clone())
        .arg("rev-parse")
        .arg("--short=8")
        .arg("HEAD")
        .output()
        .expect(format!("failed to get head commit for {}", dir.clone()).as_str());
    let hash: String = String::from_utf8(command.stdout)
        .unwrap()
        .lines()
        .next()
        .unwrap()
        .to_string();
    return hash;
}

/// List all repo tags matching a provided pattern.
/// Typically used to find all tags of a "Release" type.
pub fn list_tags(dir: String, tag_pattern: String) -> Vec<String> {
    let tag_regex: Regex = Regex::new(tag_pattern.as_str()).unwrap();
    let leading: Regex = Regex::new("^'").unwrap();
    let trailing: Regex = Regex::new("'$").unwrap();
    // git -C consent for-each-ref --sort=creatordate --format '%(refname)'
    let git_refs: Output = Command::new("git")
        .arg("-C")
        .arg(dir.clone())
        .arg("for-each-ref")
        .arg("--sort=creatordate")
        .arg("--format")
        .arg("'%(refname)'")
        .output()
        .expect(format!("failed to list tags for {}", dir.clone()).as_str());

    let stdout: String = String::from_utf8(git_refs.stdout).unwrap();
    let tags: Vec<String> = stdout
        .lines()
        // Retain all entries that match the tag pattern
        .filter(|s| tag_regex.is_match(s))
        .map(|s| s.to_string())
        // Trim the leading and trailing 's from the tag strings
        .map(|s| leading.replace_all(s.as_str(), "").into_owned())
        .map(|s| trailing.replace_all(s.as_str(), "").into_owned())
        .collect();
    return tags;
}

/// Clone repo into directory of the same name.
pub fn checkout_repo(repo: String) {
    Repository::clone(
        format!("https://github.com/DataBiosphere/{}", repo.clone()).as_str(),
        repo.clone().as_str(),
    ).expect(format!("failed to clone repository: {}", repo.clone()).as_str());
}

#[cfg(test)]
mod tests {
    use std::fs;
    use std::path::Path;
    use std::sync::Once;

    use super::*;

    static INIT: Once = Once::new();
    static DIR: &str = "consent";

    pub fn initialize() {
        INIT.call_once(|| {
            println!("Initializing...");
            let exists: bool = Path::new(DIR.clone()).is_dir();
            if exists {
                println!("Removing existing repo ... ");
                fs::remove_dir_all(DIR).unwrap_or_else(|why| {
                    println!("Error: {:?}", why.kind())
                });
            }
            checkout_repo(DIR.to_string());
            println!("Done.");
        });
    }

    #[test]
    fn test_list_tags() {
        initialize();
        let exists: bool = Path::new(DIR.clone()).is_dir();
        assert!(exists);
        let tags: Vec<String> = list_tags(DIR.clone().to_string(), "RC_".to_string());
        assert!(tags.len() > 0);
    }

    #[test]
    fn test_get_head_commit() {
        initialize();
        let head = get_head_commit(DIR.to_string());
        assert!(head.len() > 0);
    }

    #[test]
    fn test_get_remote_origin_url() {
        initialize();
        let url = get_remote_origin_url(DIR.to_string());
        assert!(url.len() > 0);
    }

    #[test]
    fn test_get_commit_messages() {
        initialize();
        let tags: Vec<String> = list_tags(DIR.clone().to_string(), "RC_".to_string());
        let messages = get_commit_messages(
            DIR.to_string(),
            tags.clone().get(tags.len() - 1).unwrap().clone(),
            get_head_commit(DIR.to_string()));
        assert!(messages.len() > 0);
    }
}
