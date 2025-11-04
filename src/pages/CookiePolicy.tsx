import React from 'react'
import { Link } from 'react-router-dom'
import './PrivacyPolicy.css'

export default function CookiePolicy() {
  return (
    <div className="markdown-body">
      <h1>Cookie Policy</h1>
      <div>Last Updated: 04, November, 2025</div>
      <div>This Cookie Policy relates to your use of duos.org</div>
      <div>
        When you choose to accept or reject cookies in DUOS, your choices are valid for DUOS only. If you click
        through to another website, whether operated by us or a third party you will need to make separate
        choices in relation to the Cookies that you would like to accept or reject on that other website.
        These websites will set cookies in accordance with their own policies, which are separate from ours.
        Please consult these separate policies as appropriate.
      </div>
      <div>
        For more information as to how DUOS uses your information, please see our
        <Link to="/privacy">Privacy Policy</Link>.
      </div>

      <h2>What are cookies?</h2>
      <div>
        Like most organisations, DUOS uses cookies, and similar technologies such as tracking pixels (referred
        to in this policy together as &quot;cookies&quot;), to capture information about our website users (referred
        to as &quot;you&quot;). A cookie is a small file of letters and numbers that is downloaded onto your computer
        or device by a website, stored and used to send information back to that website.
      </div>
      <div>
        Cookies help to make websites work. They can also improve the performance of a site and some provide
        information to the owners of the site.
      </div>
      <div>
        Cookies do not store or collect information about you like your name. But they do collect information
        that relates to, for example, the devices you use to access the internet and your browsing history.
      </div>

      <h2>What cookies do we use?</h2>

      <h3>Strictly necessary cookies</h3>
      <div>
        These cookies are necessary for our website to function and therefore cannot be switched off. We use
        them for things like remembering your privacy settings, or your authentication state.
      </div>

      <h3>Cookies that measure website use</h3>
      <div>
        These allow us to count your visits to the website, and to see how you move around it. This helps us to
        provide you with a good experience while you browse, for example by helping to make sure you can find
        what you need. It also allows us to improve the way the website works.
      </div>

      <h3>First-party cookies</h3>
      <div>These cookies are set by DUOS when you visit our website.</div>

      <h2>Cookies consent and changing preferences</h2>
      <div>
        We will ask for your consent to place cookies on your computer or device, except where they are
        essential to make our website work.
      </div>

      <div>
        You can change your cookie preferences at any time clicking the Manage Cookies link in the footer. You can
        adjust the settings to &#39;on&#39; or &#39;off&#39; which are immediately saved.
      </div>

      <h2>Cookies we use</h2>
      <h3>Strictly necessary cookies</h3>
      <div>
        These cookies are necessary for our website to function and therefore cannot be switched off. We use them for
        things like remembering your privacy settings and knowing authentication identity provider.
      </div>

      <h3>Cookies that measure website use</h3>
      <div>
        We use analytics cookies on our websites. These collect information related to the number of visitors to
        the website, where visitors have come to the website from, and the pages they visited. We use the
        information to compile reports and to help us improve the website. We use the following analytics cookies
        on our website:
        <div style={{
          border: '1px solid gray',
          borderRadius: '5px',
          padding: '2rem',
          margin: '2rem 2rem 0 0',
          display: 'flex',
          flexDirection: 'row',
          gap: '1rem',
          alignItems: 'flex-start',
        }}
        >
          <div style={{ minWidth: '150px', fontWeight: 'bold' }}>
            <div>Google Analytics</div>
          </div>
          <div>
            <div>
              With your permission, we use Google Analytics to to collect data about how you use the
              website. This information helps us to improve the website.
            </div>
            <div>
              Google Analytics stores information about what pages you visit, how long you are on the
              site, how you got here and what you click.
            </div>
            <div>
              We do not allow Google to use or share the data about how you use our website. We do not
              collect or store your personal details such as your name or address.
            </div>
            <div>
              <Link to="https://support.google.com/analytics/answer/6004245">Visit Google to see a full
                list of cookies and their uses.
              </Link>
            </div>
          </div>
        </div>
      </div>

      <h2>Controlling all Cookies</h2>
      <div>In addition to the Cookie choices presented within our websites, you can also use your web browser to
        manage your Cookies. For example, your web browser will enable you to:
      <ul>
        <li>delete all or selected Cookies</li>
        <li>block all Cookies</li>
        <li>allow all Cookies</li>
        <li>block &#39;third-party&#39; Cookies</li>
        <li>clear all Cookies when you close the browser</li>
        <li>open a &#39;private browsing&#39;/&#39;incognito&#39; session, which allows you to browse the
          web without recording your browsing history or storing local data such as Cookies.
        </li>
      </ul>
      </div>

      <div>If you do choose to block Cookies, please be aware that you may lose some of the functionality of our
        websites.
      </div>

      <div>Find out more about managing Cookies on browsers:
        <ul>
          <li><Link to="https://support.google.com/chrome/answer/95647">Google Chrome</Link></li>
          <li>
            <Link
              to="https://support.microsoft.com/en-gb/help/17442/windows-internet-explorer-delete-manage-cookies"
            >
              Microsoft Edge
            </Link>
          </li>
          <li><Link to="https://support.apple.com/en-gb/guide/safari/sfri11471/mac">Safari</Link></li>
          <li>
            <Link to="https://support.mozilla.org/en-US/kb/enable-and-disable-cookies-website-preferences">
              Mozilla Firefox
            </Link>
          </li>
          <li><Link to="https://help.opera.com/en/latest/web-preferences/">Opera</Link></li>
        </ul>
      </div>

      <h2>Changes to this Policy</h2>
      <div>
        We may update how we use cookies (and this policy) from time to time. So please check regularly to keep
        up to date with any changes.
      </div>

      <h2>Contact Us</h2>
      <div>
        If you want to contact us in relation to this Cookie Policy, contact our DUOS Support Team.
      </div>
      <div>
        <a href="mailto:duos@duos.org"><span className="glyphicon glyphicon-envelope" style={{ paddingRight: '1rem' }} />duos@duos.org</a>
      </div>
    </div>
  )
}
