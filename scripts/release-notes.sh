#!/usr/bin/env bash

# This script is used to print a formatted list of commits between two tags.
# By design, it is intended to look back at the last two tags. That can be
# adjusted by changing the values of `from_commit` and `to_commit` in `log_repo`
# Since we tag Consent and Ontology releases differently from DUOS releases,
# we need to be flexible on the pattern that `log_repo` uses.

log_repo() {
  # $1: Repo, i.e. "https://github.com/DataBiosphere/duos-ui"
  # $2: Repo Title, i.e. "DUOS"
  # $3: Tag Filter Pattern, i.e. "staging_", "production_" or "RC_"
  from_commit=-2 # Goes back to the second to last commit
  to_commit=-1   # Goes back to the last commit

  # Checkout repo and generate an ordered array of tag commit hashes matching the tag filter pattern
  {
    rm -rf tempdir
    mkdir -p tempdir
    git clone "$1.git" tempdir
    cd tempdir || exit
    array=()
    while IFS='' read -r line; do array+=("$line"); done < <(git for-each-ref --sort=creatordate --format '%(refname)' | grep "refs/tags/$3" | sed 's/refs\/tags\///')
  } &> /dev/null # Hide output from these commands

  # Generate a formatted summary of each commit from the earlier to the later tag hash
  printf '\n## %s Changes' "$2"
  printf '\n%s/releases/tag/%s\n' "$1" "${array[to_commit]}"
  git --no-pager log --reverse --pretty="format:$1/commit/%h - %s (%an)" "${array[from_commit]}".."${array[to_commit]}"
  printf '\n'
  {
    cd ../
    rm -rf tempdir
  } &> /dev/null # Hide output from these commands
}

log_repo "https://github.com/DataBiosphere/duos-ui" "DUOS" "production_"
log_repo "https://github.com/DataBiosphere/consent" "Consent" "RC_"
log_repo "https://github.com/DataBiosphere/consent-ontology" "Ontology" "RC_"
printf '\n'
