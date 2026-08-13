#!/bin/bash
# Reassigns the Signing Official on the most recently submitted DAR that is
# awaiting SO approval, so that DAR shows up on your own SO console for testing.
# Candidates are limited to researchers at the given SO's institution, because
# the SO console lists collections by researcher institution
# (DarCollectionSummaryDAO#getDarCollectionSummariesForSO) — a DAR from anywhere
# else would stay invisible there no matter who its SO is.
#
# The consent backend gates the SO approval flow on
# data->>'signingOfficialEmail' matching the logged-in user's email
# (DarCollectionService#updateSummaryActionsForSO and
# #validateSigningOfficialApproval), so that JSON field is what this script
# rewrites. requires_so_approval / approving_so_id are left alone: the target
# DAR is selected precisely because it already requires approval and has not
# been approved yet.
#
# DB credentials are read from the local consent deployment's config file
# (default /workspaces/consent/config/consent.yaml). Requires either psql on
# PATH or a running Postgres container to exec into.
#
# See usage section below.

set -eu
set -o pipefail

usage() {
    cat <<EOF
Usage: $0 SO_EMAIL [OPTION]...
Point the most recently submitted DAR awaiting SO approval at a given Signing
Official. Only DARs from researchers at that Signing Official's institution are
considered, since the SO console lists collections by researcher institution.

  SO_EMAIL              Email address of the user to set as the Signing Official
  --config PATH         Consent config file to read DB credentials from
                        (default: $CONFIG_FILE)
  --host HOST           Database host (default: $DB_HOST). The host in the config
                        file's JDBC url is the docker-compose service name, which
                        only resolves inside the compose network, so it is not used.
  --port PORT           Database port (default: taken from the config file's JDBC url)
  --container NAME      Postgres container to exec into when psql is not on PATH
                        (default: $DB_CONTAINER)
  --dry-run             Show what would be changed without writing anything
  --help                Display this help and exit
EOF
    exit 0
}

error() {
    echo "ERROR: $1" >&2
    exit 1
}

# default values that may be overridden by command line arguments
CONFIG_FILE="/workspaces/consent/config/consent.yaml"
DB_HOST="localhost"
DB_PORT=""
DB_CONTAINER="localdb"
DRY_RUN="false"
SO_EMAIL=""

parse_cli_args() {
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --config)
                CONFIG_FILE=$2
                shift 2
                ;;
            --host)
                DB_HOST=$2
                shift 2
                ;;
            --port)
                DB_PORT=$2
                shift 2
                ;;
            --container)
                DB_CONTAINER=$2
                shift 2
                ;;
            --dry-run)
                DRY_RUN="true"
                shift
                ;;
            --help)
                usage
                ;;
            -*)
                error "Unknown option: $1. Try --help to see a list of all options."
                ;;
            *)
                if [[ -n "$SO_EMAIL" ]]; then
                    error "Unexpected argument: $1. Only one Signing Official email may be given."
                fi
                SO_EMAIL=$1
                shift
                ;;
        esac
    done

    if [[ -z "$SO_EMAIL" ]]; then
        error "A Signing Official email address is required. Try --help."
    fi
}

# Echoes the value of a key from the config's database block.
db_config_value() {
    echo "$DB_BLOCK" | sed -n "s/^[[:space:]]*$1:[[:space:]]*//p" | head -1
}

