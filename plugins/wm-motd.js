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
        to {
          height: 0;
          padding: 0;
        }
      }

    </style>
    <div id="banner" class$="[[_computeBannerClass(display)]]">
      Take the
      <a href="https://wikimediafoundation.limesurvey.net/796964">
      2023 Developer Satisfaction Survey
      </a>
      (<a href="https://foundation.wikimedia.org/wiki/Legal:December_2023_Developer_Satisfaction_Survey">
      privacy statement
      </a>) to help identify areas for improvement and measure
      satisfaction within the Wikimedia developer community.
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
    return 'wm-motd-2023-dev-survey_dismiss';
  }

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
  plugin.registerCustomComponent( 'banner', WikimediaMotdElement.is );
});
