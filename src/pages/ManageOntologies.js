import { Component, Fragment } from 'react';
import { div, button, hr, h, span, a } from 'react-hyperscript-helpers';
import { PageHeading } from '../components/PageHeading';
import { PaginatorBar } from '../components/PaginatorBar';
import { AddOntologiesModal } from '../components/modals/AddOntologiesModal';
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import { SearchBox } from '../components/SearchBox';
import { Ontology, Files } from "../libs/ajax";
import { LoadingIndicator } from '../components/LoadingIndicator';

class ManageOntologies extends Component {

  constructor(props) {
    super(props);
    this.state = {
      loading:true,
      value: '',
      limit: 5,
      currentPage: 1,
      indexedFiles: [],
      showDialogDelete: false,
    };

    this.myHandler = this.myHandler.bind(this);
    this.addOntologiesModal = this.addOntologiesModal.bind(this);
    this.closeAddOntologiesModal = this.closeAddOntologiesModal.bind(this);
    this.okAddOntologiesModal = this.okAddOntologiesModal.bind(this);
    this.afterAddOntologiesModalOpen = this.afterAddOntologiesModalOpen.bind(this);
  }

  async getOntologiesManage() {
    const ontologies = await Ontology.retrieveIndexedFiles();
    this.setState(prev => {
      prev.loading = false;
      prev.currentPage = 1;
      prev.indexedFiles = ontologies;
      return prev;
    });
  };

  componentDidMount() {
    this.getOntologiesManage();
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

  addOntologiesModal() {
    this.setState(prev => {
      prev.showModal = true;
      return prev;
    });
  }

  closeAddOntologiesModal() {
    // this state change close AddDul modal
    this.setState(prev => {
      prev.showModal = false;
      return prev;
    });
  }

  okAddOntologiesModal() {
    // this state change close AddDul modal
    this.setState(prev => {
      prev.showModal = false;
      return prev;
    });
  }

  afterAddOntologiesModalOpen() {
    // not sure when to use this
  }


  myHandler(event) {
    // TBD
  }

  async downloadOntology(fileName, fileUrl) {
    await Files.getOntologyFile(fileName, fileUrl);
  };

  openDelete = (fileUrl) => {
    this.setState({
      showDialogDelete: true,
      fileUrlId: fileUrl
    });
  };

  dialogHandlerDelete = (answer) => (e) => {
    this.setState({ showDialogDelete: false });
    let ontologyFileId = this.state.fileUrlId;
    if (answer) {
      Ontology.deleteOntologyFile(ontologyFileId).then(data => {
        if (data.ok) {
          this.removeOntologyfromList(ontologyFileId);
        }
      })
    }
  };

  removeOntologyfromList(ontologyFileId) {
    let updatedOntologyList = this.state.electionsList.dul.filter(ontology => ontology.fileUrl !== ontologyFileId);
    this.setState(prev => {
      prev.currentPage = 1;
      prev.indexedFiles = updatedOntologyList;
      return prev;
    });
  };

  handleSearchDul = (query) => {
    this.setState({ searchDulText: query });
  };

  searchTable = (query) => (row) => {
    if (query && query !== undefined) {
      let text = JSON.stringify(row);
      return text.includes(query);
    }
    return true;
  };

  render() {

    if (this.state.loading) { return LoadingIndicator(); }
    
    const { currentPage, searchDulText } = this.state;

    return (

      div({ className: "container" }, [
        div({ className: "row no-margin" }, [
          div({ className: "col-lg-7 col-md-7 col-sm-12 col-xs-12 no-padding" }, [
            PageHeading({ id: "manageOntologies", imgSrc: "/images/icon-manage-ontology.png", iconSize: "large", color: "common", title: "Manage Ontologies", description: "Select and manage Ontologies for index" }),
          ]),

          div({ className: "col-lg-5 col-md-5 col-sm-12 col-xs-12 search-wrapper no-padding" }, [
            div({ className: "col-lg-7 col-md-7 col-sm-7 col-xs-7" }, [
              SearchBox({ id: 'manageOntologies', searchHandler: this.handleSearchDul, color: 'common' })
            ]),

            a({
              id: 'btn_addOntologies',
              className: "col-lg-5 col-md-5 col-sm-5 col-xs-5 admin-add-button common-background no-margin",
              onClick: this.addOntologiesModal
            }, [
                div({ className: "all-icons add-ontologies-white" }),
                span({}, ["Add Ontologies"]),
              ]),
            AddOntologiesModal({
              showModal: this.state.showModal,
              onOKRequest: this.okAddOntologiesModal,
              onCloseRequest: this.closeAddOntologiesModal,
              onAfterOpen: this.afterAddOntologiesModalOpen
            }),

            hr({ className: "section-separator" })
          ])
        ]),

        div({ className: "jumbotron table-box" }, [
          div({ className: "grid-row pushed-1" }, [

            div({ className: "col-5 cell-header common-color" }, ["File name"]),
            div({ className: "col-2 cell-header common-color" }, ["Type"]),
            div({ className: "col-2 cell-header common-color" }, ["Prefix"]),
          ]),
          hr({ className: "table-head-separator" }),

          this.state.indexedFiles.filter(this.searchTable(searchDulText)).slice((currentPage - 1) * this.state.limit, currentPage * this.state.limit).map((indexFile, ix) => {
            return h(Fragment, { key: ix }, [
              div({ className: "grid-row pushed-1 tableRow" }, [
                a({
                  id: ix + "_linkFileName",
                  name: "fileName",
                  className: "col-5 cell-body text",
                  style: { "cursor": "pointer" },
                  onClick: () => this.downloadOntology(indexFile.fileName, indexFile.fileUrl),
                  filename: indexFile.fileName,
                  fileurl: indexFile.fileUrl
                }, [indexFile.fileName]),
                div({ id: ix + "_type", name: "type", className: "col-2 cell-body text" }, [indexFile.ontologyType]),
                div({ id: ix + "_prefix", name: "prefix", className: "col-2 cell-body text" }, [indexFile.prefix]),

                div({ className: "icon-actions" }, [
                  div({ className: "display-inline-block", disabled: false }, [
                    button({ id: ix + "_btnDelete", name: "btn_delete", onClick: () => this.openDelete(indexFile.fileUrl) }, [span({ className: "glyphicon glyphicon-trash caret-margin" }),
                    ]),
                    ConfirmationDialog({
                      title: 'Delete Ontology file?', color: 'common', showModal: this.state.showDialogDelete, action: { label: "Yes", handler: this.dialogHandlerDelete }
                    }, [div({ className: "dialog-description" }, ["Are you sure you want to delete this file? The ontologies contained will be deleted from the Ontology Model."]),]),
                  ])
                ])
              ]),
              hr({ className: "table-body-separator" }),
            ]);
          }),
          PaginatorBar({
            total: this.state.indexedFiles.filter(this.searchTable(searchDulText)).length,
            limit: this.state.limit,
            pageCount: this.pageCount,
            currentPage: this.state.currentPage,
            onPageChange: this.handlePageChange,
            changeHandler: this.handleSizeChange,
          })
        ]),
      ])
    );
  }
}

export default ManageOntologies;

