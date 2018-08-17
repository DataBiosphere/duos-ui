import { Component, Fragment } from 'react';
import { div, button, table, thead, tbody, th, tr, td, form, h, hr, input, label, i, span, a, p } from 'react-hyperscript-helpers';
import { PageHeading } from '../components/PageHeading';

class DatasetCatalog extends Component {

    constructor(props) {
        super(props);
        this.state = {
            isLogged: false
        }

        this.myHandler = this.myHandler.bind(this);
        this.mockData = this.mockData.bind(this);
    }

    mockData() {
        let data = {};
        let catalog = [];

        for (var i = 0; i < 10; i++) {
            let dataSet = {
                dataSetId: 'DS00' + i,
                dataSetName: 'DS Name 00' + i,
                darCode: 'DAR00' + i,
                alreadyVoted: i % 2 === 0,
                hasConcerns: i % 2 !== 0,
                deletable: i % 2 === 0,
                active: i % 2 !== 0
            };
            let properties = [];
            properties.push({ propertyName: "Dataset Name", propertyValue: i % 2 === 0 ? 'CMG_00' + i : 'RPG_00' + i });
            properties.push({ propertyName: "Dataset ID", propertyValue: i % 2 === 0 ? 'SC-2340' + i : 'SC-1200' + i });
            properties.push({ propertyName: "Data Type", propertyValue: i % 2 === 0 ? 'DNA, whole exome' : 'Whole Genome' });
            properties.push({ propertyName: "Species", propertyValue: 'human' });
            properties.push({ propertyName: "Phenotype/Indication", propertyValue: i % 2 === 0 ? 'orphan disease' : 'primary brain disease' });
            properties.push({ propertyName: "# of participants", propertyValue: i * 20 });
            properties.push({
                propertyName: "Description", propertyValue: i % 2 === 0
                    ? 'Families with orphan diseases recruited by The Manton Center for Orphan Disease Research and sequenced through The Broad Center for Mendelian Genomics'
                    : 'Families with neurological diseases recruited by Joseph Gleeson\'s team and sequenced through The Broad Center for Mendelian Genomics'
            });
            properties.push({ propertyName: "dbGAP", propertyValue: 'NA' });
            properties.push({ propertyName: "Data Depositor", propertyValue: i % 2 === 0 ? 'Nadya Lopez Zalba' : 'Veronica Vicario' });
            properties.push({ propertyName: "Principal Investigator(PI)", propertyValue: i % 2 === 0 ? 'Leonardo Forconesi' : 'Tadeo Riveros' });
            dataSet['properties'] = properties;
            catalog.push(dataSet);
        }

        data = {
            catalog: catalog,
            dictionary: [
                { key: "Dataset Name", value: 'DS00' },
                { key: "Dataset ID", value: 'DS00' },
                { key: "Data Type", value: 'DS00' },
                { key: "Species", value: 'DS00' },
                { key: "Phenotype/Indication", value: 'DS00' },
                { key: "# of participants", value: 'DS00' },
                { key: "Description", value: 'DS00' },
                { key: "dbGAP", propertyVvaluealue: 'DS00' },
                { key: "Data Depositor", value: 'DS00' },
                { key: "Principal Investigator(PI)", value: 'DS00' },
            ]
        }

        console.log('data', data);

        let dataSetList = this.state.dataSetList;
        dataSetList = data;
        this.setState({ dataSetList: dataSetList }, () => { console.log(this.state) });


    }
    componentWillMount() {
        console.log('----------------------------componentWillMount----------------------------------');
        this.mockData();
    }

    componentDidMount() {

    }

    showSdul() {

    }

    downloadList() {

    }

    exportToRequest() {

    }

    associate() {

    }

    openDelete() {

    }

    openDisable() {

    }

    openEnable() {

    }

    download() {

    }

    myHandler(event) {
        // TBD
    }

