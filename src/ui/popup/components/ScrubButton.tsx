/**
 * Copyright (c) 2017-2022 Kenny Do and CAD Team (https://github.com/Cookie-AutoDelete/Cookie-AutoDelete/graphs/contributors)
 * Licensed under MIT (https://github.com/Cookie-AutoDelete/Cookie-AutoDelete/blob/3.X.X-Branch/LICENSE)
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
import * as React from 'react';
import { useRef } from 'react';
import browser from 'webextension-polyfill';
import IconButton from '../../common_components/IconButton';
import { animateFlash } from '../popupLib';
import { useCleanSiteData } from './useCleanSiteData';

interface OwnProps {
  hostname: string;
  tab: browser.Tabs.Tab;
}

/**
 * One-click shortcut for "Clean All for this domain".
 */
const ScrubButton: React.FunctionComponent<OwnProps> = ({ hostname, tab }) => {
  const cleanSiteData = useCleanSiteData();
  const wrapperRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={wrapperRef} className="d-inline-block m-1">
      <IconButton
        iconName="broom"
        className="btn-warning"
        type="button"
        onClick={async () => {
          const result = await cleanSiteData('All', hostname, tab);
          animateFlash(wrapperRef.current, result);
        }}
        title={browser.i18n.getMessage('manualCleanSiteDataAllDomain', [
          hostname,
        ])}
        text={browser.i18n.getMessage('scrubText')}
      />
    </div>
  );
};

export default ScrubButton;
