load(":gitiles_external_plugin_deps.bzl", gitiles="external_plugin_deps")
load(":go_import_external_plugin_deps.bzl", go_import="external_plugin_deps")
load(":javamelody_external_plugin_deps.bzl", javamelody="external_plugin_deps")
load(":lfs_external_plugin_deps.bzl", lfs="external_plugin_deps")
load(":webhooks_external_plugin_deps.bzl", webhooks="external_plugin_deps")
load(":wikimedia_external_plugin_deps.bzl", wikimedia="external_plugin_deps")

def external_plugin_deps():
    gitiles()
    go_import()
    javamelody()
    lfs()
    webhooks()
    wikimedia()
