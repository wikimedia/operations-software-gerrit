'use strict';

// Mock plugin invocation of `window.Gerrit.install()
class MockChecksPluginApi {
  register( /** provider, config */ ) { }
}
class MockPluginApi {
  checks() { return new MockChecksPluginApi(); }
}
class MockGerrit {
  install(plugin) { plugin( new MockPluginApi() ); }
}
global.window = {
  Gerrit: new MockGerrit()
};
