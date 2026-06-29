"""
Permission definitions based on PERMISSIONS_MATRIX.md

Scopes:
- PUBLIC: JWT not required (roles/owner/assignee do not apply and must be ignored by authorize())
- GLOBAL: JWT required, no organization membership required
- ORG: JWT required + organization membership required

Convention (only for scope=org):
- Organization admins are NOT listed in roles (admin override in authorize()).
- roles=[]  means "admin only" (no non-admin role can perform this action).
Convention (for scope=global):
- roles is ignored by authorize() — any authenticated user can perform the action.
- roles=[] to reflect that no role restriction applies.
"""

PERMISSIONS = {
	#--User--
	"auth:register":
	{
		"scope": "public",
		"roles": [],
		"owner_allowed": False,
		"assignee_allowed": False,
	},
	"auth:login":
	{
		"scope": "public",
		"roles": [],
		"owner_allowed": False,
		"assignee_allowed": False,
	},
	"users:me:details":
	{
		"scope": "global",
		"roles": [],
		"owner_allowed": False,
		"assignee_allowed": False,
	},
	"users:me:update":
	{
		"scope": "global",
		"roles": [],
		"owner_allowed": False,
		"assignee_allowed": False,
	},
	"users:me:avatar":
	{
		"scope": "global",
		"roles": [],
		"owner_allowed": False,
		"assignee_allowed": False,
	},
	#--Legal--
	"legal:document:get":
	{
		"scope": "public",
		"roles": [],
		"owner_allowed": False,
		"assignee_allowed": False,
	},
	#--Organizations--
	"organizations:create":
	{
		"scope": "global",
		"roles": [],
		"owner_allowed": False,
		"assignee_allowed": False,
	},
	"organizations:rol":
	{
		"scope": "global",
		"roles": [],
		"owner_allowed": False,
		"assignee_allowed": False,
	},
	"organizations:join":
	{
		"scope": "global",
		"roles": [],
		"owner_allowed": False,
		"assignee_allowed": False,
	},
	"organizations:members:list":
	{
		"scope": "org",
		"roles": ["scrum_master", "product_owner", "developer"],
		"owner_allowed": False,
		"assignee_allowed": False,
	},
	"organizations:members:invite":
	{
		"scope": "org",
		"roles": [],
		"owner_allowed": False,
		"assignee_allowed": False,
	},
	"organizations:members:remove":
	{
		"scope": "org",
		"roles": [],
		"owner_allowed": False,
		"assignee_allowed": False,
	},
	#--Tickets--
	"organizations:tickets:create":
	{
		"scope": "org",
		"roles": ["scrum_master", "product_owner"],
		"owner_allowed": False,
		"assignee_allowed": False,
	},
	"organizations:tickets:list":
	{
		"scope": "org",
		"roles": ["scrum_master", "product_owner", "developer"],
		"owner_allowed": False,
		"assignee_allowed": False,
	},
	"tickets:details":
	{
		"scope": "org",
		"roles": ["scrum_master", "product_owner", "developer"],
		"owner_allowed": False,
		"assignee_allowed": False,
	},
	"tickets:update":
	{
		"scope": "org",
		"roles": ["scrum_master", "product_owner"],
		"owner_allowed": False,
		"assignee_allowed": False,
		"restricted_fields": {
			"priority": ["product_owner"]  # Only these roles can update this field
		}
	},
	"tickets:move":
	{
		"scope": "org",
		"roles": ["scrum_master", "product_owner"],
		"owner_allowed": False,
		"assignee_allowed": False,
	},
	"tickets:delete":
	{
		"scope": "org",
		"roles": ["scrum_master", "product_owner"],
		"owner_allowed": False,
		"assignee_allowed": False,
	},
	#--Tasks--
	"tickets:tasks:create":
	{
		"scope": "org",
		"roles": ["scrum_master", "product_owner", "developer"],
		"owner_allowed": False,
		"assignee_allowed": False,
	},
	"tickets:tasks:list":
	{
		"scope": "org",
		"roles": ["scrum_master", "product_owner", "developer"],
		"owner_allowed": False,
		"assignee_allowed": False,
	},
	"tasks:details":
	{
		"scope": "org",
		"roles": ["scrum_master", "product_owner", "developer"],
		"owner_allowed": False,
		"assignee_allowed": False,
	},
	"tasks:update":
	{
		"scope": "org",
		"roles": ["scrum_master", "product_owner"],
		"owner_allowed": True,
		"assignee_allowed": True,
	},
	"tasks:delete":
	{
		"scope": "org",
		"roles": ["scrum_master", "product_owner"],
		"owner_allowed": True,
		"assignee_allowed": False,
	},
	#--Standups--
	"organizations:standups:create":
	{
		"scope": "org",
		"roles": ["scrum_master", "product_owner", "developer"],
		"owner_allowed": False,
		"assignee_allowed": False,
	},
	"organizations:standups:list":
	{
		"scope": "org",
		"roles": ["scrum_master", "product_owner", "developer"],
		"owner_allowed": False,
		"assignee_allowed": False,
	},
	"standups:details":
	{
		"scope": "org",
		"roles": ["scrum_master", "product_owner", "developer"],
		"owner_allowed": False,
		"assignee_allowed": False,
	},
	"standups:update":
	{
		"scope": "org",
		"roles": [],
		"owner_allowed": True,
		"assignee_allowed": False,
	},
	"standups:delete":
	{
		"scope": "org",
		"roles": [],
		"owner_allowed": True,
		"assignee_allowed": False,
	},
	#--Blockers--
	"organizations:blockers:create":
	{
		"scope": "org",
		"roles": ["scrum_master", "product_owner", "developer"],
		"owner_allowed": False,
		"assignee_allowed": False,
	},
	"organizations:blockers:list":
	{
		"scope": "org",
		"roles": ["scrum_master", "product_owner", "developer"],
		"owner_allowed": False,
		"assignee_allowed": False,
	},
	"blockers:details":
	{
		"scope": "org",
		"roles": ["scrum_master", "product_owner", "developer"],
		"owner_allowed": False,
		"assignee_allowed": False,
	},
	"blockers:update":
	{
		"scope": "org",
		"roles": ["scrum_master", "product_owner"],
		"owner_allowed": True,
		"assignee_allowed": False,
	},
	"blockers:resolve":
	{
		"scope": "org",
		"roles": ["scrum_master", "product_owner"],
		"owner_allowed": True,
		"assignee_allowed": True,
	},
	#--Dashboard--
	"organizations:dashboard:get":
	{
		"scope": "org",
		"roles": ["scrum_master", "product_owner", "developer"],
		"owner_allowed": False,
		"assignee_allowed": False,
	},
}
