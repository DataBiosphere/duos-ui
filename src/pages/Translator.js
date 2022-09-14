import { useState } from 'react';
import { div, img, h1, h2, h3, form, textarea, button, label, ul, li, a, span } from 'react-hyperscript-helpers';
import { cloneDeep, groupBy, isNil } from 'lodash/fp';
import { Translate } from '../libs/ajax';
import homeHeaderBackground from '../images/home_header_background.png';
import { Spinner } from '../components/Spinner';

const homeTitle = {
  color: '#FFFFFF',
  fontFamily: 'Montserrat',
  fontSize: '6rem',
  fontWeight: 800,
  textAlign: 'center',
  padding: '0 5rem',
  transform: 'scaleX(0.9)',
  marginTop: 0
};

const homeBannerDescription = {
  color: '#FFFFFF',
  fontFamily: 'Montserrat',
  fontSize: '20px',
  textAlign: 'center',
  whiteSpace: 'pre-wrap'
};

export default function Translator() {
  const [paragraph, setParagraph] = useState('');
  const [results, setResults] = useState();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState();

  const submit = async () => {
    let rawResults;
    try {
      setIsLoading(true);
      rawResults = await Translate.translate({ paragraph });
      setError();
    } catch (e) {
      setError(e);
    }
    normalizeResults(rawResults);
  };

  const normalizeResults = (rawResults) => {
    const normalizedObjects = Object
      .keys(rawResults || {})
      .map(key => {
        let normalizedRaw = cloneDeep(rawResults[key]);
        let splitArr = key.split('/');
        normalizedRaw.key = key;
        normalizedRaw.url = key;
        normalizedRaw.urlDisplay = splitArr[splitArr.length - 1];
        normalizedRaw.urlDomain = splitArr[2];
        return normalizedRaw;
      });
    setResults(groupBy('category', normalizedObjects));
    setIsLoading(false);
  };

  return (
    div({ className: 'row' }, [
      div({ className: 'col-lg-12 col-md-12 col-sm-12 col-xs-12' }, [
        div({
          className: 'row',
          style: {
            backgroundColor: 'white',
            height: '350px',
            position: 'relative',
            margin: '-20px auto auto 0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}, [
          img({ style: { height: 'inherit', minWidth: '100%' }, src: homeHeaderBackground}),
          div({ className: 'flex-col', style: { position: 'absolute', width: '100%' }}, [
            h1({ style: homeTitle }, ['The DUO Translator']),
            label(
              { className: 'hidden-xs', style: homeBannerDescription },
              ['Map your consent form to the GA4GH Data Use Ontology!']
            ),
            form({ className: 'flex-col', style: { width: '100%' } }, [
              textarea({
                rows: 3,
                style: {
                  width: '90%',
                  maxWidth: 800,
                  margin: '20px 30px',
                  padding: 20,
                  borderRadius: 5
                },
                onChange: (e) => { setParagraph(e.target.value); }
              }),
              button({
                className: 'button button-blue',
                type: 'button',
                onClick: submit,
                style: {
                  fontSize: 20,
                  minWidth: 250,
                  boxShadow: 'rgba(0, 0, 0, 0.3) 5px 5px 7px'
                }
              }, ['Submit'])
            ])
          ])
        ]),
        div({ isRendered: !isNil(results), style: { padding: 20 } }, [
          div({ className: 'row' }, [
            div({ className: 'col-lg-12', style: { backgroundColor: 'white' } }, [
              h2(`Translation Results`)
            ])
          ]),

          div({
            isRendered: isLoading,
            className: 'flex-row',
            style: { width: '100%', justifyContent: 'center' }
          }, [Spinner]),

          div({ isRendered: error }, [
            'There was an error running your request'
          ]),

          div({ isRendered: !isLoading && !error, className: 'row no-margin' }, [
            results && Object.keys(results).length === 0 && div([
              'No results found'
            ]),
            results && Object
              .keys(results)
              .map(key => {
                return div({ key: `category-${key}`, className: 'col-md-4' }, [
                  h3([key]),

                  ul(
                    { className: 'search-result-list'},
                    results[key].map(searchResult => {
                      return li(
                        {
                          key: `category-${key}-result-${searchResult.key}`,
                          style: { marginBottom: 15 }
                        },
                        [
                          div([searchResult.title]),
                          div([
                            a({href: searchResult.url}, [searchResult.urlDisplay]),
                            span({ style: {fontSize: '1rem', opacity: 0.7, marginLeft: 6} }, `(${searchResult.urlDomain})`)
                          ])
                        ]
                      );
                    })
                  )
                ]);
              })
          ])
        ])
      ])
    ])
  );
}
