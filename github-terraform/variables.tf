variable "github_token" {
  description = "The GitHub Personal Access Token."
  type        = string
  sensitive   = true
}

variable "repository_name" {
  description = "The name of the GitHub repository."
  type        = string
  default     = "xgueret.github.io"
}

variable "repository_description" {
  description = "A description for the GitHub repository"
  type        = string
  default     = "Managed by Terraform: my github page"
}

variable "visibility" {
  description = "The visibility of the GitHub repository (public or private)."
  type        = string
  default     = "public"
}

variable "custom_domain" {
  description = "Custom domain (CNAME) for GitHub Pages. Leave empty to use the default *.github.io URL."
  type        = string
  default     = "xgueret.tipunchlabs.fr"
}