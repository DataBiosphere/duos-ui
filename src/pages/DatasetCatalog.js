import { Component } from 'react';
import { div, button, table, thead, tbody, th, tr, td, form, hr, input, label, i, span, a, p } from 'react-hyperscript-helpers';
import { PageHeading } from '../components/PageHeading';

class DatasetCatalog extends Component {

    constructor(props) {
        super(props);
        this.state = {
            value: ''
        }

        this.myHandler = this.myHandler.bind(this);
    }

    myHandler(event) {
        // TBD
    }

    render() {
        return (

            div({ className: "container" }, [
                div({ className: "row no-margin" }, [

                    div({ className: "row no-margin" }, [
                        div({ className: "col-lg-7 col-md-7 col-sm-12 col-xs-12 no-padding" }, [
                            PageHeading({ imgSrc: "../images/icon_dataset_.png", iconSize: "large", color: "dataset-color", title: "Dataset Catalog", description: "Datasets with an associated DUL to apply for secondary use" }),
                        ]),
                        div({ className: "col-lg-5 col-md-5 col-sm-12 col-xs-12 search-reviewed no-padding" }, [
                            div({ className: "col-lg-6 col-md-6 col-sm-7 col-xs-7" }, [
                                div({ className: "search-text" }, [
                                    i({ className: "glyphicon glyphicon-search dataset-color" }),
                                    input({
                                        type: "search", className: "form-control users-search", placeholder: "Enter search term..."
                                        , "value": "searchDataset"
                                    })
                                ]),
                            ]),
                            button({
                                download: "", "ng-disabled": "objectIdList.length === 0", onClick: "DatasetCatalog.download(objectIdList)",
                                className: "col-lg-6 col-md-6 col-sm-5 col-xs-5 download-button dataset-background"
                            }, [
                                    span({}, ["Download selection"]),
                                    span({ className: "cm-icon-button glyphicon glyphicon-download caret-margin", "aria-hidden": "true" }, []),
                                ]),
                        ]),
                    ]),
                    hr({ className: "section-separator" }),
                ]),
                div({ className: "table-wrap" }, [
                    form({ className: "pos-relative" }, [
                        div({ className: "checkbox check-all" }, [
                            input({ type: "checkbox", "select-all": "true", className: "checkbox-inline", id: "all" }),
                            label({ className: "regular-checkbox", for: "all" }, []),
                        ]),
                        div({ "ng-class": "isAdmin && !isResearcher ? 'table-scroll-admin' : 'table-scroll'" }, [
                            table({ className: "table" }, [
                                thead({}, [
                                    tr({}, [
                                        th({}, []),
                                        th({
                                            "ng-repeat": "dictionary in DatasetCatalog.dataSetList.dictionary",
                                            className: "table-titles dataset-color cell-size"
                                        }, ["this.dictionary.key "]),
                                        th({ className: "table-titles dataset-color cell-size" }, ["ConsentId"]),
                                        th({ className: "table-titles dataset-color cell-size" }, ["Structured Data Use Limitations"]),
                                        th({ "ng-show": "isAdmin", className: "table-titles dataset-color cell-size" }, ["Approved Requestors"]),
                                    ]),
                                ]),
                                tbody({}, [
                                    tr({
                                        "dir-paginate": "dataSet in DatasetCatalog.dataSetList.catalog | filter: searchDataset | itemsPerPage:10"
                                        , "current-page": "pagination.current"
                                    }, [
                                            td({ "ng-repeat": "property in dataSet.properties", isRendered: "property.propertyName ==='Dataset ID'" }, [
                                                div({ className: "checkbox" }, [
                                                    input({
                                                        type: "checkbox", id: "this.property.propertyValue "
                                                        , "value": "checkMod['field_' + pagination.current + $parent.$parent.$index]"
                                                        , className: "checkbox-inline user-checkbox", "add-object-id": "true"
                                                    }),
                                                    label({
                                                        className: "regular-checkbox rp-choice-questions"
                                                        , for: "this.property.propertyValue "
                                                    }, []),
                                                ]),
                                            ]),
                                            td({ className: "remove-datasets-col", "ng-repeat": "property in dataSet.properties", isRendered: "property.propertyName ==='Dataset ID' && isAdmin && !isResearcher" }, [
                                                a({
                                                    isRendered: "dataSet.deletable && isAdmin && !isResearcher", onClick: "DatasetCatalog.openDelete(property.propertyValue)"
                                                    , tooltip: "Delete dataset", "tooltip-class": "tooltip-class", "tooltip-trigger": "true",
                                                    "tooltip-placement": "right"
                                                }, [
                                                        span({
                                                            className: "cm-icon-button glyphicon glyphicon-trash caret-margin default-color",
                                                            "aria-hidden": "true"
                                                        }, []),
                                                    ]),
                                                a({ isRendered: "!dataSet.deletable && isAdmin && !isResearcher" }, [
                                                    span({
                                                        className: "cm-icon-button glyphicon glyphicon-trash caret-margin dismiss-color",
                                                        "aria-hidden": "true"
                                                    }, []),
                                                ]),
                                                div({ className: "disable-datasets-col" }, [
                                                    a({ isRendered: "dataSet.active && isAdmin && !isResearcher", onClick: "DatasetCatalog.openDisable(property.propertyValue)", "tooltip": "Disable dataset", "tooltip-class": "tooltip-class", "tooltip-trigger": "true", "tooltip-placement": "right" }, [
                                                        span({
                                                            className: "cm-icon-button glyphicon glyphicon-ok-circle caret-margin dataset-color",
                                                            "aria-hidden": "true"
                                                        }, []),
                                                    ]),
                                                    a({
                                                        isRendered: "!dataSet.active && isAdmin && !isResearcher", onClick: "DatasetCatalog.openEnable(property.propertyValue)", "tooltip": "Enable dataset"
                                                        , "tooltip-className": "tooltip-class", "tooltip-trigger": "true", "tooltip-placement": "right"
                                                    }, [
                                                            span({
                                                                className: "cm-icon-button glyphicon glyphicon-ban-circle caret-margin cancel-color",
                                                                "aria-hidden": "true"
                                                            }, []),
                                                        ]),
                                                ]),
                                                div({ className: "approval-datasets-col" }, [
                                                    a({ isRendered: "isAdmin && !isResearcher", onClick: "DatasetCatalog.associate(property.propertyValue, dataSet.needsApproval)", "tooltip": "Connect with Data Owner", "tooltip-class": "tooltip-class", "tooltip-trigger": "true", "tooltip-placement": "right" }, [
                                                        span({ "ng-class": "dataSet.isAssociatedToDataOwners ? 'cm-icon-button glyphicon glyphicon-link caret-margin dataset-color' : 'cm-icon-button glyphicon glyphicon-link caret-margin default-color'", "aria-hidden": "true" }, []),
                                                    ]),
                                                ]),
                                            ]),

                                            td({ "ng-repeat": "property in dataSet.properties", className: "table-items cell-size", "ng-class": "{'dataset-disabled': !dataSet.active}" }, [
                                                p({ isRendered: "property.propertyName !=='dbGAP' " }, ["this.property.propertyValue"]),
                                                a({
                                                    href: "this.property.propertyValue ", target: "_blank"
                                                    , isRendered: "property.propertyName ==='dbGAP' && property.propertyValue.length }), 0  "
                                                    , className: "enabled"
                                                }, ["Link"]),
                                                a({
                                                    href: "this.property.propertyValue "
                                                    , isRendered: "property.propertyName ==='dbGAP' && property.propertyValue.length === 0   "
                                                    , className: "disabled"
                                                }, ["Link"]),
                                                td({ className: "table-items cell-size", "ng-class": "{'dataset-disabled': !dataSet.active}" }, ["this.dataSet.consentId "]),
                                                td({ className: "table-items cell-size translated-restriction hover-color", "ng-class": "{'dataset-disabled': !dataSet.active}", onClick: "DatasetCatalog.showSdul(dataSet.translatedUseRestriction)" }, [span({ style: { "cursor": "pointer" } }, ["Translated Use Restriction"]),
                                                ]),

                                                td({ "ng-show": "isAdmin", className: "table-items cell-size translated-restriction hover-color", onClick: "DatasetCatalog.downloadList(dataSet)" }, [span({ style: { "cursor": "pointer" } }, ["Download List"]),
                                                ]),
                                            ]),
                                        ]),
                                ]),
                            ]),
                        ]),

                        div({
                            className: "pvotes-pagination dataset-pagination", "dir-pagination-controls": "true"
                            , "max-size": "10"
                            , "direction-links": "true"
                            , "boundary-links": "true"
                        }, [
                            ]),
                    ]),
                    div({ className: "f-right" }, [
                        button({
                            "ng-show": "isResearcher",
                            "ng-disabled": "objectIdList.length === 0",
                            onClick: "DatasetCatalog.exportToRequest(objectIdList)",
                            className: "download-button dataset-background apply-dataset",
                            "ng-class": "{'disabled': objectIdList.length === 0}",
                            tooltip: "Request Access for selected Datasets", "tooltip-class": "tooltip-class", "tooltip-trigger": "true",
                            "tooltip-placement": "top", "tooltip-animation": "false"
                        }, ["Apply for Access"]),
                    ]),
                ])
            ])
        );
    }
}

export default DatasetCatalog;

