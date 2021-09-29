use std::string::String;

use regex::{Captures, Regex};

const JIRA_URL: &str = "https://broadworkbench.atlassian.net/browse/";
const REGEX_STR: &str = "(DUOS-[0-9]+)";

pub fn update_with_jira_link(messages: Vec<String>) -> Vec<String> {
    let new_messages: Vec<String> = messages.clone().iter()
        .map(|m| update_line(m.to_string()))
        .collect();
    return new_messages;
}

fn update_line(line: String) -> String {
    let ticket_regex: Regex = Regex::new(REGEX_STR).unwrap();
    return if ticket_regex.is_match(line.as_str()) {
        let caps: Captures = ticket_regex.captures(line.as_str()).unwrap();
        let ticket: &str = caps.get(1).map_or("", |m| m.as_str());
        format!("{}[{}{}]", line, JIRA_URL, ticket)
    } else {
        line
    };
}
