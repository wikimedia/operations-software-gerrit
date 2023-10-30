'use strict';

// Mock plugin invocation of `window.Gerrit.install()`
class MockChecksPluginApi {
  register( /** provider, config */ ) { }
}
// Mock for `plugin.hook(xxx).onAttached(callback)`
class MockHookApi {
  onAttached( /** callback */ ) {}
}
class MockPluginApi {
  checks() { return new MockChecksPluginApi(); }
  hook() { return new MockHookApi(); }
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
