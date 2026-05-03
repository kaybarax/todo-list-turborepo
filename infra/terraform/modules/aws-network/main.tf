terraform {
  required_version = ">= 1.9.0"

  required_providers {
    aws = {
      source = "hashicorp/aws"
    }
  }
}

variable "project" {
  description = "Project name used for resource naming."
  type        = string
}

variable "environment" {
  description = "Deployment environment name."
  type        = string
}

variable "aws_region" {
  description = "AWS region where this module is deployed."
  type        = string
}

variable "tags" {
  description = "Common AWS tags to apply to resources."
  type        = map(string)
  default     = {}
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC."
  type        = string
  default     = "10.40.0.0/16"
}

variable "availability_zones" {
  description = "Availability zones to use. Defaults to the first two available zones in the region."
  type        = list(string)
  default     = []
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public ALB/NAT subnets."
  type        = list(string)
  default     = ["10.40.0.0/20", "10.40.16.0/20"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private ECS service subnets."
  type        = list(string)
  default     = ["10.40.64.0/20", "10.40.80.0/20"]
}

variable "database_subnet_cidrs" {
  description = "CIDR blocks for isolated database subnets. Private subnets are reused when this is empty."
  type        = list(string)
  default     = []
}

variable "enable_nat_gateway" {
  description = "Whether private subnets receive default egress through NAT."
  type        = bool
  default     = true
}

variable "single_nat_gateway" {
  description = "Whether to create one NAT gateway instead of one per public subnet."
  type        = bool
  default     = true
}

variable "enable_vpc_endpoints" {
  description = "Whether to create common VPC endpoints for private ECS tasks."
  type        = bool
  default     = true
}

variable "allowed_http_cidr_blocks" {
  description = "CIDR blocks allowed to reach public ALB HTTP/HTTPS listeners."
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "api_container_port" {
  description = "API container port accepted from the ALB."
  type        = number
  default     = 3001
}

locals {
  module_name = "aws-network"
  name_prefix = "${var.project}-${var.environment}"
  azs         = length(var.availability_zones) > 0 ? var.availability_zones : slice(data.aws_availability_zones.available.names, 0, max(length(var.public_subnet_cidrs), length(var.private_subnet_cidrs), length(var.database_subnet_cidrs), 2))
  tags        = merge(var.tags, { managed_by = "terraform" })

  database_subnet_ids = length(aws_subnet.database) > 0 ? aws_subnet.database[*].id : aws_subnet.private[*].id

  interface_endpoint_services = [
    "ecr.api",
    "ecr.dkr",
    "logs",
    "secretsmanager",
    "ssm",
    "ssmmessages",
    "ec2messages",
  ]
}

data "aws_availability_zones" "available" {
  state = "available"
}

resource "aws_vpc" "this" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-vpc"
  })
}

resource "aws_internet_gateway" "this" {
  vpc_id = aws_vpc.this.id

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-igw"
  })
}

resource "aws_subnet" "public" {
  count = length(var.public_subnet_cidrs)

  vpc_id                  = aws_vpc.this.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = local.azs[count.index % length(local.azs)]
  map_public_ip_on_launch = true

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-public-${count.index + 1}"
    tier = "public"
  })
}

resource "aws_subnet" "private" {
  count = length(var.private_subnet_cidrs)

  vpc_id            = aws_vpc.this.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = local.azs[count.index % length(local.azs)]

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-private-${count.index + 1}"
    tier = "private"
  })
}

resource "aws_subnet" "database" {
  count = length(var.database_subnet_cidrs)

  vpc_id            = aws_vpc.this.id
  cidr_block        = var.database_subnet_cidrs[count.index]
  availability_zone = local.azs[count.index % length(local.azs)]

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-database-${count.index + 1}"
    tier = "database"
  })
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.this.id

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-public"
  })
}

resource "aws_route" "public_internet" {
  route_table_id         = aws_route_table.public.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.this.id
}

resource "aws_route_table_association" "public" {
  count = length(aws_subnet.public)

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_eip" "nat" {
  count = var.enable_nat_gateway ? (var.single_nat_gateway ? 1 : length(aws_subnet.public)) : 0

  domain = "vpc"

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-nat-${count.index + 1}"
  })
}

