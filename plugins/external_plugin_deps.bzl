load(":gitiles/external_plugin_deps.bzl", gitiles="external_plugin_deps")
load(":go-import/external_plugin_deps.bzl", go_import="external_plugin_deps")
load(":lfs/external_plugin_deps.bzl", lfs="external_plugin_deps")
load(":webhooks/external_plugin_deps.bzl", webhooks="external_plugin_deps")

def external_plugin_deps():
    gitiles()
    go_import()
    lfs()
    webhooks()
