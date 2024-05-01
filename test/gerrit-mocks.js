'use strict';

// Mock plugin invocation of `window.Gerrit.install()`
class MockChecksPluginApi {
  register( /** provider, config */ ) { }
}
// Mock for `plugin.hook(xxx).onAttached(callback)`
class MockHookApi {
  onAttached( /** callback */ ) {}
}
// Mock for `plugin.restApi().post()`
class MockRestPluginApi {
  post( ) {}
}

class MockPluginApi {
  checks() { return new MockChecksPluginApi(); }
  hook() { return new MockHookApi(); }
  restApi() { return new MockRestPluginApi(); }
  registerCustomComponent() {}
}
class MockGerrit {
  install(plugin) { plugin( new MockPluginApi() ); }
}

class PolymerElement {
}

global.window = {
  Gerrit: new MockGerrit(),
};
global.Polymer = {
  Element: PolymerElement
};
global.customElements = {
  define: () => {},
};
