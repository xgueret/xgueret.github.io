---
title: "Setting Up a Pre-Commit Hook to Verify Files Are Encrypted with Ansible Vault"
date: "2024-10-27"
author: "Xavier GUERET"
tags:
  - "ansible"
  - "ansible-vault"
  - "bash"
  - "pre-commit"
  - "python"
categories:
  - "Tutorials"
image: "/images/posts/hook-pre-commit.png"
---

In this tutorial, we'll set up a *[pre-commit](https://pre-commit.com/) hook* to ensure that all files in the `secret` directory are encrypted with `ansible-vault` before allowing them to be committed to Git. This ensures that sensitive information remains secure.

## Prerequisites

- **Python** (needed to install the `pre-commit` tool)
- **Ansible** (for `ansible-vault`)

## Step 1: Install `pre-commit`

First, install the `pre-commit` tool:

```shell
pip install pre-commit
```

`pre-commit` allows us to define automatic checks that run before each commit, such as checking for encrypted files.

## Step 2: Create the Pre-Commit Configuration

At the root of your project, create a `.pre-commit-config.yaml` file to specify the hook configuration.

```shell
repos:
  - repo: local
    hooks:
      - id: check-ansible-vault
        name: Check Ansible Vault Encryption
        entry: bash check_ansible_vault.sh
        language: system
        files: ^secret/.*$
        stages: [pre-commit]

```

#### Parameter Explanation

- `repo: local` : this indicates that this hook is local, i.e., specific to your project.
- `entry: bash check_ansible_vault.sh` : the hook will execute a script called `check_ansible_vault.sh`.
- `files: ^secret/.*$` : limits the hook to files in the `secret` directory.
- `stages: [commit]` : applies this hook at the commit stage.

## Step 3: Create the Validation Script

Next, we need to create the `check_ansible_vault.sh` script that will check if each file in `secret` is encrypted with `ansible-vault`.

1. At the root of your project, create a file named `check_ansible_vault.sh`.
2. Open the file and add the following content:

```shell
#!/bin/bash

# Loop through each file provided as an argument by pre-commit
for file in "$@"; do
    # Check if the file is encrypted with ansible-vault
    if ! ansible-vault view "$file" &>/dev/null; then
        echo "Error: The file $file is not encrypted with ansible-vault."
        exit 1
    fi
done

```

This script:

- Loops through each file provided as an argument by `pre-commit` in the `secret` directory.
- Uses `ansible-vault view` to check if the file is encrypted (without displaying its content).
- If a file is not encrypted, it prints an error message and returns an exit code `1`, blocking the commit.

1. Make the script executable by running the following command:

   ```shell
   chmod +x check_ansible_vault.sh
   ```

## Step 4: Install the Pre-Commit Hook

Install the hook in your project so it runs automatically before each commit:

```shell
pre-commit install
```

This adds a Git hook that will invoke `pre-commit` before each commit.

## Step 5: Test the Hook

1. Try to commit an unencrypted file in the `secret` directory to verify that the hook is working correctly. You should see an error message indicating that the file is not encrypted.
2. If everything is working correctly, commits will only proceed if all files in `secret` are properly encrypted with `ansible-vault`.



## Conclusion

With this *pre-commit hook*, you ensure that all sensitive files in `secret` are protected by `ansible-vault` before being committed.
