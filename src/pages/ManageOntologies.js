import { Component, Fragment } from 'react';
import { div, button, hr, img, h, h2, i, input, span, a, br } from 'react-hyperscript-helpers';
import { PageHeading } from '../components/PageHeading';
import { PaginatorBar } from '../components/PaginatorBar';


class ManageOntologies extends Component {

  constructor(props) {
    super(props);
    this.state = {
      value: '',
      limit: 5,
      currentPage: 1,
      indexedFiles: [
        {
          fileUrl: 'fileUrl',
          fileName: 'fileName',
          ontologyType: 'OID',
          prefix: 'orsp-'
        }

      ]
    }

    this.myHandler = this.myHandler.bind(this);
  }

  handlePageChange = page => {
    this.setState(prev => {
      prev.currentPage = page;
      return prev;
    });
  };

  handleSizeChange = size => {
    this.setState(prev => {
      prev.limit = size;
      prev.currentPage = 1;
      return prev;
    });
  };

  myHandler(event) {
    // TBD
  }

  downloadOntology = (e) => {

  }

  openDelete = (e) => {

  }

  render() {


    const { currentPage } = this.state;

    return (

      // div({ className: "container" }, [
      //   div({ className: "row no-margin" }, [
      //     div({ className: "col-lg-7 col-md-7 col-sm-12 col-xs-12 no-padding" }, [
      //       PageHeading({ id: "manageOntologies", imgSrc: "../images/icon-manage-ontology.png", iconSize: "large", color: "common", title: "Manage Ontologies", description: "Select and manage Ontologies for index" }),
      //     ]),
      //   ]),
      //   hr({ className: "section-separator" }),

      //   button({}, ["Click Me!"])
      // ])


      div({ className: "container" }, [
        div({ className: "row no-margin" }, [
          div({ className: "col-lg-6 col-md-6 col-sm-12 col-xs-12 no-padding title-wrapper" }, [
            img({ src: "/images/icon-manage-ontology.png", alt: "Manage Ontology icon", className: "cm-icons main-icon-title" }),
            h2({ className: "main-title margin-sm common-color" }, ["Manage Ontologies", br(),
              div({ className: "main-title-description" }, ["Select and manage Ontologies for index"]),
            ]),
          ]),
          div({ className: "col-lg-6 col-md-6 col-sm-12 col-xs-12 search-reviewed no-padding" }, [
            div({ className: "col-lg-7 col-md-7 col-sm-7 col-xs-7" }, [
              div({ className: "search-text" }, [
                i({ className: "glyphicon glyphicon-search common-color" }),
                input({
                  type: "search", className: "form-control users-search", placeholder: "Enter search term..."
                  , "value": "searchOntologies"
                }),
              ]),
            ]),
            a({ href: "", className: "col-lg-5 col-md-5 col-sm-5 col-xs-5 admin-add-button common-background no-margin", onClick: "addOntology()" }, [
              div({ className: "all-icons add-ontologies-white" }, []),
              span({}, ["Add Ontologies"]),
            ]),
          ]),
        ]),
        div({ className: "jumbotron box-vote-singleresults box-vote-no-margin" }, [
          div({ className: "row manage-wrapper" }, [
            div({ className: "pvotes-box-head fsi-row-lg-level fsi-row-md-level" }, [
              div({ className: "col-lg-5 col-md-5 col-sm-5 col-xs-4 pvotes-box-subtitle common-color" }, ["File name"]),
              div({ className: "col-lg-3 col-md-3 col-sm-3 col-xs-3 pvotes-box-subtitle common-color" }, ["Type"]),
              div({ className: "col-lg-3 col-md-3 col-sm-3 col-xs-3 pvotes-box-subtitle common-color" }, ["Prefix"]),
              div({ className: "col-lg-1 col-md-1 col-sm-1 col-xs-1 pvotes-box-subtitle f-center common-color" }, []),
            ]),

            div({ className: "admin-box-body" }, [
              hr({ className: "pvotes-main-separator" }),
              this.state.indexedFiles.slice((currentPage - 1) * this.state.limit, currentPage * this.state.limit).map((indexFile, ix) => {
                return h(Fragment, { key: ix }, [
                  // div({ "dir-paginate": "indexFile in indexedFiles | itemsPerPage:8", "pagination-id": "indexedFiles" }, [
                  div({ className: "row pvotes-main-list" }, [
                    a({
                      className: "col-lg-5 col-md-5 col-sm-5 col-xs-4 pvotes-list-id",
                      style: { "cursor": "pointer" }, onClick: this.downloadOntology, fileName: indexFile.fileName, fileUrl: indexFile.fileUrl
                    }, [indexFile.fileName]),
                    div({ className: "col-lg-3 col-md-3 col-sm-3 col-xs-3 pvotes-list-id" }, [indexFile.ontologyType]),
                    div({ className: "col-lg-3 col-md-3 col-sm-3 col-xs-3 pvotes-list-id" }, [indexFile.prefix]),
                    div({ className: "remove-dul-col" }, [
                      a({ onClick: this.openDelete, fileUrl: indexFile.fileUrl }, [
                        span({ className: "cm-icon-button glyphicon glyphicon-trash caret-margin", "aria-hidden": "true" }, []),
                      ]),
                      hr({ className: "pvotes-separator-longer" }, [
                      ]),
                    ]),
                  ]),
                  hr({ className: "pvotes-separator" }),
                ]);
              }),
              // div({ dir-pagination-controls
              //      ", "max-size":"10"
              //      ", "direction-links":"true"
              //      ", "boundary-links":"true"
              //      className:"pvotes-pagination"
              //      pagination-id:"indexedFiles"},[
              // ]),
              // ]),-----
              PaginatorBar({
                total: this.state.indexedFiles.length,
                limit: this.state.limit,
                pageCount: this.pageCount,
                currentPage: this.state.currentPage,
                onPageChange: this.handlePageChange,
                changeHandler: this.handleSizeChange,
              }),
            ]),
          ]),
        ]),
      ])
    );
  }
}

export default ManageOntologies;

