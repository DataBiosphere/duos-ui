use std::fs;

use serde::{Deserialize, Serialize};
use serde_json::Result;

#[derive(Serialize, Deserialize)]
pub struct Config {
    pub repos: Vec<Repo>,
}

#[derive(Serialize, Deserialize)]
pub struct Repo {
    pub name: String,
    pub tag_pattern: Option<String>,
    pub from_commit: Option<String>,
    pub to_commit: Option<String>,
}

/// Parse existing configuration
pub fn parse_config(path: &str) -> Result<Config> {
    let data: String = fs::read_to_string(path).unwrap();
    let c: Config = serde_json::from_str(data.as_str())?;
    Ok(c)
}
