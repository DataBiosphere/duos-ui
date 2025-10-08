# Getting Started

## Table of Contents

### Set up for general GitHub resources
1. [Create a GitHub account](#1-create-a-github-account)
2. [Connect GitHub to Broad profile](#2-connect-github-to-broad-profile)
3. [Create GitHub token](#3-create-github-token)

### Set up for general Broad resources
4. [Request Broad GitHub Organization Access](#4-request-broad-github-organization-access)
5. [Install Development Tools](#5-install-development-tools)

### Set up for working on DUOS
6. [Request DUOS Team Access](#6-request-duos-team-access)
7. [Create Terra Accounts](#7-create-terra-accounts)
8. [Code Checkout](#8-code-checkout)
9. [Local DUOS-UI Setup](#9-local-duos-ui-setup)

### Resources
- [Team Resources](#team-resources)
- [Other Resources](#other-resources)

---

## Prerequisites

**Operating System**: These instructions are for MacOS.

**VPN Access**: 
- VPN is only required for certain tasks, not general development
- If you're on the internal Broad network, you can skip VPN setup
- If needed, follow the [VPN setup instructions](https://broad.io/vpn) (requires login and MFA)

**GitHub Credentials**: Have your GitHub username and password ready - you'll need them for multiple steps.

---

# Set up for general GitHub resources

## 1. Create a GitHub account

GitHub is where the Broad stores our code and projects. Sign up to this service with your personal or Broad email: https://github.com/join

## 2. Connect GitHub to Broad profile

> Make sure 2-factor authentication (2FA) is activated on your [Broad](https://broad.io/2fa) and [GitHub](https://github.com/settings/security) account before starting this process!

Connect your GitHub account to your Broad profile:

1. Go to [Broad people](https://people.broadinstitute.org/me) and select the **My Profile** tab.
2. Link your profile to GitHub by clicking under **Other Profiles**.
3. [Check if the account is successfully linked](https://github.broadinstitute.org/).
4. Open the following GitHub group and **Request to join** by going to the Members tab: [Broad Institute Read](https://github.com/orgs/broadinstitute/teams/broad-institute-read)

**OPTIONAL**: To avoid being overwhelmed with notifications:
- [Add your Broad email address](https://github.com/settings/emails)
- [Route the notifications](https://github.com/settings/notifications) to that email
- [Unfollow projects](https://github.com/watching) that are not relevant to your team

## 3. Create GitHub token

The GitHub token verifies team permissions. To create a token:

1. Go to the [GitHub Personal Access Token](https://github.com/settings/tokens) page and click **Generate new token** and choose the **classic token**.
2. Give the token a descriptive name, **only** give it the following two scopes and then click **Generate token**.
    * `read:org` scope under `admin:org`
    * `workflow` (this is used to kick off GitHub actions from the command line)
3. Store this token in a file:

```
GITHUB_TOKEN=<<GITHUB TOKEN VALUE>>
echo $GITHUB_TOKEN > ~/.github-token
```

---

# Set up for general Broad resources

## 4. Request Broad GitHub Organization Access

Ensure that you have access to the required team resources. If you encounter a permission error, it is likely because you are missing appropriate access.

- Within the `#dsp-devops-champions` Slack channel, message the DevOps team to Open a request to be added to the [DataBiosphere GitHub Org](https://github.com/orgs/DataBiosphere/people). 
- Once DevOps approves and notifies that you have been invited, check your email that is associated with your GitHub profile and accept the invitation. 
- **NOTE**: You have 7-days to accept the invitation once DevOps has invited you.

## 5. Install Development Tools

We use [**Homebrew**](https://brew.sh/) to automatically install all necessary development tools via a [Brewfile](https://github.com/Homebrew/homebrew-bundle).

### Installation Commands

**Install Homebrew:**
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

**Download and install development tools:**
```bash
curl -LO https://raw.githubusercontent.com/DataBiosphere/duos-ui/develop/docs/Brewfile
brew bundle --no-lock install
```

### Tools Installed

The `brew bundle` command will install these development tools:

1. **[Git](https://git-scm.com/)** is a version control tool for tracking changes in projects and `code`.
2. **[jq](https://stedolan.github.io/jq/)** is a command line JSON processing tool.
3. **[Docker](https://www.docker.com/)** is a tool to deliver software in packages called containers. Docker for MacOS also includes **[Kubernetes](https://kubernetes.io/)**, which deploys groups of containers together in clusters.
4. **[Volta](https://volta.sh/)** is a tool to manage installations of **`nodejs`** and its dependencies. The DUOS user interface is built using `nodejs`.
5. **[Google Cloud SDK](https://cloud.google.com/sdk)** is a command-line interface to Google Cloud services. Once it is installed, you'll need to allow auth access and configure Docker to connect to the appropriate Google Cloud endpoint when necessary, which is done with the configuration below.
6. **[IntelliJ IDEA](https://www.jetbrains.com/idea/)** is an integrated development environment (IDE) for Java. There are two versions available: **Ultimate** (paid) and **Community** (open-source). We recommend the Ultimate Edition to Broad employees for its database navigation capabilities. Alternatively, the Community Edition has all the features needed for development, and this version can be installed by switching `intellij-idea` with `intellij-idea-ce` in the Brewfile.
7. **[Visual Studio Code](https://code.visualstudio.com/)** is a lightweight but powerful source code editor with excellent support for JavaScript, TypeScript, and web development.

### Manual Configuration Steps

After the automatic installation, some manual configuration is necessary. The following commands can be copied and pasted all at once:

```bash
open -a docker
gcloud auth login
gcloud config set project broad-dsde-dev
gcloud auth application-default login
gcloud auth configure-docker
NODE_VERSION=$(curl -L https://raw.githubusercontent.com/DataBiosphere/duos-ui/develop/Dockerfile | awk 'NR==2 {gsub(":","@",$2); print $2}')
volta setup && volta install ${NODE_VERSION}
```

These commands will:
1. Launch Docker Desktop
2. Configure Google Cloud SDK authentication and set the project
3. Install the appropriate version of Node.js and its dependencies

---

# Set up for working on DUOS

## 6. Request DUOS Team Access

Ensure that you have access to the DUOS team resources. If you encounter a permission error, it is likely because you are missing appropriate access.

### Google Groups Access
- Ask a team member for access to the [DUOS team Google Group](https://groups.google.com/a/broadinstitute.org/g/ninjaturtles) (called "ninjaturtles"). 
- Verify that you're a member of [dsde-engineering](https://groups.google.com/a/broadinstitute.org/g/dsde-engineering). 
- These Google Groups are used for scheduling, email, and Google Drive document sharing, and are also used to control membership in GitHub teams in the `broadinstitute` organization.

### Jira Access
- Ask a team member to add you to the [DUOS board](https://broadworkbench.atlassian.net/jira/software/c/projects/DUOS/boards/123). 
- We use Jira to track all of our work including milestones, tasks, issues, and bugs.

---

## 7. Create Terra Accounts

DUOS and [Terra](https://terra.bio/) use [Sam](https://github.com/broadinstitute/sam) to abstract identity and access management. To gain access to these services, sign into each of the environments with your Broad account and follow the prompts:

- [Dev](https://bvdp-saturn-dev.appspot.com/)
- [Staging](https://bvdp-saturn-staging.appspot.com/)

For [production](https://app.terra.bio/), you will need to register using a `firecloud.org` email. In order to get an account, you must become suitable, which requires following [these steps](https://docs.google.com/document/d/1DRftlTe-9Q4H-R0jxanVojvyNn1IzbdIOhNKiIj9IpI/edit?usp=sharing).

Ask a member of the team to add you to the admin groups for each of these environments.

## 8. Code Checkout

> It may be useful to create a folder for Broad projects in your home directory to organize your work projects separately from personal projects.

Download the team's projects. The DUOS team maintains several related repositories:

```
git clone https://github.com/DataBiosphere/duos-ui.git
git clone https://github.com/DataBiosphere/consent.git
git clone https://github.com/DataBiosphere/consent-ontology.git
```

- **duos-ui**: The main user interface application
- **consent**: The backend API service
- **consent-ontology**: Ontology and data modeling components

See the `DEVNOTES.md` file in each repository for setup and local development.

## 9. Local DUOS-UI Setup

Refer to the `DEVNOTES.md` file in the `duos-ui` repository for detailed local development setup instructions.

---

# Resources

### Team Resources

1. [Google Drive](https://drive.google.com/drive/folders/1xYnk_-LrKM7CT2SVrqcuHJXPSsWpUQBH)
2. [DUOS Architecture](https://docs.google.com/document/d/1KFSxrS_nLKu3VLil-KutKNX_fJUwF_H8rbhzwWYTl5Q/edit)

### Other Resources

1. [How to Onboard](https://docs.google.com/document/d/11pZE-GqeZFeSOG0UpGg_xyTDQpgBRfr0MLxpxvvQgEw/edit?usp=sharing)
2. [How to Develop](https://docs.google.com/document/d/1foRggv6wfgz0PwO-mcl61a6OGdrSc0gN-a0YNpEaY-M/edit?usp=sharing)
