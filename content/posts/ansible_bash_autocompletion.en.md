+++
title= "Activating Ansible Auto-completion with Argcomplete"
date= "2024-09-28"
author= "Xavier GUERET"
tags= [
    "ansible", 
    "bash", 
    "auto-completion", 
    "argcomplete"]
categories= [
    "ansible",
    ]
+++

## Activating Ansible Auto-completion with Argcomplete

Terminal auto-completion is a valuable tool for improving efficiency when using Ansible. By setting up `argcomplete`, you can enjoy Bash auto-completion for Ansible commands. Follow these steps to enable auto-completion in your Bash terminal.

### Steps to enable `argcomplete` for Ansible

1. **Install `argcomplete`**:

   If `argcomplete` isn't installed yet, you can use `pip` to install it:

   ```shell
   pip install argcomplete
   ```

2. **Activate global auto-completion**: 

   Once `argcomplete` is installed, activate global auto-completion by running:

   ```shell
   activate-global-python-argcomplete
   ```

   This command modifies your `~/.bashrc` file to register auto-completion automatically.

3. **Apply the changes**: 

   Reload your `~/.bashrc` file to apply the changes:

   ```shell
   source ~/.bashrc
   ```

4. **Test auto-completion for Ansible**: 

   Test auto-completion by typing an Ansible command followed by the `Tab` key:

   ```shell
   ansible-playbook <Tab>
   ```


### Optional configuration

If you'd like to manually register auto-completion for each Ansible command, add the following lines to your `~/.bashrc` file:

```shell
eval "$(register-python-argcomplete ansible)"
eval "$(register-python-argcomplete ansible-playbook)"
eval "$(register-python-argcomplete ansible-config)"
eval "$(register-python-argcomplete ansible-doc)"
eval "$(register-python-argcomplete ansible-galaxy)"
eval "$(register-python-argcomplete ansible-inventory)"
eval "$(register-python-argcomplete ansible-pull)"
eval "$(register-python-argcomplete ansible-vault)"
```

Then reload `~/.bashrc` :

```shell
source ~/.bashrc
```

## Conclusion

By configuring `argcomplete`, you enable Ansible auto-completion in Bash, greatly simplifying the use of this powerful tool.:tada:
