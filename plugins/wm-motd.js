/** Whether to register the plugin. Values: true / false */
const WM_MOTD_ENABLED = false;

/** A key in local storage to store whether the banner has been dismissed */
const WM_MOTD_STORAGE_KEY = 'wm-motd-2026-new-key_dismiss';

/** HTML message that is put inside the banner */
const WM_MOTD_MESSAGE = Polymer.html`
We have created a new SSH host key to replace the existing
(<a href="https://phabricator.wikimedia.org/T240266">
1024-bit RSA key
</a>). The new key is: <b>ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIFp+VIoTbE8Js9fwRCUy9KnSAewDQa2f6Dwi77R7IqS7</b> and has been added to the known_hosts supplied by the wmf-laptop package. For a transitional period both keys will be valid in parallel. On August 4th we will invalidate the old key.
`;

// Implementation
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
      ${WM_MOTD_MESSAGE}
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
    this.set('display', 'dismiss' !== window.localStorage.getItem(WM_MOTD_STORAGE_KEY));
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
    window.localStorage.setItem(WM_MOTD_STORAGE_KEY, 'dismiss');
    this.set('display', false);
  }

}

customElements.define(WikimediaMotdElement.is, WikimediaMotdElement);

window.Gerrit.install(plugin => {
  // Only attach the element to the endpoint if we have the configuration set
  if ( WM_MOTD_ENABLED ) {
    plugin.registerCustomComponent( 'banner', WikimediaMotdElement.is );
  }
});