resource "aws_nat_gateway" "this" {
  count = var.enable_nat_gateway ? (var.single_nat_gateway ? 1 : length(aws_subnet.public)) : 0

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index % length(aws_subnet.public)].id

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-nat-${count.index + 1}"
  })

  depends_on = [aws_internet_gateway.this]
}

resource "aws_route_table" "private" {
  count = length(aws_subnet.private)

  vpc_id = aws_vpc.this.id

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-private-${count.index + 1}"
  })
}

resource "aws_route" "private_nat" {
  count = var.enable_nat_gateway ? length(aws_route_table.private) : 0

  route_table_id         = aws_route_table.private[count.index].id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.this[var.single_nat_gateway ? 0 : count.index % length(aws_nat_gateway.this)].id
}

resource "aws_route_table_association" "private" {
  count = length(aws_subnet.private)

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

resource "aws_route_table" "database" {
  count = length(aws_subnet.database)

  vpc_id = aws_vpc.this.id

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-database-${count.index + 1}"
  })
}

resource "aws_route_table_association" "database" {
  count = length(aws_subnet.database)

  subnet_id      = aws_subnet.database[count.index].id
  route_table_id = aws_route_table.database[count.index].id
}

resource "aws_security_group" "alb" {
  name        = "${local.name_prefix}-alb"
  description = "Public ALB ingress"
  vpc_id      = aws_vpc.this.id

  tags = merge(local.tags, {
    Name    = "${local.name_prefix}-alb"
    service = "api"
  })
}

resource "aws_security_group_rule" "alb_http" {
  type              = "ingress"
  from_port         = 80
  to_port           = 80
  protocol          = "tcp"
  cidr_blocks       = var.allowed_http_cidr_blocks
  security_group_id = aws_security_group.alb.id
}

resource "aws_security_group_rule" "alb_https" {
  type              = "ingress"
  from_port         = 443
  to_port           = 443
  protocol          = "tcp"
  cidr_blocks       = var.allowed_http_cidr_blocks
  security_group_id = aws_security_group.alb.id
}

resource "aws_security_group_rule" "alb_egress" {
  type              = "egress"
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.alb.id
}

resource "aws_security_group" "api" {
  name        = "${local.name_prefix}-api"
  description = "API ECS service"
  vpc_id      = aws_vpc.this.id

  tags = merge(local.tags, {
    Name    = "${local.name_prefix}-api"
    service = "api"
  })
}

resource "aws_security_group_rule" "api_from_alb" {
  type                     = "ingress"
  from_port                = var.api_container_port
  to_port                  = var.api_container_port
  protocol                 = "tcp"
  source_security_group_id = aws_security_group.alb.id
  security_group_id        = aws_security_group.api.id
}

resource "aws_security_group_rule" "api_egress" {
  type              = "egress"
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.api.id
}

resource "aws_security_group" "ingestion" {
  name        = "${local.name_prefix}-ingestion"
  description = "Ingestion ECS worker"
  vpc_id      = aws_vpc.this.id

  tags = merge(local.tags, {
    Name    = "${local.name_prefix}-ingestion"
    service = "ingestion"
  })
}

resource "aws_security_group_rule" "ingestion_egress" {
  type              = "egress"
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.ingestion.id
}

resource "aws_security_group" "database" {
  name        = "${local.name_prefix}-database"
  description = "MongoDB-compatible database access"
  vpc_id      = aws_vpc.this.id

  tags = merge(local.tags, {
    Name    = "${local.name_prefix}-database"
    service = "database"
  })
}

resource "aws_security_group_rule" "database_from_services" {
  for_each = {
    api       = aws_security_group.api.id
    ingestion = aws_security_group.ingestion.id
  }

  type                     = "ingress"
  from_port                = 27017
  to_port                  = 27017
  protocol                 = "tcp"
  source_security_group_id = each.value
  security_group_id        = aws_security_group.database.id
}

resource "aws_security_group_rule" "database_egress" {
  type              = "egress"
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.database.id
}

resource "aws_security_group" "redis" {
  name        = "${local.name_prefix}-redis"
  description = "Redis access"
  vpc_id      = aws_vpc.this.id

  tags = merge(local.tags, {
    Name    = "${local.name_prefix}-redis"
    service = "redis"
  })
}

