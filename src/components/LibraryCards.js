import { PureComponent } from 'react';
import * as ld from 'lodash';
import { div, hh, span } from 'react-hyperscript-helpers';

export const LibraryCards = hh(class LibraryCards extends PureComponent {

  render() {
    const { libraryCards, style } = this.props;
    return div({ style: style }, [
      ld.isEmpty(libraryCards) ?
        div({ className: 'library-flag flag-disabled' }, [
          div({ className: 'library-icon' }),
          span({ className: 'library-label' }, 'None')
        ]) :
        ld.map(ld.uniq(libraryCards), card => {
          return div({ key: card.id, style: { margin: 1 }, className: 'library-flag flag-enabled' }, [
            div({ className: 'library-icon' }),
            span({ className: 'library-label' }, card.institution.name)
          ]);
        })
    ]);
  }

});
