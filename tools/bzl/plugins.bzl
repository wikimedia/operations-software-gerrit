CORE_PLUGINS = [
    "codemirror-editor",
    "commit-message-length-validator",
    "download-commands",
    "hooks",
    "replication",
    "reviewnotes",
    # "singleusergroup",
]

CUSTOM_PLUGINS = [
    # Add custom core plugins here
    "delete-project",
    "javamelody",
    "gitiles",
    "go-import",
    "healthcheck",
    "its-phabricator",
    "lfs",
    "motd",
    "reviewers",
    "webhooks",
    "zuul",
    "zuul-status",
]

CUSTOM_PLUGINS_TEST_DEPS = [
    # Add custom core plugins with tests deps here
    "go-import",
    "webhooks",
]
