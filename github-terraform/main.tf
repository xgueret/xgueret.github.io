terraform {
  required_providers {
    github = {
      source  = "integrations/github"
      version = "~> 5.0"
    }
  }
}

provider "github" {
  token = var.github_token
}

resource "github_repository" "githubpage" {
  name        = var.repository_name
  description = var.repository_description
  visibility  = var.visibility

  pages {
    build_type = "workflow"
    source {
      branch = "main"
    }
  }
}

resource "github_branch_protection" "main" {
  repository_id = github_repository.githubpage.node_id
  pattern       = "main"

  enforce_admins      = false
  allows_deletions    = false
  allows_force_pushes = false

  required_status_checks {
    strict   = false
    contexts = [
      "Article validation",
      "Astro check",
      "Build",
    ]
  }
}

output "repository_url" {
  value = github_repository.githubpage.html_url
}