resource "aws_security_group_rule" "redis_from_services" {
  for_each = {
    api       = aws_security_group.api.id
    ingestion = aws_security_group.ingestion.id
  }

  type                     = "ingress"
  from_port                = 6379
  to_port                  = 6379
  protocol                 = "tcp"
  source_security_group_id = each.value
  security_group_id        = aws_security_group.redis.id
}

resource "aws_security_group_rule" "redis_egress" {
  type              = "egress"
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.redis.id
}

resource "aws_security_group" "observability" {
  name        = "${local.name_prefix}-observability"
  description = "Observability collector access"
  vpc_id      = aws_vpc.this.id

  tags = merge(local.tags, {
    Name    = "${local.name_prefix}-observability"
    service = "observability"
  })
}

resource "aws_security_group_rule" "observability_from_services" {
  for_each = {
    api       = aws_security_group.api.id
    ingestion = aws_security_group.ingestion.id
  }

  type                     = "ingress"
  from_port                = 4317
  to_port                  = 4318
  protocol                 = "tcp"
  source_security_group_id = each.value
  security_group_id        = aws_security_group.observability.id
}

resource "aws_security_group_rule" "observability_egress" {
  type              = "egress"
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.observability.id
}

resource "aws_security_group" "vpc_endpoints" {
  count = var.enable_vpc_endpoints ? 1 : 0

  name        = "${local.name_prefix}-vpc-endpoints"
  description = "Interface VPC endpoint access"
  vpc_id      = aws_vpc.this.id

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-vpc-endpoints"
  })
}

resource "aws_security_group_rule" "vpc_endpoints_ingress" {
  count = var.enable_vpc_endpoints ? 1 : 0

  type              = "ingress"
  from_port         = 443
  to_port           = 443
  protocol          = "tcp"
  cidr_blocks       = [var.vpc_cidr]
  security_group_id = aws_security_group.vpc_endpoints[0].id
}

resource "aws_security_group_rule" "vpc_endpoints_egress" {
  count = var.enable_vpc_endpoints ? 1 : 0

  type              = "egress"
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.vpc_endpoints[0].id
}

resource "aws_vpc_endpoint" "interface" {
  for_each = var.enable_vpc_endpoints ? toset(local.interface_endpoint_services) : toset([])

  vpc_id              = aws_vpc.this.id
  service_name        = "com.amazonaws.${var.aws_region}.${each.value}"
  vpc_endpoint_type   = "Interface"
  subnet_ids          = aws_subnet.private[*].id
  security_group_ids  = [aws_security_group.vpc_endpoints[0].id]
  private_dns_enabled = true

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-${replace(each.value, ".", "-")}"
  })
}

resource "aws_vpc_endpoint" "s3" {
  count = var.enable_vpc_endpoints ? 1 : 0

  vpc_id            = aws_vpc.this.id
  service_name      = "com.amazonaws.${var.aws_region}.s3"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = aws_route_table.private[*].id

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-s3"
  })
}

output "module_name" {
  description = "Logical module name."
  value       = local.module_name
}

output "tags" {
  description = "Resolved common tags for this module."
  value       = local.tags
}

output "vpc_id" {
  description = "VPC ID."
  value       = aws_vpc.this.id
}

output "vpc_cidr_block" {
  description = "VPC CIDR block."
  value       = aws_vpc.this.cidr_block
}

output "public_subnet_ids" {
  description = "Public subnet IDs."
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "Private subnet IDs."
  value       = aws_subnet.private[*].id
}

output "database_subnet_ids" {
  description = "Database subnet IDs, or private subnet IDs when no dedicated database subnets are configured."
  value       = local.database_subnet_ids
}

output "security_group_ids" {
  description = "Security group IDs by workload."
  value = {
    alb           = aws_security_group.alb.id
    api           = aws_security_group.api.id
    ingestion     = aws_security_group.ingestion.id
    database      = aws_security_group.database.id
    redis         = aws_security_group.redis.id
    observability = aws_security_group.observability.id
    vpc_endpoints = var.enable_vpc_endpoints ? aws_security_group.vpc_endpoints[0].id : null
  }
}
