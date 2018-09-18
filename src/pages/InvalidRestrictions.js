import { Component, Fragment } from 'react';
import { div, hr, i, input, a, h } from 'react-hyperscript-helpers';
import { PageHeading } from '../components/PageHeading';
import { PageSubHeading } from '../components/PageSubHeading';
import { PaginatorBar } from '../components/PaginatorBar';
import { SearchBox } from '../components/SearchBox';

class InvalidRestrictions extends Component {

  constructor(props) {
    super(props);
    this.state = {
      value: '',
      searchDulCases: '',
      searchDarCases: '',
      dulLimit: 5,
      darLimit: 5,
      currentDulPage: 1,
      currentDarPage: 1,
      InvalidRestrictions: {
        dulList: [
          {}
        ],
        darList: [
          {}
        ]
      }
    }
  }

  componentWillMount() {
    let duls = [];
    let dars = [];

    for (var i = 0; i < 50; i++) {
      duls.push({ name: 'name ' + i, useRestriction: 'use restriction .... ' + i });
      dars.push({ name: 'name ' + i, useRestriction: 'use restriction .... ' + i });
    }
    this.setState({
      searchDulCases: '',
      searchDarCases: '',
      InvalidRestrictions: {
        dulList: duls,
        darList: dars,
      }
    })
  }

  handleDulPageChange = page => {
    this.setState(prev => {
      prev.currentDulPage = page;
      return prev;
    });
  };

  handleDulSizeChange = size => {
    this.setState(prev => {
      prev.dulLimit = size;
      prev.currentDulPage = 1;
      return prev;
    });
  }

  handleDarPageChange = page => {
    this.setState(prev => {
      prev.currentDarPage = page;
      return prev;
    });
  };

  handleDarSizeChange = size => {
    this.setState(prev => {
      prev.darLimit = size;
      prev.currentDarPage = 1;
      return prev;
    });
  }

  download = (name, useRestriction) => {

  }

  handleSearchDul = (query) => {
    this.setState({ searchDulText: query });
  }

  handleSearchDar = (query) => {
    this.setState({ searchDarText: query });
  }

  searchTable = (query) => (row) => {
    if (query && query !== undefined) {
      let text = JSON.stringify(row);
      return text.includes(query);
    }
    return true;
  }

  render() {

    const { currentDulPage, currentDarPage, dulLimit, darLimit, searchDulText, searchDarText } = this.state;

    return (

      div({ className: "container" }, [
        div({ className: "row no-margin" }, [
          div({ className: "col-lg-12 col-md-12 col-sm-12 col-xs-12 no-padding" }, [
            PageHeading({
              id: "invalidRestrictions", imgSrc: "../images/icon_invalid_restrictions.png",
              iconSize: "large", color: "common", title: "Invalid Request Restrictions",
              description: "List of Invalid Restrictions for Data Use Limitations and Data Access Requests"
            })
          ])
        ]),

        hr({ className: "section-separator" }),

        div({ className: "col-lg-10 col-lg-offset-1 col-md-10 col-md-offset-1 col-sm-12 col-xs-12" }, [
          div({ className: "row no-margin" }, [
            div({ className: "col-lg-8 col-md-8 col-sm-8 col-xs-12 no-padding" }, [
              PageSubHeading({ imgSrc: "/images/icon_dul_invalid.png", color: "dul", title: "Data Use Limitations Invalid Cases", description: "List of Invalid Restrictions for Data Use Limitations" }),
            ]),

            div({ className: "col-lg-4 col-md-4 col-sm-4 col-xs-12 search-wrapper" }, [
              SearchBox({ id: 'invalidRestrictions', searchHandler: this.handleSearchDul, color: 'dul' })
            ]),
          ]),

          div({ className: "jumbotron table-box" }, [
            div({ className: "row no-margin" }, [
              div({ className: "col-lg-4 col-md-4 col-sm-4 col-xs-4 cell-header dul-color" }, ["Consent id"]),
              div({ className: "col-lg-8 col-md-8 col-sm-8 col-xs-8 cell-header dul-color" }, ["Invalid Restrictions"]),
            ]),

            hr({ className: "table-head-separator" }),

            this.state.InvalidRestrictions.dulList
              .filter(this.searchTable(searchDulText))
              .slice((currentDulPage - 1) * dulLimit, currentDulPage * dulLimit).map((dul, index) => {
                return h(Fragment, { key: index }, [
                  div({ className: "row no-margin" }, [
                    div({ className: "col-lg-4 col-md-4 col-sm-4 col-xs-4 cell-body text" }, [dul.name]),
                    div({ className: "col-lg-8 col-md-8 col-sm-8 col-xs-8 cell-body text" }, [
                      a({ href: "", onClick: this.download(dul.name, dul.useRestriction), className: "bold hover-color" }, ["Download Restrictions"]),
                    ])
                  ]),
                  hr({ className: "table-body-separator" })
                ])
              }),
            PaginatorBar({
              total: this.state.InvalidRestrictions.dulList.filter(this.searchTable(searchDulText)).length,
              limit: dulLimit,
              currentPage: currentDulPage,
              onPageChange: this.handleDulPageChange,
              changeHandler: this.handleDulSizeChange,
            })
          ]),

          div({ className: "row no-margin" }, [
            div({ className: "col-lg-8 col-md-8 col-sm-8 col-xs-12 no-padding" }, [
              PageSubHeading({ imgSrc: "/images/icon_access_invalid.png", color: "access", title: "Data Access Requests Invalid Cases", description: "List of Invalid Restrictions for Data Access Requests" }),
            ]),
            div({ className: "col-lg-4 col-md-4 col-sm-4 col-xs-12 search-wrapper" }, [
              SearchBox({ searchHandler: this.handleSearchDar, color: 'access' })
            ]),
          ]),

          div({ className: "jumbotron table-box" }, [
            div({ className: "row no-margin" }, [
              div({ className: "col-lg-4 col-md-4 col-sm-4 col-xs-4 cell-header access-color" }, ["Data Access Request id"]),
              div({ className: "col-lg-8 col-md-8 col-sm-8 col-xs-8 cell-header access-color" }, ["Invalid Restrictions"]),
            ]),

            hr({ className: "table-head-separator" }),

            this.state.InvalidRestrictions.darList
              .filter(this.searchTable(searchDarText))
              .slice((currentDarPage - 1) * darLimit, currentDarPage * darLimit).map((dar, index) => {
                return h(Fragment, { key: index }, [
                  div({ className: "row no-margin" }, [
                    div({ className: "col-lg-4 col-md-4 col-sm-4 col-xs-4 cell-body text" }, [dar.name]),
                    div({ className: "col-lg-8 col-md-8 col-sm-8 col-xs-8 cell-body text" }, [
                      a({ href: "", onClick: this.download(dar.name, dar.useRestriction), className: "bold hover-color" }, ["Download Restrictions"]),
                    ]),
                  ]),
                  hr({ className: "table-body-separator" }),
                ])
              }),
            PaginatorBar({
              total: this.state.InvalidRestrictions.darList.filter(this.searchTable(searchDarText)).length,
              limit: darLimit,
              currentPage: currentDarPage,
              onPageChange: this.handleDarPageChange,
              changeHandler: this.handleDarSizeChange,
            })
          ]),
        ])
      ])
    );
  }
}

export default InvalidRestrictions;

