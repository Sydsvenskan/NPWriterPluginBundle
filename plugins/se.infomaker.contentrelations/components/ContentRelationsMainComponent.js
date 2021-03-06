import {Component} from 'substance'
import {api} from 'writer'
import { OpenContentClient } from '@infomaker/oc-client'
import ContentSearchComponent from './ContentSearchComponent'

class ContentRelationsMainComponent extends Component {

    didMount() {
        const relevance = { name: this.getLabel('Relevance'), field: false, ascending: false }
        let { contentHost, contenttype } = this.state.pluginConfig
        contentHost = Object.assign({}, contentHost) // Clone contentHost to avoid overwriting sortingsPath
        contentHost.sortingsPath += `?contentType=${contenttype}`

        this.extendState({ sorting: relevance, sortings: [relevance] })

        new OpenContentClient(contentHost)
            .getSortings()
            .then(response => api.router.checkForOKStatus(response))
            .then(response => response.json())
            .then(({ sortings }) => {
                const sortingObjects = sortings.map((sorting) => {
                    return {
                        name: sorting.name,
                        field: sorting.sortIndexFields.length ? sorting.sortIndexFields[0].indexField : false,
                        ascending: sorting.sortIndexFields.length ? sorting.sortIndexFields[0].ascending : false
                    }
                })
                const defaultSorting = (this.state.pluginConfig.defaultSorting && sortingObjects.length) ?
                    sortingObjects.find(sort => sort.name === this.state.pluginConfig.defaultSorting) : false

                this.extendState({
                    sortings: [
                        ...sortingObjects,
                        relevance
                    ],
                    sorting: defaultSorting || sortingObjects[0] || relevance
                })
            })
            .catch((err) => {
                console.error(err)
            })
    }

    getInitialState() {
        const pluginConfig = this.props.pluginConfigObject.pluginConfigObject.data

        return {
            pluginConfig,
            sortings: [],
            client: null
        }
    }

    render($$) {
        const { sortings, sorting, pluginConfig } = this.state
        const { contentHost, propertyMap, defaultQueries, contenttype, locale, icons } = pluginConfig
        const host = `${contentHost.protocol}${contentHost.hostName}:${contentHost.port}${contentHost.objectPath}`

        const header = $$('h2').append(this.getLabel('ContentRelations'))
        const searchComponent = $$(ContentSearchComponent, {
            contentHost,
            contenttype,
            propertyMap,
            defaultQueries,
            sorting,
            sortings,
            locale,
            icons,
            host
        }).ref('searchComponent')

        return $$('div', { class: 'content-relations-container' }, [
            header,
            searchComponent,
        ]).ref('relationsContainer')
    }
}


export default ContentRelationsMainComponent