    render() {
        console.log('----------------------------render----------------------------------');
        const isAdmin = true;
        const isResearcher = false;
        const objectIdList = ['a', 'b', 'c'];
        console.log('---------------dictionary----------------', this.state);

        return (
            h(Fragment, {}, [
                div({ className: "container" }, [
                    div({ className: "row no-margin" }, [
                        div({ className: "col-lg-7 col-md-7 col-sm-12 col-xs-12 no-padding" }, [
                            PageHeading({ imgSrc: "/images/icon_dataset_.png", iconSize: "large", color: "dataset-color", title: "Dataset Catalog", description: "Datasets with an associated DUL to apply for secondary use" }),
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
                                download: "", "ng-disabled": "objectIdList.length === 0", onClick: this.download(objectIdList),
                                className: "col-lg-6 col-md-6 col-sm-5 col-xs-5 download-button dataset-background"
                            }, [
                                    span({}, ["Download selection"]),
                                    span({ className: "cm-icon-button glyphicon glyphicon-download caret-margin", "aria-hidden": "true" }, []),
                                ]),
                        ]),
                    ]),
                    hr({ className: "section-separator" }),


                    div({ className: "table-wrap" }, [

                        form({ className: "pos-relative" }, [
                            div({ className: "checkbox check-all" }, [
                                input({ type: "checkbox", "select-all": "true", className: "checkbox-inline", id: "all" }),
                                label({ className: "regular-checkbox", for: "all" }, []),
                            ]),
                        ]),

                        div({ className: isAdmin && !isResearcher ? 'table-scroll-admin' : 'table-scroll' }, [
                            table({ className: "table" }, [

                                thead({}, [
                                    tr({}, [
                                        th({}),
                                        this.state.dataSetList.dictionary.map(dictionary => {
                                            return h(Fragment, {}, [
                                                th({ className: "table-titles dataset-color cell-size", id: dictionary.key }, [
                                                    dictionary.key
                                                ])
                                            ])
                                        }),

                                        th({ className: "table-titles dataset-color cell-size" }, ["ConsentId"]),
                                        th({ className: "table-titles dataset-color cell-size" }, ["Structured Data Use Limitations"]),
                                        th({ isRendered: isAdmin, className: "table-titles dataset-color cell-size" }, ["Approved Requestors"]),
                                    ]),
                                ]),

                                tbody({}, [

                                    this.state.dataSetList.catalog.map((dataSet, trIndex) => {
                                        return h(Fragment, {}, [

                                            tr({
                                                id: 'tr-' + dataSet.dataSetId,
                                                "dir-paginate": "dataSet in DatasetCatalog.dataSetList.catalog | filter: searchDataset | itemsPerPage:10"
                                                , "current-page": "pagination.current"
                                            }, [

                                                    dataSet.properties.map(property => {
                                                        return h(Fragment, {}, [

                                                            td({
                                                                isRendered: property.propertyName === 'Dataset ID',
                                                                id: property.propertyName + '-' + trIndex
                                                            }, [
                                                                    div({ className: "checkbox" }, [
                                                                        input({
                                                                            type: "checkbox", id: property.propertyValue
                                                                            // , value: "checkMod['field_' + pagination.current + $parent.$parent.$index]"
                                                                            , value: "true", className: "checkbox-inline user-checkbox", "add-object-id": "true"
                                                                        }),
                                                                        label({ className: "regular-checkbox rp-choice-questions", for: property.propertyValue }),
                                                                    ])
                                                                ])
                                                        ])
                                                    }),

                                                    dataSet.properties.map(property => {
                                                        return h(Fragment, {}, [

                                                            td({
                                                                className: "remove-datasets-col", id: 'td-' + property.propertyName,
                                                                isRendered: property.propertyName === 'Dataset ID' && isAdmin && !isResearcher
                                                            }, [

                                                                    a({
                                                                        isRendered: dataSet.deletable && isAdmin && !isResearcher, onClick: this.openDelete(property.propertyValue),
                                                                        tooltip: "Delete dataset", "tooltip-class": "tooltip-class", "tooltip-trigger": "true", "tooltip-placement": "right"
                                                                    }, [
                                                                            span({ className: "cm-icon-button glyphicon glyphicon-trash caret-margin default-color", "aria-hidden": "true" }),
                                                                        ]),

                                                                    a({ isRendered: !dataSet.deletable && isAdmin && !isResearcher }, [
                                                                        span({ className: "cm-icon-button glyphicon glyphicon-trash caret-margin dismiss-color", "aria-hidden": "true" }),
                                                                    ]),

                                                                    div({ className: "disable-datasets-col" }, [

                                                                        a({
                                                                            isRendered: dataSet.active && isAdmin && !isResearcher, onClick: this.openDisable(property.propertyValue),
                                                                            "tooltip": "Disable dataset",
                                                                            "tooltip-class": "tooltip-class", "tooltip-trigger": "true", "tooltip-placement": "right"
                                                                        }, [
                                                                                span({
                                                                                    className: "cm-icon-button glyphicon glyphicon-ok-circle caret-margin dataset-color", "aria-hidden": "true"
                                                                                }, []),
                                                                            ]),

                                                                        a({
                                                                            isRendered: !dataSet.active && isAdmin && !isResearcher, onClick: this.openEnable(property.propertyValue),
                                                                            "tooltip": "Enable dataset",
                                                                            "tooltip-className": "tooltip-class", "tooltip-trigger": "true", "tooltip-placement": "right"
                                                                        }, [
                                                                                span({
                                                                                    className: "cm-icon-button glyphicon glyphicon-ban-circle caret-margin cancel-color",
                                                                                    "aria-hidden": "true"
                                                                                }, []),
                                                                            ]),

                                                                    ]),


                                                                    div({ className: "approval-datasets-col" }, [
                                                                        a({
                                                                            isRendered: isAdmin && !isResearcher, onClick: this.associate(property.propertyValue, dataSet.needsApproval),
                                                                            "tooltip": "Connect with Data Owner", "tooltip-class": "tooltip-class", "tooltip-trigger": "true",
                                                                            "tooltip-placement": "right"
                                                                        }, [
                                                                                span({
                                                                                    className: dataSet.isAssociatedToDataOwners ? 'cm-icon-button glyphicon glyphicon-link caret-margin dataset-color' : 'cm-icon-button glyphicon glyphicon-link caret-margin default-color',
                                                                                    "aria-hidden": "true"
                                                                                }, []),
                                                                            ]),
                                                                    ]),
                                                                ])
                                                        ])
                                                    }),

                                                    dataSet.properties.map(property => {
                                                        return h(Fragment, {}, [

                                                            td({
                                                                className: "table-items cell-size", "ng-class": "{'dataset-disabled': !dataSet.active}"
                                                            }, [

                                                                    p({ isRendered: property.propertyName !== 'dbGAP' }, [property.propertyValue]),

                                                                    a({
                                                                        href: property.propertyValue, target: "_blank", className: "enabled",
                                                                        isRendered: property.propertyName === 'dbGAP' && property.propertyValue.length > 0
                                                                    }, ["Link"]),

                                                                    a({
                                                                        href: property.propertyValue, className: "disabled",
                                                                        isRendered: property.propertyName === 'dbGAP' && property.propertyValue.length === 0
                                                                    }, ["Link"]),
                                                                ])
                                                        ])
                                                    }),


                                                    td({ className: "table-items cell-size", "ng-class": "{'dataset-disabled': !dataSet.active}" }, [dataSet.consentId]),

                                                    td({
                                                        className: "table-items cell-size translated-restriction hover-color",
                                                        "ng-class": "{'dataset-disabled': !dataSet.active}",
                                                        onClick: this.showSdul(dataSet.translatedUseRestriction)
                                                    }, [span({ style: { "cursor": "pointer" } }, ["Translated Use Restriction"]),
                                                        ]),

                                                    td({
                                                        isRendered: isAdmin, className: "table-items cell-size translated-restriction hover-color",
                                                        onClick: this.downloadList(dataSet)
                                                    }, [span({ style: { "cursor": "pointer" } }, ["Download List"]),
                                                        ]),
                                                ])
                                        ]);
                                    })

                                ]),
                            ]),

                            div({
                                className: "pvotes-pagination dataset-pagination", "dir-pagination-controls": "true"
                                , "max-size": "10"
                                , "direction-links": "true"
                                , "boundary-links": "true"
                            }),
                        ]),
                        div({ className: "f-right" }, [
                            button({
                                "ng-show": "isResearcher",
                                "ng-disabled": "objectIdList.length === 0",
                                onClick: this.exportToRequest(objectIdList),
                                className: "download-button dataset-background apply-dataset",
                                "ng-class": "{'disabled': objectIdList.length === 0}",
                                tooltip: "Request Access for selected Datasets", "tooltip-class": "tooltip-class", "tooltip-trigger": "true",
                                "tooltip-placement": "top", "tooltip-animation": "false"
                            }, ["Apply for Access"]),
                        ])
                    ])
                ])
            ])
        );
    }
}

export default DatasetCatalog;

