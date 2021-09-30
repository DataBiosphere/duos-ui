use std::error::Error;
use std::fs;

use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct Config {
    pub repos: Vec<Repo>,
}

#[derive(Serialize, Deserialize)]
pub struct Repo {
    pub name: String,
    pub title: Option<String>,
    pub tag_pattern: Option<String>,
    pub from_commit: Option<String>,
    pub to_commit: Option<String>,
}

/// Parse existing configuration
pub fn parse_config(path: &str) -> Result<Config, Box<dyn Error>> {
    let data: String = fs::read_to_string(path)?;
    let c: Config = serde_json::from_str(data.as_str())?;
    Ok(c)
}

#[cfg(test)]
mod tests {
    use std::error::Error;

    use crate::config::{Config, parse_config};

    #[test]
    fn test_parse_config() {
        let config: Result<Config, Box<dyn Error>> = parse_config("./config.json");
        assert!(config.unwrap().repos.len() > 0);
    }

    #[test]
    fn test_parse_config_failure() {
        let config: Result<Config, Box<dyn Error>> = parse_config("./missing.json");
        let error = config.err().unwrap();
        println!("Expected error case: {:?}", error);
        assert!(error.to_string().len() > 0)
    }
}
