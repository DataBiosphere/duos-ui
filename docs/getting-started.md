# Getting Started

These instructions assume you use MacOS, and that you are on the internal Broad network or the VPN. If the VPN is not installed, follow the instructions [at this link](https://broad.io/vpn).

> During this process, you will need your GitHub username and password for multiple steps, so make sure to have those handy. If you don't have those yet, see the section below, otherwise you can skip to [Connect accounts](#2-connect-accounts).

## 1. Create a GitHub account

GitHub is where the Broad stores our code and projects. Sign up to this service with your personal or Broad email: https://github.com/join

## 2. Connect accounts

> Make sure 2-factor authentication (2FA) is activated on your [Broad](https://broad.io/2fa) and [GitHub](https://github.com/settings/security) account before starting this process!

Connect your GitHub account to your Broad profile:

1. Go to [Broad people](https://people.broadinstitute.org/me) and select the **My Profile** tab.
2. Link your profile to GitHub by clicking under **Other Profiles**.
3. [Check if the account is successfully linked](https://github.broadinstitute.org/).
4. Open each of the following GitHub groups and **Request to join** by going to the Members tab: [Broad Institute Read](https://github.com/orgs/broadinstitute/teams/broad-institute-read), [Prometheus](https://github.com/orgs/broadinstitute/teams/prometheus), [DSDE Engineering](https://github.com/orgs/broadinstitute/teams/dsde-engineering)
5. To avoid being overwhelmed with notifications, [add your Broad email address](https://github.com/settings/emails), [route the notifications](https://github.com/settings/notifications) to that email, and [unfollow projects](https://github.com/watching) that are not relevant to your team.

## 3. Request Required Access

Ensure that you have access to the required team resources. If you encounter a permission error, it is likely because you are missing appropriate access.

- DataBiosphere: Join the `#github` Slack channel, click the lightning bolt in the channel header, and select `Join DataBiosphere`.  Once you've been granted access to DataBiosphere, ask a team member to add your GitHub user to the [broadinstitute/duos](https://github.com/orgs/broadinstitute/teams/duos/members) and [databiosphere/duos](https://github.com/orgs/DataBiosphere/teams/duos/members) groups. This will give you access to our code repositories. You should also be a member of [broadwrite](https://github.com/orgs/DataBiosphere/teams/broadwrite); this should be done automatically when you're added to the DataBiosphere organization.
- Google Groups: Ask a team member for access to the [duos](https://groups.google.com/a/broadinstitute.org/g/ninjaturtles) Google Group. Verify that you're a member of [dsde-engineering](https://groups.google.com/a/broadinstitute.org/g/dsde-engineering), [dsp-engineering-internal](https://groups.google.com/a/broadinstitute.org/g/dsp-engineering-internal), and [workbench-dev](https://groups.google.com/a/broadinstitute.org/g/workbench-dev). These Google Groups are used for scheduling, email, and Google Drive document sharing, and are also used to control membership in GitHub teams in the `broadinstitute` organization.
- Jira: Ask a team member to add you to the [DUOS board](https://broadworkbench.atlassian.net/jira/software/c/projects/DUOS/boards/123). We use Jira to track all of our work including milestones, tasks, issues, and bugs.

## 4. Create Terra Accounts

DUOS and [Terra](https://terra.bio/) use [Sam](https://github.com/broadinstitute/sam) to abstract identity and access management. To gain access to these services, first create a non-Broad email address through Gmail. This email address will specifically be used for development purposes in our non-prod environments. Next, to register as a new user, click the `Sign in with Google` button in each of the environments with the newly created email address and follow the prompts:

- [Dev](https://bvdp-saturn-dev.appspot.com/)
- [Alpha](https://bvdp-saturn-alpha.appspot.com/)
- [Staging](https://bvdp-saturn-staging.appspot.com/)

For [production](https://app.terra.bio/), you will need to register using a `firecloud.org` email. In order to get an account, you must become suitable, which requires following [these steps](https://docs.google.com/document/d/1DRftlTe-9Q4H-R0jxanVojvyNn1IzbdIOhNKiIj9IpI/edit?usp=sharing).

Ask a member of the team to add you to the admin groups for each of these environments.

## 5. Install Homebrew

[Homebrew](https://brew.sh/) is a [package manager](https://en.wikipedia.org/wiki/Package_manager) which enables the installation of software using a single, convenient command line interface. To automatically install development tools necessary for the team, a [Brewfile](https://github.com/Homebrew/homebrew-bundle) is used:

```
/usr/bin/ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
curl -LO https://raw.githubusercontent.com/DataBiosphere/duos-ui/develop/docs/Brewfile
brew bundle --no-lock install
```

Running the `brew` command above will install the following tools:

1. [Git](https://git-scm.com/) is a version control tool for tracking changes in projects and code.
2. [git-secrets](https://github.com/awslabs/git-secrets) prevents developers from committing passwords and secrets to git.
3. [jq](https://stedolan.github.io/jq/) is a command line JSON processing tool.
4. [Docker](https://www.docker.com/) is a tool to deliver software in packages called containers. Docker for MacOS also includes [Kubernetes](https://kubernetes.io/), which deploys groups of containers together in clusters.
5. [Vault](https://www.vaultproject.io/) is an encrypted database used to store many of the team's secrets such as keys and passwords.
6. [Volta](https://volta.sh/) is a tool to manage installations of [`nodejs`](https://nodejs.org/en/) and its dependencies. The DUOS user interface is built using `nodejs`.
7. [Google Cloud SDK](https://cloud.google.com/sdk) is a command-line interface to Google Cloud services. Once it is installed, you'll need to allow auth access and configure Docker to connect to the appropriate Google Cloud endpoint when necessary, which is done with the configuration below.
8. [IntelliJ IDEA](https://www.jetbrains.com/idea/) is an integrated development environment (IDE) for Java. There are two versions available: **Ultimate** (paid) and **Community** (open-source). We recommend the Ultimate Edition to Broad employees for its database navigation capabilities. Alternatively, the Community Edition has all the features needed for development, and this version can be installed by switching `intellij-idea` with `intellij-idea-ce` in the Brewfile.
9. [Postgres](https://www.postgresql.org/) is an advanced open-source database.

Unfortunately, some manual configuration is also necessary:

```
# configure vault
export VAULT_ADDR=https://clotho.broadinstitute.org:8200

# launch docker desktop - this installs docker in /usr/local/bin
open -a docker

# launch postgres.app
# 1. click the sidebar icon (bottom left-hand corner) and then click the plus sign
# 2. name the new server, making sure to select version 11 and then initialize it
open -a postgres

# configure google-cloud-sdk
gcloud auth login
gcloud auth application-default login
gcloud auth configure-docker

# ensure that git-secrets patterns are installed
git clone https://github.com/broadinstitute/dsp-appsec-gitsecrets-client.git
./dsp-appsec-gitsecrets-client/gitsecrets.sh

# install the appropriate version of nodejs and its dependencies
NODE_VERSION=$(curl -L https://raw.githubusercontent.com/DataBiosphere/duos-ui/develop/Dockerfile | awk 'NR==2 {gsub(":","@",$2); print $2}')
volta setup && volta install ${NODE_VERSION}
```

## 6. Create GitHub token

The GitHub token verifies team permissions. This token is necessary for the next step, [Login to Vault](#9-login-to-vault). To create a token:

1. Go to the [GitHub Personal Access Token](https://github.com/settings/tokens) page and click **Generate new token**.
2. Give the token a descriptive name, **only** give it the following two scopes and then click **Generate token**.
    * `read:org` scope under `admin:org`
    * `workflow` (this is used to kick off GitHub actions from the command line)
4. Store this token in a file:

```
GITHUB_TOKEN=<<GITHUB TOKEN VALUE>>
echo $GITHUB_TOKEN > ~/.github-token
```

## 7. Login to Vault

Vault access tokens can be obtained using the GitHub token from earlier as follows:

```
vault login -method=github token=$(cat ~/.github-token)
```

> Vault access tokens expire after 30 days, so if you get a `403` error trying to use `vault`, re-run the `vault login` command to refresh your access token.

## 8. Code Checkout

> It may be useful to create a folder for Broad projects in your home directory.

Download the team's projects:

```
git clone https://github.com/DataBiosphere/duos-ui.git
git clone https://github.com/DataBiosphere/consent.git
git clone https://github.com/DataBiosphere/consent-ontology.git
```

See the `DEVNOTES.md` file in each repository for setup and local development.

## Resources

### Team Resources

1. [Google Drive](https://drive.google.com/drive/folders/1xYnk_-LrKM7CT2SVrqcuHJXPSsWpUQBH)
2. [DUOS Architecture](https://docs.google.com/document/d/1KFSxrS_nLKu3VLil-KutKNX_fJUwF_H8rbhzwWYTl5Q/edit)

### Other Resources

1. [How to Onboard](https://docs.google.com/document/d/11pZE-GqeZFeSOG0UpGg_xyTDQpgBRfr0MLxpxvvQgEw/edit?usp=sharing)
2. [How to Develop](https://docs.google.com/document/d/1foRggv6wfgz0PwO-mcl61a6OGdrSc0gN-a0YNpEaY-M/edit?usp=sharing)
