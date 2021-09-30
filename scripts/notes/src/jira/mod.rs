use std::string::String;

use regex::{Captures, Regex};

const JIRA_URL: &str = "https://broadworkbench.atlassian.net/browse/";
const REGEX_STR: &str = "(DUOS-[0-9]+)";

/// For each message passed in, update the line with a link to a jira
/// ticket if one can be found in the message text.
pub fn update_with_jira_link(messages: Vec<String>) -> Vec<String> {
    let new_messages: Vec<String> = messages.clone().iter()
        .map(|m| update_line(m.to_string()))
        .collect();
    return new_messages;
}

/// Update the line with a link to a jira ticket if one can be found in
/// the message text.
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

#[cfg(test)]
mod tests {
    use crate::jira::JIRA_URL;
    use crate::jira::update_line;

    #[test]
    fn test_update_line_with_match() {
        let pattern = "DUOS-12345678910";
        let line = format!("random {}", pattern);
        let updated_line = update_line(line.to_string());
        assert!(updated_line.contains(JIRA_URL));
        assert!(updated_line.contains(pattern));
        assert!(updated_line.contains(&[JIRA_URL, pattern].join("")));
    }

    #[test]
    fn test_update_line_without_match() {
        let line = "random string";
        let updated_line = update_line(line.to_string());
        assert!(!updated_line.contains(JIRA_URL));
    }
}
