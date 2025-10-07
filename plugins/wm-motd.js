class WikimediaMotdElement extends Polymer.Element {

  static get is() { return 'wm-motd'; }

  static get properties() {
    return {
      display: {
        type: Boolean,
      }
    };
  }

  static get template() {
    return Polymer.html`
    <style>
      a {
        color: var(--link-color);
        text-decoration: none;
      }
      #banner {
        padding: 0.5em;

        animation:
          2s ease-in 10s both fade,
          1s ease-in 12s both vanish;
      }

      div#dismisser {
        display: inline;
        margin-left: 3em;
      }

      .hideBanner {
        display: none;
      }

      @keyframes fade {
        from {
          color: var(--warning-foreground);
          background-color: var(--warning-background);
        }
        to  {
          color: var(--info-foreground);
          background-color: var(--info-background);
        }
      }
      @keyframes vanish {
        from {
            height: auto;
        }
        to {
          height: 0;
          padding: 0;
        }
      }

    </style>
    <div id="banner" class$="[[_computeBannerClass(display)]]">
      Gerrit will be under maintenance on
      <a href="https://zonestamp.toolforge.org/1759752000">
      Monday, 6 Oct 2025, 12:00–13:00 UTC
      </a>.
      During the maintenance, the system will be read-only
      (<a href="https://phabricator.wikimedia.org/T387833">T387833)<a>).
      <div id="dismisser">
        <gr-button
          on-click="_setDismiss"
        >
          Dismiss
        </gr-button>
      </div>
    </div>
    `;
  }

  ready() {
    super.ready();
    this.set('display', 'dismiss' !== window.localStorage.getItem(this._itemKey()));
  }

  _itemKey() {
    return 'wm-motd-2025-gerrit-switchover-20251006_dismiss';
  }

  /**
   * @param {boolean} display The element property: whether the banner is to be
   * displayed.
   * @return {string} The css class matching the intent (can be empty)
   */
  _computeBannerClass(display) {
    return display ? '' : 'hideBanner';
  }

  _setDismiss() {
    window.localStorage.setItem(this._itemKey(), 'dismiss');
    this.set('display', false);
  }

}

customElements.define(WikimediaMotdElement.is, WikimediaMotdElement);

window.Gerrit.install(plugin => {
  if ( false ) { // eslint-disable-line no-constant-condition
    plugin.registerCustomComponent( 'banner', WikimediaMotdElement.is );
  }
});
