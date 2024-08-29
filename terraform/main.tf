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
}

output "repository_url" {
  value = github_repository.githubpage.html_url
}