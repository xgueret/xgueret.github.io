---
title: "My Proxmox homelab, fully automated with Ansible"
date: "2026-02-13"
author: "Xavier GUERET"
description: "How I automated the deployment and configuration of my Proxmox VE 9 server using Ansible and Cloud-Init."
tags:
  - "HomeLab"
  - "Proxmox"
  - "Ansible"
  - "Cloud-Init"
  - "IaC"
categories:
  - "Personal Projects"
image: "/images/posts/proxmox-homelab.png"
---
## Why this project?

Like many folks in the field, I had an old PC gathering dust — an Acer XC-605 — and the idea of turning it into a home server had been on my mind for a while. Proxmox VE was the obvious choice: open-source, powerful, and perfect for running VMs and containers without breaking the bank.

But installing Proxmox by hand, creating users, configuring storage, building VM templates… it's the kind of work you do once and forget about. Until the day you need to redo everything (disk failure, migration, new hardware), and suddenly you're digging through old notes and losing a weekend.

So I decided to code the whole thing. The result is the [TiPunchLabs/proxmox](https://github.com/TiPunchLabs/proxmox) project: a set of Ansible playbooks that takes a freshly installed Proxmox and configures it end to end, idempotently and reproducibly.

## What the project actually does

At its core, it's an Ansible playbook with a `configure` role that runs four stages, each independently executable via tags:

### 1. SSH hardening

First thing after a fresh install: lock down access. The playbook creates a dedicated `ansible` user with sudo privileges, deploys my SSH public key, then disables password authentication. Basic stuff, but essential.

```bash
ansible-playbook -u root playbook.yml --tags "security_ssh_hardening"
```

After that, no more root logins. Every subsequent run goes through the `ansible` user.

### 2. Proxmox API roles, users, and tokens

This was the most interesting part to automate. Proxmox has its own access management system (`pveum`), and manually creating API tokens with the right privileges is pretty tedious.

The playbook deploys a Bash script that reads a JSON file describing the tokens to create, then uses `pveum` to provision everything idempotently:

- A **Terraform** token (`terraform-prov@pve!terraform`) with 20 privileges — everything needed to create VMs, manage storage and networking.
- An **Ansible** token (`ansible-prov@pve!ansible`) with just 2 privileges (`VM.PowerMgmt`, `VM.Audit`) — the bare minimum to manage existing VMs.

Generated tokens are stored as JSON on the server, ready to be retrieved.

```bash
ansible-playbook playbook.yml --tags "setup_roles_users_tokens"
```

### 3. Storage configuration

My Acer has an SSD for the system and an extra HDD for backups and ISOs. The playbook partitions, formats, and mounts the disk, then registers it in Proxmox as a `dir` storage type with `backup,iso,vztmpl` content.

Everything is idempotent: if the disk is already partitioned, nothing happens. And a `configure_storage_force_format: false` flag prevents any accidental formatting.

```bash
ansible-playbook playbook.yml --tags "setup_storage"
```

### 4. Cloud-Init VM template generation

This is the meatiest part. The playbook downloads an Ubuntu cloud image (24.04 Noble by default), customizes it with `virt-customize`, then turns it into a Proxmox template ready to clone.

The customization includes:

- Installing `qemu-guest-agent` and `cloud-init`
- Creating an `ansible` user with SSH key and sudo access
- Setting the root password (stored in Ansible Vault)
- Enabling the serial console (workaround for an Ubuntu 24.04 issue)

Then the VM is created, the disk imported, boot options configured, and the whole thing is converted to a template. From there, cloning a ready-to-use VM takes seconds.

```bash
ansible-playbook playbook.yml --tags "generate_vm_template"
```

## Secrets management

This is something I spent real time on: making sure no secret ever appears in plaintext in the repository. The strategy relies on three layers:

- **Ansible Vault** for sensitive variables (VM passwords, token generation password). The vault file is AES256-encrypted.
- **pass** (the Unix password manager) to store the Vault password. A small `ansible-vault-pass.sh` script bridges the gap.
- **direnv** which automatically loads environment variables when I enter the project directory.

The result: I type `ansible-playbook playbook.yml` and everything unlocks in cascade, without ever prompting me for a password.

## Tooling and code quality

The project ships with quite a few guardrails to keep the code clean:

- **pre-commit** with 6 hooks: `shfmt`, `shellcheck`, `ansible-lint`, a custom check to verify Vault files are properly encrypted, `terraform fmt`, `terraform validate`, and `tflint`.
- **GitHub Actions CI** that runs Ansible, Terraform, and ShellCheck linting on every push/PR.
- **Dependabot** for automatic dependency updates.
- **uv** as the Python package manager — much faster than pip and nicely integrated with direnv.

## Installation

For those curious, installing Proxmox VE 9 on the Acer XC-605 requires a small tweak: at the boot menu, you need to edit the boot line (press `e`) and append `nomodeset` to the `linux` line, then press F10 to continue. Pretty standard for slightly older hardware.

## What's next?

The project is at v0.1.0 — a first release that lays the groundwork. A few ideas for what comes next:

- **Automatic token rotation** with notifications
- **Proper secrets manager integration** (HashiCorp Vault, Bitwarden CLI, or age/sops)
- **Replacing Bash scripts** with native Ansible modules for `pveum` operations
- **Scoping permissions**: today the ACLs are set on `/` (root path), the idea is to restrict them per resource

The project is open-source under the MIT license. If this kind of thing interests you, feel free to check out the [TiPunchLabs/proxmox](https://github.com/TiPunchLabs/proxmox) repository — contributions and feedback are welcome.