# Pulls user, password and the JDBC url out of the top-level `database:` block
# of the consent config. The awk block ends at the next unindented line, so
# keys of the same name in other blocks are never picked up.
read_db_config() {
    [[ -f "$CONFIG_FILE" ]] || error "Config file not found: $CONFIG_FILE"

    DB_BLOCK=$(awk '/^database:/{flag=1; next} /^[^[:space:]]/{flag=0} flag' "$CONFIG_FILE")

    DB_USER=$(db_config_value user)
    DB_PASSWORD=$(db_config_value password)
    local jdbc_url
    jdbc_url=$(db_config_value url)

    [[ -n "$DB_USER" && -n "$DB_PASSWORD" && -n "$jdbc_url" ]] ||
        error "Could not read user/password/url from the database block of $CONFIG_FILE"

    # e.g. jdbc:postgresql://sqlproxy:5432/consent -> port 5432, database consent
    DB_NAME=${jdbc_url##*/}
    if [[ -z "$DB_PORT" ]]; then
        local host_port=${jdbc_url%/*}
        host_port=${host_port##*/}
        DB_PORT=${host_port##*:}
        [[ "$DB_PORT" =~ ^[0-9]+$ ]] || DB_PORT=5432
    fi

    echo "Using database '$DB_NAME' as user '$DB_USER' (credentials from $CONFIG_FILE)"
}

# Prefers a local psql; otherwise runs psql inside the Postgres container, which
# is how the local dev stack is normally reachable.
choose_psql_runner() {
    if command -v psql > /dev/null 2>&1; then
        PSQL_MODE="local"
        echo "Connecting with local psql at $DB_HOST:$DB_PORT"
    elif command -v docker > /dev/null 2>&1 && docker ps --format '{{.Names}}' | grep -qx "$DB_CONTAINER"; then
        PSQL_MODE="docker"
        echo "psql not found on PATH; running psql inside the '$DB_CONTAINER' container"
    else
        error "Need either psql on PATH or a running '$DB_CONTAINER' container. Is the local database up?"
    fi
}

# Runs a statement read from stdin. Any arguments are passed through to psql,
# which is how callers set output formatting and -v variables.
run_sql() {
    if [[ "$PSQL_MODE" == "local" ]]; then
        PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
            -v ON_ERROR_STOP=1 "$@"
    else
        docker exec -i -e PGPASSWORD="$DB_PASSWORD" "$DB_CONTAINER" \
            psql -U "$DB_USER" -d "$DB_NAME" -v ON_ERROR_STOP=1 "$@"
    fi
}

# Confirms the target user exists and can actually act as a Signing Official.
lookup_signing_official() {
    local row
    row=$(run_sql -tA -F '|' -v so_email="$SO_EMAIL" <<'SQL'
SELECT u.user_id,
       COALESCE(u.display_name, ''),
       COALESCE(u.institution_id::text, ''),
       COALESCE(i.institution_name, ''),
       COALESCE((SELECT string_agg(DISTINCT r.name, ', ' ORDER BY r.name)
                 FROM user_role ur JOIN roles r ON r.role_id = ur.role_id
                 WHERE ur.user_id = u.user_id), '')
FROM users u
LEFT JOIN institution i ON i.institution_id = u.institution_id
WHERE LOWER(u.email) = LOWER(:'so_email');
SQL
    )

    [[ -n "$row" ]] || error "No user found with email $SO_EMAIL"
    [[ $(echo "$row" | wc -l) -eq 1 ]] || error "Multiple users found with email $SO_EMAIL"

    IFS='|' read -r SO_USER_ID SO_DISPLAY_NAME SO_INSTITUTION_ID SO_INSTITUTION_NAME SO_ROLES <<< "$row"

    if [[ ",$SO_ROLES," != *"SigningOfficial"* ]]; then
        error "User $SO_EMAIL (id $SO_USER_ID) does not have the SigningOfficial role. Roles: ${SO_ROLES:-none}"
    fi

    # Without an institution there is nothing for the SO console to list, since
    # it selects collections by the researcher's institution
    # (DarCollectionSummaryDAO#getDarCollectionSummariesForSO).
    if [[ -z "$SO_INSTITUTION_ID" ]]; then
        error "User $SO_EMAIL (id $SO_USER_ID) has no institution, so no DAR can appear on their SO console"
    fi

    echo "Signing Official: ${SO_DISPLAY_NAME:-$SO_EMAIL} <$SO_EMAIL> (user_id $SO_USER_ID, institution ${SO_INSTITUTION_NAME:-none})"
}

# Reports how many DARs are awaiting SO approval outside the target
# institution, so a no-candidates failure says whether the data set is empty or
# just belongs to other institutions.
count_dars_awaiting_approval_elsewhere() {
    run_sql -tA -v so_institution_id="$SO_INSTITUTION_ID" <<'SQL'
SELECT COUNT(*)
FROM data_access_request d
JOIN users u ON u.user_id = d.user_id
WHERE d.requires_so_approval IS TRUE
  AND d.approving_so_id IS NULL
  AND d.submission_date IS NOT NULL
  AND d.data IS NOT NULL
  AND (u.institution_id IS DISTINCT FROM :'so_institution_id'::bigint);
SQL
}

# The most recently submitted DAR that still needs an SO to act on it: flagged
# as requiring approval, submitted, and not yet approved by anyone. Restricted
# to researchers at the target SO's institution, since the SO console filters
# on that and a DAR from any other institution would stay invisible there.
find_target_dar() {
    local row
    row=$(run_sql -tA -F '|' -v so_institution_id="$SO_INSTITUTION_ID" <<'SQL'
SELECT d.id,
       c.dar_code,
       d.submission_date,
       COALESCE(d.data ->> 'signingOfficialEmail', ''),
       u.email
FROM data_access_request d
JOIN dar_collection c ON c.collection_id = d.collection_id
JOIN users u ON u.user_id = d.user_id
WHERE d.requires_so_approval IS TRUE
  AND d.approving_so_id IS NULL
  AND d.submission_date IS NOT NULL
  AND d.data IS NOT NULL
  AND u.institution_id = :'so_institution_id'::bigint
ORDER BY d.submission_date DESC
LIMIT 1;
SQL
    )

    if [[ -z "$row" ]]; then
        local elsewhere
        elsewhere=$(count_dars_awaiting_approval_elsewhere)
        echo "ERROR: No submitted DAR from a researcher at ${SO_INSTITUTION_NAME:-institution $SO_INSTITUTION_ID} is awaiting SO approval." >&2
        if [[ "$elsewhere" -gt 0 ]]; then
            echo "       $elsewhere such DAR(s) exist at other institutions, but reassigning one would not make it" >&2
            echo "       visible on this SO's console. Submit a DAR as a researcher at this institution, or pick an" >&2
            echo "       SO whose institution already has one." >&2
        else
            echo "       No DAR anywhere is currently awaiting SO approval. Submit one that requires SO approval first." >&2
        fi
        exit 1
    fi

    IFS='|' read -r DAR_ID DAR_CODE DAR_SUBMISSION_DATE DAR_CURRENT_SO_EMAIL RESEARCHER_EMAIL <<< "$row"

    echo "Target DAR: $DAR_CODE (id $DAR_ID) submitted $DAR_SUBMISSION_DATE by $RESEARCHER_EMAIL"
    echo "  current Signing Official: ${DAR_CURRENT_SO_EMAIL:-none}"
}

# Rewrites both SO fields the DAR form maintains: the email the backend
# authorizes against, and the "Name (email)" display string shown on the
# application (ResearcherInfo's formatSOString).
assign_signing_official() {
    if [[ "$DRY_RUN" == "true" ]]; then
        echo "Dry run: would set the Signing Official on $DAR_CODE to $SO_EMAIL. No changes made."
        return
    fi

    run_sql -v dar_id="$DAR_ID" -v so_id="$SO_USER_ID" <<'SQL'
UPDATE data_access_request d
SET data = jsonb_set(
             jsonb_set(d.data, '{signingOfficialEmail}', to_jsonb(u.email)),
             '{signingOfficial}',
             to_jsonb(COALESCE(NULLIF(u.display_name, ''), u.email) || ' (' || u.email || ')')),
    update_date = now()
FROM users u
WHERE d.id = :'dar_id'::bigint
  AND u.user_id = :'so_id'::bigint
RETURNING d.id AS dar_id,
          d.data ->> 'signingOfficial' AS signing_official,
          d.data ->> 'signingOfficialEmail' AS signing_official_email;
SQL

    echo "Done. $DAR_CODE now awaits approval from $SO_EMAIL."
}

parse_cli_args "$@"
read_db_config
choose_psql_runner
lookup_signing_official
find_target_dar
assign_signing_official
